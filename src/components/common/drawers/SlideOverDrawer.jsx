'use client';

import * as React from 'react';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { cn } from '@/lib/utils';

export function SlideOverDrawer({
  open,
  onClose,
  title,
  subtitle,
  icon,
  iconBg = 'bg-emerald-50 border-emerald-100',
  iconColor = 'text-[#16A34A]',
  isDirty = false,
  discardTitle = 'Discard Unsaved Changes?',
  discardDescription = 'You have unsaved changes in this configuration. If you close now, your changes will be lost.',
  confirmLabel = 'Discard Changes',
  cancelLabel = 'Keep Editing',
  children,
  footer,
  className,
  placement = 'right',
  widthClass,
  loading = false,
}) {
  const [showDiscardConfirm, setShowDiscardConfirm] = React.useState(false);

  const defaultWidthClass =
    widthClass ||
    (placement === 'left'
      ? 'w-full md:w-[85vw] lg:w-[800px] lg:max-w-[85vw]'
      : 'w-full md:w-[80vw] md:max-w-[750px] lg:w-[720px] lg:max-w-[750px]');

  // Lock body scroll when drawer is open
  React.useEffect(() => {
    if (open) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [open]);

  // Attempt close with unsaved changes verification
  const handleAttemptClose = React.useCallback(() => {
    if (loading) return;
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      onClose?.();
    }
  }, [loading, isDirty, onClose]);

  // Handle escape key
  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleAttemptClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, handleAttemptClose]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Subtle Dark Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
          onClick={handleAttemptClose}
          aria-hidden="true"
        />

        {/* Slide-over Container */}
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="slideover-drawer-title"
          className={cn(
            'fixed inset-y-0 z-50 flex flex-col bg-white shadow-2xl',
            'h-full max-h-screen h-[100dvh] max-w-full overflow-x-hidden transition-transform duration-300 ease-in-out',
            placement === 'left'
              ? 'left-0 border-r border-slate-200/90 animate-in slide-in-from-left duration-300'
              : 'right-0 border-l border-slate-200/90 animate-in slide-in-from-right duration-300',
            defaultWidthClass,
            className
          )}
        >
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between border-b border-slate-200/80 px-6 py-4 bg-slate-50/70 sticky top-0 z-10">
            <div className="flex items-center gap-3 min-w-0 pr-4">
              {icon && (
                <div
                  className={cn(
                    'flex size-10 items-center justify-center rounded-xl border shrink-0',
                    iconBg,
                    iconColor
                  )}
                >
                  {icon}
                </div>
              )}
              <div className="min-w-0">
                <h2
                  id="slideover-drawer-title"
                  className="text-base font-bold text-slate-900 leading-snug truncate"
                >
                  {title}
                </h2>
                {subtitle && <p className="text-xs text-slate-500 mt-0.5 truncate">{subtitle}</p>}
              </div>
            </div>

            <button
              type="button"
              onClick={handleAttemptClose}
              disabled={loading}
              className="text-slate-400 hover:text-slate-700 size-8 flex items-center justify-center rounded-lg hover:bg-slate-200/70 transition-colors cursor-pointer shrink-0"
              aria-label="Close drawer"
            >
              <FontAwesomeIcon icon={faXmark} className="text-base" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6 space-y-6">
            {children}
          </div>

          {/* Sticky Footer */}
          {footer && (
            <div className="shrink-0 flex items-center justify-end gap-3 border-t border-slate-200/80 bg-slate-50/90 px-6 py-4 sticky bottom-0 z-10 shadow-xs">
              {typeof footer === 'function'
                ? footer({ attemptClose: handleAttemptClose, loading })
                : footer}
            </div>
          )}
        </div>
      </div>

      {/* Discard Confirmation Dialog */}
      <ConfirmDialog
        open={showDiscardConfirm}
        onOpenChange={setShowDiscardConfirm}
        title={discardTitle}
        description={discardDescription}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        variant="destructive"
        onConfirm={() => {
          setShowDiscardConfirm(false);
          onClose?.();
        }}
      />
    </>
  );
}
