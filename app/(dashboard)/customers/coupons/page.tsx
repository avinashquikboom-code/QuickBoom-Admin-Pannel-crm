'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '@/lib/utils';
import { AdminPageHeader, AdminButton, AdminFormDrawer } from '@/components/admin';
import { Tag, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Eye } from 'lucide-react';

type CouponForm = {
  name: string;
  code: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: string;
  appliesToAllPlans: boolean;
  planIds: number[];
  minimumAmount: string;
  maximumDiscountAmount: string;
  startsAt: string;
  expiresAt: string;
  usageLimit: string;
  perCustomerLimit: string;
  isActive: boolean;
};

const emptyForm = (): CouponForm => ({
  name: '',
  code: '',
  description: '',
  discountType: 'PERCENTAGE',
  discountValue: '',
  appliesToAllPlans: true,
  planIds: [],
  minimumAmount: '',
  maximumDiscountAmount: '',
  startsAt: '',
  expiresAt: '',
  usageLimit: '100',
  perCustomerLimit: '1',
  isActive: true,
});

function extractList(res: any) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
}

function dateInput(value?: string | null) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'ACTIVE')
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200">
        Active
      </span>
    );
  if (status === 'EXPIRED')
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-amber-50 text-amber-700 border border-amber-200">
        Expired
      </span>
    );
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-slate-100 text-slate-500 border border-slate-200">
      Inactive
    </span>
  );
}

const inputCls =
  'w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 placeholder:text-slate-400 transition disabled:bg-slate-50 disabled:text-slate-400';

