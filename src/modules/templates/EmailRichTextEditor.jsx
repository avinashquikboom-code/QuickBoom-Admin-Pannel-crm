'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const TOOLBAR = [
  { cmd: 'bold', label: 'B', title: 'Bold', className: 'font-bold' },
  { cmd: 'italic', label: 'I', title: 'Italic', className: 'italic' },
  { cmd: 'underline', label: 'U', title: 'Underline', className: 'underline' },
  { type: 'sep' },
  { block: 'h2', label: 'H2', title: 'Heading' },
  { block: 'p', label: 'P', title: 'Paragraph' },
  { type: 'sep' },
  { cmd: 'insertUnorderedList', label: '•', title: 'Bullet list' },
  { cmd: 'insertOrderedList', label: '1.', title: 'Numbered list' },
  { type: 'sep' },
  { action: 'link', label: 'Link', title: 'Insert link' },
  { action: 'image', label: 'Img', title: 'Insert image URL' },
  { action: 'table', label: 'Tbl', title: 'Insert table' },
];

function applyCommand(command, value) {
  try {
    document.execCommand(command, false, value);
  } catch {
    // execCommand may be unavailable in some browsers; visual mode degrades gracefully.
  }
}

export function EmailRichTextEditor({ value, onChange, disabled, className, id }) {
  const editorRef = React.useRef(null);
  const [mode, setMode] = React.useState('visual');
  const html = value ?? '';

  React.useEffect(() => {
    if (mode !== 'visual' || !editorRef.current) return;
    const el = editorRef.current;
    if (el.innerHTML !== html) {
      el.innerHTML = html || '';
    }
  }, [mode, html]);

  const syncFromVisual = React.useCallback(() => {
    if (!editorRef.current) return;
    onChange?.(editorRef.current.innerHTML);
  }, [onChange]);

  const runToolbar = (item) => {
    if (disabled) return;
    if (item.cmd) {
      editorRef.current?.focus();
      applyCommand(item.cmd);
      syncFromVisual();
      return;
    }
    if (item.block) {
      editorRef.current?.focus();
      applyCommand('formatBlock', item.block === 'h2' ? 'h2' : 'p');
      syncFromVisual();
      return;
    }
    if (item.action === 'link') {
      const url = window.prompt('Link URL');
      if (!url) return;
      editorRef.current?.focus();
      applyCommand('createLink', url);
      syncFromVisual();
      return;
    }
    if (item.action === 'image') {
      const url = window.prompt('Image URL');
      if (!url) return;
      editorRef.current?.focus();
      applyCommand('insertImage', url);
      syncFromVisual();
      return;
    }
    if (item.action === 'table') {
      editorRef.current?.focus();
      applyCommand(
        'insertHTML',
        '<table style="width:100%;border-collapse:collapse" border="1"><tr><td>&nbsp;</td><td>&nbsp;</td></tr><tr><td>&nbsp;</td><td>&nbsp;</td></tr></table><p><br></p>',
      );
      syncFromVisual();
    }
  };

  return (
    <div className={cn('min-w-0 space-y-2', className)}>
      <div className="flex min-w-0 flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
        {TOOLBAR.map((item, index) =>
          item.type === 'sep' ? (
            <span key={`sep-${index}`} className="mx-0.5 hidden h-6 w-px bg-slate-300 sm:inline" aria-hidden />
          ) : (
            <Button
              key={item.label + index}
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled || mode === 'html'}
              title={item.title}
              className={cn('h-8 min-w-8 px-2 text-xs', item.className)}
              onClick={() => runToolbar(item)}
            >
              {item.label}
            </Button>
          ),
        )}
        <span className="mx-0.5 hidden h-6 w-px bg-slate-300 sm:inline" aria-hidden />
        <Button
          type="button"
          variant={mode === 'visual' ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 text-xs"
          onClick={() => setMode('visual')}
        >
          Visual
        </Button>
        <Button
          type="button"
          variant={mode === 'html' ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 text-xs"
          onClick={() => setMode('html')}
        >
          HTML
        </Button>
      </div>

      {mode === 'html' ? (
        <Textarea
          id={id}
          value={html}
          disabled={disabled}
          onChange={(event) => onChange?.(event.target.value)}
          rows={12}
          className="min-h-[min(50dvh,320px)] w-full max-w-full font-mono text-xs leading-relaxed"
          spellCheck={false}
        />
      ) : (
        <div
          ref={editorRef}
          id={id}
          role="textbox"
          tabIndex={0}
          aria-multiline="true"
          aria-label="Email HTML body"
          contentEditable={!disabled}
          suppressContentEditableWarning
          onInput={syncFromVisual}
          onBlur={syncFromVisual}
          className={cn(
            'min-h-[min(50dvh,320px)] w-full max-w-full overflow-y-auto rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-relaxed text-slate-800 outline-none',
            'focus-visible:ring-2 focus-visible:ring-brand/30 [&_table]:max-w-full [&_img]:h-auto [&_img]:max-w-full',
            disabled && 'cursor-not-allowed opacity-60',
          )}
        />
      )}
    </div>
  );
}
