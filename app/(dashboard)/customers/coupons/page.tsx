'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '@/lib/utils';

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

export default function CouponsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [discountType, setDiscountType] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [form, setForm] = useState<CouponForm>(emptyForm());

  const { data: coupons = [], isLoading } = useQuery({
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
      toast.success(editingId ? 'Coupon updated' : 'Coupon created');
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm());
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
    setShowForm(true);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Coupons</h1>
          <p className="text-sm text-slate-500">Package discounts used at customer checkout.</p>
        </div>
        <button
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
          onClick={() => {
            setEditingId(null);
            setForm(emptyForm());
            setShowForm(true);
          }}
        >
          Create Coupon
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search coupon code"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="EXPIRED">Expired</option>
        </select>
        <select value={discountType} onChange={(e) => setDiscountType(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <option value="">All discount types</option>
          <option value="PERCENTAGE">Percentage</option>
          <option value="FIXED">Fixed</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
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
          <tbody>
            {isLoading ? (
              <tr><td className="px-4 py-6" colSpan={10}>Loading coupons...</td></tr>
            ) : coupons.length === 0 ? (
              <tr><td className="px-4 py-6" colSpan={10}>No coupons yet.</td></tr>
            ) : coupons.map((coupon: any) => (
              <tr key={coupon.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">{coupon.code}</td>
                <td className="px-4 py-3">{coupon.name}</td>
                <td className="px-4 py-3">
                  {coupon.discountType === 'FIXED' ? `₹${coupon.discountValue} OFF` : `${coupon.discountValue}%`}
                </td>
                <td className="px-4 py-3">{(coupon.planNames || []).join(', ')}</td>
                <td className="px-4 py-3">{dateInput(coupon.startsAt) || '—'}</td>
                <td className="px-4 py-3">{dateInput(coupon.expiresAt) || '—'}</td>
                <td className="px-4 py-3">{coupon.usedCount}/{coupon.usageLimit}</td>
                <td className="px-4 py-3">{coupon.perCustomerLimit}</td>
                <td className="px-4 py-3">{coupon.status}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button className="text-emerald-700" onClick={() => openDetail(coupon.id)}>View</button>
                    <button className="text-slate-700" onClick={() => openEdit(coupon)}>Edit</button>
                    <button className="text-slate-700" onClick={() => statusMutation.mutate({ id: coupon.id, isActive: !coupon.isActive })}>
                      {coupon.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button className="text-red-600" onClick={() => deleteMutation.mutate(coupon.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold">{editingId ? 'Edit Coupon' : 'Create Coupon'}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <input className="rounded-lg border px-3 py-2" placeholder="Coupon name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="rounded-lg border px-3 py-2" placeholder="Coupon code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
            <textarea className="rounded-lg border px-3 py-2 md:col-span-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <select className="rounded-lg border px-3 py-2" value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value as CouponForm['discountType'] })}>
              <option value="PERCENTAGE">Percentage</option>
              <option value="FIXED">Fixed amount</option>
            </select>
            <input className="rounded-lg border px-3 py-2" placeholder="Discount value" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} />
            <input className="rounded-lg border px-3 py-2" placeholder="Minimum package amount" value={form.minimumAmount} onChange={(e) => setForm({ ...form, minimumAmount: e.target.value })} />
            <input className="rounded-lg border px-3 py-2" placeholder="Maximum discount" value={form.maximumDiscountAmount} onChange={(e) => setForm({ ...form, maximumDiscountAmount: e.target.value })} disabled={form.discountType !== 'PERCENTAGE'} />
            <input type="date" className="rounded-lg border px-3 py-2" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
            <input type="date" className="rounded-lg border px-3 py-2" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
            <input className="rounded-lg border px-3 py-2" placeholder="Total usage limit" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} />
            <input className="rounded-lg border px-3 py-2" placeholder="Per customer limit" value={form.perCustomerLimit} onChange={(e) => setForm({ ...form, perCustomerLimit: e.target.value })} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.appliesToAllPlans} onChange={(e) => setForm({ ...form, appliesToAllPlans: e.target.checked, planIds: e.target.checked ? [] : form.planIds })} />
              All packages
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              Active
            </label>
            {!form.appliesToAllPlans && (
              <div className="md:col-span-2 flex flex-wrap gap-3">
                {plans.map((plan: any) => (
                  <label key={plan.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.planIds.includes(plan.id)}
                      onChange={(e) => {
                        const planIds = e.target.checked
                          ? [...form.planIds, plan.id]
                          : form.planIds.filter((id) => id !== plan.id);
                        setForm({ ...form, planIds });
                      }}
                    />
                    {plan.name}
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              Save
            </button>
            <button className="rounded-lg border px-4 py-2 text-sm" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {detail && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{detail.code}</h2>
            <button className="text-sm text-slate-500" onClick={() => setDetail(null)}>Close</button>
          </div>
          <div className="grid gap-2 text-sm text-slate-700 md:grid-cols-2">
            <div>Name: {detail.name}</div>
            <div>Type: {detail.discountType}</div>
            <div>Value: {detail.discountValue}</div>
            <div>Packages: {(detail.planNames || []).join(', ')}</div>
            <div>Start: {dateInput(detail.startsAt) || '—'}</div>
            <div>Expiry: {dateInput(detail.expiresAt) || '—'}</div>
            <div>Usage: {detail.usedCount}/{detail.usageLimit}</div>
            <div>Remaining: {detail.remainingUsage}</div>
            <div>Per customer: {detail.perCustomerLimit}</div>
            <div>Status: {detail.status}</div>
            <div>Created: {dateInput(detail.createdAt)}</div>
            <div>Updated: {dateInput(detail.updatedAt)}</div>
          </div>
          <h3 className="mt-4 text-sm font-semibold">Redemptions</h3>
          <div className="mt-2 space-y-2 text-sm">
            {(detail.redemptions || []).length === 0 ? <p className="text-slate-500">No redemptions yet.</p> : (detail.redemptions || []).map((row: any) => (
              <div key={row.id} className="rounded-lg border border-slate-100 px-3 py-2">
                {row.customerName} · {row.planName} · Original ₹{row.originalAmount} · Discount ₹{row.discountAmount} · Final ₹{row.finalAmount} · {dateInput(row.redeemedAt)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
