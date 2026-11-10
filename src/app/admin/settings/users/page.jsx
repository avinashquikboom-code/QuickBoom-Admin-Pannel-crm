'use client';

import { PageHeader } from '@/components/common/PageHeader';
import { HrmGap } from '@/modules/hrm/HrmNotice';
import { suiteGaps } from '@/modules/suite/suite-api';

export default function UsersPage() {
  return <div className="max-w-none min-w-0 w-full space-y-6"><PageHeader title="User Management" description="Administrator accounts, status, and role assignment." /><HrmGap title="No user API" detail={suiteGaps.users} /></div>;
}
