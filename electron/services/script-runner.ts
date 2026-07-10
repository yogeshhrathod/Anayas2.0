/**
 * ScriptRunner - Sandboxed post-response script execution (Postman-style "Tests")
 *
 * Runs user scripts in a Node `vm` sandbox after a request completes.
 * Exposes a `luna` API (aliased as `pm` for Postman familiarity):
 * - luna.response  : status, headers, body, json(), text(), responseTime
 * - luna.request   : method, url, headers, body
 * - luna.test(name, fn)          : register a test assertion
 * - luna.expect(value)           : chai-lite assertion helper
 * - luna.environment.get/set/... : read/write global environment variables
 * - luna.collectionVariables.*   : read/write active collection environment variables
 * - luna.variables.get(name)     : resolved lookup (collection first, then global)
 * - console.log/info/warn/error  : captured and shown in the Tests panel
 *
 * Safety: scripts run with a hard timeout, no require/process/filesystem access,
 * and every failure is captured — a broken script can never crash the app.
 */

import vm from 'vm';
import { createLogger } from './logger';

const logger = createLogger('script-runner');

const DEFAULT_TIMEOUT_MS = 5000;
const MAX_LOG_ENTRIES = 200;
const MAX_LOG_LENGTH = 10_000;

export interface ScriptTestResult {
  name: string;
  passed: boolean;
  error?: string;
}

export interface ScriptLogEntry {
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  message: string;
}

export interface ScriptExecutionResult {
  success: boolean;
  error?: string;
  tests: ScriptTestResult[];
  logs: ScriptLogEntry[];
  /** key -> new value, or null when unset */
  environmentUpdates: Record<string, string | null>;
  collectionEnvironmentUpdates: Record<string, string | null>;
  durationMs: number;
}

export interface ScriptExecutionContext {
  response: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: any;
    responseTime: number;
  };
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body: any;
  };
  globalVariables: Record<string, string>;
  collectionVariables: Record<string, string>;
  timeoutMs?: number;
}

/** Stringify any value safely (circular refs, errors, huge payloads). */
function safeStringify(value: any): string {
  if (typeof value === 'string') return value;
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  try {
    const seen = new WeakSet();
    const out = JSON.stringify(
      value,
      (_key, val) => {
        if (typeof val === 'object' && val !== null) {
          if (seen.has(val)) return '[Circular]';
          seen.add(val);
        }
        if (typeof val === 'function')
          return `[Function ${val.name || 'anonymous'}]`;
        return val;
      },
      2
    );
    return out === undefined ? String(value) : out;
  } catch {
    return String(value);
  }
}

function truncate(text: string, max = MAX_LOG_LENGTH): string {
  return text.length > max ? `${text.substring(0, max)}… [truncated]` : text;
}

