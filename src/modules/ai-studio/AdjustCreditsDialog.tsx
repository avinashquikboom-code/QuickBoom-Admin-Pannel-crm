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
import { addCredits, reduceCredits, socialError } from '@/modules/social/social-api';

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
  customerId,
  customerName,
  currentBalance = 0,
  initialMode = 'add',
  onSuccess,
}: AdjustCreditsDialogProps) {
  const [mode, setMode] = React.useState<'add' | 'reduce'>(initialMode);
  const [amount, setAmount] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setMode(initialMode);
      setAmount('');
      setReason('');
      setLoading(false);
    }
  }, [open, initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseInt(amount, 10);
    if (!customerId) {
      toast.error('Please specify a valid Customer ID');
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

    if (mode === 'reduce' && numAmount > currentBalance) {
      toast.error(`Cannot reduce more than current balance (${currentBalance} credits)`);
      return;
    }

    setLoading(true);
    try {
      if (mode === 'add') {
        await addCredits(customerId, numAmount, reason.trim());
        toast.success(`Successfully added ${numAmount} credits to customer #${customerId}`);
      } else {
        await reduceCredits(customerId, numAmount, reason.trim());
        toast.success(`Successfully reduced ${numAmount} credits from customer #${customerId}`);
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
      ? currentBalance + (parseInt(amount, 10) || 0)
      : Math.max(0, currentBalance - (parseInt(amount, 10) || 0));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-xl bg-[#E8F1EC] text-[#163A2E] flex items-center justify-center shrink-0">
              <Coins className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-[#163A2E]">
                Adjust Customer Credits
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Grant promotional credits or deduct usage manually.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Customer info card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Target Customer
              </span>
              <p className="text-sm font-bold text-slate-900 truncate">
                {customerName || `Customer #${customerId}`}
              </p>
              <span className="text-xs text-slate-500">ID: #{customerId}</span>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Current Balance
              </span>
              <p className="text-base font-bold text-[#163A2E]">{currentBalance} Credits</p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setMode('add')}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'add'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plus className="size-3.5" />
              Add Credits
            </button>
            <button
              type="button"
              onClick={() => setMode('reduce')}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
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
                className="h-10 text-sm pl-9"
              />
              <Coins className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            {amount && !isNaN(parseInt(amount, 10)) && (
              <p className="text-[11px] text-slate-500">
                New balance after adjustment:{' '}
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
              className="text-xs resize-none"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className={
                mode === 'add'
                  ? 'bg-[#163A2E] hover:bg-[#163A2E]/90 text-white'
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              }
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
