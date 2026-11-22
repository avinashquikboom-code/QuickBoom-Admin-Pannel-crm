'use client';

import * as React from 'react';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import {
  faCircleCheck,
  faCircleExclamation,
  faTriangleExclamation,
  faCircleInfo,
  faSpinner,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { toastStore, toast } from './toast-store';

export { toast, toastStore };

const VARIANT_CONFIG = {
  success: {
    borderLeftClass: 'border-l-[5px] border-l-[#163A2E]',
    bgClass: 'bg-white',
    icon: faCircleCheck,
    iconWrapperClass: 'bg-[#E8F1EC] text-[#163A2E]',
    defaultTitle: 'Success!',
    role: 'status',
  },
  error: {
    borderLeftClass: 'border-l-[5px] border-l-rose-600',
    bgClass: 'bg-white',
    icon: faCircleExclamation,
    iconWrapperClass: 'bg-rose-50 text-rose-600',
    defaultTitle: 'Error!',
    role: 'alert',
  },
  warning: {
    borderLeftClass: 'border-l-[5px] border-l-amber-500',
    bgClass: 'bg-white',
    icon: faTriangleExclamation,
    iconWrapperClass: 'bg-amber-50 text-amber-600',
    defaultTitle: 'Warning!',
    role: 'status',
  },
  info: {
    borderLeftClass: 'border-l-[5px] border-l-sky-500',
    bgClass: 'bg-white',
    icon: faCircleInfo,
    iconWrapperClass: 'bg-sky-50 text-sky-600',
    defaultTitle: 'Information',
    role: 'status',
  },
  loading: {
    borderLeftClass: 'border-l-[5px] border-l-sky-500',
    bgClass: 'bg-white',
    icon: faSpinner,
    iconWrapperClass: 'bg-sky-50 text-sky-600',
    defaultTitle: 'Processing...',
    role: 'status',
    isSpinner: true,
  },
};

export function ToastItem({ toast: item }) {
  const config = VARIANT_CONFIG[item.type] || VARIANT_CONFIG.info;
  const title = item.title || config.defaultTitle;

  return (
    <div
      role={config.role}
      aria-atomic="true"
      onMouseEnter={() => toastStore.pause(item.id)}
      onMouseLeave={() => toastStore.resume(item.id)}
      className={`pointer-events-auto w-full rounded-2xl border border-slate-200/90 shadow-[0_12px_36px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] p-3.5 sm:p-4 transition-all duration-200 ease-out motion-reduce:transition-none ${
        config.bgClass
      } ${config.borderLeftClass} ${
        item.isExiting
          ? 'opacity-0 -translate-y-2 scale-95 pointer-events-none motion-reduce:opacity-0'
          : 'opacity-100 translate-y-0 scale-100 animate-in fade-in slide-in-from-top-3 duration-200 motion-reduce:animate-none'
      }`}
    >
      <div className="flex items-start gap-3 sm:gap-3.5">
        {/* Variant Icon inside pill container */}
        <div
          className={`shrink-0 size-9 rounded-xl flex items-center justify-center shadow-2xs ${config.iconWrapperClass}`}
        >
          <FontAwesomeIcon
            icon={config.icon}
            className={`size-4.5 ${config.isSpinner ? 'animate-spin' : ''}`}
          />
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0 pr-1">
          <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug truncate">
            {title}
          </p>
          {item.message && (
            <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed break-words mt-0.5">
              {item.message}
            </p>
          )}

          {/* Optional Loading Progress Bar */}
          {item.type === 'loading' && typeof item.progress === 'number' && (
            <div className="mt-2.5 space-y-1">
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, item.progress))}%` }}
                />
              </div>
              <span className="text-[10px] font-semibold text-slate-400 block text-right">
                {Math.round(item.progress)}%
              </span>
            </div>
          )}

          {/* Optional Action Button */}
          {item.action && (
            <div className="mt-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  item.action.onClick(item.id);
                  toastStore.dismiss(item.id);
                }}
                className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
              >
                {item.action.label}
              </button>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={() => toastStore.dismiss(item.id)}
          className="shrink-0 size-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close notification"
        >
          <FontAwesomeIcon icon={faXmark} className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

export function Toaster({ position = 'top-right' }) {
  const [toasts, setToasts] = React.useState([]);

  React.useEffect(() => {
    setToasts(toastStore.getToasts());
    return toastStore.subscribe(() => {
      setToasts([...toastStore.getToasts()]);
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed top-5 right-5 sm:top-6 sm:right-6 z-[9999] flex flex-col gap-2.5 sm:gap-3 pointer-events-none w-[min(420px,calc(100vw-32px))] max-w-[420px] max-sm:inset-x-4 max-sm:top-4 max-sm:w-auto"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}

// Backward-compatible export
export { Toaster as Toast };
