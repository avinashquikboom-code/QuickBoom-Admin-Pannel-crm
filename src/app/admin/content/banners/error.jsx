'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import {
  faTriangleExclamation,
  faRotate,
  faArrowLeft,
  faHouse,
} from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

export default function BannersError({ error, reset }) {
  React.useEffect(() => {
    console.error('[BannersPageError]', error);
  }, [error]);

  return (
    <div className="flex min-h-[500px] w-full flex-col items-center justify-center p-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-4 border border-amber-200/80 shadow-xs">
        <FontAwesomeIcon icon={faTriangleExclamation} className="text-2xl" />
      </div>

      <h2 className="text-xl font-bold text-slate-900 mb-2">
        Unable to Load Home Banners
      </h2>

      <p className="max-w-md text-sm text-slate-500 mb-6 leading-relaxed">
        {error?.message ||
          'A client-side runtime or connectivity issue prevented the promotional banners screen from displaying properly.'}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          type="button"
          onClick={() => (reset ? reset() : window.location.reload())}
          className="bg-[#16A34A] hover:bg-[#15803D] text-white shadow-xs font-semibold rounded-xl gap-2"
        >
          <FontAwesomeIcon icon={faRotate} className="text-xs" />
          <span>Reload Banners</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            window.location.href = '/admin/content/banners?refresh=' + Date.now();
          }}
          className="border-slate-200 text-slate-700 hover:bg-slate-50 font-medium rounded-xl gap-2"
        >
          <span>Hard Refresh</span>
        </Button>

        <Button variant="ghost" asChild className="text-slate-600 rounded-xl gap-2">
          <Link href="/admin/dashboard">
            <FontAwesomeIcon icon={faHouse} className="text-xs" />
            <span>Dashboard</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
