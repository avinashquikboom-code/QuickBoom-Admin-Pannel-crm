'use client';

import * as React from 'react';

export function ProviderLogo({ provider, className = 'size-8', size = 32 }) {
  const norm = String(provider || '').toUpperCase();

  switch (norm) {
    case 'OPENAI':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={className}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M21.5 10.3a5.7 5.7 0 0 0-.5-4.2 5.9 5.9 0 0 0-4.3-3 5.8 5.8 0 0 0-4.6.8A5.7 5.7 0 0 0 8 3a5.9 5.9 0 0 0-4.3 3.1 5.8 5.8 0 0 0-.8 4.6 5.7 5.7 0 0 0 .8 4.2 5.9 5.9 0 0 0 4.3 3 5.8 5.8 0 0 0 4.6-.8 5.7 5.7 0 0 0 4.1.9 5.9 5.9 0 0 0 4.3-3.1 5.8 5.8 0 0 0 .5-4.6z"
            fill="#10A37F"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 5.3a2.3 2.3 0 0 1 2.3 2.3v3.4l2.1-1.2a2.3 2.3 0 0 1 3.1.8 2.4 2.4 0 0 1-.8 3.2L16 15.3v2.5a2.3 2.3 0 0 1-2.3 2.3 2.3 2.3 0 0 1-2.3-2.3v-3.4L9.3 15.6a2.3 2.3 0 0 1-3.1-.8 2.4 2.4 0 0 1 .8-3.2l2.7-1.5V7.6A2.3 2.3 0 0 1 12 5.3z"
            fill="#FFFFFF"
          />
        </svg>
      );

    case 'GEMINI':
    case 'GOOGLE_GEMINI':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={className}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="gemini-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1B73E8" />
              <stop offset="40%" stopColor="#7B1FA2" />
              <stop offset="75%" stopColor="#D93025" />
              <stop offset="100%" stopColor="#1A73E8" />
            </linearGradient>
          </defs>
          <path
            d="M12 2C12 7.52 7.52 12 2 12C7.52 12 12 16.48 12 22C12 16.48 16.48 12 22 12C16.48 12 12 7.52 12 2Z"
            fill="url(#gemini-grad)"
          />
        </svg>
      );

    case 'ANTHROPIC':
    case 'CLAUDE':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={className}
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="24" height="24" rx="6" fill="#D97757" />
          <path
            d="M13.8 6.5h2.4l4.1 11h-2.3l-.9-2.6H13l-.9 2.6H9.8l4-11zm2.5 6.6l-1.3-3.7-1.3 3.7h2.6zM6.5 13.5l1.6-4.5H5.8L4.2 13.5h2.3z"
            fill="#FFFFFF"
          />
        </svg>
      );

    case 'ELEVENLABS':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={className}
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="24" height="24" rx="6" fill="#000000" />
          <path
            d="M9.5 6.5h1.8v11H9.5zm3.2 0h1.8v11h-1.8z"
            fill="#FFFFFF"
          />
        </svg>
      );

    case 'RAZORPAY':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={className}
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="24" height="24" rx="6" fill="#0C2340" />
          <path
            d="M7 17.5L13.8 4H17L10.2 17.5H7z"
            fill="#0284C7"
          />
          <path
            d="M12 17.5L15.4 10.7H18L14.6 17.5H12z"
            fill="#38BDF8"
          />
        </svg>
      );

    case 'GOOGLE_MAPS':
    case 'MAPS':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={className}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
            fill="#EA4335"
          />
          <circle cx="12" cy="9" r="3" fill="#FFFFFF" />
          <circle cx="12" cy="9" r="1.8" fill="#1A73E8" />
        </svg>
      );

    case 'WHATSAPP':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={className}
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="24" height="24" rx="6" fill="#25D366" />
          <path
            d="M17.5 14.3c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.5-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.5-.5.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.2-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.8s1.2 3.2 1.4 3.4c.2.2 2.4 3.6 5.8 5.1 2.8 1.2 3.4 1 4 .9.6-.1 1.8-.7 2.1-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.4z"
            fill="#FFFFFF"
          />
        </svg>
      );

    case 'MSG91':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={className}
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="24" height="24" rx="6" fill="#1E293B" />
          <path
            d="M6 7h12c.6 0 1 .4 1 1v7c0 .6-.4 1-1 1h-4l-3 3-1-3H6c-.6 0-1-.4-1-1V8c0-.6.4-1 1-1z"
            fill="#38BDF8"
          />
          <circle cx="9" cy="11.5" r="1.2" fill="#FFFFFF" />
          <circle cx="12" cy="11.5" r="1.2" fill="#FFFFFF" />
          <circle cx="15" cy="11.5" r="1.2" fill="#FFFFFF" />
        </svg>
      );

    case 'FIREBASE':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={className}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.6 17.5L6.5 5.2c.1-.5.7-.7 1-.3l2.8 5.2-5.7 7.4z"
            fill="#FFA000"
          />
          <path
            d="M12.5 10.4l2.1-4c.3-.5 1-.5 1.2 0l3.6 11.1-6.9-7.1z"
            fill="#F57C00"
          />
          <path
            d="M4.6 17.5l7.4 4.1c.4.2.9.2 1.3 0l6.1-4.1-3.6-7-11.2 7z"
            fill="#FFCA28"
          />
        </svg>
      );

    case 'AWS':
    case 'AWS_S3':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={className}
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="24" height="24" rx="6" fill="#EAB308" />
          <path
            d="M6 8l6-3.5L18 8v8l-6 3.5L6 16V8z"
            fill="#CA8A04"
          />
          <path
            d="M12 4.5L18 8l-6 3.5L6 8l6-3.5z"
            fill="#FEF08A"
          />
          <path
            d="M12 11.5v8l6-3.5V8l-6 3.5z"
            fill="#A16207"
          />
        </svg>
      );

    case 'SMTP':
    case 'EMAIL':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={className}
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="24" height="24" rx="6" fill="#173D30" />
          <path
            d="M5 8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8z"
            fill="#20C466"
            fillOpacity="0.25"
          />
          <path
            d="M5 8.5l7 4.5 7-4.5M5 15.5l5-4.5m9 4.5l-5-4.5"
            stroke="#20C466"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    default:
      return (
        <div
          className={`${className} flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200`}
        >
          {norm.substring(0, 2)}
        </div>
      );
  }
}
