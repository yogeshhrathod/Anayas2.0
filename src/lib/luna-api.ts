/**
 * Luna Scripting API — single source of truth
 *
 * This file describes the entire `luna` (a.k.a. `pm`) API that is available
 * inside post-response scripts. It powers three things at once so they can
 * never drift apart:
 *   1. The context-aware autocomplete in the script editor (ScriptsTab)
 *   2. The in-app documentation dialog (ScriptDocsDialog)
 *   3. The Monaco hover/type definitions (`LUNA_TYPE_DEFS`)
 *
 * The runtime that actually backs this API lives in
 * `electron/services/script-runner.ts` — keep the two in sync.
 */

/** Where a member can be suggested from. */
export type LunaScope =
  | 'global' // statement level: luna, pm, console, btoa, atob
  | 'luna' // after `luna.` / `pm.`
  | 'response' // after `luna.response.`
  | 'request' // after `luna.request.`
  | 'varScope' // after `luna.environment.` / `luna.collectionVariables.`
  | 'variables' // after `luna.variables.`
  | 'headers' // after `luna.response.headers.`
  | 'console' // after `console.`
  | 'expect'; // inside an `luna.expect(...)` assertion chain

export type LunaMemberKind = 'method' | 'property' | 'variable' | 'keyword';

export interface LunaMember {
  /** Text shown in the completion list and docs. */
  label: string;
  kind: LunaMemberKind;
  /** Monaco snippet inserted on accept (supports ${1:...} tab stops). */
  insertText: string;
  /** One-line signature, e.g. `test(name, fn)`. */
  signature: string;
  /** Short description shown as the completion `detail`. */
  detail: string;
  /** Longer markdown documentation shown in hover + docs dialog. */
  documentation: string;
  /** Optional runnable example. */
  example?: string;
  /** Relative sort weight within a scope (lower shows first). */
  sortOrder?: number;
}

export interface LunaApiGroup {
  id: string;
  title: string;
  /** Short intro shown at the top of the docs section. */
  summary: string;
  members: LunaMember[];
}

// ─────────────────────────────────────────────────────────────────────────
// Member catalogues (grouped for the docs dialog)
// ─────────────────────────────────────────────────────────────────────────

const ROOT_MEMBERS: LunaMember[] = [
  {
    label: 'test',
    kind: 'method',
    insertText: "test('${1:name}', () => {\n\t${2:// assertion}\n});",
    signature: 'test(name: string, fn: () => void): void',
    detail: 'Register a named test assertion',
    documentation:
      'Registers a named test. The callback runs immediately; if it throws (e.g. a failed `expect`), the test is marked as failed in the **Tests** panel. Otherwise it passes.',
    example:
      "luna.test('Status code is 200', () => {\n  luna.response.to.have.status(200);\n});",
    sortOrder: 0,
  },
  {
    label: 'expect',
    kind: 'method',
    insertText: 'expect(${1:value})',
    signature: 'expect(actual: any): Assertion',
    detail: 'Start a Chai-style assertion chain',
    documentation:
      'Returns an assertion chain for `actual`. Chain grammar words (`to`, `be`, `have`, `not`, `deep`) are sugar and can be freely combined before a matcher.',
    example:
      "luna.expect(body).to.have.property('id');\nluna.expect(res.status).to.equal(200);",
    sortOrder: 1,
  },
  {
    label: 'response',
    kind: 'property',
    insertText: 'response',
    signature: 'response: Response',
    detail: 'The HTTP response that was received',
    documentation:
      'The response returned by the request. Exposes `status`, `code`, `statusText`, `responseTime`, `headers`, `body`, plus `json()` / `text()` helpers and the `to.have.status()` / `to.be.ok` chain.',
    sortOrder: 2,
  },
  {
    label: 'request',
    kind: 'property',
    insertText: 'request',
    signature: 'request: Request',
    detail: 'The request that was sent',
    documentation:
      'The request that produced this response. Exposes `method`, `url`, `headers`, and `body`.',
    sortOrder: 3,
  },
  {
    label: 'environment',
    kind: 'property',
    insertText: 'environment',
    signature: 'environment: VariableScope',
    detail: 'Global environment variables',
    documentation:
      'Read and write **global** environment variables. Changes are persisted to the active global environment after the script runs.',
    example: "luna.environment.set('authToken', body.token);",
    sortOrder: 4,
  },
  {
    label: 'collectionVariables',
    kind: 'property',
    insertText: 'collectionVariables',
    signature: 'collectionVariables: VariableScope',
    detail: 'Collection-level variables',
    documentation:
      'Read and write variables scoped to the active **collection**. Changes are persisted to the collection environment after the script runs.',
    sortOrder: 5,
  },
  {
    label: 'variables',
    kind: 'property',
    insertText: 'variables',
    signature: 'variables: { get(key): string }',
    detail: 'Resolved variable lookup',
    documentation:
      'Read-only resolver that looks a variable up in the **collection** scope first, then falls back to the **global** scope.',
    example: "const base = luna.variables.get('baseUrl');",
    sortOrder: 6,
  },
];

