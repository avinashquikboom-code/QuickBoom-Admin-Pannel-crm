'use client';

import { PageHeader } from '@/components/common/PageHeader';
import { HrmGap } from '@/modules/hrm/HrmNotice';
import { suiteGaps } from '@/modules/suite/suite-api';

export default function CompanySettingsPage() {
  return <div className="max-w-none space-y-4 sm:space-y-6 w-full min-w-0 overflow-x-hidden"><PageHeader title="Company Settings" description="Company profile, address, tax, and registration details." /><HrmGap title="No company settings API" detail={suiteGaps.company} /></div>;
}
