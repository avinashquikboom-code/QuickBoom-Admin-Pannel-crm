'use client';

import React from 'react';
import Link from 'next/link';
import { Loader2, Check } from 'lucide-react';

export interface AdminFormActionsProps {
  backHref: string;
  cancelLabel?: string;
  submitLabel?: string;
  loading?: boolean;
  isSubmitting?: boolean;
  isPending?: boolean;
  onCancel?: () => void;
  sticky?: boolean;
  extraActions?: React.ReactNode;
}

export function AdminFormActions({
  backHref,
  cancelLabel = 'Cancel',
  submitLabel = 'Save Changes',
  loading = false,
  isSubmitting = false,
  isPending = false,
  onCancel,
  sticky = false,
  extraActions,
}: AdminFormActionsProps) {
  const isLoading = loading || isSubmitting || isPending;
  return (
    <div
      className={`bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-4 ${
        sticky
          ? 'sticky bottom-4 z-20 backdrop-blur-md bg-white/95 shadow-lg border-slate-300'
          : ''
      }`}
    >
      <div>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-black transition-all cursor-pointer text-center"
          >
            {cancelLabel}
          </button>
        ) : (
          <Link
            href={backHref}
            className="inline-block w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-black transition-all text-center"
          >
            {cancelLabel}
          </Link>
        )}
      </div>

      <div className="flex items-center gap-3">
        {extraActions}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto px-6 py-3 bg-[#23C45E] hover:bg-[#1AA14D] text-white rounded-2xl text-xs font-black transition-all shadow-md shadow-[#23C45E]/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>{submitLabel}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
