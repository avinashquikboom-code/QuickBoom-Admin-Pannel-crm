'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { AdminButton } from '../buttons/AdminButton';

export interface AdminFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  subtitle?: string;
  icon?: any;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  maxWidth?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  hideFooter?: boolean;
  showFooter?: boolean;
  onSave?: (e?: React.FormEvent) => void;
  saveLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  isLoading?: boolean;
}

export function AdminFormDrawer({
  isOpen,
  onClose,
  title,
  description,
  subtitle,
  icon: Icon,
  size = 'md',
  maxWidth,
  children,
  footer,
  hideFooter = false,
  showFooter = false,
  onSave,
  saveLabel = 'Save Changes',
  cancelLabel = 'Cancel',
  isSubmitting = false,
  isLoading = false,
}: AdminFormDrawerProps) {
  const displayDescription = description || subtitle;
  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !isSubmitting) {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const sizeClasses = maxWidth || {
    sm: 'sm:max-w-[420px]',
    md: 'sm:max-w-[480px]',
    lg: 'sm:max-w-[560px]',
    xl: 'sm:max-w-[640px]',
  }[size];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
        aria-hidden="true"
      />

      {/* Sliding Drawer Container */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 pointer-events-none">
        <div
          className={`pointer-events-auto w-screen ${sizeClasses} bg-white shadow-2xl flex flex-col justify-between transform transition-transform ease-out duration-300 animate-in slide-in-from-right`}
        >
          {/* 1. Fixed Header */}
          <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
            <div className="min-w-0 pr-4 flex items-center gap-3">
              {Icon && (
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-[#1AA14D] flex items-center justify-center shrink-0 border border-emerald-200/60">
                  <Icon className="w-5 h-5 text-[#23C45E]" />
                </div>
              )}
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate">
                  {title}
                </h2>
                {displayDescription && (
                  <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                    {displayDescription}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 2. Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-slate-800">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <div className="w-6 h-6 border-2 border-[#23C45E] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-bold text-slate-400">Loading form...</p>
              </div>
            ) : (
              children
            )}
          </div>

          {/* 3. Fixed Footer */}
          {!hideFooter && (footer || onSave || showFooter) && (
            <div className="px-5 py-4 sm:px-6 sm:py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
              {footer ? (
                footer
              ) : (
                <>
                  <AdminButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={onClose}
                    disabled={isSubmitting}
                  >
                    {cancelLabel}
                  </AdminButton>

                  {onSave && (
                    <AdminButton
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={onSave}
                      loading={isSubmitting}
                    >
                      {saveLabel}
                    </AdminButton>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