const RESPONSE_MEMBERS: LunaMember[] = [
  {
    label: 'status',
    kind: 'property',
    insertText: 'status',
    signature: 'status: number',
    detail: 'HTTP status code',
    documentation: 'The numeric HTTP status code, e.g. `200`, `404`.',
    sortOrder: 0,
  },
  {
    label: 'code',
    kind: 'property',
    insertText: 'code',
    signature: 'code: number',
    detail: 'Alias for status',
    documentation: 'Alias of `status` for Postman compatibility.',
    sortOrder: 1,
  },
  {
    label: 'statusText',
    kind: 'property',
    insertText: 'statusText',
    signature: 'statusText: string',
    detail: 'HTTP status text',
    documentation: 'The status reason phrase, e.g. `"OK"`, `"Not Found"`.',
    sortOrder: 2,
  },
  {
    label: 'responseTime',
    kind: 'property',
    insertText: 'responseTime',
    signature: 'responseTime: number',
    detail: 'Round-trip time in milliseconds',
    documentation: 'Total time the request took, in milliseconds.',
    example:
      "luna.test('Fast response', () => {\n  luna.expect(luna.response.responseTime).to.be.below(500);\n});",
    sortOrder: 3,
  },
  {
    label: 'headers',
    kind: 'property',
    insertText: 'headers',
    signature: 'headers: Headers',
    detail: 'Response headers',
    documentation:
      'The response headers. Use `headers.get(name)` for case-insensitive lookup or `headers.has(name)` to check existence.',
    sortOrder: 4,
  },
  {
    label: 'body',
    kind: 'property',
    insertText: 'body',
    signature: 'body: any',
    detail: 'Parsed body (JSON) or raw string',
    documentation:
      'The response body. Automatically parsed to an object when the payload is JSON, otherwise the raw string.',
    sortOrder: 5,
  },
  {
    label: 'json',
    kind: 'method',
    insertText: 'json()',
    signature: 'json(): any',
    detail: 'Parse the body as JSON',
    documentation:
      'Returns the body parsed as JSON. Throws if the body is not valid JSON.',
    example: 'const body = luna.response.json();',
    sortOrder: 6,
  },
  {
    label: 'text',
    kind: 'method',
    insertText: 'text()',
    signature: 'text(): string',
    detail: 'Get the raw body text',
    documentation: 'Returns the response body as a raw string.',
    sortOrder: 7,
  },
  {
    label: 'to',
    kind: 'property',
    insertText: 'to',
    signature: 'to.have.status(code) | to.be.ok',
    detail: 'Response assertion chain',
    documentation:
      'Assertion sugar on the response itself: `luna.response.to.have.status(200)`, `luna.response.to.have.header(name)`, and `luna.response.to.be.ok` (2xx).',
    example: 'luna.response.to.have.status(201);',
    sortOrder: 8,
  },
];

