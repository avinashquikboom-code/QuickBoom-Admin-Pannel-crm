'use client';

import { PageHeader } from '@/components/common/PageHeader';
import { HrmGap } from '@/modules/hrm/HrmNotice';
import { missingHrmApis } from '@/modules/hrm/hrm-api';

export default function OvertimePage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Overtime Approvals" description="Review overtime requests when the payroll API provides them." />
      <HrmGap title="Overtime approvals are not available from the current API" detail={missingHrmApis.overtime} />
    </div>
  );
}
