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
  });
}