const REQUEST_MEMBERS: LunaMember[] = [
  {
    label: 'method',
    kind: 'property',
    insertText: 'method',
    signature: 'method: string',
    detail: 'HTTP method',
    documentation: 'The request method, e.g. `"GET"`, `"POST"`.',
    sortOrder: 0,
  },
  {
    label: 'url',
    kind: 'property',
    insertText: 'url',
    signature: 'url: string',
    detail: 'Fully resolved request URL',
    documentation:
      'The final request URL after variables were resolved.',
    sortOrder: 1,
  },
  {
    label: 'headers',
    kind: 'property',
    insertText: 'headers',
    signature: 'headers: Record<string, string>',
    detail: 'Request headers that were sent',
    documentation: 'The headers that were sent with the request.',
    sortOrder: 2,
  },
  {
    label: 'body',
    kind: 'property',
    insertText: 'body',
    signature: 'body: any',
    detail: 'Request body that was sent',
    documentation: 'The body payload that was sent with the request.',
    sortOrder: 3,
  },
];

const VAR_SCOPE_MEMBERS: LunaMember[] = [
  {
    label: 'get',
    kind: 'method',
    insertText: "get('${1:key}')",
    signature: 'get(key: string): string | undefined',
    detail: 'Read a variable',
    documentation: 'Returns the stored value for `key`, or `undefined`.',
    sortOrder: 0,
  },
  {
    label: 'set',
    kind: 'method',
    insertText: "set('${1:key}', ${2:value})",
    signature: 'set(key: string, value: any): void',
    detail: 'Write a variable',
    documentation:
      'Stores `value` under `key`. Non-string values are JSON-stringified. Persisted after the script runs.',
    example: "luna.environment.set('authToken', body.token);",
    sortOrder: 1,
  },
  {
    label: 'has',
    kind: 'method',
    insertText: "has('${1:key}')",
    signature: 'has(key: string): boolean',
    detail: 'Check a variable exists',
    documentation: 'Returns `true` if a variable named `key` is set.',
    sortOrder: 2,
  },
  {
    label: 'unset',
    kind: 'method',
    insertText: "unset('${1:key}')",
    signature: 'unset(key: string): void',
    detail: 'Delete a variable',
    documentation: 'Removes the variable named `key`.',
    sortOrder: 3,
  },
  {
    label: 'toObject',
    kind: 'method',
    insertText: 'toObject()',
    signature: 'toObject(): Record<string, string>',
    detail: 'Get all variables as an object',
    documentation: 'Returns a plain object snapshot of every variable in scope.',
    sortOrder: 4,
  },
];

const VARIABLES_MEMBERS: LunaMember[] = [
  {
    label: 'get',
    kind: 'method',
    insertText: "get('${1:key}')",
    signature: 'get(key: string): string | undefined',
    detail: 'Resolve a variable (collection → global)',
    documentation:
      'Looks up `key` in the collection scope first, then the global scope.',
    sortOrder: 0,
  },
];

const HEADERS_MEMBERS: LunaMember[] = [
  {
    label: 'get',
    kind: 'method',
    insertText: "get('${1:name}')",
    signature: 'get(name: string): string | undefined',
    detail: 'Case-insensitive header lookup',
    documentation: 'Returns the header value for `name` (case-insensitive).',
    example: "const type = luna.response.headers.get('content-type');",
    sortOrder: 0,
  },
  {
    label: 'has',
    kind: 'method',
    insertText: "has('${1:name}')",
    signature: 'has(name: string): boolean',
    detail: 'Check a header exists',
    documentation: 'Returns `true` if the response has the header `name`.',
    sortOrder: 1,
  },
];

const CONSOLE_MEMBERS: LunaMember[] = (
  ['log', 'info', 'warn', 'error', 'debug'] as const
).map((level, i) => ({
  label: level,
  kind: 'method' as const,
  insertText: `${level}(\${1:'message'})`,
  signature: `${level}(...args: any[]): void`,
  detail: `console.${level} — shown in the Tests panel`,
  documentation: `Logs \`${level}\` output. All console output is captured and displayed in the **Tests** panel below the editor.`,
  sortOrder: i,
}));

