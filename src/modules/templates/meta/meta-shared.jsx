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

export function WhatsAppPreview({ body, header, headerType = 'NONE', footer, buttons = [], compact }) {
  const buttonList = Array.isArray(buttons) ? buttons : [];

  return (
    <div
      className={`mx-auto rounded-[28px] border border-slate-200/90 bg-[#E5DDD5] p-3 sm:p-4 shadow-inner ${
        compact ? 'max-w-[320px]' : 'max-w-[380px] w-full'
      }`}
    >
      {/* WhatsApp Message Bubble */}
      <div className="relative rounded-2xl rounded-tl-sm bg-white p-3 sm:p-3.5 text-sm text-slate-800 shadow-sm border border-slate-100">
        {/* Header Section */}
        {headerType && headerType !== 'NONE' && (
          <div className="mb-2">
            {headerType === 'TEXT' && header ? (
              <p className="font-bold text-slate-900 leading-snug">{header}</p>
            ) : headerType === 'IMAGE' ? (
              <div className="flex h-32 w-full items-center justify-center rounded-xl bg-slate-100 text-slate-400 text-xs border border-slate-200 overflow-hidden">
                {header && header.startsWith('http') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={header} alt="Header media" className="h-full w-full object-cover" />
                ) : (
                  <span>📷 [Image: {header || 'Sample Media'}]</span>
                )}
              </div>
            ) : headerType === 'VIDEO' ? (
              <div className="flex h-28 w-full items-center justify-center rounded-xl bg-slate-100 text-slate-500 text-xs border border-slate-200">
                <span>🎬 [Video: {header || 'Header Video'}]</span>
              </div>
            ) : headerType === 'DOCUMENT' ? (
              <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-2.5 text-xs text-slate-600 border border-slate-200">
                <span>📄 [Document: {header || 'Attached PDF'}]</span>
              </div>
            ) : header ? (
              <p className="font-bold text-slate-900">{header}</p>
            ) : null}
          </div>
        )}

        {/* Message Body */}
        <p className="whitespace-pre-wrap break-words leading-relaxed text-slate-800 text-[13px] sm:text-sm">
          {body || 'Your message text will appear here...'}
        </p>

        {/* Footer Text */}
        {footer && (
          <p className="mt-2 text-[11px] text-slate-400 border-t border-slate-100 pt-1.5 leading-tight">
            {footer}
          </p>
        )}

        {/* Timestamp simulation */}
        <div className="mt-1 text-right text-[10px] text-slate-400">
          12:30 PM
        </div>
      </div>

      {/* Buttons (Call to Actions / Quick Replies) */}
      {buttonList.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {buttonList.map((btn, index) => (
            <div
              key={index}
              className="flex items-center justify-center gap-2 rounded-xl bg-white py-2 px-3 text-center text-xs font-semibold text-[#00A884] shadow-xs border border-slate-100/80 transition-all hover:bg-slate-50"
            >
              <span>{btn.text || btn.type || 'Action Button'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
