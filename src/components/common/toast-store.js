// Centralized Toast State Store for QB Suite
let listeners = [];
let toasts = [];
let recentHashes = new Map();

const DEFAULT_TITLES = {
  success: 'Success!',
  error: 'Error!',
  warning: 'Warning!',
  info: 'Information',
  loading: 'Processing...',
};

const DEFAULT_DURATIONS = {
  success: 4000,
  error: 6000,
  warning: 5000,
  info: 5000,
  loading: Infinity,
};

const MAX_VISIBLE_TOASTS = 3;
const DEDUPE_WINDOW_MS = 1200;

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function normalizeArgs(type, messageOrTitle, options = {}) {
  let title = DEFAULT_TITLES[type] || 'Notification';
  let message = '';
  let duration = options.duration ?? DEFAULT_DURATIONS[type];
  let action = options.action;
  let progress = options.progress;
  let id = options.id;

  if (typeof messageOrTitle === 'string') {
    if (options.description) {
      // First arg was title, options.description is message
      title = messageOrTitle;
      message = options.description;
    } else {
      // First arg was description/message, use default title
      message = messageOrTitle;
      if (options.title) {
        title = options.title;
      }
    }
  } else if (typeof messageOrTitle === 'object' && messageOrTitle !== null) {
    // Passed an object: toast.success({ title, description, ... })
    const opts = messageOrTitle;
    title = opts.title || DEFAULT_TITLES[type];
    message = opts.description || opts.message || '';
    duration = opts.duration ?? DEFAULT_DURATIONS[type];
    action = opts.action;
    progress = opts.progress;
    id = opts.id;
  }

  return {
    id: id || `qb-toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    type,
    title,
    message,
    duration,
    action,
    progress,
  };
}

export const toastStore = {
  subscribe(listener) {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },

  getToasts() {
    return toasts;
  },

  add(toastData) {
    // Deduplication check
    const hash = `${toastData.type}:${String(toastData.message).trim()}:${String(toastData.title).trim()}`;
    const now = Date.now();
    const existing = recentHashes.get(hash);

    if (existing && now - existing.timestamp < DEDUPE_WINDOW_MS && toastData.type !== 'loading') {
      return existing.id;
    }
    recentHashes.set(hash, { timestamp: now, id: toastData.id });

    // Clean old hashes
    if (recentHashes.size > 50) {
      for (const [k, v] of recentHashes.entries()) {
        if (now - v.timestamp > 10000) recentHashes.delete(k);
      }
    }

    const toast = {
      ...toastData,
      isExiting: false,
      createdAt: now,
      remainingTime: toastData.duration,
      startTime: now,
    };

    // Schedule auto-dismiss if finite duration
    if (toast.duration && toast.duration !== Infinity && toast.duration > 0) {
      toast.timerId = setTimeout(() => {
        toastStore.dismiss(toast.id);
      }, toast.duration);
    }

    // Add to toasts list (newest first)
    toasts = [toast, ...toasts];

    // Enforce max visible: dismiss older visible toasts if exceeding MAX_VISIBLE_TOASTS
    const activeToasts = toasts.filter((t) => !t.isExiting);
    if (activeToasts.length > MAX_VISIBLE_TOASTS) {
      // Find oldest active non-loading toast to dismiss
      for (let i = toasts.length - 1; i >= 0; i--) {
        if (!toasts[i].isExiting && toasts[i].type !== 'loading') {
          toastStore.dismiss(toasts[i].id);
          break;
        }
      }
    }

    emitChange();
    return toast.id;
  },

  update(id, updates = {}) {
    const index = toasts.findIndex((t) => t.id === id);
    if (index === -1) return;

    const current = toasts[index];
    if (current.timerId) {
      clearTimeout(current.timerId);
    }

    const newType = updates.type || current.type;
    const newTitle = updates.title || (updates.type ? DEFAULT_TITLES[updates.type] : current.title);
    const newMessage = updates.message ?? updates.description ?? current.message;
    const newDuration = updates.duration ?? (updates.type ? DEFAULT_DURATIONS[updates.type] : current.duration);
    const newProgress = updates.progress !== undefined ? updates.progress : current.progress;
    const newAction = updates.action !== undefined ? updates.action : current.action;

    const updatedToast = {
      ...current,
      type: newType,
      title: newTitle,
      message: newMessage,
      duration: newDuration,
      progress: newProgress,
      action: newAction,
      isExiting: false,
      remainingTime: newDuration,
      startTime: Date.now(),
    };

    if (newDuration && newDuration !== Infinity && newDuration > 0) {
      updatedToast.timerId = setTimeout(() => {
        toastStore.dismiss(id);
      }, newDuration);
    }

    toasts = [...toasts];
    toasts[index] = updatedToast;
    emitChange();
  },

  dismiss(id) {
    if (!id) {
      // Dismiss all
      toasts.forEach((t) => {
        if (t.timerId) clearTimeout(t.timerId);
      });
      toasts = toasts.map((t) => ({ ...t, isExiting: true }));
      emitChange();
      setTimeout(() => {
        toasts = [];
        emitChange();
      }, 300);
      return;
    }

    const index = toasts.findIndex((t) => t.id === id);
    if (index === -1) return;

    const toast = toasts[index];
    if (toast.timerId) {
      clearTimeout(toast.timerId);
    }

    // Mark as exiting for smooth exit animation
    toasts = [...toasts];
    toasts[index] = { ...toast, isExiting: true };
    emitChange();

    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id);
      emitChange();
    }, 280);
  },

  pause(id) {
    const toast = toasts.find((t) => t.id === id);
    if (!toast || toast.duration === Infinity || toast.isExiting) return;

    if (toast.timerId) {
      clearTimeout(toast.timerId);
      toast.timerId = null;
      const elapsed = Date.now() - toast.startTime;
      toast.remainingTime = Math.max(500, toast.remainingTime - elapsed);
    }
  },

  resume(id) {
    const toast = toasts.find((t) => t.id === id);
    if (!toast || toast.duration === Infinity || toast.isExiting) return;

    if (!toast.timerId && toast.remainingTime > 0) {
      toast.startTime = Date.now();
      toast.timerId = setTimeout(() => {
        toastStore.dismiss(id);
      }, toast.remainingTime);
    }
  },
};

// Singleton toast dispatch function
export const toast = (messageOrTitle, options = {}) => {
  const norm = normalizeArgs('info', messageOrTitle, options);
  return toastStore.add(norm);
};

toast.success = (messageOrTitle, options) => {
  const norm = normalizeArgs('success', messageOrTitle, options);
  return toastStore.add(norm);
};

toast.error = (messageOrTitle, options) => {
  const norm = normalizeArgs('error', messageOrTitle, options);
  return toastStore.add(norm);
};

toast.warning = (messageOrTitle, options) => {
  const norm = normalizeArgs('warning', messageOrTitle, options);
  return toastStore.add(norm);
};

toast.info = (messageOrTitle, options) => {
  const norm = normalizeArgs('info', messageOrTitle, options);
  return toastStore.add(norm);
};

toast.loading = (messageOrTitle, options) => {
  const norm = normalizeArgs('loading', messageOrTitle, options);
  return toastStore.add(norm);
};

toast.update = (id, updates) => {
  toastStore.update(id, updates);
};

toast.dismiss = (id) => {
  toastStore.dismiss(id);
};

toast.promise = async (promise, { loading, success, error }) => {
  const toastId = toast.loading(typeof loading === 'string' ? loading : 'Processing...');
  try {
    const result = typeof promise === 'function' ? await promise() : await promise;
    const successMsg = typeof success === 'function' ? success(result) : (success || 'Completed successfully.');
    toast.update(toastId, {
      type: 'success',
      title: 'Success!',
      message: successMsg,
    });
    return result;
  } catch (err) {
    const errorMsg = typeof error === 'function' ? error(err) : (error || err?.message || 'Something went wrong.');
    toast.update(toastId, {
      type: 'error',
      title: 'Error!',
      message: errorMsg,
    });
    throw err;
  }
};
