'use client';

import { PageHeader } from '@/components/common/PageHeader';
import { HrmGap } from '@/modules/hrm/HrmNotice';
import { billingGaps } from '@/modules/customer/billing-api';

export default function CouponsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Coupons" description="Subscription coupon management." />
      <HrmGap title="Coupon API is not available" detail={billingGaps.coupons} />
    </div>
  );
}