/** Minimal chai-style expect implementation covering the common cases. */
function createExpect() {
  const deepEqual = (a: any, b: any): boolean => {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (a === null || b === null) return false;
    if (typeof a !== 'object') return false;
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every(k => deepEqual(a[k], b[k]));
  };

  return function expect(actual: any) {
    const build = (negated: boolean) => {
      const assert = (condition: boolean, message: string) => {
        const pass = negated ? !condition : condition;
        if (!pass) {
          throw new Error(
            negated ? message.replace('expected', 'expected not') : message
          );
        }
      };

      const chain: any = {
        equal: (expected: any) =>
          assert(
            actual === expected,
            `expected ${safeStringify(actual)} to equal ${safeStringify(expected)}`
          ),
        eql: (expected: any) =>
          assert(
            deepEqual(actual, expected),
            `expected ${safeStringify(actual)} to deeply equal ${safeStringify(expected)}`
          ),
        include: (expected: any) => {
          let ok = false;
          if (typeof actual === 'string')
            ok = actual.includes(String(expected));
          else if (Array.isArray(actual))
            ok = actual.some(item => deepEqual(item, expected));
          else if (actual && typeof actual === 'object')
            ok = Object.keys(expected || {}).every(k =>
              deepEqual(actual[k], expected[k])
            );
          assert(
            ok,
            `expected ${safeStringify(actual)} to include ${safeStringify(expected)}`
          );
        },
        match: (regex: RegExp) =>
          assert(
            regex.test(String(actual)),
            `expected ${safeStringify(actual)} to match ${regex}`
          ),
        above: (n: number) =>
          assert(
            Number(actual) > n,
            `expected ${safeStringify(actual)} to be above ${n}`
          ),
        below: (n: number) =>
          assert(
            Number(actual) < n,
            `expected ${safeStringify(actual)} to be below ${n}`
          ),
        least: (n: number) =>
          assert(
            Number(actual) >= n,
            `expected ${safeStringify(actual)} to be at least ${n}`
          ),
        most: (n: number) =>
          assert(
            Number(actual) <= n,
            `expected ${safeStringify(actual)} to be at most ${n}`
          ),
        a: (type: string) => {
          const actualType = Array.isArray(actual) ? 'array' : typeof actual;
          assert(
            actualType === type,
            `expected ${safeStringify(actual)} to be a ${type} but got ${actualType}`
          );
        },
        property: (...propArgs: [string, any?]) => {
          const name = propArgs[0];
          const has =
            actual != null &&
            Object.prototype.hasOwnProperty.call(actual, name);
          if (propArgs.length > 1) {
            assert(
              has && deepEqual(actual[name], propArgs[1]),
              `expected ${safeStringify(actual)} to have property '${name}' with value ${safeStringify(propArgs[1])}`
            );
          } else {
            assert(
              has,
              `expected ${safeStringify(actual)} to have property '${name}'`
            );
          }
        },
        lengthOf: (n: number) =>
          assert(
            actual != null && actual.length === n,
            `expected ${safeStringify(actual)} to have length ${n} but got ${actual?.length}`
          ),
        status: (code: number) =>
          assert(
            actual != null && actual.status === code,
            `expected response status ${actual?.status} to be ${code}`
          ),
        oneOf: (list: any[]) =>
          assert(
            Array.isArray(list) && list.some(item => deepEqual(item, actual)),
            `expected ${safeStringify(actual)} to be one of ${safeStringify(list)}`
          ),
      };

      Object.defineProperty(chain, 'true', {
        get: () =>
          assert(
            actual === true,
            `expected ${safeStringify(actual)} to be true`
          ),
      });
      Object.defineProperty(chain, 'false', {
        get: () =>
          assert(
            actual === false,
            `expected ${safeStringify(actual)} to be false`
          ),
      });
      Object.defineProperty(chain, 'null', {
        get: () =>
          assert(
            actual === null,
            `expected ${safeStringify(actual)} to be null`
          ),
      });
      Object.defineProperty(chain, 'undefined', {
        get: () =>
          assert(
            actual === undefined,
            `expected ${safeStringify(actual)} to be undefined`
          ),
      });
      Object.defineProperty(chain, 'empty', {
        get: () => {
          const isEmpty =
            actual == null ||
            (typeof actual === 'string' && actual.length === 0) ||
            (Array.isArray(actual) && actual.length === 0) ||
            (typeof actual === 'object' && Object.keys(actual).length === 0);
          assert(isEmpty, `expected ${safeStringify(actual)} to be empty`);
        },
      });
      Object.defineProperty(chain, 'exist', {
        get: () =>
          assert(
            actual !== null && actual !== undefined,
            `expected value to exist`
          ),
      });
      Object.defineProperty(chain, 'ok', {
        get: () =>
          assert(!!actual, `expected ${safeStringify(actual)} to be truthy`),
      });

      // Grammar sugar: to / be / have / and / deep
      chain.to = chain;
      chain.be = chain;
      chain.been = chain;
      chain.have = chain;
      chain.has = chain;
      chain.deep = chain;
      chain.and = chain;
      chain.at = chain;
      chain.is = chain;
      chain.that = chain;
      chain.with = chain;

      Object.defineProperty(chain, 'not', {
        get: () => build(!negated),
      });

      return chain;
    };

    return build(false);
  };
}

