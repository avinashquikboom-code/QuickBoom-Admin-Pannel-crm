'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Clock3, Laptop, Plus, RefreshCw, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { useEmployeeAuthStore } from '@/lib/employee-store';
import { hasPermission } from '@/lib/access-control';
import { getErrorMessage } from '@/lib/utils';
import EmployeeSideSheet from '@/components/EmployeeSideSheet';

type Filter = 'ACTIVE' | 'APPROVED' | 'PENDING' | 'HISTORY';

interface RemoteRequest {
  id: string;
  fromDate: string;
  toDate: string;
  startTime: string;
  endTime: string;
  duration: string;
  reason: string;
  status: string;
  rejectionReason: string;
  employee: string;
}

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'HISTORY', label: 'All History' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Backend sends YYYY-MM-DD or ISO; read the calendar part directly so the day never shifts.
const formatDay = (value: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return m ? `${m[3]} ${MONTHS[Number(m[2]) - 1]} ${m[1]}` : value || '—';
};

const toIsoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// <input type="time"> gives HH:mm; the API uses "hh:mm AM/PM".
const to12h = (value: string) => {
  const [h, m] = value.split(':').map(Number);
  return `${String(h % 12 === 0 ? 12 : h % 12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

function mapRequest(raw: any, index: number): RemoteRequest {
  const days = Number(raw.days) || 1;
  const emp = raw.employee;
  return {
    id: String(raw.id ?? `req-${index}`),
    fromDate: String(raw.fromDate ?? raw.startDate ?? '').split('T')[0],
    toDate: String(raw.toDate ?? raw.endDate ?? '').split('T')[0],
    startTime: String(raw.startTime ?? '09:00 AM'),
    endTime: String(raw.endTime ?? '06:00 PM'),
    duration: String(raw.duration ?? `${days} ${days === 1 ? 'Day' : 'Days'}`),
    reason: String(raw.reason ?? '').trim(),
    status: String(raw.status ?? 'PENDING').toUpperCase(),
    rejectionReason: String(raw.rejectionReason ?? '').trim(),
    employee:
      String(raw.employeeCode ?? emp?.employeeCode ?? '').trim() ||
      [emp?.firstName, emp?.lastName].filter(Boolean).join(' ') ||
      String(raw.employeeName ?? '').trim(),
  };
}

const STATUS_CLS: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
  CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200',
};

const matches = (r: RemoteRequest, f: Filter) =>
  f === 'ACTIVE' ? r.status === 'APPROVED' || r.status === 'PENDING' : f === 'HISTORY' ? true : r.status === f;

export default function EmployeeRemoteWorkPage() {
  const user = useEmployeeAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>('ACTIVE');
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<RemoteRequest | null>(null);

  const today = toIsoDay(new Date());
  const [form, setForm] = useState({ fromDate: today, toDate: today, startTime: '09:00', endTime: '18:00', reason: '' });
  const [formError, setFormError] = useState('');

  const canView = hasPermission(user, ['employee.remote_work.view', 'remote.view_own', 'remote.view']);
  const canCreate = hasPermission(user, ['employee.remote_work.create', 'remote.create', 'remote.apply', 'remote.view_own', 'employee.remote_work.view']);

  const query = useQuery<RemoteRequest[]>({
    queryKey: ['employee-remote-requests'],
    enabled: canView,
    queryFn: async () => {
      const response: any = await api.get('/remote-requests');
      const list = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.requests)
            ? response.requests
            : Array.isArray(response?.items)
              ? response.items
              : Array.isArray(response?.data?.items)
                ? response.data.items
                : null;
      if (!list) throw new Error('The remote work response was invalid.');
      return list.map(mapRequest);
    },
  });

  const submit = useMutation({
    mutationFn: () =>
      api.post('/remote-requests', {
        fromDate: form.fromDate,
        toDate: form.toDate,
        startTime: to12h(form.startTime),
        endTime: to12h(form.endTime),
        reason: form.reason.trim(),
      }),
    onSuccess: () => {
      toast.success('Remote work application submitted');
      setOpen(false);
      setForm({ fromDate: today, toDate: today, startTime: '09:00', endTime: '18:00', reason: '' });
      queryClient.invalidateQueries({ queryKey: ['employee-remote-requests'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const requests = useMemo(() => query.data ?? [], [query.data]);
  const counts = useMemo(
    () => Object.fromEntries(FILTERS.map((f) => [f.value, requests.filter((r) => matches(r, f.value)).length])) as Record<Filter, number>,
    [requests],
  );
  const visible = useMemo(() => requests.filter((r) => matches(r, filter)), [requests, filter]);
  const ready = !query.isLoading && !query.isError;

  const handleSubmit = () => {
    if (submit.isPending) return;
    if (!form.fromDate || !form.toDate || !form.startTime || !form.endTime) return setFormError('All date and time fields are required.');
    if (form.toDate < form.fromDate) return setFormError('To Date cannot be before From Date.');
    if (form.endTime <= form.startTime) return setFormError('End Time must be after Start Time.');
    if (!form.reason.trim()) return setFormError('Please enter a reason and deliverables plan.');
    setFormError('');
    submit.mutate();
  };

  if (!canView) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-10 text-center">
        <h1 className="text-xl font-bold text-slate-900">Access denied</h1>
        <p className="mt-2 text-sm text-slate-500">You do not have permission to view remote work.</p>
      </div>
    );
  }

  const inputCls =
    'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-[#23C45E] focus:ring-4 focus:ring-[#23C45E]/15';
  const applyButton = canCreate && (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="inline-flex items-center gap-2 rounded-xl bg-[#23C45E] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#23C45E]/20 hover:bg-[#1AA14D]"
    >
      <Plus className="h-4 w-4" /> Apply WFH
    </button>
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-1 pb-10 sm:px-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Remote Work (WFH)</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Manage your work-from-home applications and history.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => query.refetch()}
            disabled={query.isFetching}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${query.isFetching ? 'animate-spin' : ''}`} /> Refresh
          </button>
          {applyButton}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white p-4">
        {FILTERS.map((f) => {
          const selectedTab = filter === f.value;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
                selectedTab ? 'border-[#23C45E] bg-[#23C45E] text-white' : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
              }`}
            >
              {selectedTab && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              {f.label} {ready ? counts[f.value] : '–'}
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        {query.isLoading ? (
          <div className="space-y-3 p-5" aria-busy="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : query.isError ? (
          <div className="p-10 text-center">
            <p className="font-semibold text-red-800">Unable to load remote work applications.</p>
            <button type="button" onClick={() => query.refetch()} className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white">
              Try Again
            </button>
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Laptop className="h-10 w-10 text-slate-300" />
            <p className="font-semibold text-slate-700">No Remote Work Applications</p>
            <p className="text-sm text-slate-500">You don&apos;t have any remote work applications for this filter.</p>
            {canCreate && <div className="mt-2">{applyButton}</div>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  {['Date', 'Time', 'Employee', 'Duration', 'Status', 'Reason / Deliverables', 'Actions'].map((h) => (
                    <th key={h} className="whitespace-nowrap px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70">
                    <td className="whitespace-nowrap px-4 py-3.5 font-bold text-slate-900">
                      {formatDay(r.fromDate)}
                      {r.toDate && r.toDate !== r.fromDate && <span className="font-medium text-slate-500"> – {formatDay(r.toDate)}</span>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-700">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 className="h-3.5 w-3.5 text-slate-400" />
                        {r.startTime} – {r.endTime}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-700">{r.employee || '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-700">{r.duration}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${STATUS_CLS[r.status] ?? STATUS_CLS.CANCELLED}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="max-w-[260px] truncate px-4 py-3.5 text-slate-600" title={r.reason}>{r.reason || '—'}</td>
                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => setSelected(r)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Remote Work Application Drawer */}
      <EmployeeSideSheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Remote Work Application"
        subtitle={selected ? `Status: ${selected.status}` : undefined}
        footer={
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        }
      >
        {selected && (
          <dl className="grid grid-cols-2 gap-4 text-sm">
            {[
              ['From Date', formatDay(selected.fromDate)],
              ['To Date', formatDay(selected.toDate)],
              ['Start Time', selected.startTime],
              ['End Time', selected.endTime],
              ['Duration', selected.duration],
              ['Status', selected.status],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{k}</dt>
                <dd className="mt-0.5 font-bold text-slate-900">{v}</dd>
              </div>
            ))}
            <div className="col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Reason & Deliverables</dt>
              <dd className="mt-1 whitespace-pre-wrap rounded-xl bg-slate-50 border border-slate-100 p-3 text-slate-700 leading-relaxed font-medium">
                {selected.reason || '—'}
              </dd>
            </div>
            {selected.rejectionReason && (
              <div className="col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-red-400">Rejection Reason</dt>
                <dd className="mt-1 rounded-xl bg-red-50 border border-red-100 p-3 text-red-700 font-medium">
                  {selected.rejectionReason}
                </dd>
              </div>
            )}
          </dl>
        )}
      </EmployeeSideSheet>

      {/* Apply for Remote Work (WFH) Drawer */}
      <EmployeeSideSheet
        open={open}
        onClose={() => !submit.isPending && setOpen(false)}
        title="Apply for Remote Work"
        subtitle="Submit a Work-From-Home (WFH) request"
        footer={
          <>
            <button
              type="button"
              disabled={submit.isPending}
              onClick={() => setOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submit.isPending}
              onClick={handleSubmit}
              className="rounded-xl bg-[#23C45E] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#1AA14D] disabled:opacity-60 transition-colors cursor-pointer"
            >
              {submit.isPending ? 'Submitting...' : 'Submit Application'}
            </button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-xs font-bold text-slate-600">
            From Date
            <input
              type="date"
              className={inputCls}
              value={form.fromDate}
              onChange={(e) => setForm((f) => ({ ...f, fromDate: e.target.value, toDate: f.toDate < e.target.value ? e.target.value : f.toDate }))}
            />
          </label>
          <label className="space-y-1.5 text-xs font-bold text-slate-600">
            To Date
            <input type="date" className={inputCls} min={form.fromDate} value={form.toDate} onChange={(e) => setForm((f) => ({ ...f, toDate: e.target.value }))} />
          </label>
          <label className="space-y-1.5 text-xs font-bold text-slate-600">
            Start Time
            <input type="time" className={inputCls} value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} />
          </label>
          <label className="space-y-1.5 text-xs font-bold text-slate-600">
            End Time
            <input type="time" className={inputCls} value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} />
          </label>
          <label className="space-y-1.5 text-xs font-bold text-slate-600 sm:col-span-2">
            Reason & Deliverables Plan *
            <textarea
              rows={4}
              className="w-full rounded-xl border border-slate-200 p-3 text-sm font-medium text-slate-800 outline-none focus:border-[#23C45E] focus:ring-4 focus:ring-[#23C45E]/15 resize-none"
              placeholder="Explain reason and planned deliverables during remote work..."
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            />
          </label>
        </div>
        {formError && <p className="mt-2 text-sm font-semibold text-red-600">{formError}</p>}
      </EmployeeSideSheet>
    </div>
  );
}

