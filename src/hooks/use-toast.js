'use client';

import { toast, toastStore } from '@/components/common/Toast';

export { toast, toastStore };

export function useToast() {
  const toastFn = (opts) => {
    if (typeof opts === 'string') {
      return toast.info(opts);
    }
    if (opts && typeof opts === 'object') {
      if (opts.variant === 'destructive' || opts.variant === 'error') {
        return toast.error(opts.title || 'Error!', {
          description: opts.description || opts.message,
          action: opts.action,
          duration: opts.duration,
        });
      }
      if (opts.variant === 'warning') {
        return toast.warning(opts.title || 'Warning!', {
          description: opts.description || opts.message,
          action: opts.action,
          duration: opts.duration,
        });
      }
      if (opts.variant === 'info') {
        return toast.info(opts.title || 'Information', {
          description: opts.description || opts.message,
          action: opts.action,
          duration: opts.duration,
        });
      }
      if (opts.variant === 'loading') {
        return toast.loading(opts.title || 'Processing...', {
          description: opts.description || opts.message,
          progress: opts.progress,
        });
      }
      return toast.success(opts.title || 'Success!', {
        description: opts.description || opts.message,
        action: opts.action,
        duration: opts.duration,
      });
    }
    return toast(opts);
  };

  toastFn.success = toast.success;
  toastFn.error = toast.error;
  toastFn.warning = toast.warning;
  toastFn.info = toast.info;
  toastFn.loading = toast.loading;
  toastFn.update = toast.update;
  toastFn.dismiss = toast.dismiss;
  toastFn.promise = toast.promise;

  return {
    toast: toastFn,
    dismiss: (id) => toast.dismiss(id),
    success: toast.success,
    error: toast.error,
    warning: toast.warning,
    info: toast.info,
    loading: toast.loading,
    update: toast.update,
  };
}
