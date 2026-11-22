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
import { AlertCircle, Trash2 } from 'lucide-react';

interface SsmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  handlerName: string;
  loading: boolean;
  onConfirm: () => void | Promise<void>;
}

export function SsmDeleteDialog({
  open,
  onOpenChange,
  handlerName,
  loading,
  onConfirm,
}: SsmDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
              <Trash2 className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Remove Handler
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                This action will delete the handler record from the system.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-3 text-xs text-slate-600">
          Are you sure you want to delete social media handler{' '}
          <strong className="text-slate-900">{handlerName}</strong>? This will revoke
          their recorded assignment to this account.
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            disabled={loading}
            className="bg-rose-600 hover:bg-rose-700 text-white"
          >
            {loading ? 'Deleting...' : 'Delete Handler'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
