'use client';

export function MetaTemplateDetails({ template }) {
  const buttons = Array.isArray(template.buttons) ? template.buttons : [];
  const variables = Array.isArray(template.variables) ? template.variables : [];
  return (
    <div className="space-y-3 text-sm text-[#172B24]">
      <p><span className="text-[#718078]">Code:</span> {template.templateName || template.key || '—'}</p>
      <p><span className="text-[#718078]">Language:</span> {template.language}</p>
      <p><span className="text-[#718078]">Category:</span> {template.category}</p>
      <p><span className="text-[#718078]">Approval:</span> {template.status}</p>
      <p><span className="text-[#718078]">Source:</span> {template.source || 'META_SYNC'}</p>
      <p><span className="text-[#718078]">Header:</span> {template.headerContent || template.headerType || 'None'}</p>
      <p className="whitespace-pre-wrap break-words"><span className="text-[#718078]">Body:</span> {template.body || template.bodyText}</p>
      <p><span className="text-[#718078]">Footer:</span> {template.footer || template.footerText || '—'}</p>
      <p><span className="text-[#718078]">Buttons:</span> {buttons.length ? buttons.map((button) => button.text || button.type).join(', ') : '—'}</p>
      <p><span className="text-[#718078]">Variables:</span> {variables.length ? variables.join(', ') : '—'}</p>
      {template.rejectionReason ? <p className="text-red-600">Rejection reason: {template.rejectionReason}</p> : null}
    </div>
  );
}

export function WhatsAppPreview({ body, header, footer, compact }) {
  return (
    <div className={`mx-auto rounded-[24px] border border-slate-200 bg-[#e5ddd5] p-3 shadow-inner ${compact ? 'max-w-[320px]' : 'max-w-[380px] w-full'}`}>
      <div className="rounded-2xl bg-white p-3 text-sm text-slate-800 shadow-sm">
        {header ? <p className="mb-2 font-bold">{header}</p> : null}
        <p className="whitespace-pre-wrap break-words leading-relaxed">{body || 'Message body preview'}</p>
        {footer ? <p className="mt-2 text-[11px] text-slate-500">{footer}</p> : null}
      </div>
    </div>
  );
}
