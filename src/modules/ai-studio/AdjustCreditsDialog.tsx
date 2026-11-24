// @ts-nocheck
'use client';

import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, AlertCircle, Coins, User, ArrowRight, Sparkles, Building2 } from 'lucide-react';
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

const PRESET_AMOUNTS = [10, 50, 100, 250, 500];

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

  // If user inputs custom ID and blurs, fetch current balance
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

  const parsedAmount = parseInt(amount, 10) || 0;
  const resultingBalance =
    mode === 'add'
      ? activeBalance + parsedAmount
      : Math.max(0, activeBalance - parsedAmount);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[480px] p-0 flex flex-col bg-white border-l border-slate-200"
      >
        {/* Drawer Header */}
        <SheetHeader className="p-6 border-b border-slate-100 bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-emerald-50 text-[#16A34A] ring-1 ring-emerald-200/60 flex items-center justify-center shrink-0">
              <Coins className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full ring-1 ring-emerald-200">
                  Wallet Adjustment
                </span>
              </div>
              <SheetTitle className="text-lg font-bold text-slate-900 mt-1">
                Adjust Customer Credits
              </SheetTitle>
              <SheetDescription className="text-xs text-slate-500">
                Grant promotional credits or deduct usage manually from a customer wallet.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-700">
          {/* Target Customer Info Card / Search */}
          {initialCustomerId ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 flex items-center justify-between">
              <div className="min-w-0 pr-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Target Customer
                </span>
                <p className="text-sm font-bold text-slate-900 truncate">
                  {targetName || `Customer #${initialCustomerId}`}
                </p>
                <span className="text-xs text-slate-500 font-mono">ID: #{initialCustomerId}</span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Current Balance
                </span>
                <p className="text-lg font-black text-[#16A34A]">{activeBalance} Credits</p>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">
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
                <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5 pt-0.5">
                  <Building2 className="size-3 text-emerald-600" />
                  <span>{targetName} • Current balance: <strong>{activeBalance} credits</strong></span>
                </p>
              )}
            </div>
          )}

          {/* Mode Switcher */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">
              Adjustment Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('add')}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold border transition-all cursor-pointer ${
                  mode === 'add'
                    ? 'border-[#16A34A] bg-emerald-50 text-[#16A34A] shadow-xs ring-1 ring-[#16A34A]'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Plus className="size-4 text-[#16A34A]" />
                <span>Add / Grant Credits</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('reduce')}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold border transition-all cursor-pointer ${
                  mode === 'reduce'
                    ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-xs ring-1 ring-rose-500'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Minus className="size-4 text-rose-600" />
                <span>Reduce / Deduct</span>
              </button>
            </div>
          </div>

          {/* Amount of Credits Input & Presets */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800">
              Credit Amount <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Input
                type="number"
                min="1"
                placeholder="e.g. 50"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="h-10 text-sm pl-9 font-bold text-slate-900 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
              />
              <Coins className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Presets:</span>
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(String(amt))}
                  className="rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition-colors"
                >
                  +{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Live Resulting Balance Preview Card */}
          {parsedAmount > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 space-y-2 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Sparkles className="size-3.5 text-amber-500" />
                <span>Balance Impact Simulation</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="text-slate-500">
                  <span>Current: </span>
                  <span className="font-semibold text-slate-800">{activeBalance}</span>
                </div>
                <ArrowRight className="size-3.5 text-slate-400" />
                <div className="text-slate-500">
                  <span>Change: </span>
                  <span className={`font-bold ${mode === 'add' ? 'text-[#16A34A]' : 'text-rose-600'}`}>
                    {mode === 'add' ? `+${parsedAmount}` : `-${parsedAmount}`}
                  </span>
                </div>
                <ArrowRight className="size-3.5 text-slate-400" />
                <div>
                  <span className="text-slate-500">Result: </span>
                  <span className="font-black text-sm text-[#16A34A]">
                    {resultingBalance} Credits
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Reason Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">
              Reason / Audit Reference <span className="text-rose-500">*</span>
            </label>
            <Textarea
              placeholder="e.g. Promotional campaign grant, manual refund, or customer support adjustment..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={3}
              className="text-xs resize-none rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Drawer Sticky Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-end gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="h-9 rounded-xl border-slate-200 text-xs font-semibold text-slate-700 px-4"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            size="sm"
            disabled={loading}
            className={`h-9 rounded-xl text-xs font-semibold text-white shadow-xs px-4 ${
              mode === 'add'
                ? 'bg-[#16A34A] hover:bg-[#15803D]'
                : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            {loading
              ? 'Processing...'
              : mode === 'add'
              ? `Grant ${parsedAmount ? parsedAmount : ''} Credits`
              : `Deduct ${parsedAmount ? parsedAmount : ''} Credits`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
