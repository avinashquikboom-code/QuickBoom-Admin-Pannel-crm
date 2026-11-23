// @ts-nocheck
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, AlertCircle, Coins, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { addCredits, reduceCredits, loadCustomerCredits, socialError } from '@/modules/social/social-api';

interface AdjustCreditsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string | number;
  customerName?: string;
  currentBalance?: number;
  initialMode?: 'add' | 'reduce';
  onSuccess?: () => void;
}

export function AdjustCreditsDialog({
  open,
  onOpenChange,
  customerId: initialCustomerId,
  customerName: initialCustomerName,
  currentBalance = 0,
  initialMode = 'add',
  onSuccess,
}: AdjustCreditsDialogProps) {
  const [mode, setMode] = React.useState<'add' | 'reduce'>(initialMode);
  const [targetId, setTargetId] = React.useState(initialCustomerId ? String(initialCustomerId) : '');
  const [targetName, setTargetName] = React.useState(initialCustomerName || '');
  const [activeBalance, setActiveBalance] = React.useState(currentBalance);
  const [amount, setAmount] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setMode(initialMode);
      setTargetId(initialCustomerId ? String(initialCustomerId) : '');
      setTargetName(initialCustomerName || '');
      setActiveBalance(currentBalance || 0);
      setAmount('');
      setReason('');
      setLoading(false);
    }
  }, [open, initialMode, initialCustomerId, initialCustomerName, currentBalance]);

  // If user inputs custom ID and blurs, optionally fetch current balance
  const handleIdBlur = async () => {
    const id = targetId.trim();
    if (!id || initialCustomerId) return;
    try {
      const res = await loadCustomerCredits(id);
      const data = res?.data || res;
      const bal = data?.wallet?.balance ?? data?.balance ?? 0;
      const name = data?.customer?.companyName || data?.customer?.name || `Customer #${id}`;
      setActiveBalance(bal);
      setTargetName(name);
    } catch {
      // ignore
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalId = targetId.trim() || initialCustomerId;
    const numAmount = parseInt(amount, 10);

    if (!finalId) {
      toast.error('Please enter a valid Customer ID');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid credit amount greater than 0');
      return;
    }
    if (!reason.trim()) {
      toast.error('Please enter a reason for this credit adjustment');
      return;
    }

    if (mode === 'reduce' && activeBalance > 0 && numAmount > activeBalance) {
      toast.error(`Cannot reduce more than current balance (${activeBalance} credits)`);
      return;
    }

    setLoading(true);
    try {
      if (mode === 'add') {
        await addCredits(finalId, numAmount, reason.trim());
        toast.success(`Successfully added ${numAmount} credits to customer #${finalId}`);
      } else {
        await reduceCredits(finalId, numAmount, reason.trim());
        toast.success(`Successfully reduced ${numAmount} credits from customer #${finalId}`);
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error(socialError(err) || 'Failed to adjust credits');
    } finally {
      setLoading(false);
    }
  };

  const resultingBalance =
    mode === 'add'
      ? activeBalance + (parseInt(amount, 10) || 0)
      : Math.max(0, activeBalance - (parseInt(amount, 10) || 0));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] rounded-2xl bg-white p-6 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-emerald-50 text-[#16A34A] ring-1 ring-emerald-200/60 flex items-center justify-center shrink-0">
              <Coins className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                Adjust Customer Credits
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Grant promotional credits or deduct usage manually.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Customer info card or Input */}
          {initialCustomerId ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 flex items-center justify-between">
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Target Customer
                </span>
                <p className="text-sm font-bold text-slate-900 truncate">
                  {targetName || `Customer #${initialCustomerId}`}
                </p>
                <span className="text-xs text-slate-500 font-mono">ID: #{initialCustomerId}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Current Balance
                </span>
                <p className="text-base font-black text-[#16A34A]">{activeBalance} Credits</p>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Customer ID <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="e.g. 1, 2, 5..."
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  onBlur={handleIdBlur}
                  required
                  className="h-10 text-xs pl-9 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                />
                <User className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              {targetName && (
                <p className="text-[11px] text-emerald-700 font-semibold">
                  {targetName} • Current balance: {activeBalance} credits
                </p>
              )}
            </div>
          )}

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setMode('add')}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'add'
                  ? 'bg-[#16A34A] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plus className="size-3.5" />
              Add Credits
            </button>
            <button
              type="button"
              onClick={() => setMode('reduce')}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'reduce'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Minus className="size-3.5" />
              Reduce Credits
            </button>
          </div>

          {/* Amount input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Amount of Credits <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Input
                type="number"
                min="1"
                placeholder="e.g. 50"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="h-10 text-xs pl-9 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
              />
              <Coins className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            {amount && !isNaN(parseInt(amount, 10)) && (
              <p className="text-[11px] text-slate-500">
                Estimated balance after adjustment:{' '}
                <strong className={mode === 'add' ? 'text-emerald-700' : 'text-slate-800'}>
                  {resultingBalance} credits
                </strong>
              </p>
            )}
          </div>

          {/* Reason input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Reason / Reference <span className="text-rose-500">*</span>
            </label>
            <Textarea
              placeholder="e.g. Promotional campaign grant, manual refund, or support adjustment..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={3}
              className="text-xs resize-none rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="rounded-xl border-slate-200 text-xs font-semibold text-slate-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className={`rounded-xl text-xs font-semibold text-white shadow-xs ${
                mode === 'add'
                  ? 'bg-[#16A34A] hover:bg-[#15803D]'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {loading
                ? 'Processing...'
                : mode === 'add'
                ? `Add ${amount ? amount : ''} Credits`
                : `Reduce ${amount ? amount : ''} Credits`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