// Chain grammar sugar + matchers available inside `luna.expect(...)`
const EXPECT_SUGAR: LunaMember[] = (
  ['to', 'be', 'been', 'have', 'has', 'is', 'that', 'and', 'with', 'at', 'deep', 'not'] as const
).map((word, i) => ({
  label: word,
  kind: 'property' as const,
  insertText: word,
  signature: `.${word}`,
  detail: word === 'not' ? 'Negate the assertion' : 'Assertion chain word',
  documentation:
    word === 'not'
      ? 'Negates the next matcher, e.g. `expect(x).to.not.equal(y)`.'
      : 'Grammar sugar — readability only. Chain freely before a matcher.',
  sortOrder: i,
}));

const EXPECT_MATCHERS: LunaMember[] = [
  {
    label: 'equal',
    kind: 'method',
    insertText: 'equal(${1:expected})',
    signature: 'equal(expected: any)',
    detail: 'Strict equality (===)',
    documentation: 'Asserts strict equality using `===`.',
    example: 'luna.expect(res.status).to.equal(200);',
    sortOrder: 10,
  },
  {
    label: 'eql',
    kind: 'method',
    insertText: 'eql(${1:expected})',
    signature: 'eql(expected: any)',
    detail: 'Deep equality',
    documentation: 'Asserts deep structural equality of objects/arrays.',
    example: 'luna.expect(body).to.eql({ id: 1, name: "Luna" });',
    sortOrder: 11,
  },
  {
    label: 'include',
    kind: 'method',
    insertText: 'include(${1:expected})',
    signature: 'include(expected: any)',
    detail: 'Inclusion (string / array / object)',
    documentation:
      'Asserts inclusion. Works with substrings, array items, and object subsets.',
    sortOrder: 12,
  },
  {
    label: 'match',
    kind: 'method',
    insertText: 'match(/${1:pattern}/)',
    signature: 'match(regex: RegExp)',
    detail: 'Regular expression match',
    documentation: 'Asserts the value matches the given regular expression.',
    sortOrder: 13,
  },
  {
    label: 'property',
    kind: 'method',
    insertText: "property('${1:key}'${2:, ${3:value}})",
    signature: 'property(key: string, value?: any)',
    detail: 'Object has property (optionally with value)',
    documentation:
      'Asserts the target has an own property `key`. Pass a second argument to also assert its value.',
    example: "luna.expect(body).to.have.property('id', 123);",
    sortOrder: 14,
  },
  {
    label: 'lengthOf',
    kind: 'method',
    insertText: 'lengthOf(${1:n})',
    signature: 'lengthOf(n: number)',
    detail: 'Length / size equals n',
    documentation: 'Asserts the target has a `.length` of exactly `n`.',
    sortOrder: 15,
  },
  {
    label: 'above',
    kind: 'method',
    insertText: 'above(${1:n})',
    signature: 'above(n: number)',
    detail: 'Greater than n',
    documentation: 'Asserts the numeric target is strictly greater than `n`.',
    sortOrder: 16,
  },
  {
    label: 'below',
    kind: 'method',
    insertText: 'below(${1:n})',
    signature: 'below(n: number)',
    detail: 'Less than n',
    documentation: 'Asserts the numeric target is strictly less than `n`.',
    sortOrder: 17,
  },
  {
    label: 'least',
    kind: 'method',
    insertText: 'least(${1:n})',
    signature: 'least(n: number)',
    detail: 'Greater than or equal to n',
    documentation: 'Asserts the numeric target is `>= n`.',
    sortOrder: 18,
  },
  {
    label: 'most',
    kind: 'method',
    insertText: 'most(${1:n})',
    signature: 'most(n: number)',
    detail: 'Less than or equal to n',
    documentation: 'Asserts the numeric target is `<= n`.',
    sortOrder: 19,
  },
  {
    label: 'a',
    kind: 'method',
    insertText: "a('${1:type}')",
    signature: "a(type: string)",
    detail: 'Type check',
    documentation:
      'Asserts the target is of a given type: `string`, `number`, `boolean`, `array`, `object`, `function`, `undefined`.',
    sortOrder: 20,
  },
  {
    label: 'oneOf',
    kind: 'method',
    insertText: 'oneOf([${1:values}])',
    signature: 'oneOf(list: any[])',
    detail: 'Membership in a list',
    documentation: 'Asserts the target is one of the values in `list`.',
    sortOrder: 21,
  },
  {
    label: 'status',
    kind: 'method',
    insertText: 'status(${1:code})',
    signature: 'status(code: number)',
    detail: 'Response status equals code',
    documentation:
      'Asserts a response object has the given status code, e.g. `expect(luna.response).to.have.status(200)`.',
    sortOrder: 22,
  },
  // Getter-style matchers (no parentheses)
  {
    label: 'ok',
    kind: 'property',
    insertText: 'ok',
    signature: '.ok',
    detail: 'Truthy',
    documentation: 'Asserts the target is truthy.',
    sortOrder: 30,
  },
  {
    label: 'true',
    kind: 'property',
    insertText: 'true',
    signature: '.true',
    detail: 'Strictly true',
    documentation: 'Asserts the target is exactly `true`.',
    sortOrder: 31,
  },
  {
    label: 'false',
    kind: 'property',
    insertText: 'false',
    signature: '.false',
    detail: 'Strictly false',
    documentation: 'Asserts the target is exactly `false`.',
    sortOrder: 32,
  },
  {
    label: 'null',
    kind: 'property',
    insertText: 'null',
    signature: '.null',
    detail: 'Is null',
    documentation: 'Asserts the target is `null`.',
    sortOrder: 33,
  },
  {
    label: 'undefined',
    kind: 'property',
    insertText: 'undefined',
    signature: '.undefined',
    detail: 'Is undefined',
    documentation: 'Asserts the target is `undefined`.',
    sortOrder: 34,
  },
  {
    label: 'empty',
    kind: 'property',
    insertText: 'empty',
    signature: '.empty',
    detail: 'Is empty',
    documentation:
      'Asserts the target is empty (empty string, array, object, or nullish).',
    sortOrder: 35,
  },
  {
    label: 'exist',
    kind: 'property',
    insertText: 'exist',
    signature: '.exist',
    detail: 'Not null/undefined',
    documentation: 'Asserts the target is neither `null` nor `undefined`.',
    sortOrder: 36,
  },
];

