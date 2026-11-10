'use client';

import * as React from 'react';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { toast } from '@/hooks/use-toast';
import { addLeadNote, checkLeadDuplicate, crmError, loadEmployees, loadLeads, personName, saveLead, uploadLeadImage } from '@/modules/crm/crm-api';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faBuilding, faLink } from '@fortawesome/free-solid-svg-icons';
import { faFacebook, faInstagram, faLinkedin, faPinterest, faTiktok, faWhatsapp, faXTwitter, faYoutube } from '@fortawesome/free-brands-svg-icons';
import { loadDepartments } from '@/modules/master/master-api';

function stageLabel(value, stages = []) {
  const key = String(value || '').toUpperCase();
  const match = stages.find((stage) => String(stage.key || '').toUpperCase() === key || stage.name === value);
  return match?.name || value || '—';
}
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const SOURCE_OPTIONS = ['Manual', 'Google Maps', 'Google Places', 'Website', 'WhatsApp', 'Facebook', 'Instagram', 'Referral', 'Other'];
const SOCIAL_FIELDS = [
  ['instagram', 'Instagram URL', faInstagram, '#E1306C'],
  ['facebook', 'Facebook URL', faFacebook, '#1877F2'],
  ['linkedin', 'LinkedIn URL', faLinkedin, '#0A66C2'],
  ['youtube', 'YouTube URL', faYoutube, '#FF0000'],
  ['twitter', 'X / Twitter URL', faXTwitter, '#172B24'],
  ['whatsapp', 'WhatsApp Business URL', faWhatsapp, '#25D366'],
  ['tiktok', 'TikTok URL', faTiktok, '#111111'],
  ['pinterest', 'Pinterest URL', faPinterest, '#E60023'],
  ['other', 'Other social URL', faLink, '#163A2E'],
];
const blank = { leadName: '', companyName: '', phone: '', whatsapp: '', email: '', website: '', address: '', city: '', state: '', country: '', pincode: '', source: 'Manual', category: '', priority: 'MEDIUM', status: 'NEW', assignedToId: '', assignedTeam: '', value: '', notes: '', instagram: '', facebook: '', linkedin: '', youtube: '', twitter: '', whatsappUrl: '', tiktok: '', pinterest: '', other: '' };

function unwrap(payload) {
  if (payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) return payload.data;
  return payload || {};
}


function validEmail(value) {
  return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return !value || (digits.length >= 8 && digits.length <= 15);
}

function splitName(value) {
  const parts = String(value || '').trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') };
}


async function persistLead(form, id) {
  const name = splitName(form.leadName || `${form.firstName || ''} ${form.lastName || ''}`);
  if (!name.firstName) throw new Error('Lead name is required.');
  if (!validEmail(form.email)) throw new Error('Enter a valid email address.');
  if (!validPhone(form.phone) || !validPhone(form.whatsapp)) throw new Error('Enter a valid phone number.');
  if (form.value !== '' && form.value != null && Number.isNaN(Number(form.value))) throw new Error('Estimated deal value must be a number.');
  const socialMedia = socialPayload(form);
  const { imageFile, imagePreview, instagram, facebook, linkedin, youtube, twitter, whatsappUrl, tiktok, pinterest, other, ...leadValues } = form;
  const values = { ...leadValues, ...name, socialMedia, source: form.source === 'Google Places' ? 'GOOGLE_PLACES' : form.source };
  if (!id) {
    const duplicate = unwrap(await checkLeadDuplicate(values));
    if (duplicate.isDuplicate) throw new Error(duplicate.matchReason || 'A matching lead already exists.');
  }
  const saved = unwrap(await saveLead(values, id));
  const leadId = id || saved.id;
  if (leadId && form.imageFile instanceof File) await uploadLeadImage(leadId, form.imageFile);
  if (leadId && form.notes) await addLeadNote(leadId, form.notes);
  if (leadId && form.whatsapp && form.whatsapp !== form.phone) await addLeadNote(leadId, `WhatsApp: ${form.whatsapp}`);
}

