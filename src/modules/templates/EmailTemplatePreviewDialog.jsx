'use client';

import * as React from 'react';
import api from '../../../lib/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const SAMPLE_VARS = {
  leadTitle: 'Mr. Raj Sharma',
  userName: 'Avinash',
  email: 'sales@quikboom.com',
  startDate: '25 September 2026',
  startTime: '11:30 AM',
  companyName: 'QUIKBOOM',
  customerName: 'Raj Sharma',
};

function localInterpolate(text, variables) {
  if (!text) return '';
  return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => String(variables[key] ?? `{{${key}}}`));
}

function formatBodyForPreview(content) {
  if (!content) return '';
  if (content.includes('<html') || content.includes('<!DOCTYPE') || content.includes('<body')) {
    return content;
  }
  const lines = content.split('\n');
  return lines
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return '<br />';
      return `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#334155;">${trimmed}</p>`;
    })
    .join('\n');
}

export function EmailTemplatePreviewDialog({ open, onOpenChange, subject, body, code }) {
  const [viewport, setViewport] = React.useState('desktop');
  const [rendered, setRendered] = React.useState({ subject: '', body: '' });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function loadPreview() {
      setLoading(true);
      setError('');
      const subj = subject?.trim() || '';
      const html = body?.trim() || '';
      if (!subj || !html) {
        setRendered({ subject: subj, body: '' });
        setError('Subject and HTML body are required for preview.');
        setLoading(false);
        return;
      }
      try {
        const res = await api.post('/email/templates/preview', {
          subject: subj,
          body: html,
          variables: SAMPLE_VARS,
        });
        const data = res?.data ?? res;
        if (!cancelled) {
          setRendered({
            subject: data?.subject ?? localInterpolate(subj, SAMPLE_VARS),
            body: data?.body ?? formatBodyForPreview(localInterpolate(html, SAMPLE_VARS)),
          });
        }
      } catch {
        if (!cancelled) {
          setRendered({
            subject: localInterpolate(subj, SAMPLE_VARS),
            body: formatBodyForPreview(localInterpolate(html, SAMPLE_VARS)),
          });
          setError('Live preview API unavailable; showing client-side rendering.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPreview();
    return () => {
      cancelled = true;
    };
  }, [open, subject, body]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(92dvh,900px)] w-[calc(100%-1rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b border-slate-100 px-4 py-4 sm:px-6">
          <DialogTitle>Email preview</DialogTitle>
          <DialogDescription>
            Renders the current subject and HTML body{code ? ` · ${code}` : ''}.
          </DialogDescription>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              type="button"
              size="sm"
              variant={viewport === 'desktop' ? 'default' : 'outline'}
              onClick={() => setViewport('desktop')}
            >
              Desktop
            </Button>
            <Button
              type="button"
              size="sm"
              variant={viewport === 'mobile' ? 'default' : 'outline'}
              onClick={() => setViewport('mobile')}
            >
              Mobile
            </Button>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {loading ? <p className="text-sm text-slate-500">Generating preview…</p> : null}
          {error ? <p className="mb-3 text-xs text-amber-700">{error}</p> : null}

          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
            <p className="break-words font-semibold text-slate-900">
              <span className="text-slate-500">Subject: </span>
              {rendered.subject || '—'}
            </p>
          </div>

          <div
            className={cn(
              'mx-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-all',
              viewport === 'mobile' ? 'max-w-[390px]' : 'max-w-full',
            )}
          >
            <div
              className="prose prose-sm max-w-none break-words text-slate-800 [&_img]:max-w-full [&_table]:w-full"
              // Preview is operator-authored template HTML; backend sanitizes on save.
              dangerouslySetInnerHTML={{ __html: rendered.body || '<p class="text-slate-400">No body content</p>' }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
