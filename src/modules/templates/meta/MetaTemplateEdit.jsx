'use client';

import * as React from 'react';
import { WhatsAppTemplateModal } from './WhatsAppTemplateModal';

export function MetaTemplateEdit({ template, duplicate = false, onClose, onSaved }) {
  return (
    <WhatsAppTemplateModal
      template={template}
      duplicate={duplicate}
      isOpen={true}
      isPageMode={false}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

export default MetaTemplateEdit;
