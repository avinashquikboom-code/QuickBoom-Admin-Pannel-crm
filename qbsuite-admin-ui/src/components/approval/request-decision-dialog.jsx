'use client';

import * as React from 'react';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faCircleCheck, faCircleXmark, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { cn } from 'cn';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/common/Button';
import { Label } from '@/components/common/Label';
import { Textarea } from '@/components/common/Textarea';
import { ApprovalSummary } from './approval-summary';
import { getRequestDecisionCopy, MAX_NOTE } from './approval-dialog-config';

/**
 * @param {object} props
 * @param {'approve' | 'reject'} props.mode
 * @param {boolean} props.open
 * @param {(open: boolean) => void} props.onOpenChange
 * @param {string} props.title
 * @param {string} props.description
 * @param {import('./approval-dialog-config').RequestDecisionCopy['summary']} [props.summary]
 * @param {string} props.primaryLabel
 * @param {string} [props.cancelLabel]
 * @param {string} props.noteLabel
 * @param {string} props.notePlaceholder
 * @param {boolean} [props.noteRequired]
 * @param {string} props.note
 * @param {(value: string) => void} props.onNoteChange
 * @param {(note: string) => void | Promise<void>} props.onSubmit
 * @param {boolean} [props.loading]
 */

/**
 * Controlled dialog bound to a request type and item payload.
 */
export function RequestDecisionDialogSwitch({
  open,
  onOpenChange,
  mode,
  requestType,
  item,
  note,
  onNoteChange,
  onSubmit,
  loading = false,
}) {
  const copy = React.useMemo(() => {
    if (!item || !mode) {
      return null;
    }
    return getRequestDecisionCopy(requestType, item, mode);
  }, [item, mode, requestType]);

  if (!copy || !mode) {
    return null;
  }

  return (
    <RequestDecisionDialog
      mode={mode}
      open={open}
      onOpenChange={onOpenChange}
      title={copy.title}
      description={copy.description}
      summary={copy.summary}
      primaryLabel={copy.primaryLabel}
      noteLabel={copy.noteLabel}
      notePlaceholder={copy.notePlaceholder}
      noteRequired={copy.noteRequired}
      note={note}
      onNoteChange={onNoteChange}
      onSubmit={onSubmit}
      loading={loading}
    />
  );
}

export function RequestDecisionDialog({
  mode,
  open,
  onOpenChange,
  title,
  description,
  summary = [],
  primaryLabel,
  cancelLabel = 'Cancel',
  noteLabel,
  notePlaceholder,
  noteRequired = false,
  note,
  onNoteChange,
  onSubmit,
  loading = false,
}) {
  const [validationMessage, setValidationMessage] = React.useState('');
  const isApprove = mode === 'approve';
  const noteLength = note?.length ?? 0;

  React.useEffect(() => {
    if (!open) {
      setValidationMessage('');
    }
  }, [open]);

  const handleNoteChange = (value) => {
    if (value.length <= MAX_NOTE) {
      onNoteChange(value);
      if (validationMessage && value.trim()) {
        setValidationMessage('');
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = note?.trim() ?? '';

    if (noteRequired && !trimmed) {
      setValidationMessage('A rejection reason is required.');
      return;
    }

    try {
      await onSubmit(trimmed);
    } catch {
      /* Caller shows error toast; keep dialog open with note preserved. */
    }
  };

  const handleOpenChange = (nextOpen) => {
    if (loading) {
      return;
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={!loading}
        className={cn(
          'flex max-h-[min(92dvh,720px)] w-full max-w-[calc(100%-1.25rem)] flex-col gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-2xl ring-0 sm:max-w-lg md:max-w-xl',
          isApprove ? 'bg-linear-to-b from-brand-light/50 via-white to-white' : 'bg-linear-to-b from-rose-50/80 via-white to-white',
        )}
      >
        <div
          className={cn(
            'shrink-0 px-5 pb-4 pt-5 sm:px-6 sm:pt-6',
            isApprove ? 'border-b border-brand/10' : 'border-b border-rose-100',
          )}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div
              className={cn(
                'flex size-14 shrink-0 items-center justify-center rounded-2xl shadow-sm',
                isApprove ? 'bg-brand text-primary-foreground' : 'bg-rose-600 text-white',
              )}
            >
              {isApprove ? (
                <FontAwesomeIcon icon={faCircleCheck} className="size-7" aria-hidden />
              ) : (
                <FontAwesomeIcon icon={faCircleXmark} className="size-7" aria-hidden />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <span
                className={cn(
                  'inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase',
                  isApprove ? 'bg-brand/15 text-brand-dark' : 'bg-rose-100 text-rose-700',
                )}
              >
                {isApprove ? 'Approval Request' : 'Rejection Request'}
              </span>
              <DialogTitle className="font-heading text-lg font-bold leading-tight text-slate-900 sm:text-xl">
                {title}
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed text-slate-600">
                {description}
              </DialogDescription>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
            {summary.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Request summary
                </p>
                <ApprovalSummary fields={summary} />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="request-decision-note" className="text-xs font-semibold text-slate-800">
                  {noteLabel}
                  {noteRequired ? <span className="text-rose-500"> *</span> : null}
                </Label>
                <span className="text-[11px] tabular-nums text-slate-400">
                  {noteLength}/{MAX_NOTE}
                </span>
              </div>
              <Textarea
                id="request-decision-note"
                value={note}
                onChange={(e) => handleNoteChange(e.target.value)}
                placeholder={notePlaceholder}
                rows={4}
                disabled={loading}
                aria-invalid={!!validationMessage}
                aria-describedby={validationMessage ? 'request-decision-note-error' : undefined}
                className={cn(
                  'resize-none rounded-xl border-slate-200 bg-white text-sm shadow-xs',
                  isApprove
                    ? 'focus-visible:border-brand focus-visible:ring-brand/30'
                    : 'focus-visible:border-rose-400 focus-visible:ring-rose-200/60',
                )}
              />
              {validationMessage ? (
                <p id="request-decision-note-error" className="text-xs font-medium text-rose-600" role="alert">
                  {validationMessage}
                </p>
              ) : null}
            </div>
          </div>

          <div className="shrink-0 flex flex-col-reverse gap-2 border-t border-slate-200/80 bg-white/90 px-5 py-4 backdrop-blur-sm sm:flex-row sm:justify-end sm:px-6">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => handleOpenChange(false)}
              className="h-10 w-full border-slate-200 text-slate-700 sm:w-auto"
            >
              {cancelLabel}
            </Button>
            <Button
              type="submit"
              disabled={loading || (noteRequired && !note?.trim())}
              className={cn(
                'h-10 w-full font-semibold sm:w-auto',
                isApprove
                  ? 'bg-brand hover:bg-primary-hover text-primary-foreground'
                  : 'bg-rose-600 hover:bg-rose-700 text-white',
              )}
            >
              {loading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="mr-2 size-4 animate-spin" aria-hidden />
                  Processing…
                </>
              ) : (
                primaryLabel
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
