'use client';

import * as React from 'react';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/common/Button';

export function ConfirmModal({ isOpen, title, message, confirmText = 'Confirm', onConfirm, onCancel, busy = false }) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-5 sm:p-6 shadow-xl border border-[#E2E8E5] space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
            <FontAwesomeIcon icon={faTriangleExclamation} className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500">Action confirmation required</p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          {message}
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={onCancel}
            className="border-slate-200 text-slate-700"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={busy}
            onClick={onConfirm}
            className="bg-[#163A2E] hover:bg-[#204C3D] text-white font-semibold"
          >
            {busy ? 'Processing…' : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