export function runPostResponseScript(
  script: string,
  ctx: ScriptExecutionContext
): ScriptExecutionResult {
  const started = Date.now();
  const tests: ScriptTestResult[] = [];
  const logs: ScriptLogEntry[] = [];
  const environmentUpdates: Record<string, string | null> = {};
  const collectionEnvironmentUpdates: Record<string, string | null> = {};

  const pushLog = (level: ScriptLogEntry['level'], args: any[]) => {
    if (logs.length >= MAX_LOG_ENTRIES) return;
    logs.push({
      level,
      message: truncate(args.map(a => safeStringify(a)).join(' ')),
    });
  };

  // Working copies so scripts read-back their own writes
  const globalVars: Record<string, string> = { ...(ctx.globalVariables || {}) };
  const collectionVars: Record<string, string> = {
    ...(ctx.collectionVariables || {}),
  };

  const headerLookup: Record<string, string> = {};
  for (const [key, value] of Object.entries(ctx.response.headers || {})) {
    headerLookup[key.toLowerCase()] = value;
  }

  const rawBody = ctx.response.body;
  const bodyText =
    typeof rawBody === 'string' ? rawBody : safeStringify(rawBody);
  let parsedBody: any = rawBody;
  if (typeof rawBody === 'string') {
    const trimmed = rawBody.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        parsedBody = JSON.parse(trimmed);
      } catch {
        parsedBody = rawBody;
      }
    }
  }

  const expect = createExpect();

  const responseApi = {
    status: ctx.response.status,
    code: ctx.response.status,
    statusText: ctx.response.statusText,
    responseTime: ctx.response.responseTime,
    headers: {
      ...(ctx.response.headers || {}),
      get: (name: string) => headerLookup[String(name).toLowerCase()],
      has: (name: string) =>
        Object.prototype.hasOwnProperty.call(
          headerLookup,
          String(name).toLowerCase()
        ),
    },
    body: parsedBody,
    json: () => {
      if (typeof parsedBody === 'string') {
        throw new Error('Response body is not valid JSON');
      }
      return parsedBody;
    },
    text: () => bodyText,
    to: {
      have: {
        status: (code: number) => {
          if (ctx.response.status !== code) {
            throw new Error(
              `expected response status ${ctx.response.status} to be ${code}`
            );
          }
        },
        header: (name: string) => {
          if (
            !Object.prototype.hasOwnProperty.call(
              headerLookup,
              String(name).toLowerCase()
            )
          ) {
            throw new Error(`expected response to have header '${name}'`);
          }
        },
      },
      be: {
        get ok() {
          if (ctx.response.status < 200 || ctx.response.status >= 300) {
            throw new Error(
              `expected response to be ok but got status ${ctx.response.status}`
            );
          }
          return true;
        },
      },
    },
  };

  const makeVarScope = (
    store: Record<string, string>,
    updates: Record<string, string | null>
  ) => ({
    get: (key: string) => store[String(key)],
    has: (key: string) =>
      Object.prototype.hasOwnProperty.call(store, String(key)),
    set: (key: string, value: any) => {
      const k = String(key);
      if (!k.trim()) throw new Error('Variable name cannot be empty');
      const v = typeof value === 'string' ? value : safeStringify(value);
      store[k] = v;
      updates[k] = v;
    },
    unset: (key: string) => {
      const k = String(key);
      delete store[k];
      updates[k] = null;
    },
    toObject: () => ({ ...store }),
  });

  const lunaApi = {
    response: responseApi,
    request: {
      method: ctx.request.method,
      url: ctx.request.url,
      headers: { ...(ctx.request.headers || {}) },
      body: ctx.request.body,
    },
    environment: makeVarScope(globalVars, environmentUpdates),
    collectionVariables: makeVarScope(
      collectionVars,
      collectionEnvironmentUpdates
    ),
    variables: {
      get: (key: string) => {
        const k = String(key);
        if (Object.prototype.hasOwnProperty.call(collectionVars, k)) {
          return collectionVars[k];
        }
        return globalVars[k];
      },
    },
    expect,
    test: (name: string, fn: () => void) => {
      const testName = String(name || `Test ${tests.length + 1}`);
      if (typeof fn !== 'function') {
        tests.push({
          name: testName,
          passed: false,
          error: 'Test callback must be a function',
        });
        return;
      }
      try {
        fn();
        tests.push({ name: testName, passed: true });
      } catch (err: any) {
        tests.push({
          name: testName,
          passed: false,
          error: truncate(err?.message || String(err), 1000),
        });
      }
    },
  };

  const sandbox: Record<string, any> = {
    luna: lunaApi,
    pm: lunaApi, // Postman-compatible alias so pasted Postman scripts mostly work
    console: {
      log: (...args: any[]) => pushLog('log', args),
      info: (...args: any[]) => pushLog('info', args),
      warn: (...args: any[]) => pushLog('warn', args),
      error: (...args: any[]) => pushLog('error', args),
      debug: (...args: any[]) => pushLog('debug', args),
    },
    JSON,
    Math,
    Date,
    RegExp,
    Number,
    String,
    Boolean,
    Array,
    Object,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    encodeURIComponent,
    decodeURIComponent,
    btoa: (input: string) =>
      Buffer.from(String(input), 'binary').toString('base64'),
    atob: (input: string) =>
      Buffer.from(String(input), 'base64').toString('binary'),
  };

  let error: string | undefined;
  try {
    const context = vm.createContext(sandbox, {
      codeGeneration: { strings: false, wasm: false },
    });
    const compiled = new vm.Script(script, {
      filename: 'post-response-script.js',
    });
    compiled.runInContext(context, {
      timeout: ctx.timeoutMs || DEFAULT_TIMEOUT_MS,
      displayErrors: true,
    });
  } catch (err: any) {
    error = truncate(err?.message || String(err), 2000);
    logger.warn('Post-response script failed', { error });
  }

  return {
    success: !error,
    error,
    tests,
    logs,
    environmentUpdates,
    collectionEnvironmentUpdates,
    durationMs: Date.now() - started,
  };
}
