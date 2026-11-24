'use client';

import * as React from 'react';
import { BusinessAdsScreen } from '@/modules/content/BusinessAdsScreen';

export default function BusinessBannersPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-slate-400">Loading Business Banners...</div>}>
      <BusinessAdsScreen initialTab="BANNER" />
    </React.Suspense>
  );
}
