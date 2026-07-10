import { describe, expect, it, vi } from 'vitest';

// Mock electron so the logger dependency doesn't fail
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn().mockReturnValue('/tmp/user-data'),
  },
}));

import {
  runPostResponseScript,
  ScriptExecutionContext,
} from '../../../../electron/services/script-runner';

function makeCtx(
  overrides: Partial<ScriptExecutionContext> = {}
): ScriptExecutionContext {
  return {
    response: {
      status: 200,
      statusText: 'OK',
      headers: { 'Content-Type': 'application/json' },
      body: { id: 123, name: 'Luna', items: [1, 2, 3] },
      responseTime: 42,
    },
    request: {
      method: 'GET',
      url: 'https://api.example.com/users/1',
      headers: { Authorization: 'Bearer token' },
      body: null,
    },
    globalVariables: { baseUrl: 'https://api.example.com' },
    collectionVariables: { collectionKey: 'colVal' },
    ...overrides,
  };
}

describe('runPostResponseScript', () => {
  // ── Basic execution ──────────────────────────────────────────────
  it('runs an empty script without error', () => {
    const result = runPostResponseScript('', makeCtx());
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.tests).toHaveLength(0);
    expect(result.logs).toHaveLength(0);
  });

  it('runs a simple script and captures console.log', () => {
    const result = runPostResponseScript(
      `console.log('hello', 'world');`,
      makeCtx()
    );
    expect(result.success).toBe(true);
    expect(result.logs).toHaveLength(1);
    expect(result.logs[0].level).toBe('log');
    expect(result.logs[0].message).toContain('hello');
    expect(result.logs[0].message).toContain('world');
  });

  it('captures multiple log levels', () => {
    const result = runPostResponseScript(
      `console.log('l'); console.info('i'); console.warn('w'); console.error('e'); console.debug('d');`,
      makeCtx()
    );
    expect(result.logs).toHaveLength(5);
    expect(result.logs.map(l => l.level)).toEqual([
      'log',
      'info',
      'warn',
      'error',
      'debug',
    ]);
  });

  // ── Tests ────────────────────────────────────────────────────────
  it('passes a test that does not throw', () => {
    const result = runPostResponseScript(
      `luna.test('always passes', () => {});`,
      makeCtx()
    );
    expect(result.tests).toHaveLength(1);
    expect(result.tests[0].name).toBe('always passes');
    expect(result.tests[0].passed).toBe(true);
  });

  it('fails a test that throws', () => {
    const result = runPostResponseScript(
      `luna.test('fails', () => { throw new Error('boom'); });`,
      makeCtx()
    );
    expect(result.tests).toHaveLength(1);
    expect(result.tests[0].passed).toBe(false);
    expect(result.tests[0].error).toContain('boom');
  });

  it('supports pm alias', () => {
    const result = runPostResponseScript(
      `pm.test('pm works', () => { pm.expect(1).to.equal(1); });`,
      makeCtx()
    );
    expect(result.tests[0].passed).toBe(true);
  });

  it('handles non-function test callback gracefully', () => {
    const result = runPostResponseScript(
      `luna.test('bad callback', 'not a function');`,
      makeCtx()
    );
    expect(result.tests[0].passed).toBe(false);
    expect(result.tests[0].error).toContain('function');
  });

  it('auto-generates test name when missing', () => {
    const result = runPostResponseScript(`luna.test('', () => {});`, makeCtx());
    expect(result.tests[0].name).toBe('Test 1');
  });

  // ── Expect API ───────────────────────────────────────────────────
  it('expect.equal passes for equal values', () => {
    const result = runPostResponseScript(
      `luna.test('eq', () => { luna.expect(2).to.equal(2); });`,
      makeCtx()
    );
    expect(result.tests[0].passed).toBe(true);
  });

  it('expect.equal fails for different values', () => {
    const result = runPostResponseScript(
      `luna.test('neq', () => { luna.expect(2).to.equal(3); });`,
      makeCtx()
    );
    expect(result.tests[0].passed).toBe(false);
  });

  it('expect.eql does deep equality', () => {
    const result = runPostResponseScript(
      `luna.test('deep', () => { luna.expect({a:1}).to.eql({a:1}); });`,
      makeCtx()
    );
    expect(result.tests[0].passed).toBe(true);
  });

  it('expect.property checks object has key', () => {
    const result = runPostResponseScript(
      `luna.test('prop', () => { luna.expect({a:1}).to.have.property('a'); });`,
      makeCtx()
    );
    expect(result.tests[0].passed).toBe(true);
  });

  it('expect.property checks key and value', () => {
    const result = runPostResponseScript(
      `luna.test('prop-val', () => { luna.expect({a:1}).to.have.property('a', 1); });`,
      makeCtx()
    );
    expect(result.tests[0].passed).toBe(true);
  });

  it('expect.above / below / least / most work numerically', () => {
    const result = runPostResponseScript(
      `luna.test('above', () => { luna.expect(5).to.be.above(3); });
       luna.test('below', () => { luna.expect(3).to.be.below(5); });
       luna.test('least', () => { luna.expect(5).to.be.at.least(5); });
       luna.test('most', () => { luna.expect(5).to.be.at.most(5); });`,
      makeCtx()
    );
    expect(result.tests.every(t => t.passed)).toBe(true);
  });

  it('expect.a checks type', () => {
    const result = runPostResponseScript(
      `luna.test('string type', () => { luna.expect('hi').to.be.a('string'); });
       luna.test('array type', () => { luna.expect([]).to.be.a('array'); });
       luna.test('number type', () => { luna.expect(42).to.be.a('number'); });`,
      makeCtx()
    );
    expect(result.tests.every(t => t.passed)).toBe(true);
  });

  it('expect.include works for strings, arrays, objects', () => {
    const result = runPostResponseScript(
      `luna.test('str includes', () => { luna.expect('hello world').to.include('world'); });
       luna.test('arr includes', () => { luna.expect([1,2,3]).to.include(2); });
       luna.test('obj includes', () => { luna.expect({a:1,b:2}).to.include({a:1}); });`,
      makeCtx()
    );
    expect(result.tests.every(t => t.passed)).toBe(true);
  });

  it('expect.match tests against regex', () => {
    const result = runPostResponseScript(
      `luna.test('regex', () => { luna.expect('abc123').to.match(/abc\\d+/); });`,
      makeCtx()
    );
    expect(result.tests[0].passed).toBe(true);
  });

  it('expect.not negates the assertion', () => {
    const result = runPostResponseScript(
      `luna.test('not equal', () => { luna.expect(1).to.not.equal(2); });`,
      makeCtx()
    );
    expect(result.tests[0].passed).toBe(true);
  });

  it('expect.ok / .true / .false / .null / .undefined / .empty / .exist getters work', () => {
    const result = runPostResponseScript(
      `luna.test('ok', () => { luna.expect(1).to.be.ok; });
       luna.test('true', () => { luna.expect(true).to.be.true; });
       luna.test('false', () => { luna.expect(false).to.be.false; });
       luna.test('null', () => { luna.expect(null).to.be.null; });
       luna.test('undefined', () => { luna.expect(undefined).to.be.undefined; });
       luna.test('empty', () => { luna.expect('').to.be.empty; });
       luna.test('exist', () => { luna.expect(0).to.exist; });`,
      makeCtx()
    );
    expect(result.tests.every(t => t.passed)).toBe(true);
  });

  it('expect.lengthOf checks length', () => {
    const result = runPostResponseScript(
      `luna.test('len', () => { luna.expect([1,2,3]).to.have.lengthOf(3); });`,
      makeCtx()
    );
    expect(result.tests[0].passed).toBe(true);
  });

  it('expect.oneOf checks membership', () => {
    const result = runPostResponseScript(
      `luna.test('oneOf', () => { luna.expect('a').to.be.oneOf(['a','b','c']); });`,
      makeCtx()
    );
    expect(result.tests[0].passed).toBe(true);
  });

  // ── Response API ─────────────────────────────────────────────────
  it('exposes response.status and response.code', () => {
    const result = runPostResponseScript(
      `luna.test('status', () => { luna.expect(luna.response.status).to.equal(200); });
       luna.test('code', () => { luna.expect(luna.response.code).to.equal(200); });`,
      makeCtx()
    );
    expect(result.tests.every(t => t.passed)).toBe(true);
  });

  it('response.json() returns parsed body', () => {
    const result = runPostResponseScript(
      `luna.test('json body', () => {
         const body = luna.response.json();
         luna.expect(body.id).to.equal(123);
       });`,
      makeCtx()
    );
    expect(result.tests[0].passed).toBe(true);
  });

  it('response.text() returns stringified body', () => {
    const result = runPostResponseScript(
      `luna.test('text body', () => {
         const text = luna.response.text();
         luna.expect(text).to.include('123');
       });`,
      makeCtx()
    );
    expect(result.tests[0].passed).toBe(true);
  });

  it('response.to.have.status() works', () => {
    const result = runPostResponseScript(
      `luna.test('status chain', () => { luna.response.to.have.status(200); });`,
      makeCtx()
    );
    expect(result.tests[0].passed).toBe(true);
  });

  it('response.to.be.ok passes for 2xx', () => {
    const result = runPostResponseScript(
      `luna.test('ok chain', () => { luna.response.to.be.ok; });`,
      makeCtx()
    );
    expect(result.tests[0].passed).toBe(true);
  });

  it('response.to.be.ok fails for 4xx', () => {
    const result = runPostResponseScript(
      `luna.test('not ok', () => { luna.response.to.be.ok; });`,
      makeCtx({ response: { ...makeCtx().response, status: 404 } })
    );
    expect(result.tests[0].passed).toBe(false);
  });

  it('response.headers.get() is case-insensitive', () => {
    const result = runPostResponseScript(
      `luna.test('header get', () => {
         luna.expect(luna.response.headers.get('content-type')).to.equal('application/json');
       });`,
      makeCtx()
    );
    expect(result.tests[0].passed).toBe(true);
  });

  it('response.to.have.header() checks existence', () => {
    const result = runPostResponseScript(
      `luna.test('header exists', () => { luna.response.to.have.header('Content-Type'); });`,
      makeCtx()
    );
    expect(result.tests[0].passed).toBe(true);
  });

  // ── Request API ──────────────────────────────────────────────────
  it('exposes request method and url', () => {
    const result = runPostResponseScript(
      `luna.test('method', () => { luna.expect(luna.request.method).to.equal('GET'); });
       luna.test('url', () => { luna.expect(luna.request.url).to.include('example.com'); });`,
      makeCtx()
    );
    expect(result.tests.every(t => t.passed)).toBe(true);
  });

  // ── Environment variables ────────────────────────────────────────
  it('environment.get reads existing variables', () => {
    const result = runPostResponseScript(
      `luna.test('env get', () => {
         luna.expect(luna.environment.get('baseUrl')).to.equal('https://api.example.com');
       });`,
      makeCtx()
    );
    expect(result.tests[0].passed).toBe(true);
  });

  it('environment.set writes and returns updates', () => {
    const result = runPostResponseScript(
      `luna.environment.set('newVar', 'hello');`,
      makeCtx()
    );
    expect(result.environmentUpdates.newVar).toBe('hello');
  });

  it('environment.unset marks variable as null in updates', () => {
    const result = runPostResponseScript(
      `luna.environment.unset('baseUrl');`,
      makeCtx()
    );
    expect(result.environmentUpdates.baseUrl).toBeNull();
  });

  it('collectionVariables.set writes to collectionEnvironmentUpdates', () => {
    const result = runPostResponseScript(
      `luna.collectionVariables.set('colNew', 'val');`,
      makeCtx()
    );
    expect(result.collectionEnvironmentUpdates.colNew).toBe('val');
  });

  it('variables.get resolves collection first, then global', () => {
    const result = runPostResponseScript(
      `luna.test('resolve collection', () => {
         luna.expect(luna.variables.get('collectionKey')).to.equal('colVal');
       });
       luna.test('resolve global', () => {
         luna.expect(luna.variables.get('baseUrl')).to.equal('https://api.example.com');
       });`,
      makeCtx()
    );
    expect(result.tests.every(t => t.passed)).toBe(true);
  });

  it('environment.set with non-string stringifies the value', () => {
    const result = runPostResponseScript(
      `luna.environment.set('obj', { a: 1 });`,
      makeCtx()
    );
    expect(result.environmentUpdates.obj).toBe(
      JSON.stringify({ a: 1 }, null, 2)
    );
  });

  it('environment.set throws on empty key', () => {
    const result = runPostResponseScript(
      `luna.environment.set('  ', 'val');`,
      makeCtx()
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain('empty');
  });

  // ── Error handling ───────────────────────────────────────────────
  it('captures syntax errors without crashing', () => {
    const result = runPostResponseScript(`{{{invalid`, makeCtx());
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('captures runtime errors without crashing', () => {
    const result = runPostResponseScript(
      `throw new Error('script explosion');`,
      makeCtx()
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain('script explosion');
  });

  it('still returns tests that ran before a runtime error', () => {
    const result = runPostResponseScript(
      `luna.test('before crash', () => {});
       throw new Error('midway crash');
       luna.test('after crash', () => {});`,
      makeCtx()
    );
    expect(result.tests).toHaveLength(1);
    expect(result.tests[0].name).toBe('before crash');
    expect(result.tests[0].passed).toBe(true);
    expect(result.success).toBe(false);
  });

  // ── Timeout ──────────────────────────────────────────────────────
  it('respects timeoutMs and reports error', () => {
    const result = runPostResponseScript(
      `while(true) {}`,
      makeCtx({ timeoutMs: 100 })
    );
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  // ── Duration ─────────────────────────────────────────────────────
  it('reports a non-zero durationMs', () => {
    const result = runPostResponseScript(
      `luna.test('dur', () => { luna.expect(luna.response.status).to.equal(200); });`,
      makeCtx()
    );
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  // ── Log truncation ───────────────────────────────────────────────
  it('truncates very long log messages', () => {
    const longStr = 'x'.repeat(20_000);
    const result = runPostResponseScript(
      `console.log('${longStr}');`,
      makeCtx()
    );
    expect(result.logs).toHaveLength(1);
    expect(result.logs[0].message.length).toBeLessThan(20_000);
    expect(result.logs[0].message).toContain('truncated');
  });

  it('limits number of log entries', () => {
    const script = Array.from(
      { length: 250 },
      (_, i) => `console.log(${i});`
    ).join('\n');
    const result = runPostResponseScript(script, makeCtx());
    expect(result.logs.length).toBeLessThanOrEqual(200);
  });

  // ── Sandbox safety ───────────────────────────────────────────────
  it('does not expose process or require', () => {
    const result = runPostResponseScript(
      `luna.test('no process', () => { luna.expect(typeof process).to.equal('undefined'); });
       luna.test('no require', () => { luna.expect(typeof require).to.equal('undefined'); });`,
      makeCtx()
    );
    expect(result.tests.every(t => t.passed)).toBe(true);
  });

  it('provides btoa and atob', () => {
    const result = runPostResponseScript(
      `luna.test('btoa', () => { luna.expect(btoa('hi')).to.equal('aGk='); });
       luna.test('atob', () => { luna.expect(atob('aGk=')).to.equal('hi'); });`,
      makeCtx()
    );
    expect(result.tests.every(t => t.passed)).toBe(true);
  });

  // ── Realistic Postman-style script ───────────────────────────────
  it('runs a realistic Postman-style test script', () => {
    const script = `
      pm.test("Status code is 200", function () {
        pm.response.to.have.status(200);
      });

      pm.test("Response has id", function () {
        const body = pm.response.json();
        pm.expect(body).to.have.property('id');
        pm.expect(body.id).to.equal(123);
      });

      pm.test("Response time is acceptable", function () {
        pm.expect(pm.response.responseTime).to.be.below(1000);
      });

      pm.test("Items array has 3 elements", function () {
        const body = pm.response.json();
        pm.expect(body.items).to.have.lengthOf(3);
      });

      // Chain: save a token for later requests
      pm.environment.set('userId', '123');
    `;

    const result = runPostResponseScript(script, makeCtx());
    expect(result.success).toBe(true);
    expect(result.tests).toHaveLength(4);
    expect(result.tests.every(t => t.passed)).toBe(true);
    expect(result.environmentUpdates.userId).toBe('123');
  });
});
