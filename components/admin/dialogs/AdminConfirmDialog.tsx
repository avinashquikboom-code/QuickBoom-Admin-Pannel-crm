'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { AdminButton } from '../buttons/AdminButton';

export interface AdminConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  message?: string;
  confirmLabel?: string;
  confirmText?: string;
  cancelLabel?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary' | 'warning';
  loading?: boolean;
  isLoading?: boolean;
}

export function AdminConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  message,
  confirmLabel = 'Confirm Action',
  confirmText,
  cancelLabel = 'Cancel',
  cancelText,
  variant = 'danger',
  loading = false,
  isLoading,
}: AdminConfirmDialogProps) {
  if (!isOpen) return null;

  const displayMessage = message || description || '';
  const displayConfirm = confirmText || confirmLabel;
  const displayCancel = cancelText || cancelLabel;
  const isBusy = isLoading ?? loading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 z-10 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                variant === 'danger'
                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">{title}</h3>
              {displayMessage && <p className="text-xs text-slate-500 font-medium mt-0.5">{displayMessage}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <AdminButton variant="secondary" size="sm" onClick={onClose} disabled={isBusy}>
            {displayCancel}
          </AdminButton>
          <AdminButton
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            loading={isBusy}
          >
            {displayConfirm}
          </AdminButton>
        </div>
      </div>
    </div>
  );
}
