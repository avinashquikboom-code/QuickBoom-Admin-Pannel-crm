'use client';

import * as React from 'react';
import { BusinessAdsScreen } from '@/modules/content/BusinessAdsScreen';

export default function BusinessVideosPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-slate-400">Loading Sponsored Videos...</div>}>
      <BusinessAdsScreen initialTab="VIDEO" />
    </React.Suspense>
  );
}
