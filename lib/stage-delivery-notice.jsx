import { toast } from 'react-hot-toast';

const upper = (value) => String(value || '').trim().toUpperCase();

const blobOf = (payload) => [payload?.reason, payload?.errorCode, payload?.error, payload?.message, payload?.details]
  .filter(Boolean)
  .join(' ')
  .toLowerCase();

const languageProblem = (payload, blob) => {
  const reason = upper(payload?.reason || payload?.errorCode);
  return reason.includes('LANGUAGE') || blob.includes('language mismatch') || blob.includes('language is unavailable');
};

const missingTemplate = (payload, blob) => {
  const reason = upper(payload?.reason || payload?.errorCode);
  const meta = payload?.metaErrorCode;
  return meta === 132001 || meta === '132001' || reason.includes('TEMPLATE_NOT') || reason.includes('TEMPLATE_PENDING') || reason.includes('TEMPLATE_REJECT') || reason.includes('132001') || blob.includes('132001') || blob.includes('not approved') || blob.includes('does not exist');
};

const notConfigured = (payload, blob) => {
  const reason = upper(payload?.reason || payload?.errorCode);
  return reason.includes('NOT_CONFIGURED') || reason.includes('NO_TEMPLATE') || reason.includes('EMAIL_TEMPLATE_MISSING') || blob.includes('not configured') || blob.includes('no template') || blob.includes('no email template');
};

const missingEmail = (payload, blob) => {
  const reason = upper(payload?.reason || payload?.errorCode);
  return reason.includes('CUSTOMER_EMAIL_MISSING') || reason.includes('NO_EMAIL') || blob.includes('email is missing') || blob.includes('email address is missing');
};

function notice(label, payload) {
  if (!payload) return null;
  const status = upper(payload.status) || 'UNKNOWN';
  const blob = blobOf(payload);
  const whatsapp = label === 'WhatsApp';

  if (whatsapp && languageProblem(payload, blob)) return { label, status: 'FAILED', detail: 'Selected template language is unavailable.', tone: 'failed' };
  if (whatsapp && missingTemplate(payload, blob)) return { label, status: 'FAILED', detail: 'Template not found or not approved.', tone: 'failed' };
  if (notConfigured(payload, blob) || (whatsapp && status === 'SKIPPED')) return { label, status: 'SKIPPED', detail: 'No template configured for this stage.', tone: 'skipped' };
  if (!whatsapp && missingEmail(payload, blob)) return { label, status: 'SKIPPED', detail: 'Customer email address is missing.', tone: 'skipped' };
  if (!whatsapp && status === 'SKIPPED') return { label, status: 'SKIPPED', detail: 'No template configured for this stage.', tone: 'skipped' };

  if (status === 'SENT') return { label, status, detail: whatsapp ? 'Message sent successfully.' : 'Email sent successfully.', tone: 'sent' };
  if (status === 'DELIVERED') return { label, status, detail: whatsapp ? 'Message delivered.' : 'Email delivered.', tone: 'sent' };
  if (status === 'READ') return { label, status, detail: 'Message read.', tone: 'sent' };
  if (status === 'FAILED') return { label, status, detail: whatsapp ? 'Message could not be sent. Please try again.' : 'Unable to send email. Please try again.', tone: 'failed' };
  if (status === 'PENDING') return { label, status, detail: 'Waiting to send.', tone: 'pending' };
  return { label, status: 'FAILED', detail: 'Something went wrong. Please try again.', tone: 'failed' };
}

const toneColor = {
  sent: '#16A34A',
  failed: '#DC2626',
  skipped: '#64748B',
  pending: '#D97706',
};

let visibleKey = '';

export function showStageDeliveryNotice(payload) {
  const email = notice('Email', payload?.emailNotification);
  const whatsapp = notice('WhatsApp', payload?.whatsappNotification);
  if (!email && !whatsapp) return;

  const bothSkipped = email && whatsapp && email.status === 'SKIPPED' && whatsapp.status === 'SKIPPED' && email.detail.startsWith('No template') && whatsapp.detail.startsWith('No template');
  const key = bothSkipped ? 'both-skipped' : `${whatsapp?.status}:${whatsapp?.detail}|${email?.status}:${email?.detail}`;
  if (visibleKey === key) return;
  visibleKey = key;

  toast.custom((current) => (
    <div className="w-[min(420px,calc(100vw-32px))] rounded-2xl bg-[#0F172A] px-4 py-3 text-white shadow-xl">
      <div className="mb-1 flex items-center justify-between gap-3">
        <p className="text-sm font-bold">Message Delivery</p>
        <button type="button" className="text-xs text-slate-300" onClick={() => { visibleKey = ''; toast.dismiss(current.id); }}>Close</button>
      </div>
      {bothSkipped ? <p className="text-sm text-slate-200">Messages skipped: No channel is configured for this stage.</p> : null}
      {!bothSkipped && [whatsapp, email].filter(Boolean).map((item) => (
        <p key={item.label} className="mt-1 text-sm leading-snug" style={{ color: toneColor[item.tone] }}>
          {item.label}: {item.status} – {item.detail}
        </p>
      ))}
    </div>
  ), { id: `stage-delivery-${key}`, duration: 5000 });
}