function Field({ label, children, span2 = false }: { label: string; children: React.ReactNode; span2?: boolean }) {
  return (
    <div className={span2 ? 'md:col-span-2' : ''}>
      <label className="block text-xs font-semibold text-slate-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

export default function CouponsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [discountType, setDiscountType] = useState('');

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CouponForm>(emptyForm());
  const [detail, setDetail] = useState<any>(null);

  const { data: coupons = [], isLoading, isError } = useQuery({
    queryKey: ['admin-coupons', search, status, discountType],
    queryFn: async () => {
      const res = await api.get('/admin/coupons', {
        params: {
          ...(search ? { search } : {}),
          ...(status ? { status } : {}),
          ...(discountType ? { discountType } : {}),
        },
      });
      return extractList(res);
    },
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => extractList(await api.get('/admin/plans')),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        discountValue: Number(form.discountValue),
        usageLimit: Number(form.usageLimit),
        perCustomerLimit: Number(form.perCustomerLimit),
        minimumAmount: form.minimumAmount === '' ? null : Number(form.minimumAmount),
        maximumDiscountAmount:
          form.discountType === 'PERCENTAGE' && form.maximumDiscountAmount !== ''
            ? Number(form.maximumDiscountAmount)
            : null,
        startsAt: form.startsAt || null,
        expiresAt: form.expiresAt || null,
        planIds: form.appliesToAllPlans ? [] : form.planIds,
      };
      if (editingId) return api.patch(`/admin/coupons/${editingId}`, payload);
      return api.post('/admin/coupons', payload);
    },
    onSuccess: () => {
      toast.success(editingId ? 'Coupon updated successfully' : 'Coupon created successfully');
      closeDrawer();
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) =>
      api.patch(`/admin/coupons/${id}/status`, { isActive }),
    onSuccess: () => {
      toast.success('Coupon status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/admin/coupons/${id}`),
    onSuccess: () => {
      toast.success('Coupon deactivated');
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setIsDrawerOpen(true);
  };

  const openEdit = (coupon: any) => {
    setEditingId(coupon.id);
    setForm({
      name: coupon.name || '',
      code: coupon.code || '',
      description: coupon.description || '',
      discountType: coupon.discountType === 'FIXED' ? 'FIXED' : 'PERCENTAGE',
      discountValue: String(coupon.discountValue ?? ''),
      appliesToAllPlans: coupon.appliesToAllPlans !== false,
      planIds: Array.isArray(coupon.planIds) ? coupon.planIds : [],
      minimumAmount: coupon.minimumAmount != null ? String(coupon.minimumAmount) : '',
      maximumDiscountAmount:
        coupon.maximumDiscountAmount != null ? String(coupon.maximumDiscountAmount) : '',
      startsAt: dateInput(coupon.startsAt),
      expiresAt: dateInput(coupon.expiresAt),
      usageLimit: String(coupon.usageLimit ?? 1),
      perCustomerLimit: String(coupon.perCustomerLimit ?? 1),
      isActive: coupon.isActive !== false,
    });
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const openDetail = async (id: number) => {
    try {
      const res = await api.get(`/admin/coupons/${id}`);
      setDetail(res?.data?.data || res?.data || res);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* 1. Standard page header */}
      <AdminPageHeader
        title="Coupons"
        description="Package discounts used at customer checkout."
        icon={Tag}
        iconColor="text-emerald-500"
        badge={{ text: 'Discount Management', variant: 'emerald' }}
        breadcrumbs={[
          { label: 'Customers', href: '/customers' },
          { label: 'Coupons' },
        ]}
        actions={
          <AdminButton variant="primary" size="md" icon={Plus} onClick={openCreate}>
            Create Coupon
          </AdminButton>
        }
      />

      {/* 2. Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search coupon code or name…"
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 min-w-[200px] transition"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="EXPIRED">Expired</option>
        </select>
        <select
          value={discountType}
          onChange={(e) => setDiscountType(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition"
        >
          <option value="">All discount types</option>
          <option value="PERCENTAGE">Percentage</option>
          <option value="FIXED">Fixed amount</option>
        </select>
      </div>

      {/* 3. Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Discount</th>
              <th className="px-4 py-3">Packages</th>
              <th className="px-4 py-3">Start</th>
              <th className="px-4 py-3">Expiry</th>
              <th className="px-4 py-3">Usage</th>
              <th className="px-4 py-3">Per customer</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 10 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-3 bg-slate-100 rounded animate-pulse w-16" />
                    </td>
                  ))}
                </tr>
              ))
            ) : isError ? (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-sm text-red-500 font-medium">
                  Failed to load coupons. Please refresh.
                </td>
              </tr>
            ) : coupons.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Tag className="w-8 h-8 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-400">No coupons yet.</p>
                    <p className="text-xs text-slate-400">Create your first coupon to get started.</p>
                  </div>
                </td>
              </tr>
            ) : (
              coupons.map((coupon: any) => (
                <tr key={coupon.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-slate-800 text-xs bg-slate-100 px-2 py-0.5 rounded">
                      {coupon.code}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700 font-medium">{coupon.name}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {coupon.discountType === 'FIXED' ? `Rs.${coupon.discountValue} OFF` : `${coupon.discountValue}%`}
                  </td>
                  <td className="px-4 py-3 text-slate-600 max-w-[140px] truncate">
                    {(coupon.planNames || []).join(', ')}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{dateInput(coupon.startsAt) || '-'}</td>
                  <td className="px-4 py-3 text-slate-500">{dateInput(coupon.expiresAt) || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{coupon.usedCount}/{coupon.usageLimit}</td>
                  <td className="px-4 py-3 text-slate-600">{coupon.perCustomerLimit}</td>
                  <td className="px-4 py-3"><StatusBadge status={coupon.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button title="View detail" className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" onClick={() => openDetail(coupon.id)}>
                        <Eye className="w-4 h-4" />
                      </button>
                      <button title="Edit" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors" onClick={() => openEdit(coupon)}>
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        title={coupon.isActive ? 'Deactivate' : 'Activate'}
                        className={`p-1.5 rounded-lg transition-colors ${coupon.isActive ? 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                        onClick={() => statusMutation.mutate({ id: coupon.id, isActive: !coupon.isActive })}
                      >
                        {coupon.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                      <button title="Delete" className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" onClick={() => deleteMutation.mutate(coupon.id)}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Detail panel */}
      {detail && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">{detail.code}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{detail.name}</p>
            </div>
            <button className="text-xs text-slate-500 hover:text-slate-700 transition-colors px-2 py-1 rounded hover:bg-slate-100" onClick={() => setDetail(null)}>
              Close
            </button>
          </div>
          <div className="grid gap-2 text-sm text-slate-700 md:grid-cols-2">
            <div>Type: <span className="font-semibold">{detail.discountType}</span></div>
            <div>Value: <span className="font-semibold">{detail.discountType === 'FIXED' ? `Rs.${detail.discountValue}` : `${detail.discountValue}%`}</span></div>
            <div>Packages: <span className="font-semibold">{(detail.planNames || []).join(', ')}</span></div>
            <div>Start: <span className="font-semibold">{dateInput(detail.startsAt) || '-'}</span></div>
            <div>Expiry: <span className="font-semibold">{dateInput(detail.expiresAt) || '-'}</span></div>
            <div>Usage: <span className="font-semibold">{detail.usedCount}/{detail.usageLimit}</span></div>
            <div>Remaining: <span className="font-semibold">{detail.remainingUsage}</span></div>
            <div>Per customer: <span className="font-semibold">{detail.perCustomerLimit}</span></div>
            <div>Status: <span className="font-semibold">{detail.status}</span></div>
            <div>Created: <span className="font-semibold">{dateInput(detail.createdAt)}</span></div>
          </div>
          <h3 className="mt-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Redemptions</h3>
          <div className="mt-2 space-y-2 text-sm">
            {(detail.redemptions || []).length === 0 ? (
              <p className="text-slate-400 text-xs">No redemptions yet.</p>
            ) : (
              (detail.redemptions || []).map((row: any) => (
                <div key={row.id} className="rounded-lg border border-slate-100 px-3 py-2 text-xs text-slate-600">
                  <span className="font-semibold">{row.customerName}</span> - {row.planName} - Original Rs.{row.originalAmount} - Discount Rs.{row.discountAmount} - Final Rs.{row.finalAmount} - {dateInput(row.redeemedAt)}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 5. Create / Edit Right-Side Drawer */}
      <AdminFormDrawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        title={editingId ? 'Edit Coupon' : 'Create Coupon'}
        subtitle={editingId ? 'Update the package discount coupon.' : 'Create a new package discount coupon for customer checkout.'}
        icon={Tag}
        size="lg"
        onSave={() => saveMutation.mutate()}
        saveLabel={editingId ? 'Save Changes' : 'Create Coupon'}
        cancelLabel="Cancel"
        isSubmitting={saveMutation.isPending}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Coupon Name *">
            <input className={inputCls} placeholder="e.g., Summer Sale" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>

          <Field label="Coupon Code *">
            <input className={`${inputCls} font-mono uppercase`} placeholder="e.g., SUMMER20" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
          </Field>

          <Field label="Description" span2>
            <textarea className={`${inputCls} resize-none`} rows={2} placeholder="Optional coupon description..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>

          <Field label="Discount Type *">
            <select className={inputCls} value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value as CouponForm['discountType'] })}>
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED">Fixed amount (Rs.)</option>
            </select>
          </Field>

          <Field label={`Discount Value * ${form.discountType === 'PERCENTAGE' ? '(%)' : '(Rs.)'}`}>
            <input className={inputCls} placeholder={form.discountType === 'PERCENTAGE' ? 'e.g., 20' : 'e.g., 500'} value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} type="number" min={0} />
          </Field>

          <Field label="Minimum Package Amount (Rs.)">
            <input className={inputCls} placeholder="e.g., 9999 (blank = no minimum)" value={form.minimumAmount} onChange={(e) => setForm({ ...form, minimumAmount: e.target.value })} type="number" min={0} />
          </Field>

          <Field label="Maximum Discount (Rs.)">
            <input className={inputCls} placeholder={form.discountType === 'PERCENTAGE' ? 'e.g., 2000 (cap on % discount)' : 'N/A for fixed discount'} value={form.maximumDiscountAmount} onChange={(e) => setForm({ ...form, maximumDiscountAmount: e.target.value })} disabled={form.discountType !== 'PERCENTAGE'} type="number" min={0} />
          </Field>

          <Field label="Start Date">
            <input className={inputCls} type="date" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
          </Field>

          <Field label="Expiry Date">
            <input className={inputCls} type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
          </Field>

          <Field label="Total Usage Limit *">
            <input className={inputCls} placeholder="e.g., 100" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} type="number" min={1} />
          </Field>

          <Field label="Per Customer Limit *">
            <input className={inputCls} placeholder="e.g., 1" value={form.perCustomerLimit} onChange={(e) => setForm({ ...form, perCustomerLimit: e.target.value })} type="number" min={1} />
          </Field>

          <div className="md:col-span-2 flex flex-col gap-3">
            <label className="flex items-center gap-2.5 cursor-pointer select-none text-sm text-slate-700">
              <input type="checkbox" className="w-4 h-4 accent-emerald-500 rounded" checked={form.appliesToAllPlans} onChange={(e) => setForm({ ...form, appliesToAllPlans: e.target.checked, planIds: e.target.checked ? [] : form.planIds })} />
              <span className="font-medium">All packages</span>
              <span className="text-slate-400 text-xs">(applies to every package)</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer select-none text-sm text-slate-700">
              <input type="checkbox" className="w-4 h-4 accent-emerald-500 rounded" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              <span className="font-medium">Active</span>
              <span className="text-slate-400 text-xs">(coupon is available for use)</span>
            </label>
          </div>

          {!form.appliesToAllPlans && plans.length > 0 && (
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-2">Select Eligible Packages *</label>
              <div className="flex flex-wrap gap-3">
                {plans.map((plan: any) => (
                  <label key={plan.id} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-emerald-500 rounded"
                      checked={form.planIds.includes(plan.id)}
                      onChange={(e) => {
                        const planIds = e.target.checked ? [...form.planIds, plan.id] : form.planIds.filter((id) => id !== plan.id);
                        setForm({ ...form, planIds });
                      }}
                    />
                    {plan.name}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </AdminFormDrawer>
    </div>
  );
}
