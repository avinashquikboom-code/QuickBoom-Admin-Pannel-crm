'use client';

export function MetaTemplateDetails({ template }) {
  const buttons = Array.isArray(template.buttons) ? template.buttons : [];
  const variables = Array.isArray(template.variables) ? template.variables : [];

  return (
    <div className="space-y-4 text-xs sm:text-sm text-slate-800">
      {/* Rejection Alert if rejected */}
      {template.rejectionReason && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-rose-800">
          <p className="font-bold text-xs uppercase tracking-wide text-rose-700">Meta Rejection Reason</p>
          <p className="mt-1 text-xs leading-relaxed">{template.rejectionReason}</p>
        </div>
      )}

      {/* Overview Grid */}
      <div className="grid grid-cols-2 gap-2.5 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Code / Key</span>
          <span className="font-mono text-xs font-semibold text-slate-800 break-all">
            {template.templateName || template.key || '—'}
          </span>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Language</span>
          <span className="font-semibold text-slate-800">{template.language || '—'}</span>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Category</span>
          <span className="font-semibold text-slate-800">{template.category || '—'}</span>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Approval Status</span>
          <span className="font-semibold text-emerald-700">{template.status || '—'}</span>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Source</span>
          <span className="font-medium text-slate-600">
            {template.source ? template.source.replace('QB_', 'QB ') : 'META_SYNC'}
          </span>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Header Type</span>
          <span className="font-medium text-slate-600">{template.headerType || 'NONE'}</span>
        </div>
      </div>

      {/* Header Content if text */}
      {template.headerContent && (
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Header Content</span>
          <p className="text-xs font-semibold text-slate-800">{template.headerContent}</p>
        </div>
      )}

      {/* Message Body */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-1.5">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Message Body Text</span>
        <div className="rounded-lg bg-slate-50 p-2.5 font-mono text-xs leading-relaxed text-slate-800 whitespace-pre-wrap break-words border border-slate-100">
          {template.body || template.bodyText || '—'}
        </div>
      </div>

      {/* Footer Content */}
      {(template.footer || template.footerText) && (
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Footer Text</span>
          <p className="text-xs text-slate-600">{template.footer || template.footerText}</p>
        </div>
      )}

      {/* Interactive Buttons */}
      {buttons.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Buttons ({buttons.length})
          </span>
          <div className="flex flex-wrap gap-2">
            {buttons.map((btn, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-[#00A884]"
              >
                <span>{btn.text || btn.type}</span>
                {btn.url && <span className="text-[10px] text-slate-400 truncate max-w-[150px]">({btn.url})</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Variables */}
      {variables.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Dynamic Variables ({variables.length})
          </span>
          <div className="flex flex-wrap gap-1.5">
            {variables.map((variable, idx) => (
              <span
                key={idx}
                className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-xs font-bold text-emerald-800"
              >
                {`{{${variable}}}`}
              </span>
            ))}
          </div>
        </div>
      )}
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