function LeadForm({ form, setForm, sources, employees, departments, stages = [] }) {
  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });
  return <div className="grid gap-3 sm:grid-cols-2">
    <Field label="Business image" className="sm:col-span-2"><div className="flex items-center gap-3"><LeadAvatar lead={{ ...form, imageUrl: form.imagePreview || form.imageUrl }} /><input type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { toast.error('Use a JPG, PNG, or WebP image.'); event.target.value = ''; return; } if (file.size > 10 * 1024 * 1024) { toast.error('Image must be 10 MB or smaller.'); event.target.value = ''; return; } setForm({ ...form, imageFile: file, imagePreview: URL.createObjectURL(file) }); }} /></div></Field>
    <Field label="Lead name"><Input required value={form.leadName || ''} onChange={set('leadName')} /></Field>
    <Field label="Company name"><Input value={form.companyName || ''} onChange={set('companyName')} /></Field>
    <Field label="Mobile number"><Input value={form.phone || ''} onChange={set('phone')} /></Field>
    <Field label="WhatsApp number"><Input value={form.whatsapp || ''} onChange={set('whatsapp')} /></Field>
    <Field label="Email"><Input type="email" value={form.email || ''} onChange={set('email')} /></Field>
    <Field label="Website"><Input value={form.website || ''} onChange={set('website')} /></Field>
    <p className="sm:col-span-2 pt-1 text-xs font-semibold text-[#163A2E]">Social media</p>
    {SOCIAL_FIELDS.map(([key, label]) => <Field key={key} label={label}><Input type="url" inputMode="url" placeholder="https://" value={form[key === 'whatsapp' ? 'whatsappUrl' : key] || ''} onChange={set(key === 'whatsapp' ? 'whatsappUrl' : key)} /></Field>)}
    <Field label="Business address" className="sm:col-span-2"><Input value={form.address || ''} onChange={set('address')} /></Field>
    <Field label="City"><Input value={form.city || ''} onChange={set('city')} /></Field>
    <Field label="State"><Input value={form.state || ''} onChange={set('state')} /></Field>
    <Field label="Country"><Input value={form.country || ''} onChange={set('country')} /></Field>
    <Field label="Pincode"><Input value={form.pincode || ''} onChange={set('pincode')} /></Field>
    <Field label="Lead source"><select className="h-9 rounded-md border px-2 text-sm" value={form.source || 'Manual'} onChange={set('source')}>{sources.map((source) => <option key={source}>{source}</option>)}</select></Field>
    <Field label="Lead category"><Input value={form.category || ''} onChange={set('category')} /></Field>
    <Field label="Priority"><select className="h-9 rounded-md border px-2 text-sm" value={form.priority || 'MEDIUM'} onChange={set('priority')}>{PRIORITIES.map((item) => <option key={item}>{item}</option>)}</select></Field>
    <Field label="Lead stage"><select className="h-9 rounded-md border px-2 text-sm" value={form.stageId || form.status || ''} onChange={(event) => { const stage = stages.find((item) => String(item.id) === event.target.value || item.key === event.target.value); setForm({ ...form, status: stage?.key || event.target.value, stageId: stage?.id || '' }); }}>{stages.filter((stage) => stage.isActive !== false || stage.key === form.status || String(stage.id) === String(form.stageId)).map((stage) => <option key={stage.id || stage.key} value={stage.id || stage.key}>{stage.name}{stage.isActive === false ? ' (inactive)' : ''}</option>)}</select></Field>
    <Field label="Assigned employee"><select className="h-9 rounded-md border px-2 text-sm" value={form.assignedToId || ''} onChange={set('assignedToId')}><option value="">Unassigned</option>{employees.map((employee) => <option key={employee.recordId} value={employee.recordId}>{employee.name}</option>)}</select></Field>
    <Field label="Estimated deal value"><Input type="number" min="0" value={form.value ?? ''} onChange={set('value')} /></Field>
    <Field label="Notes" className="sm:col-span-2"><Input value={form.notes || ''} onChange={set('notes')} /></Field>
  </div>;
}


