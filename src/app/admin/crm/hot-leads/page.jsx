'use client';

import { Handshake } from 'lucide-react';
import { PageTitleCard } from '@/components/common/PageTitleCard';
import { HotDealLeads } from '@/modules/crm/HotDealLeads';

export default function HotLeadsPage() {
  return (
    <div className="space-y-5 pb-28 w-full min-w-0">
      <PageTitleCard
        moduleName="CRM"
        breadcrumb="Hot Leads"
        title="Hot Leads"
        description="High-intent prospects ready for focused follow-up."
        icon={Handshake}
      />
      <HotDealLeads />
    </div>
  );
}
