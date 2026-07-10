/**
 * ScriptDocsDialog - In-app reference for the Luna post-response scripting API.
 *
 * Driven entirely by `LUNA_DOC_GROUPS` in `src/lib/luna-api.ts`, so it always
 * matches the editor autocomplete and the runtime. Users can click "Insert"
 * on any example to drop it straight into the script editor.
 */

import { BookOpen, Copy, Plus } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { LUNA_DOC_GROUPS, LunaMember } from '../../lib/luna-api';
import { Dialog } from '../ui/dialog';
import { useToast } from '../ui/use-toast';

export interface ScriptDocsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional: insert an example into the editor. */
  onInsert?: (code: string) => void;
}

/** Render text with `inline code` spans (no full markdown needed). */
function InlineDoc({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('`') && part.endsWith('`') ? (
          <code
            key={i}
            className="font-mono text-[11px] px-1 py-0.5 rounded bg-muted text-violet-500"
          >
            {part.slice(1, -1)}
          </code>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function MemberRow({
  member,
  onInsert,
  onCopy,
}: {
  member: LunaMember;
  onInsert?: (code: string) => void;
  onCopy: (code: string) => void;
}) {
  return (
    <div className="rounded-lg border border-border/40 p-3 space-y-1.5 bg-card/40">
      <div className="flex items-start justify-between gap-2">
        <code className="font-mono text-xs font-semibold text-foreground break-all">
          {member.signature}
        </code>
        <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
          {member.kind}
        </span>
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        <InlineDoc text={member.documentation} />
      </p>
      {member.example && (
        <div className="group relative">
          <pre className="mt-1 overflow-x-auto rounded-md bg-muted/60 p-2 text-[11px] font-mono leading-relaxed text-foreground">
            {member.example}
          </pre>
          <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {onInsert && (
              <button
                type="button"
                title="Insert into editor"
                onClick={() => onInsert(member.example!)}
                className="rounded-md bg-background/90 p-1 text-muted-foreground hover:text-violet-500 border border-border/50"
              >
                <Plus className="h-3 w-3" />
              </button>
            )}
            <button
              type="button"
              title="Copy example"
              onClick={() => onCopy(member.example!)}
              className="rounded-md bg-background/90 p-1 text-muted-foreground hover:text-foreground border border-border/50"
            >
              <Copy className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export const ScriptDocsDialog: React.FC<ScriptDocsDialogProps> = ({
  open,
  onOpenChange,
  onInsert,
}) => {
  const { success } = useToast();
  const [activeGroup, setActiveGroup] = useState(LUNA_DOC_GROUPS[0].id);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const scrollTo = (id: string) => {
    setActiveGroup(id);
    sectionRefs.current[id]?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const copy = (code: string) => {
    navigator.clipboard.writeText(code);
    success('Copied to clipboard');
  };

  const insert = onInsert
    ? (code: string) => {
        onInsert(code);
        success('Inserted into editor');
      }
    : undefined;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      maxWidth="4xl"
      className="max-h-[85vh]"
      title={
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-violet-500" />
          <span>Script API Reference</span>
        </div>
      }
      description="Everything available inside a post-response script. pm.* also works as an alias for luna.*"
    >
      <div className="flex gap-4 min-h-0">
        {/* Section nav */}
        <nav className="hidden sm:flex w-44 shrink-0 flex-col gap-0.5 sticky top-0 self-start">
          {LUNA_DOC_GROUPS.map(group => (
            <button
              key={group.id}
              type="button"
              onClick={() => scrollTo(group.id)}
              className={`text-left rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
                activeGroup === group.id
                  ? 'bg-violet-500/10 text-violet-500'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {group.title}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-6">
          {LUNA_DOC_GROUPS.map(group => (
            <section
              key={group.id}
              ref={el => {
                sectionRefs.current[group.id] = el;
              }}
              className="scroll-mt-2 space-y-2"
            >
              <div>
                <h3 className="text-sm font-bold tracking-tight">
                  {group.title}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {group.summary}
                </p>
              </div>
              <div className="grid gap-2">
                {group.members.map(member => (
                  <MemberRow
                    key={`${group.id}-${member.label}`}
                    member={member}
                    onInsert={insert}
                    onCopy={copy}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </Dialog>
  );
};
