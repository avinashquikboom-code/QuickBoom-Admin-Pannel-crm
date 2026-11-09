'use client';

import { PageHeader } from '@/components/common/PageHeader';
import { HrmGap } from '@/modules/hrm/HrmNotice';
import { suiteGaps } from '@/modules/suite/suite-api';

export default function CompanySettingsPage() {
  return <div className="mx-auto max-w-7xl space-y-6"><PageHeader title="Company Settings" description="Company profile, address, tax, and registration details." /><HrmGap title="No company settings API" detail={suiteGaps.company} /></div>;
}
