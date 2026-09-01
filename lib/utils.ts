import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') return error;

  if (error && typeof error === 'object') {
    const err = error as any;

    if (typeof err.response?.data?.message === 'string') {
      return err.response.data.message;
    }

    if (Array.isArray(err.response?.data?.message)) {
      return err.response.data.message.join(', ');
    }

    if (typeof err.response?.data?.error === 'string') {
      return err.response.data.error;
    }

    if (typeof err.message === 'string') {
      return err.message;
    }
  }

  return 'Something went wrong';
};

export function formatNumber(value: any, defaultValue: string = '0'): string {
  if (value === null || value === undefined || value === '') return defaultValue;
  const num = Number(value);
  if (Number.isNaN(num)) return defaultValue;
  return num.toLocaleString('en-IN');
}

export function formatCurrency(value: any, defaultValue: string = '₹0'): string {
  if (value === null || value === undefined || value === '') return defaultValue;
  const num = Number(value);
  if (Number.isNaN(num)) return defaultValue;
  return `₹${num.toLocaleString('en-IN')}`;
}

export function formatDate(value: any, defaultValue: string = '—'): string {
  if (!value) return defaultValue;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return defaultValue;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(value: any, defaultValue: string = '—'): string {
  if (!value) return defaultValue;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return defaultValue;
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });
}

export function formatTimeIST(value: any, defaultValue: string = '—'): string {
  if (value === null || value === undefined || value === '' || value === '—' || value === '--:--') {
    return defaultValue;
  }

  // If already formatted like "07:14 PM" or "7:14 AM"
  if (typeof value === 'string' && /^(0?[1-9]|1[0-2]):[0-5][0-9]\s*(AM|PM)$/i.test(value.trim())) {
    return value.trim();
  }

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return typeof value === 'string' ? value : defaultValue;
  }

  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });
}

/**
 * Format total minutes as 'Xh Ym' (e.g. 0 -> '0h 0m', 1 -> '0h 1m', 30 -> '0h 30m', 60 -> '1h 0m', 90 -> '1h 30m', 125 -> '2h 5m').
 */
export function formatDurationHoursMinutes(minutes: number | string | null | undefined): string {
  if (minutes === null || minutes === undefined || minutes === '') {
    return '0h 0m';
  }

  let totalMins = 0;
  if (typeof minutes === 'string') {
    const trimmed = minutes.trim();
    if (/^\d+h\s+\d+m$/i.test(trimmed)) {
      return trimmed;
    }
    const minMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*(?:min|m)?$/i);
    if (minMatch) {
      totalMins = Math.round(parseFloat(minMatch[1]));
    } else {
      const parsed = parseFloat(trimmed);
      totalMins = isNaN(parsed) ? 0 : Math.round(parsed);
    }
  } else {
    totalMins = Math.max(0, Math.round(Number(minutes)));
  }

  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return `${hours}h ${mins}m`;
}
