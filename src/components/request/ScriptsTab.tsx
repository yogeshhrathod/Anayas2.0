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
import React from 'react';
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
        />
      </div>
    </div>
  );
};