const GLOBAL_MEMBERS: LunaMember[] = [
  {
    label: 'luna',
    kind: 'variable',
    insertText: 'luna',
    signature: 'luna',
    detail: 'The Luna scripting API',
    documentation:
      'The root scripting object. Provides `test`, `expect`, `response`, `request`, `environment`, `collectionVariables`, and `variables`.',
    sortOrder: 0,
  },
  {
    label: 'pm',
    kind: 'variable',
    insertText: 'pm',
    signature: 'pm',
    detail: 'Postman-compatible alias for luna',
    documentation:
      'Alias of `luna`. Pasted Postman test scripts mostly work as-is via `pm.*`.',
    sortOrder: 1,
  },
  {
    label: 'console',
    kind: 'variable',
    insertText: 'console',
    signature: 'console',
    detail: 'Logging captured in the Tests panel',
    documentation:
      'Standard console. `log`, `info`, `warn`, `error`, and `debug` output is captured and shown in the Tests panel.',
    sortOrder: 2,
  },
  {
    label: 'btoa',
    kind: 'method',
    insertText: 'btoa(${1:input})',
    signature: 'btoa(input: string): string',
    detail: 'Base64 encode',
    documentation: 'Encodes a binary string to Base64.',
    sortOrder: 3,
  },
  {
    label: 'atob',
    kind: 'method',
    insertText: 'atob(${1:input})',
    signature: 'atob(input: string): string',
    detail: 'Base64 decode',
    documentation: 'Decodes a Base64 string to binary.',
    sortOrder: 4,
  },
];

// ─────────────────────────────────────────────────────────────────────────
// Scope → members map used by the context-aware completion provider
// ─────────────────────────────────────────────────────────────────────────

