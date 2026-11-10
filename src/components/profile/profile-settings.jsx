'use client';
import * as React from 'react';
import api from '../../../lib/api';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { FormDrawer } from '@/components/common/drawers';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/common/Avatar';
import { toast } from 'sonner';

export function profileError(error) {
  const message = error?.response?.data?.message;
  return Array.isArray(message) ? message.join(' ') : typeof message === 'string' ? message : 'Unable to complete this request. Please try again.';
}
export function ProfileCard({ title, action, children }) {
  return <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="text-base font-semibold text-slate-900">{title}</h2>{action}</div>{children}</section>;
}
export function ProfileFields({ fields }) {
  return <dl className="grid min-w-0 grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">{fields.map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 break-words text-sm font-medium text-slate-800">{value ?? 'Not available'}</dd></div>)}</dl>;
}
export function ProfileEditDrawer({ user, profile, open, onOpenChange, onSaved }) {
  const [form, setForm] = React.useState({});
  const [file, setFile] = React.useState(null);
  const [preview, setPreview] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  React.useEffect(() => { if (open) { setForm({ firstName: user.firstName || '', lastName: user.lastName || '', phone: user.phone || '' }); setFile(null); setError(''); } }, [open]);
  React.useEffect(() => { if (!file) { setPreview(''); return; } const url = URL.createObjectURL(file); setPreview(url); return () => URL.revokeObjectURL(url); }, [file]);
  async function save() {
    setBusy(true); setError('');
    let detailsSaved = false;
    try {
      await api.put('/auth/profile', form); detailsSaved = true;
      if (file) { const data = new FormData(); data.append('file', file); await api.post('/auth/profile/photo', data, { headers: { 'Content-Type': 'multipart/form-data' } }); }
      await onSaved(); toast.success('Profile updated'); onOpenChange(false);
    } catch (err) { setError((detailsSaved ? 'Details saved, but photo upload failed. ' : '') + profileError(err)); if (detailsSaved) await onSaved(); }
    finally { setBusy(false); }
  }
  return <FormDrawer open={open} onOpenChange={(next) => { if (!busy) onOpenChange(next); }} title="Edit Profile" description="Update your personal details and profile photo." onSubmit={save} loading={busy} submitLabel="Save Changes">
    {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-rose-700">{error}</p>}
    <div className="flex items-center gap-3"><Avatar className="size-16 shrink-0"><AvatarImage src={preview || user.avatar || undefined} alt="Profile preview" /><AvatarFallback>{profile.initials}</AvatarFallback></Avatar><p className="text-xs text-slate-500">JPG, PNG or WebP. Maximum 5 MB.</p></div>
    <Label className="grid gap-2">Profile Photo<Input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(e) => { const image = e.target.files?.[0]; if (!image) { setFile(null); return; } if (!['image/jpeg','image/png','image/webp'].includes(image.type) || image.size > 5 * 1024 * 1024) { setError('Choose a JPG, PNG or WebP image up to 5 MB.'); e.target.value = ''; return; } setError(''); setFile(image); }} /></Label>
    <div className="grid gap-4 sm:grid-cols-2">{[['firstName','First Name'],['lastName','Last Name'],['phone','Phone']].map(([key,label]) => <Label key={key} className="grid gap-2">{label}<Input disabled={busy} required={key !== 'phone'} maxLength={key === 'phone' ? 20 : 100} type={key === 'phone' ? 'tel' : 'text'} value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} /></Label>)}</div>
    <Label className="grid gap-2">Email<Input value={user.email || ''} readOnly /></Label><p className="text-xs text-slate-500">Email changes are unavailable until an account email verification workflow is configured.</p>
  </FormDrawer>;
}
export function SecuritySettings() {
  const [values, setValues] = React.useState({ currentPassword:'',newPassword:'',confirm:'' });
  const [show,setShow] = React.useState(false);
  const [busy,setBusy] = React.useState(false);
  const [error,setError] = React.useState('');
  async function save(e) {
    e.preventDefault(); setError('');
    if (values.newPassword !== values.confirm) { setError('New passwords do not match.'); return; }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,72}$/.test(values.newPassword) || new TextEncoder().encode(values.newPassword).length > 72) { setError('Use 12–72 characters with uppercase, lowercase, a number and a symbol (maximum 72 UTF-8 bytes).'); return; }
    setBusy(true);
    try { await api.post('/auth/profile/password', {currentPassword:values.currentPassword,newPassword:values.newPassword}); setValues({currentPassword:'',newPassword:'',confirm:''}); setShow(false); toast.success('Password changed. Refresh tokens have been revoked.'); }
    catch (err) { setError(profileError(err)); }
    finally { setBusy(false); }
  }
  return <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]"><ProfileCard title="Change Password"><form onSubmit={save} className="space-y-4">{error && <p role="alert" className="text-sm text-rose-700">{error}</p>}{[['currentPassword','Current Password'],['newPassword','New Password'],['confirm','Confirm New Password']].map(([key,label]) => <Label key={key} className="grid gap-2">{label}<Input type={show ? 'text' : 'password'} required autoComplete={key === 'currentPassword' ? 'current-password' : 'new-password'} disabled={busy} value={values[key]} onChange={(e) => setValues({...values,[key]:e.target.value})} /></Label>)}<p className="text-xs text-slate-500">Use at least 12 characters, including uppercase, lowercase, a number and a symbol.</p><div className="flex flex-wrap gap-3"><Button type="button" variant="outline" aria-pressed={show} onClick={() => setShow(!show)}>{show ? 'Hide' : 'Show'} passwords</Button><Button disabled={busy}>{busy ? 'Saving…' : 'Change Password'}</Button></div></form></ProfileCard><div className="space-y-5"><ProfileCard title="Two-Factor Authentication"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">Not Configured</span><p className="mt-4 text-sm text-slate-500">Two-factor authentication is not available for this application yet.</p></ProfileCard><ProfileCard title="Active Sessions"><p className="text-sm text-slate-500">Device session management is not available. Password changes revoke refresh tokens; existing access tokens remain valid until they expire.</p></ProfileCard></div></div>;
}
export function ActivityTimeline() {
  const [page,setPage] = React.useState(1), [dates,setDates] = React.useState({from:'',to:''}), [filters,setFilters] = React.useState({}), [retry,setRetry] = React.useState(0);
  const [data,setData] = React.useState(null), [loading,setLoading] = React.useState(true), [error,setError] = React.useState('');
  React.useEffect(() => { let active=true; setLoading(true); setError(''); api.get('/auth/profile/activity',{params:{page,limit:10,...filters}}).then(result=>{if(active)setData(result?.data ?? result);}).catch(err=>{if(active)setError(profileError(err));}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;}; },[page,filters,retry]);
  return <ProfileCard title="Account Activity"><form className="mb-5 grid gap-3 sm:grid-cols-3" onSubmit={e=>{e.preventDefault();setPage(1);setFilters(Object.fromEntries(Object.entries(dates).filter(([,v])=>v)));}}><Label className="grid gap-2">From<Input type="date" value={dates.from} max={dates.to || undefined} onChange={e=>setDates({...dates,from:e.target.value})}/></Label><Label className="grid gap-2">To<Input type="date" value={dates.to} min={dates.from || undefined} onChange={e=>setDates({...dates,to:e.target.value})}/></Label><div className="flex flex-wrap items-end gap-2"><Button>Apply</Button><Button type="button" variant="outline" onClick={()=>{setDates({from:'',to:''});setFilters({});setPage(1);}}>Reset</Button></div></form>
    {loading ? <p role="status">Loading activity…</p> : error ? <div role="alert"><p className="text-sm text-rose-700">{error}</p><Button variant="outline" onClick={()=>setRetry(retry+1)}>Try again</Button></div> : <><ul className="divide-y divide-slate-100">{(data?.items || []).map(item=><li key={item.id} className="min-w-0 space-y-2 py-4"><div className="flex flex-wrap justify-between gap-2"><p className="break-words text-sm font-medium">{item.description || `${item.action} · ${item.module}`}</p><span className="text-xs text-slate-500">{item.status}</span></div><p className="text-xs text-slate-500">{item.action} · {new Date(item.createdAt).toLocaleString()}</p>{(item.ipAddress || item.device) && <p className="break-words text-xs text-slate-500">{[item.ipAddress,item.device].filter(Boolean).join(' · ')}</p>}</li>)}</ul>{!data?.items?.length && <p className="py-8 text-center text-sm text-slate-500">No activity found for this period.</p>}<div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm"><span>Page {page} of {data?.pagination?.totalPages || 1}</span><div className="flex gap-2"><Button variant="outline" disabled={page<=1} onClick={()=>setPage(page-1)}>Previous</Button><Button variant="outline" disabled={page >= (data?.pagination?.totalPages || 1)} onClick={()=>setPage(page+1)}>Next</Button></div></div></>}
  </ProfileCard>;
}
