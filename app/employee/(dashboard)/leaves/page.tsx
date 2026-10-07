'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, HeartPulse, Palmtree, Plus, Wallet } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { hasPermission } from '@/lib/access-control';
import { getErrorMessage } from '@/lib/utils';
import { useEmployeeAuthStore } from '@/lib/employee-store';
import EmployeeSideSheet from '@/components/EmployeeSideSheet';

type Section = 'leaves' | 'expenses';
type LeaveList = 'pending' | 'history';

interface LeaveBalance {
  leaveTypeId: number;
  name: string;
  code: string;
  remaining: number;
  total: number;
  isUnlimited: boolean;
}

interface LeaveRequest {
  id: number;
  leaveType: string;
  fromDate: string;
  toDate: string;
  status: string;
  appliedOn: string;
  reason: string;
  days: number;
  rejectionReason: string;
  reviewedOn: string;
}

const STATUS_CLS: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
  CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200',
};

const CARD_TONE = [
  { icon: Palmtree, wash: 'bg-emerald-50 text-emerald-600' },
  { icon: HeartPulse, wash: 'bg-amber-50 text-amber-600' },
  { icon: CalendarDays, wash: 'bg-sky-50 text-sky-600' },
  { icon: Wallet, wash: 'bg-slate-100 text-slate-500' },
];

