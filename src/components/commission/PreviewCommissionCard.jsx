'use client';

import * as React from 'react';
import api from '../../../lib/api';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { toast } from '@/hooks/use-toast';
import { hrmError } from '@/modules/hrm/hrm-api';
import { formatCurrency } from '@/lib/currency';
import { Calculator, Sparkles, AlertCircle, ArrowRight, UserCheck, ShieldCheck } from 'lucide-react';

const unwrap = (value) => value?.data ?? value;

export function PreviewCommissionCard({ roles = [], className = '' }) {
  const [query, setQuery] = React.useState({
    roleId: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
  });
  const [preview, setPreview] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [validationError, setValidationError] = React.useState('');

  const handlePreview = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!query.roleId) {
      setValidationError('Please select an employee role.');
      toast.warning('Please select an employee role.');
      return;
    }
    if (!query.amount || Number(query.amount) < 0) {
      setValidationError('Please enter a valid positive sale amount.');
      toast.warning('Please enter a valid sale amount.');
      return;
    }
    if (!query.date) {
      setValidationError('Please select an applicable date.');
      toast.warning('Please select an applicable date.');
      return;
    }

    setPreview(null);
    setLoading(true);
    try {
      const response = await api.post('/commissions/configs/preview', {
        roleId: Number(query.roleId),
        amount: Number(query.amount),
        date: query.date,
      });
      setPreview(unwrap(response));
    } catch (err) {
      toast.error(hrmError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-xs space-y-5 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F1EC] text-[#163A2E] border border-emerald-100/90 shadow-2xs">
            <Calculator className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Preview Commission
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Simulate and preview commission for a specific role, sale amount, and date.
            </p>
          </div>
        </div>
      </div>

      {/* Calculator Form */}
      <form onSubmit={handlePreview} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* 1. Employee Role Dropdown */}
          <div className="space-y-1.5 min-w-0">
            <Label htmlFor="preview-role" className="text-xs font-semibold text-slate-700">
              Employee Role <span className="text-rose-500">*</span>
            </Label>
            <select
              id="preview-role"
              required
              value={query.roleId}
              onChange={(e) => {
                setQuery((curr) => ({ ...curr, roleId: e.target.value }));
                if (validationError) setValidationError('');
              }}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#163A2E]/20 focus:border-[#163A2E] transition-all cursor-pointer"
            >
              <option value="">Select employee role...</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Full Sale Amount */}
          <div className="space-y-1.5 min-w-0">
            <Label htmlFor="preview-amount" className="text-xs font-semibold text-slate-700">
              Full Sale Amount (₹) <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="preview-amount"
              type="number"
              min="0"
              step="0.01"
              required
              placeholder="e.g. 50000"
              value={query.amount}
              onChange={(e) => {
                setQuery((curr) => ({ ...curr, amount: e.target.value }));
                if (validationError) setValidationError('');
              }}
              className="h-10 text-xs sm:text-sm rounded-xl border-slate-200 focus-visible:ring-[#163A2E]"
            />
          </div>

          {/* 3. Applicable Date */}
          <div className="space-y-1.5 min-w-0">
            <Label htmlFor="preview-date" className="text-xs font-semibold text-slate-700">
              Applicable Date <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="preview-date"
              type="date"
              required
              value={query.date}
              onChange={(e) => {
                setQuery((curr) => ({ ...curr, date: e.target.value }));
                if (validationError) setValidationError('');
              }}
              className="h-10 text-xs sm:text-sm rounded-xl border-slate-200 focus-visible:ring-[#163A2E]"
            />
          </div>

          {/* 4. Action Button */}
          <div>
            <Button
              type="submit"
              disabled={loading}
              className="h-10 w-full bg-[#163A2E] hover:bg-[#204C3D] text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Calculator className={`size-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Calculating…' : 'Preview Commission'}</span>
            </Button>
          </div>
        </div>

        {validationError && (
          <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">
            <AlertCircle className="size-4 shrink-0 text-rose-500" />
            <span>{validationError}</span>
          </div>
        )}
      </form>

      {/* Preview Simulation Result Card */}
      {preview && (
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-[#F0F7F4] via-white to-[#F0F7F4] p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-100/80 pb-3.5">
            <div className="flex items-center gap-2.5">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-[#163A2E]">
                <Sparkles className="size-4" />
              </span>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {preview.configuration?.name || 'Commission Calculation Result'}
                </h4>
                <p className="text-xs text-slate-600">
                  Role: <strong className="text-[#163A2E]">{preview.configuration?.role?.name || '—'}</strong> · Slab: <strong className="text-[#163A2E]">{preview.slab?.name || 'Standard'}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-[#E8F1EC] text-[#163A2E] border border-emerald-200">
                Rate: {preview.slab?.ratePercent}%
              </span>
            </div>
          </div>

          {/* Metric Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Full Sale Amount */}
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Full Sale Amount
              </span>
              <p className="text-base sm:text-lg font-bold text-slate-900">
                {formatCurrency(preview.saleAmount)}
              </p>
              <p className="text-[11px] text-slate-400">
                Rate applied: {preview.slab?.ratePercent}%
              </p>
            </div>

            {/* Total Calculated Commission */}
            <div className="rounded-xl border border-emerald-200 bg-[#E8F1EC]/60 p-3.5 space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#163A2E]">
                Total Commission
              </span>
              <p className="text-base sm:text-lg font-extrabold text-[#163A2E]">
                {formatCurrency(preview.total)}
              </p>
              <p className="text-[11px] text-[#204C3D]">
                {preview.slab?.ratePercent}% of {formatCurrency(preview.saleAmount)}
              </p>
            </div>

            {/* Employee vs Leader Payout Split */}
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Recipient Allocation
              </span>
              <div className="flex items-center justify-between text-xs pt-0.5">
                <span className="text-slate-600 flex items-center gap-1">
                  <UserCheck className="size-3 text-slate-400" /> Employee:
                </span>
                <strong className="text-slate-900">{formatCurrency(preview.employeeAmount)}</strong>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 flex items-center gap-1">
                  <ShieldCheck className="size-3 text-slate-400" /> Team Leader:
                </span>
                <strong className="text-slate-900">{formatCurrency(preview.leaderAmount)}</strong>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 pt-1">
            Existing single-recipient allocation. Simulation preview only; does not credit wallets or create payment records.
          </p>
        </div>
      )}
    </div>
  );
}
