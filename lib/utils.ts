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
