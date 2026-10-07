'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface EmployeeSideSheetProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidthClass?: string;
  headerExtra?: React.ReactNode;
  disableBackdropClick?: boolean;
}

export default function EmployeeSideSheet({
  open,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  maxWidthClass = 'sm:max-w-[480px] md:max-w-[520px]',
  headerExtra,
  disableBackdropClick = false,
}: EmployeeSideSheetProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
      onClick={() => {
        if (!disableBackdropClick) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`relative h-full w-full ${maxWidthClass} bg-white shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden animate-slide-in-right`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            {icon && (
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center shrink-0">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="font-black text-slate-900 text-base leading-tight truncate">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {headerExtra}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {children}
        </div>

        {/* Sticky Action Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0 sticky bottom-0 z-20 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
