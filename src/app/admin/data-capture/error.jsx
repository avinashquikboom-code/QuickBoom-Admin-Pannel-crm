'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { RotateCw, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function DataCaptureError({ error, reset }) {
  React.useEffect(() => {
    console.error('[DataCaptureError]', error);
  }, [error]);

  return (
    <div className="flex min-h-[450px] w-full flex-col items-center justify-center p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-4 border border-rose-100 shadow-xs">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">Data Capture Failed to Load</h2>
      <p className="max-w-md text-sm text-slate-500 mb-6">
        {error?.message || 'An unexpected rendering or network error occurred while loading this page.'}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          onClick={() => (reset ? reset() : window.location.reload())}
          className="bg-[#16A34A] hover:bg-[#15803D] text-white"
        >
          <RotateCw className="mr-2 h-4 w-4" />
          Reload to Try Again
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
