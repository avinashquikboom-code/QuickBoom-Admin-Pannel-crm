'use client';

import * as React from 'react';
import { BusinessAdsScreen } from '@/modules/content/BusinessAdsScreen';

export default function BusinessApprovalsPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-slate-400">Loading Ad Approvals...</div>}>
      <BusinessAdsScreen initialTab="PENDING" />
    </React.Suspense>
  );
}
