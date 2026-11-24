'use client';

import * as React from 'react';
import { BusinessGrowthScreen } from '@/modules/business-growth/BusinessGrowthScreen';

export default function BusinessAdsPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-slate-400">Loading Business Growth Hub...</div>}>
      <BusinessGrowthScreen initialTab="overview" />
    </React.Suspense>
  );
}
