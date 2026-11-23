'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { WhatsAppTemplateModal } from '@/modules/templates/meta/WhatsAppTemplateModal';

export default function MetaTemplateCreatePage() {
  const router = useRouter();

  return (
    <WhatsAppTemplateModal
      isOpen={true}
      onClose={() => router.push('/admin/sections/meta-templates')}
      onSaved={() => router.push('/admin/sections/meta-templates')}
    />
  );
}
