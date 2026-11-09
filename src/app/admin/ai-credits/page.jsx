'use client';

import * as React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { toast } from '@/hooks/use-toast';
import { HrmGap, HrmNotice, HrmStats } from '@/modules/hrm/HrmNotice';
import { addCredits, loadCreditTransactions, loadCustomerCredits, reduceCredits, sessionCan, socialError, socialGaps } from '@/modules/social/social-api';

export default function AiCreditsPage() {
  const [customerId, setCustomerId] = React.useState('');
  const [wallet, setWallet] = React.useState(null);
  const [ledger, setLedger] = React.useState({ rows: [] });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [allowed, setAllowed] = React.useState(false);
  const [amount, setAmount] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [refresh, setRefresh] = React.useState(0);
  React.useEffect(() => setAllowed(sessionCan('AI')), []);
  React.useEffect(() => {
    let active = true;
    setLoading(true);
    loadCreditTransactions({ page: 1 }).then((result) => { if (active) { setLedger(result); setError(''); } }).catch((err) => { if (active) setError(socialError(err)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh]);

  const balance = wallet?.balance ?? wallet?.data?.balance;
  const record = wallet?.data?.wallet || wallet?.wallet || wallet?.data;

  return <div className="mx-auto max-w-7xl space-y-6">
    <PageHeader title="AI Credits Management" description="Customer wallet balances and the credit transaction ledger." />
    <HrmGap title="Balances" detail={socialGaps.credits} />
    <div className="flex flex-wrap items-end gap-2">
      <Label className="grid gap-1 text-xs">Customer ID<Input value={customerId} onChange={(event) => setCustomerId(event.target.value)} /></Label>
      <Button variant="outline" onClick={async () => { if (!customerId) return; try { setWallet(await loadCustomerCredits(customerId)); setError(''); } catch (err) { setError(socialError(err)); } }}>Load wallet</Button>
    </div>
    <HrmNotice loading={loading} error={error} onRetry={() => setRefresh((value) => value + 1)}>
      {record && <HrmStats items={[{ label: 'Available', value: balance }, { label: 'Earned', value: record.totalEarned }, { label: 'Spent', value: record.totalSpent }, { label: 'Customer', value: wallet?.data?.customer?.companyName || wallet?.customer?.name || customerId }]} />}
      {balance === 0 && <p className="text-sm text-rose-700">The wallet reports a zero balance.</p>}
      {Number(balance) > 0 && Number(balance) <= 5 && <p className="text-sm text-amber-700">The wallet balance is {balance}.</p>}
      {allowed && record && <form className="mt-4 grid gap-2 sm:grid-cols-[8rem_1fr_auto_auto]" onSubmit={async (event) => { event.preventDefault(); const action = event.nativeEvent.submitter?.value; try { if (action === 'reduce') await reduceCredits(customerId, amount, reason); else await addCredits(customerId, amount, reason); setWallet(await loadCustomerCredits(customerId)); setRefresh((value) => value + 1); toast.success('Credit adjustment saved'); } catch (err) { toast.error(socialError(err)); } }}>
        <Input type="number" min="1" required placeholder="Credits" value={amount} onChange={(event) => setAmount(event.target.value)} />
        <Input required placeholder="Reason" value={reason} onChange={(event) => setReason(event.target.value)} />
        <Button type="submit" value="add">Add</Button>
        <Button type="submit" value="reduce" variant="outline">Reduce</Button>
      </form>}
      <div className="mt-4 overflow-x-auto"><DataTable label="Credit transactions" data={ledger.rows || []} columns={[
        { header: 'When', cell: (row) => String(row.createdAt || '').slice(0, 16).replace('T', ' ') },
        { header: 'Customer', cell: (row) => row.customer?.companyName || row.customer?.name || row.customerId },
        { header: 'Type', cell: (row) => <StatusBadge status={String(row.type || '').toLowerCase()} /> },
        { header: 'Service', cell: (row) => row.serviceCode || '—' },
        { header: 'Amount', cell: (row) => row.amount },
        { header: 'Balance after', cell: (row) => row.balanceAfter },
      ]} /></div>
    </HrmNotice>
  </div>;
}
