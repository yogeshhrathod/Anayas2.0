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

import { BookOpen, FlaskConical, Sparkles } from 'lucide-react';
import React, { useRef, useState } from 'react';
import {
  LUNA_SCOPE_MEMBERS,
  LUNA_SNIPPETS,
  LUNA_TYPE_DEFS,
  LunaMemberKind,
  resolveLunaScope,
} from '../../lib/luna-api';
import { RequestFormData } from '../../types/forms';
import { Button } from '../ui/button';
import { MonacoEditor } from '../ui/monaco-editor';
import { ScriptDocsDialog } from './ScriptDocsDialog';

export interface ScriptsTabProps {
  requestData: RequestFormData;
  setRequestData: (
    data: RequestFormData | ((prev: RequestFormData) => RequestFormData)
  ) => void;
}

export const ScriptsTab: React.FC<ScriptsTabProps> = ({
  requestData,
  setRequestData,
}) => {
  const script = requestData.scripts?.postResponse || '';
  const completionProviderRef = useRef<any>(null);
  const [docsOpen, setDocsOpen] = useState(false);

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

    const kindMap: Record<LunaMemberKind, any> = {
      method: monaco.languages.CompletionItemKind.Method,
      property: monaco.languages.CompletionItemKind.Property,
      variable: monaco.languages.CompletionItemKind.Variable,
      keyword: monaco.languages.CompletionItemKind.Keyword,
    };

    // Context-aware completion: only suggest members that are valid for the
    // expression immediately before the cursor (e.g. `luna.response.` offers
    // response members, not assertion matchers). See resolveLunaScope().
    completionProviderRef.current =
      monaco.languages.registerCompletionItemProvider('javascript', {
        triggerCharacters: ['.'],

        provideCompletionItems: (model: any, position: any) => {
          const word = model.getWordUntilPosition(position);
          const lineText = model.getLineContent(position.lineNumber);
          const textBeforeWord = lineText.substring(0, word.startColumn - 1);

          const scope = resolveLunaScope(textBeforeWord);
          if (!scope) {
            // Not a Luna context — let the built-in JS/TS provider handle it.
            return { suggestions: [] };
          }

          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };

          const suggestions = LUNA_SCOPE_MEMBERS[scope].map(member => {
            const doc = [
              '```typescript',
              member.signature,
              '```',
              '',
              member.documentation,
            ];
            if (member.example) {
              doc.push(
                '',
                '**Example**',
                '```javascript',
                member.example,
                '```'
              );
            }
            return {
              label: member.label,
              kind: kindMap[member.kind],
              insertText: member.insertText,
              insertTextRules:
                monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              detail: member.detail,
              documentation: { value: doc.join('\n'), isTrusted: true },
              range,
              sortText: `${String(member.sortOrder ?? 50).padStart(3, '0')}_${member.label}`,
            };
          });

          return { suggestions };
        },
      });

    // Type definitions power hover tooltips and parameter hints.
    monaco.languages.typescript.javascriptDefaults.addExtraLib(
      LUNA_TYPE_DEFS,
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

        <Button
          variant="outline"
          size="sm"
          onClick={() => setDocsOpen(true)}
          className="h-7 rounded-lg px-2.5 text-[11px] font-semibold border-border/40 hover:bg-violet-500/10 hover:text-violet-500 hover:border-violet-500/30 transition-all"
        >
          <BookOpen className="h-3.5 w-3.5 mr-1.5" />
          Docs
        </Button>
      </div>

      {/* Snippet shortcuts */}
      <div className="flex-shrink-0 flex items-center gap-2 flex-wrap">
        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <Sparkles className="h-3 w-3" />
          Snippets
        </span>
        {LUNA_SNIPPETS.map(snippet => (
          <Button
            key={snippet.label}
            variant="outline"
            size="sm"
            title={snippet.description}
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

      <ScriptDocsDialog
        open={docsOpen}
        onOpenChange={setDocsOpen}
        onInsert={appendSnippet}
      />
    </div>
  );
};
