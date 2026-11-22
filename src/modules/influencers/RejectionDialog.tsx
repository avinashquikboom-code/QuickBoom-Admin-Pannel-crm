// @ts-nocheck
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle } from 'lucide-react';

interface RejectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  targetName?: string;
  actionLabel?: string;
  loading?: boolean;
  onConfirm: (reason: string) => void | Promise<void>;
}

export function RejectionDialog({
  open,
  onOpenChange,
  title,
  description,
  targetName,
  actionLabel = 'Reject',
  loading = false,
  onConfirm,
}: RejectionDialogProps) {
  const [reason, setReason] = React.useState('');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (open) {
      setReason('');
      setError('');
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason before continuing.');
      return;
    }
    setError('');
    await onConfirm(reason.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border-slate-200 rounded-2xl" showCloseButton={!loading}>
        <DialogHeader className="pr-5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 mb-2 border border-rose-100">
            <AlertCircle className="size-5" />
          </div>
          <DialogTitle className="text-lg font-bold text-slate-900">{title}</DialogTitle>
          <DialogDescription className="text-sm text-slate-500 leading-relaxed">
            {targetName ? (
              <>
                You are about to modify <strong>{targetName}</strong>. {description}
              </>
            ) : (
              description
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <label htmlFor="rejection-reason" className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Reason / Notes <span className="text-rose-500">*</span>
          </label>
          <Textarea
            id="rejection-reason"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError('');
            }}
            placeholder="Explain why this action is being taken..."
            rows={3}
            className="text-xs bg-slate-50 border-slate-200 focus-visible:bg-white focus-visible:ring-brand rounded-xl resize-none"
            disabled={loading}
          />
          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-3">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => onOpenChange(false)}
            className="rounded-xl border-slate-200 text-xs font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={loading}
            onClick={handleConfirm}
            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
          >
            {loading ? 'Processing…' : actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
