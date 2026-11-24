/** Normalize a single template returned either directly or in the API response envelope. */
export function templateRecordOf(payload) {
  if (payload?.success === false) {
    const message = payload.message;
    throw new Error(Array.isArray(message) ? message.join(', ') : message || 'Template request failed.');
  }
  if (payload && typeof payload === 'object' && !Array.isArray(payload.data) && payload.data && typeof payload.data === 'object') return payload.data;
  return payload || {};
}

export function confirmedTemplateOf(payload) {
  const record = templateRecordOf(payload);
  if (!record.metaTemplateId || String(record.metaTemplateId).startsWith('seed_')) {
    throw new Error(record.syncError || record.message || 'Meta did not return a template ID. Sync templates and check the template status before retrying.');
  }
  return record;
}
