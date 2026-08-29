'use client';

import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 1000,
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
          },
        },
      }),
  );

  useEffect(() => {
    const handleChunkError = (event: ErrorEvent) => {
      if (
        event.message &&
        (event.message.includes('Loading chunk') || event.message.includes('ChunkLoadError'))
      ) {
        event.preventDefault();
        window.location.reload();
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Prevent browser crash overlay when an unhandled event or empty rejection occurs
      if (event.reason instanceof Event || typeof event.reason === 'undefined') {
        event.preventDefault();
      }
    };

    window.addEventListener('error', handleChunkError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('error', handleChunkError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#0F172A',
            color: '#F8FAFC',
            borderRadius: '16px',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(16, 185, 129, 0.15)',
            fontSize: '13px',
            fontWeight: '700',
            padding: '12px 18px',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#0F172A',
            },
            style: {
              background: 'linear-gradient(135deg, #064E3B 0%, #0F172A 100%)',
              border: '1px solid rgba(16, 185, 129, 0.5)',
              color: '#FFFFFF',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#0F172A',
            },
            style: {
              background: 'linear-gradient(135deg, #7F1D1D 0%, #0F172A 100%)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              color: '#FFFFFF',
            },
          },
        }}
      />
    </QueryClientProvider>
  );
}
