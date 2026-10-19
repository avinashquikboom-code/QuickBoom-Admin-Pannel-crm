'use client';

import { useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import { AdminButton } from '@/components/admin';

type Activity = {
  id: string; title: string; workType: string; scheduledDate: string;
  scheduledTime?: string; status: string; planName?: string;
  assignedTeam?: string; assignedToName?: string; editorName?: string;
  isLocked?: boolean; canReschedule?: boolean; lockMessage?: string;
};
const workTypes = ['REELS_SHOOT', 'VIDEO_EDITING', 'POST_DESIGN', 'STORY_DESIGN', 'UPLOADING', 'INFLUENCER_PROMO', 'ADS_MANAGEMENT', 'REEL', 'CREATIVE_POST', 'STORY', 'INFLUENCER_PROMOTION', 'GRAPHIC_DESIGN', 'VIDEO', 'SHOOT', 'EDITING', 'SOCIAL_MEDIA_MANAGEMENT', 'CONTENT_WRITING', 'META_ADS', 'GOOGLE_ADS', 'PERFORMANCE_REPORT'];
const label = (value: string) => value.replace(/_/g, ' ');
const dateKey = (value: string) => value?.slice(0, 10) || '';

export function CustomerCalendar({ customerId }: { customerId: number }) {
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(() => {
    const parts = new Intl.DateTimeFormat('en', { year: 'numeric', month: '2-digit', timeZone: 'Asia/Kolkata' }).formatToParts(new Date());
    return `${parts.find(p => p.type === 'year')?.value}-${parts.find(p => p.type === 'month')?.value}`;
  });
  const [status, setStatus] = useState('');
  const [editor, setEditor] = useState<{ mode: 'add' | 'edit' | 'reschedule'; activity?: Activity } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const calendar = useQuery({
    queryKey: ['admin-customer-calendar', customerId, month],
    enabled: /^\d{4}-\d{2}$/.test(month),
    queryFn: async (): Promise<Activity[]> => {
      const [year, selectedMonth] = month.split('-').map(Number);
      const response: any = await api.get('/works/calendar', { params: { customerId, year, month: selectedMonth } });
      const rows = response?.data ?? response;
      if (!Array.isArray(rows)) throw new Error('Unexpected customer calendar response.');
      if (rows.some(row => String(row.customerId) !== String(customerId))) throw new Error('Calendar customer could not be verified.');
      return rows;
    },
  });
  const activities = calendar.data || [];
  const visible = activities.filter(row => !status || row.status === status);
  const openEditor = (mode: 'add' | 'edit' | 'reschedule', activity?: Activity) => {
    setSaveError(''); setEditor({ mode, activity });
  };
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editor || saving) return;
    const form = new FormData(event.currentTarget);
    setSaving(true); setSaveError('');
    try {
      if (editor.mode === 'add') {
        await api.post('/works', {
          customerId, title: String(form.get('title')).trim(), workType: form.get('workType'),
          scheduledDate: `${form.get('date')}T00:00:00+05:30`, scheduledTime: form.get('time') || undefined,
        });
      } else if (editor.mode === 'reschedule') {
        await api.patch(`/works/${editor.activity!.id}/reschedule`, {
          scheduledDate: `${form.get('date')}T00:00:00+05:30`, scheduledTime: form.get('time') || '',
        });
      } else {
        await api.patch(`/works/${editor.activity!.id}`, { title: String(form.get('title')).trim() });
      }
      toast.success(editor.mode === 'add' ? 'Activity added' : editor.mode === 'edit' ? 'Activity updated' : 'Activity rescheduled');
      setEditor(null);
      await queryClient.invalidateQueries({ queryKey: ['admin-customer-calendar', customerId] });
    } catch (error) { setSaveError(getErrorMessage(error)); }
    finally { setSaving(false); }
  };
  return (
    <section className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h3 className="text-sm font-black text-slate-900">Customer Calendar</h3><p className="text-xs text-slate-500 mt-1">Plan activities, assigned teams and work progress • All dates in IST</p></div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-bold">Month <input aria-label="Calendar month" type="month" value={month} onChange={e => setMonth(e.target.value)} className="border rounded-lg px-3 py-2 ml-2" /></label>
          <select aria-label="Filter activities by status" value={status} onChange={e => setStatus(e.target.value)} className="border rounded-lg px-3 py-2 text-xs"><option value="">All statuses</option>{Array.from(new Set(activities.map(row => row.status))).sort().map(value => <option key={value} value={value}>{label(value)}</option>)}</select>
          <AdminButton variant="outline" size="sm" onClick={() => calendar.refetch()}>Refresh</AdminButton>
          <AdminButton variant="primary" size="sm" onClick={() => openEditor('add')}>Add Activity</AdminButton>
        </div>
      </div>
      {calendar.isLoading ? <p className="text-sm text-slate-500">Loading activities...</p> : calendar.isError ? <div role="alert" className="text-sm text-rose-700">{getErrorMessage(calendar.error)} <button className="underline" onClick={() => calendar.refetch()}>Retry</button></div> : !visible.length ? <p className="text-sm text-slate-500 py-8 text-center">No activities for this month and status.</p> : (
        <div className="overflow-x-auto"><table className="w-full text-xs text-left"><thead className="bg-slate-50 text-slate-500"><tr>{['Date / Time', 'Activity / Plan', 'Team / Employee', 'Status', 'Actions'].map(title => <th key={title} className="p-3 whitespace-nowrap">{title}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">
          {visible.map(activity => <tr key={activity.id}>
            <td className="p-3 whitespace-nowrap">{dateKey(activity.scheduledDate)}<div className="text-slate-500">{activity.scheduledTime || 'Time not set'}</div></td>
            <td className="p-3"><div className="font-bold">{activity.title}</div><div className="text-slate-500">{activity.planName || 'Custom activity'} · {label(activity.workType)}</div>{activity.isLocked && <p className="text-amber-700">{activity.lockMessage || 'Schedule locked'}</p>}</td>
            <td className="p-3">{activity.assignedTeam || 'Team not assigned'}<div className="text-slate-500">{activity.assignedToName || 'Employee not assigned'}{activity.editorName ? ` · Editor: ${activity.editorName}` : ''}</div></td>
            <td className="p-3"><span className="bg-slate-100 rounded px-2 py-1 whitespace-nowrap">{label(activity.status)}</span></td>
            <td className="p-3"><div className="flex gap-2"><AdminButton size="sm" variant="outline" disabled={activity.isLocked} onClick={() => openEditor('edit', activity)}>Edit</AdminButton><AdminButton size="sm" variant="outline" disabled={activity.isLocked || !activity.canReschedule} onClick={() => openEditor('reschedule', activity)}>Reschedule</AdminButton></div></td>
          </tr>)}
        </tbody></table></div>
      )}
      {editor && <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"><div role="dialog" aria-modal="true" aria-labelledby="calendar-editor-title" className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h3 id="calendar-editor-title" className="font-bold mb-4">{editor.mode === 'add' ? 'Add Activity' : editor.mode === 'edit' ? 'Edit Activity' : 'Reschedule Activity'}</h3>
        <form onSubmit={save} className="space-y-4">
          {editor.mode !== 'reschedule' && <label className="block text-sm">Activity title<input autoFocus name="title" required maxLength={250} pattern=".*\S.*" defaultValue={editor.activity?.title || ''} className="block w-full border rounded-lg p-2 mt-1" /></label>}
          {editor.mode === 'add' && <label className="block text-sm">Work type<select name="workType" className="block w-full border rounded-lg p-2 mt-1">{workTypes.map(type => <option key={type} value={type}>{label(type)}</option>)}</select></label>}
          {editor.mode !== 'edit' && <><label className="block text-sm">Date (IST)<input name="date" type="date" required defaultValue={editor.activity ? dateKey(editor.activity.scheduledDate) : `${month}-01`} className="block w-full border rounded-lg p-2 mt-1" /></label><label className="block text-sm">Time (optional)<input name="time" placeholder="e.g. 10:00 AM" defaultValue={editor.activity?.scheduledTime || ''} className="block w-full border rounded-lg p-2 mt-1" /></label></>}
          {editor.mode === 'add' && <p className="text-xs text-slate-500">Uses the customer's existing team assignment and plan quota rules.</p>}
          {saveError && <p role="alert" className="text-sm text-rose-700">{saveError}</p>}
          <div className="flex justify-end gap-2"><AdminButton type="button" variant="outline" disabled={saving} onClick={() => setEditor(null)}>Cancel</AdminButton><AdminButton type="submit" variant="primary" loading={saving}>Save</AdminButton></div>
        </form>
      </div></div>}
    </section>
  );
}
