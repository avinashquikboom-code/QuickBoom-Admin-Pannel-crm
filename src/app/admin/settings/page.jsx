'use client';

import { PageHeader } from '@/components/common/PageHeader';
import { HrmGap } from '@/modules/hrm/HrmNotice';
import { suiteGaps } from '@/modules/suite/suite-api';

export default function SettingsPage() {
  return <div className="mx-auto max-w-7xl space-y-6">
    <PageHeader title="General Settings" description="Application preferences for this admin panel." />
    <HrmGap title="No settings API" detail={suiteGaps.general} />
  </div>;
}