function asList(payload: any): any[] {
  const candidates = [payload, payload?.items, payload?.data, payload?.balances, payload?.data?.items, payload?.data?.data, payload?.records];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

function normalizeStatus(value: unknown) {
  const raw = typeof value === 'string' ? value : '';
  const status = raw.trim().toUpperCase().replace(/\s+/g, '_');
  if (status === 'APPROVE' || status === 'ACCEPTED') return 'APPROVED';
  if (status === 'REJECT' || status === 'DECLINED') return 'REJECTED';
  if (status === 'CANCEL' || status === 'CANCELED' || status === 'CANCELLED') return 'CANCELLED';
  return status || 'PENDING';
}

function formatDay(value: string) {
  if (!value) return '—';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function mapBalance(raw: any): LeaveBalance {
  const name = String(raw.leaveType || raw.name || raw.leaveTypeName || 'Leave');
  const code = String(raw.code || '');
  const isUnlimited = Boolean(raw.isUnlimited) || code === 'UL' || name.toLowerCase().includes('unpaid');
  return {
    leaveTypeId: Number(raw.leaveTypeId ?? raw.id) || 0,
    name,
    code,
    remaining: Number(raw.remaining ?? raw.balance ?? 0),
    total: Number(raw.total ?? raw.totalAllowed ?? raw.allocated ?? 0),
    isUnlimited,
  };
}

function mapRequest(raw: any): LeaveRequest {
  const reviewed = String(raw.updatedAt || raw.reviewedOn || raw.approvedOn || '').split('T')[0];
  return {
    id: Number(raw.id),
    leaveType: String(raw.leaveType || raw.leaveTypeName || raw.leaveType?.name || 'Leave'),
    fromDate: String(raw.fromDate || '').split('T')[0],
    toDate: String(raw.toDate || '').split('T')[0],
    status: normalizeStatus(raw.status),
    appliedOn: String(raw.appliedOn || raw.createdAt || '').split('T')[0],
    reason: String(raw.reason || ''),
    days: Number(raw.days || raw.totalDays || 1),
    rejectionReason: String(raw.rejectionReason || ''),
    reviewedOn: reviewed,
  };
}

export default function LeavesPage() {
  const user = useEmployeeAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [section, setSection] = useState<Section>('leaves');
  const [list, setList] = useState<LeaveList>('pending');
  const [applyOpen, setApplyOpen] = useState(false);
  const [selected, setSelected] = useState<LeaveRequest | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<any | null>(null);
  const [form, setForm] = useState({ leaveTypeId: '', fromDate: '', toDate: '', reason: '' });
  const [formError, setFormError] = useState('');

  const canView = hasPermission(user, ['employee.leave.view', 'leave.view_own', 'leave.view']);
  const canCreate = hasPermission(user, ['employee.leave.create', 'leave.create']);
  const canViewExpenses = hasPermission(user, ['employee.expenses.view', 'claims.view', 'expense.view']);

  const balancesQuery = useQuery({
    queryKey: ['employee-leave-balances'],
    enabled: canView && section === 'leaves',
    queryFn: async () => {
      const response: any = await api.get('/leaves/balances');
      return asList(response).map(mapBalance).filter((item) => item.name);
    },
  });

  const requestsQuery = useQuery({
    queryKey: ['employee-leave-requests'],
    enabled: canView && section === 'leaves',
    queryFn: async () => {
      const collected: any[] = [];
      let page = 1;
      let totalPages = 1;
      while (page <= totalPages && page <= 5) {
        const response: any = await api.get('/leaves/requests', { params: { page, limit: 100 } });
        collected.push(...asList(response));
        totalPages = Number(response?.pagination?.totalPages || response?.meta?.totalPages || 1);
        page += 1;
      }
      const seen = new Set<number>();
      return collected
        .map(mapRequest)
        .filter((item) => {
          if (!item.id || seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        });
    },
  });

  const claimsQuery = useQuery({
    queryKey: ['employee-expense-claims'],
    enabled: canViewExpenses && section === 'expenses',
    queryFn: async () => {
      const response: any = await api.get('/claims', { params: { limit: 50 } });
      return asList(response);
    },
  });

  const submit = useMutation({
    mutationFn: () =>
      api.post('/leaves/requests', {
        leaveTypeId: Number(form.leaveTypeId),
        fromDate: form.fromDate,
        toDate: form.toDate,
        reason: form.reason.trim(),
      }),
    onSuccess: () => {
      toast.success('Leave application submitted');
      setApplyOpen(false);
      setForm({ leaveTypeId: '', fromDate: '', toDate: '', reason: '' });
      queryClient.invalidateQueries({ queryKey: ['employee-leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['employee-leave-balances'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const balances = balancesQuery.data ?? [];
  const requests = requestsQuery.data ?? [];
  const visible = useMemo(
    () => requests.filter((item) => (list === 'pending' ? item.status === 'PENDING' : item.status !== 'PENDING')),
    [requests, list],
  );

  const openApply = () => {
    setFormError('');
    setForm({
      leaveTypeId: balances[0]?.leaveTypeId ? String(balances[0].leaveTypeId) : '',
      fromDate: '',
      toDate: '',
      reason: '',
    });
    setApplyOpen(true);
  };

  const handleSubmit = () => {
    if (submit.isPending) return;
    if (!form.leaveTypeId) return setFormError('Select a leave type.');
    if (!form.fromDate || !form.toDate) return setFormError('From Date and To Date are required.');
    if (form.toDate < form.fromDate) return setFormError('To Date cannot be before From Date.');
    if (!form.reason.trim()) return setFormError('Please enter a reason for leave.');
    setFormError('');
    submit.mutate();
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Requests & Applications</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your leave and expense requests.</p>
        <div className="mt-4 flex gap-6 border-b border-slate-200">
          {(
            [
              ['leaves', 'Leaves'],
              ['expenses', 'Expenses'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSection(key)}
              className={`-mb-px border-b-2 pb-2.5 text-sm font-semibold ${
                section === key ? 'border-[#16A34A] text-[#16A34A]' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {section === 'leaves' && (
        <>
          {!canView ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              You do not have permission to view leave requests.
            </div>
          ) : (
            <>
              {balancesQuery.isLoading ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[0, 1, 2, 3].map((item) => (
                    <div key={item} className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-white" />
                  ))}
                </div>
              ) : balancesQuery.isError ? (
                <div className="rounded-2xl border border-red-100 bg-white p-5 text-sm text-red-700">
                  Unable to load leave balances.
                  <button type="button" onClick={() => balancesQuery.refetch()} className="ml-3 font-semibold underline">
                    Try again
                  </button>
                </div>
              ) : balances.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">No leave balances found.</div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {balances.map((item, index) => {
                    const tone = CARD_TONE[index % CARD_TONE.length];
                    const Icon = tone.icon;
                    return (
                      <div key={`${item.leaveTypeId}-${item.name}`} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-slate-500">{item.name}</p>
                          <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${tone.wash}`}>
                            <Icon className="h-4 w-4" />
                          </span>
                        </div>
                        <p className="mt-2 text-2xl font-bold text-slate-900">{item.isUnlimited ? '∞' : item.remaining}</p>
                        <p className="text-xs text-slate-400">{item.isUnlimited ? 'Unlimited' : `${item.total} Total`}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              <section className="rounded-2xl border border-slate-200 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
                  <h2 className="text-base font-bold text-slate-900">Leave Applications</h2>
                  {canCreate && (
                    <button
                      type="button"
                      onClick={openApply}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#16A34A] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#15803D]"
                    >
                      <Plus className="h-4 w-4" /> Apply
                    </button>
                  )}
                </div>
                <div className="flex gap-2 px-4 py-3 sm:px-5">
                  {(
                    [
                      ['pending', 'Active / Pending'],
                      ['history', 'History'],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setList(key)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                        list === key ? 'bg-[#E8F9EE] text-[#15803D]' : 'bg-slate-100 text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {requestsQuery.isLoading ? (
                  <div className="space-y-2 p-5">
                    {[0, 1, 2].map((item) => (
                      <div key={item} className="h-10 animate-pulse rounded-lg bg-slate-100" />
                    ))}
                  </div>
                ) : requestsQuery.isError ? (
                  <div className="p-8 text-center text-sm text-red-700">
                    Unable to load leave applications.
                    <button type="button" onClick={() => requestsQuery.refetch()} className="ml-3 font-semibold underline">
                      Try again
                    </button>
                  </div>
                ) : visible.length === 0 ? (
                  <div className="px-5 py-14 text-center text-sm text-slate-500">
                    {list === 'history' ? 'No previous leave applications.' : 'No active or pending leave applications.'}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[920px] text-left text-sm">
                      <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <tr>
                          {['#', 'Leave Type', 'Date Range', 'Days', 'Reason', 'Status', 'Applied On', 'Actions'].map((heading) => (
                            <th key={heading} className="whitespace-nowrap px-4 py-3 font-semibold">
                              {heading}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {visible.map((item, index) => (
                          <tr key={item.id} className="hover:bg-slate-50/70">
                            <td className="px-4 py-3 text-slate-400">{index + 1}</td>
                            <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900">{item.leaveType}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                              {formatDay(item.fromDate)}
                              {item.toDate && item.toDate !== item.fromDate ? ` - ${formatDay(item.toDate)}` : ''}
                            </td>
                            <td className="px-4 py-3 text-slate-600">{item.days}</td>
                            <td className="max-w-[220px] truncate px-4 py-3 text-slate-600" title={item.reason}>{item.reason || '—'}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLS[item.status] || STATUS_CLS.CANCELLED}`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDay(item.appliedOn)}</td>
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => setSelected(item)}
                                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
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
              </section>
            </>
          )}
        </>
      )}

      {section === 'expenses' && (
        <section className="rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-bold text-slate-900">Expenses</h2>
          </div>
          {!canViewExpenses ? (
            <p className="px-5 py-12 text-center text-sm text-slate-500">You do not have permission to view expenses.</p>
          ) : claimsQuery.isLoading ? (
            <div className="space-y-2 p-5">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-10 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : claimsQuery.isError ? (
            <div className="p-8 text-center text-sm text-red-700">
              Unable to load expenses.
              <button type="button" onClick={() => claimsQuery.refetch()} className="ml-3 font-semibold underline">
                Try again
              </button>
            </div>
          ) : (claimsQuery.data ?? []).length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-slate-500">No expense claims found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <tr>
                    {['#', 'Category', 'Amount', 'Status', 'Date', 'Actions'].map((heading) => (
                      <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(claimsQuery.data ?? []).map((claim: any, index: number) => {
                    const status = String(claim.status || 'PENDING').toUpperCase();
                    return (
                      <tr key={claim.id ?? index} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 text-slate-400">{index + 1}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{claim.category || 'Expense'}</td>
                        <td className="px-4 py-3 text-slate-600">{claim.amount ? `₹${Number(claim.amount).toLocaleString('en-IN')}` : '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLS[status] || STATUS_CLS.CANCELLED}`}>
                            {status.charAt(0) + status.slice(1).toLowerCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{formatDay(String(claim.claimDate || claim.createdAt || ''))}</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => setSelectedExpense(claim)}
                            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* View Expense Claim Drawer */}
      <EmployeeSideSheet
        open={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
        title="Expense Claim Details"
        subtitle={selectedExpense ? `Claim #${selectedExpense.id ?? '—'}` : undefined}
        footer={
          <button
            type="button"
            onClick={() => setSelectedExpense(null)}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
        }
      >
        {selectedExpense && (
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs font-semibold text-slate-400">Category</dt>
              <dd className="mt-0.5 font-bold text-slate-900">{selectedExpense.category || 'Expense'}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-400">Amount</dt>
              <dd className="mt-0.5 font-bold text-emerald-600">
                {selectedExpense.amount ? `₹${Number(selectedExpense.amount).toLocaleString('en-IN')}` : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-400">Status</dt>
              <dd className="mt-0.5">
                <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLS[String(selectedExpense.status || 'PENDING').toUpperCase()] || STATUS_CLS.CANCELLED}`}>
                  {String(selectedExpense.status || 'PENDING').toUpperCase()}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-400">Claim Date</dt>
              <dd className="mt-0.5 font-bold text-slate-900">
                {formatDay(String(selectedExpense.claimDate || selectedExpense.createdAt || ''))}
              </dd>
            </div>
            {selectedExpense.approvedAmount !== undefined && selectedExpense.approvedAmount !== null && (
              <div>
                <dt className="text-xs font-semibold text-slate-400">Approved Amount</dt>
                <dd className="mt-0.5 font-bold text-slate-900">
                  ₹{Number(selectedExpense.approvedAmount).toLocaleString('en-IN')}
                </dd>
              </div>
            )}
            {selectedExpense.paymentStatus && (
              <div>
                <dt className="text-xs font-semibold text-slate-400">Payment Status</dt>
                <dd className="mt-0.5 font-bold text-slate-900">{selectedExpense.paymentStatus}</dd>
              </div>
            )}
            <div className="col-span-2">
              <dt className="text-xs font-semibold text-slate-400">Description / Purpose</dt>
              <dd className="mt-1 whitespace-pre-wrap rounded-xl bg-slate-50 border border-slate-100 p-3 text-slate-700 leading-relaxed">
                {selectedExpense.description || selectedExpense.notes || '—'}
              </dd>
            </div>
            {selectedExpense.rejectionReason && (
              <div className="col-span-2">
                <dt className="text-xs font-semibold text-red-500">Rejection Reason</dt>
                <dd className="mt-1 rounded-xl bg-red-50 border border-red-100 p-3 text-red-700 font-medium">
                  {selectedExpense.rejectionReason}
                </dd>
              </div>
            )}
            {selectedExpense.receiptUrl && (
              <div className="col-span-2">
                <dt className="text-xs font-semibold text-slate-400">Receipt Attachment</dt>
                <dd className="mt-1">
                  <a
                    href={selectedExpense.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:underline"
                  >
                    View Attached Receipt
                  </a>
                </dd>
              </div>
            )}
          </dl>
        )}
      </EmployeeSideSheet>


      {/* View Leave Application Drawer */}
      <EmployeeSideSheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Leave Application"
        subtitle={selected ? `Applied on ${formatDay(selected.appliedOn)}` : undefined}
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
            <div>
              <dt className="text-xs font-semibold text-slate-400">Leave Type</dt>
              <dd className="mt-0.5 font-bold text-slate-900">{selected.leaveType}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-400">Status</dt>
              <dd className="mt-0.5">
                <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLS[selected.status] || STATUS_CLS.CANCELLED}`}>
                  {selected.status.charAt(0) + selected.status.slice(1).toLowerCase()}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-400">From Date</dt>
              <dd className="mt-0.5 font-bold text-slate-900">{formatDay(selected.fromDate)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-400">To Date</dt>
              <dd className="mt-0.5 font-bold text-slate-900">{formatDay(selected.toDate)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-400">Days</dt>
              <dd className="mt-0.5 font-bold text-slate-900">{selected.days}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-400">Applied On</dt>
              <dd className="mt-0.5 font-bold text-slate-900">{formatDay(selected.appliedOn)}</dd>
            </div>
            {selected.status !== 'PENDING' && selected.reviewedOn && (
              <div>
                <dt className="text-xs font-semibold text-slate-400">Updated On</dt>
                <dd className="mt-0.5 font-bold text-slate-900">{formatDay(selected.reviewedOn)}</dd>
              </div>
            )}
            {selected.rejectionReason && (
              <div className="col-span-2">
                <dt className="text-xs font-semibold text-red-500">Rejection Reason</dt>
                <dd className="mt-1 rounded-xl border border-red-100 bg-red-50 p-3 font-medium text-red-700">{selected.rejectionReason}</dd>
              </div>
            )}
            <div className="col-span-2">
              <dt className="text-xs font-semibold text-slate-400">Reason for Leave</dt>
              <dd className="mt-1 whitespace-pre-wrap rounded-xl bg-slate-50 border border-slate-100 p-3 text-slate-700 leading-relaxed">
                {selected.reason || '—'}
              </dd>
            </div>
          </dl>
        )}
      </EmployeeSideSheet>

      {/* Apply for Leave Drawer */}
      <EmployeeSideSheet
        open={applyOpen}
        onClose={() => !submit.isPending && setApplyOpen(false)}
        title="Apply for Leave"
        subtitle="Submit a new leave request"
        footer={
          <>
            <button
              type="button"
              disabled={submit.isPending}
              onClick={() => setApplyOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submit.isPending}
              onClick={handleSubmit}
              className="rounded-xl bg-[#16A34A] px-5 py-2 text-sm font-semibold text-white hover:bg-[#15803D] disabled:opacity-60 transition-colors cursor-pointer"
            >
              {submit.isPending ? 'Submitting...' : 'Submit Application'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <label className="block text-xs font-semibold text-slate-600">
            Leave Type *
            <select
              value={form.leaveTypeId}
              onChange={(event) => setForm((current) => ({ ...current, leaveTypeId: event.target.value }))}
              className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-800 outline-none focus:border-[#16A34A] bg-white"
            >
              <option value="">Select leave type</option>
              {balances.map((item) => (
                <option key={item.leaveTypeId} value={item.leaveTypeId}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-slate-600">
              From Date *
              <input
                type="date"
                value={form.fromDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    fromDate: event.target.value,
                    toDate: current.toDate && current.toDate < event.target.value ? event.target.value : current.toDate,
                  }))
                }
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-800 outline-none focus:border-[#16A34A]"
              />
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              To Date *
              <input
                type="date"
                min={form.fromDate || undefined}
                value={form.toDate}
                onChange={(event) => setForm((current) => ({ ...current, toDate: event.target.value }))}
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-800 outline-none focus:border-[#16A34A]"
              />
            </label>
          </div>
          <label className="block text-xs font-semibold text-slate-600">
            Reason for Leave *
            <textarea
              rows={4}
              value={form.reason}
              placeholder="Enter reason for leave..."
              onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
              className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-800 outline-none focus:border-[#16A34A] resize-none"
            />
          </label>
          {formError && <p className="text-sm font-medium text-red-600">{formError}</p>}
        </div>
      </EmployeeSideSheet>
    </div>
  );
}