function Field({ label, children, className = '' }) { return <Label className={`grid gap-1 text-xs ${className}`}>{label}{children}</Label>; }

function leadInitials(name) {
  const words = String(name || '').trim().split(/\s+/).flatMap((word) => {
    if (word.endsWith(':')) return [];
    const cleaned = word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
    return cleaned ? [cleaned] : [];
  });
  if (!words.length) return '';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function mediaUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw) || raw.startsWith('blob:') || raw.startsWith('data:image/')) return raw;
  if (raw.startsWith('/api/') || raw.startsWith('/uploads/')) {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api.qbapp.online/api/v1';
    return `${base.replace(/\/api\/v1\/?$/, '')}${raw}`;
  }
  return '';
}

function leadImageUrls(lead) {
  const nested = Array.isArray(lead?.images) ? lead.images.map((image) => image?.url || image) : [];
  return [...new Set([lead?.imagePreview, lead?.imageUrl, ...nested].map(mediaUrl).filter(Boolean))];
}

function leadImageUrl(lead) {
  return leadImageUrls(lead)[0] || '';
}

function LeadPhotos({ lead }) {
  const urls = leadImageUrls(lead);
  const credits = [...new Set((Array.isArray(lead?.images) ? lead.images : []).flatMap((image) => Array.isArray(image?.attributions) ? image.attributions : []))];
  const [preview, setPreview] = React.useState('');
  const [failed, setFailed] = React.useState({});
  const visible = urls.filter((url) => !failed[url]);
  if (!urls.length) return null;
  return (
    <div className="space-y-2">
      <div className="flex gap-2 overflow-x-auto">
        {urls.map((url) => (
          <button key={url} type="button" className="h-20 w-28 shrink-0 overflow-hidden rounded-lg border border-[#E2E8E5] bg-[#E8F1EC]" onClick={() => setPreview(url)}>
            {failed[url] ? <span className="text-sm font-semibold text-[#163A2E]">{(leadInitials(personName(lead)) || 'L')[0]}</span> : <img src={url} alt="" className="h-full w-full object-cover" onError={() => setFailed((current) => ({ ...current, [url]: true }))} />}
          </button>
        ))}
      </div>
      {visible.some((url) => url.includes('/data-capture/photo')) ? <p className="text-xs text-[#718078]">Photos from Google Maps{credits.length ? ` · ${credits.join(', ')}` : ''}</p> : null}
      {preview ? (
        <button type="button" className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-6" onClick={() => setPreview('')}>
          <img src={preview} alt="" className="max-h-[80vh] max-w-full rounded-xl" />
        </button>
      ) : null}
    </div>
  );
}

function safeProfileUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const withScheme = /^https?:\/\//i.test(raw) ? raw : (/^[\w.-]+\.[a-z]{2,}([/:?#].*)?$/i.test(raw) ? `https://${raw}` : '');
  if (!withScheme) return '';
  try {
    const url = new URL(withScheme);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
}

function socialFormValues(row) {
  const social = row?.socialMedia && typeof row.socialMedia === 'object' ? row.socialMedia : {};
  return {
    instagram: social.instagram || '',
    facebook: social.facebook || '',
    linkedin: social.linkedin || '',
    youtube: social.youtube || '',
    twitter: social.twitter || '',
    whatsappUrl: social.whatsapp || '',
    tiktok: social.tiktok || '',
    pinterest: social.pinterest || '',
    other: social.other || '',
  };
}

