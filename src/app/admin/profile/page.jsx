'use client';
import * as React from 'react';
import Link from 'next/link';
import api from '../../../../lib/api';
import { Button } from '@/components/common/Button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/common/Avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faCamera, faPen, faLock, faUser, faSliders, faClockRotateLeft, faShieldHalved } from '@fortawesome/free-solid-svg-icons';
import { adminProfile } from '@/lib/auth/admin-profile';
import { updateSessionUser } from '@/lib/auth/admin-session';
import { ProfileCard, ProfileFields, ProfileEditDrawer, SecuritySettings, ActivityTimeline, profileError } from '@/components/profile/profile-settings';

export default function AdminProfilePage() {
  const [user,setUser] = React.useState(null), [loading,setLoading] = React.useState(true), [error,setError] = React.useState('');
  const [retry,setRetry] = React.useState(0), [tab,setTab] = React.useState('profile'), [edit,setEdit] = React.useState(false);
  const reload = React.useCallback(async () => {
    const payload = await api.get('/auth/profile');
    const record = payload?.data ?? payload;
    if (!record?.id) throw new Error('Invalid profile response');
    setUser(record); updateSessionUser(record);
  }, []);
  React.useEffect(()=>{ let active=true;setLoading(true);setError('');api.get('/auth/profile').then(payload=>{const record=payload?.data ?? payload;if(!record?.id)throw new Error('Invalid profile response');if(active){setUser(record);updateSessionUser(record);}}).catch(err=>{if(active)setError(profileError(err));}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[retry]);
  const profile=adminProfile(user);
  return <div className="max-w-none min-w-0 w-full space-y-5 sm:space-y-6">
    <div><nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap gap-2 text-xs text-[#718078]"><Link href="/admin/dashboard">Home</Link><span aria-hidden>›</span><span>Administration</span><span aria-hidden>›</span><span aria-current="page">Admin Profile</span></nav><h1 className="text-2xl font-semibold text-[#172B24]">Admin Profile</h1><p className="mt-1 text-sm text-[#718078]">Manage your account information, security and preferences.</p></div>
    {loading ? <div role="status" className="rounded-2xl border bg-white p-8 text-sm text-slate-500">Loading your profile…</div> : error ? <div role="alert" className="space-y-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><p>{error}</p><Button variant="outline" onClick={()=>setRetry(retry+1)}>Try again</Button></div> : user && <>
      <section aria-label="Profile summary" className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#163A2E] to-[#204C3D] p-5 text-white shadow-sm sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-14 -top-20 size-72 rounded-full border-[35px] border-white/5"/>
        <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center"><div className="relative shrink-0"><Avatar className="size-20 border-4 border-white/20 sm:size-24"><AvatarImage src={user.avatar || undefined} alt={profile.name}/><AvatarFallback className="bg-[#E8F1EC] text-2xl font-semibold text-[#163A2E]">{profile.initials}</AvatarFallback></Avatar><button type="button" aria-label="Change profile photo" onClick={()=>setEdit(true)} className="absolute -bottom-1 -right-1 flex size-10 items-center justify-center rounded-full border-2 border-[#204C3D] bg-white text-[#163A2E]"><FontAwesomeIcon icon={faCamera}/></button></div><div className="min-w-0 flex-1"><p className="text-xs uppercase tracking-widest text-white/60">Your account</p><h2 className="mt-1 break-words text-2xl font-semibold sm:text-3xl">{profile.name}</h2><div className="mt-3 flex flex-wrap items-center gap-3 text-xs"><span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5"><FontAwesomeIcon icon={faShieldHalved} className="mr-2"/>{profile.role || 'Role unavailable'}</span><span className="break-all text-white/70">Admin ID: {user.userId ?? user.id}</span></div></div><Button variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white" onClick={()=>setEdit(true)}><FontAwesomeIcon icon={faPen}/>Edit Profile</Button></div>
      </section>
      <Tabs value={tab} onValueChange={setTab} className="gap-5"><TabsList aria-label="Profile sections" className="h-auto max-w-full justify-start gap-1 overflow-x-auto rounded-xl border bg-white p-1.5">{[['profile','Profile Information',faUser],['security','Security',faLock],['preferences','Preferences',faSliders],['activity','Activity',faClockRotateLeft]].map(([value,label,icon])=><TabsTrigger key={value} value={value} className="min-h-11 shrink-0 gap-2 px-4 text-xs sm:text-sm"><FontAwesomeIcon icon={icon}/>{label}</TabsTrigger>)}</TabsList>
        <TabsContent value="profile"><div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]"><div className="space-y-5"><ProfileCard title="Basic Information" action={<Button variant="outline" size="sm" onClick={()=>setEdit(true)}>Edit Profile</Button>}><ProfileFields fields={[["Full Name",profile.name],["Email",profile.email],["Role",profile.role],["Phone",user.phone],["User ID",user.userId ?? user.id]]}/><div className="mt-5"><p className="mb-2 text-xs text-slate-500">Profile Photo</p><Avatar className="size-12"><AvatarImage src={user.avatar || undefined} alt={profile.name}/><AvatarFallback>{profile.initials}</AvatarFallback></Avatar></div></ProfileCard><ProfileCard title="Organization Access"><ProfileFields fields={[["Role",profile.role],["Access Level",adminProfile({role:user.effectiveRole || user.role}).role],["Organization",user.organizationName || user.customerName || 'No organization assigned']]}/></ProfileCard></div><div className="space-y-5"><ProfileCard title="Account Status"><ProfileFields fields={[["Status",typeof user.isActive === 'boolean' ? user.isActive ? 'Active' : 'Inactive' : null],["Member Since",user.createdAt ? new Date(user.createdAt).toLocaleDateString() : null],["Last Login",'Not available']]}/></ProfileCard><ProfileCard title="Quick Actions"><Button variant="outline" className="min-h-11 w-full justify-start" onClick={()=>setTab('security')}><FontAwesomeIcon icon={faLock}/>Change Password</Button></ProfileCard></div></div></TabsContent>
        <TabsContent value="security"><SecuritySettings/></TabsContent>
        <TabsContent value="preferences"><ProfileCard title="Preferences"><p className="text-sm text-slate-500">Account preferences are not configured. Language, time zone, date format, notifications and theme cannot be saved for individual accounts yet.</p></ProfileCard></TabsContent>
        <TabsContent value="activity"><ActivityTimeline/></TabsContent>
      </Tabs>
      <ProfileEditDrawer user={user} profile={profile} open={edit} onOpenChange={setEdit} onSaved={reload}/>
    </>}
  </div>;
}
