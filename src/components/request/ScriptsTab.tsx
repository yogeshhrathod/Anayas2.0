/**
 * ScriptsTab - Post-response scripts (Postman-style "Tests")
 *
 * Lets the user write a JavaScript snippet that runs after the response
 * is received. The script has access to the `luna` API (aliased as `pm`):
 * - luna.response / luna.request
 * - luna.test(name, fn) + luna.expect(value)
 * - luna.environment / luna.collectionVariables
 * - console.log (captured in the Tests panel)
 */

import { FlaskConical, Sparkles } from 'lucide-react';
import React, { useRef } from 'react';
import { RequestFormData } from '../../types/forms';
import { Button } from '../ui/button';
import { MonacoEditor } from '../ui/monaco-editor';

export interface ScriptsTabProps {
  requestData: RequestFormData;
  setRequestData: (
    data: RequestFormData | ((prev: RequestFormData) => RequestFormData)
  ) => void;
}

const SNIPPETS: Array<{ label: string; code: string }> = [
  {
    label: 'Status is 200',
    code: `luna.test('Status code is 200', () => {\n  luna.response.to.have.status(200);\n});`,
  },
  {
    label: 'Body has property',
    code: `luna.test('Body has expected property', () => {\n  const body = luna.response.json();\n  luna.expect(body).to.have.property('id');\n});`,
  },
  {
    label: 'Response time',
    code: `luna.test('Response time under 500ms', () => {\n  luna.expect(luna.response.responseTime).to.be.below(500);\n});`,
  },
  {
    label: 'Save token to env',
    code: `// Chain requests: save a value for use as {{authToken}}\nconst body = luna.response.json();\nif (body.token) {\n  luna.environment.set('authToken', body.token);\n}`,
  },
  {
    label: 'Log response',
    code: `console.log('Status:', luna.response.status);\nconsole.log('Body:', luna.response.body);`,
  },
];