function socialPayload(form) {
  const entries = [
    ['instagram', form.instagram],
    ['facebook', form.facebook],
    ['linkedin', form.linkedin],
    ['youtube', form.youtube],
    ['twitter', form.twitter],
    ['whatsapp', form.whatsappUrl],
    ['tiktok', form.tiktok],
    ['pinterest', form.pinterest],
    ['other', form.other],
  ];
  const payload = {};
  for (const [key, value] of entries) {
    const raw = String(value || '').trim();
    if (!raw) {
      payload[key] = '';
      continue;
    }
    const safe = safeProfileUrl(raw);
    if (!safe) throw new Error(`Enter a valid ${key} URL starting with http:// or https://.`);
    payload[key] = safe;
  }
  return payload;
}

function SocialLinks({ lead }) {
  const social = lead?.socialMedia && typeof lead.socialMedia === 'object' ? lead.socialMedia : {};
  const links = SOCIAL_FIELDS.flatMap(([key, label, icon, color]) => {
    const href = safeProfileUrl(social[key]);
    return href ? [{ key, label: label.replace(' URL', ''), href, icon, color }] : [];
  });
  if (!links.length) return <span className="text-[#718078]">Not Available</span>;
  return <div className="flex max-w-[168px] items-center gap-1 overflow-x-auto">{links.map((link) => <a key={link.key} href={link.href} target="_blank" rel="noopener noreferrer" title={link.label} aria-label={link.label} className="inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-[#E2E8E5] bg-white" style={{ color: link.color }}><FontAwesomeIcon icon={link.icon} className="size-3.5" /></a>)}</div>;
}

function LeadAvatar({ lead }) {
  const [failed, setFailed] = React.useState(false);
  const src = failed ? '' : leadImageUrl(lead);
  const displayName = personName(lead);
  const initials = leadInitials(displayName === '—' ? '' : displayName);
  React.useEffect(() => { setFailed(false); }, [lead?.imageUrl, lead?.imagePreview]);
  const frame = 'inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#E2E8E5] bg-[#E8F1EC] align-middle';
  if (!src) {
    return <span className={`${frame} text-xs font-bold leading-none text-[#163A2E]`} aria-hidden="true">{(initials || 'L')[0]}</span>;
  }
  return <img src={src} alt="" width={40} height={40} className={`${frame} object-cover`} onError={() => setFailed(true)} />;
}

export { stageLabel, PRIORITIES, SOURCE_OPTIONS, blank, unwrap, persistLead, LeadForm, Field, socialFormValues, SocialLinks, LeadAvatar, LeadPhotos };

export function ManualLeadDrawer({ open, onOpenChange }) {
  const [form, setForm] = React.useState({ ...blank });
  const [employees, setEmployees] = React.useState([]);
  const [departments, setDepartments] = React.useState([]);
  const [sources, setSources] = React.useState(SOURCE_OPTIONS);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  React.useEffect(() => {
    if (!open) return;
    let active = true;
    setForm({ ...blank }); setError('');
    Promise.all([loadEmployees({ bpoOnly: true }), loadDepartments(), loadLeads({ page: 1, limit: 1 })]).then(([people, teams, leads]) => {
      if (!active) return;
      setEmployees(people); setDepartments(teams);
      setSources([...new Set([...SOURCE_OPTIONS, ...(leads.sources || []).map((source) => source.name || source.code).filter(Boolean)])]);
    }).catch((error) => { if (active) setError(crmError(error)); });
    return () => { active = false; };
  }, [open]);
  return <FormDrawer open={open} onOpenChange={onOpenChange} title="Add Lead" description="Create a manual CRM lead." loading={saving} submitLabel="Add Lead" onSubmit={async (event) => {
    event.preventDefault(); setSaving(true); setError('');
    try { await persistLead(form); toast.success('CRM lead created'); onOpenChange(false); }
    catch (error) { setError(crmError(error)); }
    finally { setSaving(false); }
  }}>
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    <LeadForm form={form} setForm={setForm} sources={sources} employees={employees} departments={departments} />
  </FormDrawer>;
}
