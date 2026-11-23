'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { WhatsAppTemplateModal } from './WhatsAppTemplateModal';

export function MetaTemplateCreate() {
  const router = useRouter();

  return (
    <WhatsAppTemplateModal
      isOpen={true}
      isPageMode={true}
      onClose={() => router.push('/admin/sections/meta-templates')}
      onSaved={() => router.push('/admin/sections/meta-templates')}
    />
  );
}

export default MetaTemplateCreate;
