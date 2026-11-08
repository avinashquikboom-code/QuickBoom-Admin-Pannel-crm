'use client';

import * as React from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const DELETE_CONFIRM_PHRASE = 'DELETE PERMANENTLY';

export function PermanentDeleteDialog({
  open,
  onOpenChange,
  preview,
  loading,
  onConfirm,
}) {
  const [ack, setAck] = React.useState(false);
  const [phrase, setPhrase] = React.useState('');

  React.useEffect(() => {
    if (!open) {
      setAck(false);
      setPhrase('');
    }
  }, [open]);

  const phraseOk = phrase.trim().toUpperCase() === DELETE_CONFIRM_PHRASE;
  const canSubmit = Boolean(preview?.previewId && preview?.canConfirm && ack && phraseOk && !loading);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg border-rose-200 bg-white">
        <AlertDialogHeader>
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <AlertTriangle className="size-5" aria-hidden />
            </div>
            <div className="space-y-1 text-left">
              <AlertDialogTitle className="text-base font-semibold text-slate-900">
                Permanent database deletion
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-slate-600">
                This action permanently removes business data from PostgreSQL. It cannot be undone.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        {preview ? (
          <div className="space-y-3 rounded-xl border border-rose-100 bg-rose-50/40 p-3 text-sm text-slate-700">
            <p>
              <span className="font-semibold text-slate-900">Estimated records:</span>{' '}
              {preview.totalEstimated?.toLocaleString() ?? '—'}
            </p>
            <p className="text-xs text-slate-600">{preview.dependencySummary}</p>
            <p className="text-xs text-slate-500">
              Protected: {preview.protectedSummary || 'Authentication, roles, tenant configuration, audit infrastructure.'}
            </p>
          </div>
        ) : (
          <p className="text-sm text-rose-600">Preview is required before deletion.</p>
        )}

        <div className="space-y-3">
          <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-700">
            <Checkbox checked={ack} onCheckedChange={(v) => setAck(Boolean(v))} className="mt-0.5" />
            <span>I understand this permanently deletes database records for the selected scope.</span>
          </label>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700">
              Type <span className="font-mono text-rose-600">{DELETE_CONFIRM_PHRASE}</span> to confirm
            </Label>
            <Input
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              placeholder={DELETE_CONFIRM_PHRASE}
              className="font-mono text-sm"
              autoComplete="off"
            />
          </div>
        </div>

        <AlertDialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!canSubmit}
            className="bg-rose-600 text-white hover:bg-rose-700"
            onClick={() => onConfirm({ acknowledgePermanent: true, confirmation: phrase.trim() })}
          >
            {loading ? 'Deleting…' : 'Delete permanently'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