export const ScriptsTab: React.FC<ScriptsTabProps> = ({
  requestData,
  setRequestData,
}) => {
  const script = requestData.scripts?.postResponse || '';
  const completionProviderRef = useRef<any>(null);

  const updateScript = (value: string) => {
    setRequestData(prev => ({
      ...prev,
      scripts: { ...prev.scripts, postResponse: value },
    }));
  };

  const appendSnippet = (code: string) => {
    const current = script.trimEnd();
    updateScript(current ? `${current}\n\n${code}\n` : `${code}\n`);
  };

  const handleEditorMount = (_editor: any, monaco: any) => {
    // Enable full JS/TS IntelliSense
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      allowJs: true,
      checkJs: false,
    });

    // Dispose previous provider if re-mounting
    if (completionProviderRef.current) {
      completionProviderRef.current.dispose();
    }

    // Register completion provider for luna/pm API
    completionProviderRef.current =
      monaco.languages.registerCompletionItemProvider('javascript', {
        triggerCharacters: ['.', '(', "'"],

        provideCompletionItems: (model: any, position: any) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };

          const suggestions: any[] = [];

          // Helper to create a suggestion
          const addSuggestion = (
            label: string,
            kind: any,
            insertText: string,
            detail: string,
            documentation?: string
          ) => {
            suggestions.push({
              label,
              kind,
              insertText,
              detail,
              documentation: documentation
                ? { value: documentation }
                : undefined,
              range,
              insertTextRules:
                monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            });
          };

          const K = monaco.languages.CompletionItemKind;

          // luna / pm top-level
          addSuggestion(
            'luna',
            K.Variable,
            'luna',
            'Luna API object',
            'The Luna scripting API. Aliased as `pm` for Postman compatibility.'
          );
          addSuggestion(
            'pm',
            K.Variable,
            'pm',
            'Postman-compatible alias for luna',
            'Alias for `luna`. Use `pm.test()`, `pm.expect()`, `pm.response`, etc.'
          );

          // luna.test
          addSuggestion(
            'test',
            K.Method,
            "test('${1:name}', () => {\n  ${2:// assertion}\n});",
            'luna.test(name, fn) — Register a test',
            "Registers a named test assertion. The callback runs immediately.\n\nExample:\n```js\nluna.test('Status is 200', () => {\n  luna.response.to.have.status(200);\n});\n```"
          );

          // luna.expect
          addSuggestion(
            'expect',
            K.Method,
            'expect(${1:value})',
            'luna.expect(value) — Chai-style assertion',
            "Returns an assertion chain.\n\nExample:\n```js\nluna.expect(luna.response.status).to.equal(200);\nluna.expect(body).to.have.property('id');\nluna.expect(arr).to.have.lengthOf(3);\n```"
          );

          // luna.response
          addSuggestion(
            'response',
            K.Property,
            'response',
            'Response object',
            'Contains the HTTP response data.\n\nProperties: `.status`, `.code`, `.statusText`, `.responseTime`, `.headers`, `.body`\nMethods: `.json()`, `.text()`\nChainable: `.to.have.status(code)`, `.to.have.header(name)`, `.to.be.ok`'
          );
          addSuggestion(
            'json',
            K.Method,
            'json()',
            'response.json() — Parsed JSON body',
            'Returns the response body as a parsed JSON object.'
          );
          addSuggestion(
            'text',
            K.Method,
            'text()',
            'response.text() — Raw body text',
            'Returns the response body as a string.'
          );
          addSuggestion(
            'status',
            K.Property,
            'status',
            'HTTP status code (number)'
          );
          addSuggestion(
            'responseTime',
            K.Property,
            'responseTime',
            'Response time in milliseconds (number)'
          );
          addSuggestion(
            'headers',
            K.Property,
            'headers',
            'Response headers object',
            'Use `.get(name)` for case-insensitive lookup.'
          );

          // luna.request
          addSuggestion(
            'request',
            K.Property,
            'request',
            'Request object',
            'Contains the sent request data.\n\nProperties: `.method`, `.url`, `.headers`, `.body`'
          );

          // luna.environment
          addSuggestion(
            'environment',
            K.Property,
            'environment',
            'Environment variable scope',
            'Global environment variables.\n\nMethods: `.get(key)`, `.set(key, value)`, `.unset(key)`, `.has(key)`, `.toObject()`'
          );
          addSuggestion(
            'collectionVariables',
            K.Property,
            'collectionVariables',
            'Collection variable scope',
            'Collection-level environment variables.\n\nMethods: `.get(key)`, `.set(key, value)`, `.unset(key)`, `.has(key)`, `.toObject()`'
          );
          addSuggestion(
            'variables',
            K.Property,
            'variables',
            'Resolved variable lookup',
            'Resolves variables from collection first, then global.\n\nMethod: `.get(key)`'
          );

          // environment methods
          addSuggestion(
            'get',
            K.Method,
            "get('${1:key}')",
            'Get a variable value'
          );
          addSuggestion(
            'set',
            K.Method,
            "set('${1:key}', ${2:value})",
            'Set a variable value',
            'Stores the value as a string. Non-string values are JSON-stringified.'
          );
          addSuggestion(
            'unset',
            K.Method,
            "unset('${1:key}')",
            'Remove a variable'
          );
          addSuggestion(
            'has',
            K.Method,
            "has('${1:key}')",
            'Check if variable exists'
          );

          // expect chain methods
          addSuggestion('to', K.Property, 'to', 'Assertion chain sugar');
          addSuggestion('be', K.Property, 'be', 'Assertion chain sugar');
          addSuggestion('have', K.Property, 'have', 'Assertion chain sugar');
          addSuggestion('not', K.Property, 'not', 'Negate the assertion');
          addSuggestion('deep', K.Property, 'deep', 'Deep equality sugar');

          // expect matchers
          addSuggestion(
            'equal',
            K.Method,
            'equal(${1:expected})',
            'Strict equality (===)'
          );
          addSuggestion('eql', K.Method, 'eql(${1:expected})', 'Deep equality');
          addSuggestion(
            'include',
            K.Method,
            'include(${1:expected})',
            'Check inclusion',
            'Works with strings, arrays, and objects.'
          );
          addSuggestion(
            'match',
            K.Method,
            'match(/${1:pattern}/)',
            'Regex match'
          );
          addSuggestion('above', K.Method, 'above(${1:n})', 'Greater than n');
          addSuggestion('below', K.Method, 'below(${1:n})', 'Less than n');
          addSuggestion(
            'least',
            K.Method,
            'least(${1:n})',
            'Greater than or equal to n'
          );
          addSuggestion(
            'most',
            K.Method,
            'most(${1:n})',
            'Less than or equal to n'
          );
          addSuggestion(
            'property',
            K.Method,
            "property('${1:key}'${2:, ${3:value}})",
            'Check object has property',
            'Optionally check the property value too.'
          );
          addSuggestion(
            'lengthOf',
            K.Method,
            'lengthOf(${1:n})',
            'Check length'
          );
          addSuggestion(
            'a',
            K.Method,
            "a('${1:type}')",
            'Check type',
            'Types: string, number, boolean, array, object, function, undefined'
          );
          addSuggestion(
            'oneOf',
            K.Method,
            'oneOf([${1:values}])',
            'Check membership'
          );

          // expect getters
          addSuggestion('ok', K.Property, 'ok', 'Truthy assertion');
          addSuggestion('true', K.Property, 'true', 'Strict true assertion');
          addSuggestion('false', K.Property, 'false', 'Strict false assertion');
          addSuggestion('null', K.Property, 'null', 'Null assertion');
          addSuggestion(
            'undefined',
            K.Property,
            'undefined',
            'Undefined assertion'
          );
          addSuggestion('empty', K.Property, 'empty', 'Empty assertion');
          addSuggestion(
            'exist',
            K.Property,
            'exist',
            'Not null/undefined assertion'
          );

          // console
          addSuggestion(
            'log',
            K.Method,
            "log(${1:'message'})",
            'console.log — captured in Tests panel'
          );
          addSuggestion(
            'info',
            K.Method,
            "info(${1:'message'})",
            'console.info — captured in Tests panel'
          );
          addSuggestion(
            'warn',
            K.Method,
            "warn(${1:'message'})",
            'console.warn — captured in Tests panel'
          );
          addSuggestion(
            'error',
            K.Method,
            "error(${1:'message'})",
            'console.error — captured in Tests panel'
          );

          return { suggestions };
        },
      });

    // Add extra lib for type definitions (enables hover tooltips + parameter hints)
    const lunaDts = [
      'declare const luna: {',
      '  response: {',
      '    status: number;',
      '    code: number;',
      '    statusText: string;',
      '    responseTime: number;',
      '    headers: Record<string, string> & { get(name: string): string; has(name: string): boolean };',
      '    body: any;',
      '    json(): any;',
      '    text(): string;',
      '    to: { have: { status(code: number): void; header(name: string): void }; be: { ok: boolean } };',
      '  };',
      '  request: { method: string; url: string; headers: Record<string, string>; body: any };',
      '  environment: { get(key: string): string; set(key: string, value: any): void; unset(key: string): void; has(key: string): boolean; toObject(): Record<string, string> };',
      '  collectionVariables: { get(key: string): string; set(key: string, value: any): void; unset(key: string): void; has(key: string): boolean; toObject(): Record<string, string> };',
      '  variables: { get(key: string): string };',
      '  expect(actual: any): any;',
      '  test(name: string, fn: () => void): void;',
      '};',
      'declare const pm: typeof luna;',
      'declare const console: { log(...args: any[]): void; info(...args: any[]): void; warn(...args: any[]): void; error(...args: any[]): void; debug(...args: any[]): void };',
      'declare const btoa: (input: string) => string;',
      'declare const atob: (input: string) => string;',
    ].join('\n');

    monaco.languages.typescript.javascriptDefaults.addExtraLib(
      lunaDts,
      'luna-api.d.ts'
    );
  };

  React.useEffect(() => {
    return () => {
      if (completionProviderRef.current) {
        completionProviderRef.current.dispose();
      }
    };
  }, []);

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-3">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
            <FlaskConical className="h-4.5 w-4.5 text-violet-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight">
              Post-response Script
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Runs after the response arrives — write tests with{' '}
              <code className="font-mono text-violet-500">luna.test()</code>,
              chain requests with{' '}
              <code className="font-mono text-violet-500">
                luna.environment.set()
              </code>{' '}
              (<code className="font-mono">pm.*</code> also works)
            </p>
          </div>
        </div>
      </div>

      {/* Snippet shortcuts */}
      <div className="flex-shrink-0 flex items-center gap-2 flex-wrap">
        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <Sparkles className="h-3 w-3" />
          Snippets
        </span>
        {SNIPPETS.map(snippet => (
          <Button
            key={snippet.label}
            variant="outline"
            size="sm"
            onClick={() => appendSnippet(snippet.code)}
            className="h-6 rounded-lg px-2.5 text-[10px] font-semibold border-border/40 hover:bg-violet-500/10 hover:text-violet-500 hover:border-violet-500/30 transition-all"
          >
            {snippet.label}
          </Button>
        ))}
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0 flex flex-col">
        <MonacoEditor
          value={script}
          onChange={updateScript}
          language="javascript"
          placeholder="// luna.test('Status code is 200', () => luna.response.to.have.status(200));"
          height="100%"
          validateJson={false}
          showActions={false}
          onMount={handleEditorMount}
        />
      </div>
    </div>
  );
};