export const LUNA_SCOPE_MEMBERS: Record<LunaScope, LunaMember[]> = {
  global: GLOBAL_MEMBERS,
  luna: ROOT_MEMBERS,
  response: RESPONSE_MEMBERS,
  request: REQUEST_MEMBERS,
  varScope: VAR_SCOPE_MEMBERS,
  variables: VARIABLES_MEMBERS,
  headers: HEADERS_MEMBERS,
  console: CONSOLE_MEMBERS,
  expect: [...EXPECT_SUGAR, ...EXPECT_MATCHERS],
};

/**
 * Determine which completion scope applies for the text preceding the cursor.
 * `textBeforeWord` is the current line up to (but excluding) the word being
 * typed. Returns `null` when no Luna-specific suggestions apply (let the
 * built-in JS/TS provider take over).
 */
export function resolveLunaScope(textBeforeWord: string): LunaScope | null {
  const trimmed = textBeforeWord.replace(/\s+$/, '');

  // Statement level: the token being typed is not a member access.
  if (!trimmed.endsWith('.')) {
    // Only offer globals when starting a fresh identifier (not mid-expression
    // like `foo.` which is handled below, or after a string/number).
    const lastChar = trimmed.slice(-1);
    if (lastChar === '' || /[\s({[;,=&|!?:+\-*/]/.test(lastChar)) {
      return 'global';
    }
    return 'global';
  }

  // Member access: analyse the chain before the trailing dot.
  const chain = trimmed.slice(0, -1); // drop trailing '.'

  // Any assertion chain — once inside expect(...), everything is expect sugar.
  if (/\bexpect\s*\(/.test(chain)) {
    return 'expect';
  }

  // Identify the receiver: the last "segment" before the dot.
  // Handles `luna.response`, `response`, `luna.response.headers`, etc.
  const segMatch = chain.match(/([A-Za-z_$][\w$]*)\s*(\([^()]*\))?\s*$/);
  const receiver = segMatch ? segMatch[1] : '';

  switch (receiver) {
    case 'luna':
    case 'pm':
      return 'luna';
    case 'response':
      return 'response';
    case 'request':
      return 'request';
    case 'environment':
    case 'collectionVariables':
      return 'varScope';
    case 'variables':
      return 'variables';
    case 'headers':
      return 'headers';
    case 'console':
      return 'console';
    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Documentation groups (for the ScriptDocsDialog)
// ─────────────────────────────────────────────────────────────────────────

export const LUNA_DOC_GROUPS: LunaApiGroup[] = [
  {
    id: 'tests',
    title: 'Tests',
    summary:
      'Wrap assertions in luna.test() so each one shows as a pass/fail row in the Tests panel.',
    members: [ROOT_MEMBERS[0]],
  },
  {
    id: 'assertions',
    title: 'Assertions — luna.expect()',
    summary:
      'Chai-style assertions. Grammar words (to, be, have, not, deep) are optional sugar; end the chain with a matcher.',
    members: [ROOT_MEMBERS[1], ...EXPECT_MATCHERS],
  },
  {
    id: 'response',
    title: 'Response — luna.response',
    summary: 'Everything about the response you just received.',
    members: RESPONSE_MEMBERS,
  },
  {
    id: 'request',
    title: 'Request — luna.request',
    summary: 'The request that was sent (after variables were resolved).',
    members: REQUEST_MEMBERS,
  },
  {
    id: 'variables',
    title: 'Variables',
    summary:
      'Read and write environment / collection variables to chain requests together.',
    members: [ROOT_MEMBERS[4], ROOT_MEMBERS[5], ROOT_MEMBERS[6], ...VAR_SCOPE_MEMBERS],
  },
  {
    id: 'console',
    title: 'Console & Utilities',
    summary: 'Logging is captured in the Tests panel. btoa/atob are available.',
    members: [...CONSOLE_MEMBERS, GLOBAL_MEMBERS[3], GLOBAL_MEMBERS[4]],
  },
];

// ─────────────────────────────────────────────────────────────────────────
// Ready-to-use snippet buttons (shared with ScriptsTab)
// ─────────────────────────────────────────────────────────────────────────

export interface LunaSnippet {
  label: string;
  description: string;
  code: string;
}

export const LUNA_SNIPPETS: LunaSnippet[] = [
  {
    label: 'Status is 200',
    description: 'Assert the response status code is 200.',
    code: `luna.test('Status code is 200', () => {\n  luna.response.to.have.status(200);\n});`,
  },
  {
    label: 'Body has property',
    description: 'Assert the JSON body contains a given property.',
    code: `luna.test('Body has expected property', () => {\n  const body = luna.response.json();\n  luna.expect(body).to.have.property('id');\n});`,
  },
  {
    label: 'Response time',
    description: 'Assert the response returned within a time budget.',
    code: `luna.test('Response time under 500ms', () => {\n  luna.expect(luna.response.responseTime).to.be.below(500);\n});`,
  },
  {
    label: 'Content-Type is JSON',
    description: 'Assert the response Content-Type header is JSON.',
    code: `luna.test('Content-Type is JSON', () => {\n  const type = luna.response.headers.get('content-type');\n  luna.expect(type).to.include('application/json');\n});`,
  },
  {
    label: 'Save token to env',
    description: 'Store a value from the body for use as {{authToken}}.',
    code: `// Chain requests: save a value for use as {{authToken}}\nconst body = luna.response.json();\nif (body.token) {\n  luna.environment.set('authToken', body.token);\n}`,
  },
  {
    label: 'Log response',
    description: 'Print the status and body to the Tests panel.',
    code: `console.log('Status:', luna.response.status);\nconsole.log('Body:', luna.response.body);`,
  },
];

// ─────────────────────────────────────────────────────────────────────────
// Monaco extra-lib type definitions (hover tooltips + parameter hints)
// ─────────────────────────────────────────────────────────────────────────

export const LUNA_TYPE_DEFS = [
  'interface LunaAssertion {',
  '  /** Grammar sugar — chain freely. */',
  '  to: LunaAssertion; be: LunaAssertion; been: LunaAssertion; have: LunaAssertion;',
  '  has: LunaAssertion; is: LunaAssertion; that: LunaAssertion; and: LunaAssertion;',
  '  with: LunaAssertion; at: LunaAssertion; deep: LunaAssertion;',
  '  /** Negate the next matcher. */',
  '  not: LunaAssertion;',
  '  equal(expected: any): void; eql(expected: any): void;',
  '  include(expected: any): void; match(regex: RegExp): void;',
  '  property(key: string, value?: any): void; lengthOf(n: number): void;',
  '  above(n: number): void; below(n: number): void; least(n: number): void; most(n: number): void;',
  '  a(type: string): void; oneOf(list: any[]): void; status(code: number): void;',
  '  readonly ok: void; readonly true: void; readonly false: void;',
  '  readonly null: void; readonly undefined: void; readonly empty: void; readonly exist: void;',
  '}',
  'interface LunaHeaders extends Record<string, string> {',
  '  get(name: string): string | undefined;',
  '  has(name: string): boolean;',
  '}',
  'interface LunaResponse {',
  '  status: number; code: number; statusText: string; responseTime: number;',
  '  headers: LunaHeaders; body: any;',
  '  json(): any; text(): string;',
  '  to: { have: { status(code: number): void; header(name: string): void }; be: { ok: boolean } };',
  '}',
  'interface LunaRequest { method: string; url: string; headers: Record<string, string>; body: any }',
  'interface LunaVariableScope {',
  '  get(key: string): string | undefined; set(key: string, value: any): void;',
  '  unset(key: string): void; has(key: string): boolean; toObject(): Record<string, string>;',
  '}',
  'interface Luna {',
  '  response: LunaResponse;',
  '  request: LunaRequest;',
  '  environment: LunaVariableScope;',
  '  collectionVariables: LunaVariableScope;',
  '  variables: { get(key: string): string | undefined };',
  '  expect(actual: any): LunaAssertion;',
  '  test(name: string, fn: () => void): void;',
  '}',
  'declare const luna: Luna;',
  'declare const pm: Luna;',
  'declare const console: { log(...a: any[]): void; info(...a: any[]): void; warn(...a: any[]): void; error(...a: any[]): void; debug(...a: any[]): void };',
  'declare const btoa: (input: string) => string;',
  'declare const atob: (input: string) => string;',
].join('\n');
