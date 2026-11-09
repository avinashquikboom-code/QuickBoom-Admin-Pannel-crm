'use client';

import { PageHeader } from '@/components/common/PageHeader';
import { HrmGap } from '@/modules/hrm/HrmNotice';
import { missingHrmApis } from '@/modules/hrm/hrm-api';

export default function AnnouncementsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Announcements" description="Publish HR announcements when an announcement API is available." />
      <HrmGap title="Announcements are not available from the current API" detail={missingHrmApis.announcements} />
    </div>
  );
}
