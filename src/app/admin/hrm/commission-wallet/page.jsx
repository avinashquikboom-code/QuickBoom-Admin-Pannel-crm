'use client';

import * as React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { toast } from '@/hooks/use-toast';
import { decideWithdrawal, hrmError, loadCommissionWallet, saveCommissionSlab, sessionCan } from '@/modules/hrm/hrm-api';

const inr = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value) || 0);

export default function CommissionWalletPage() {
  const [dashboard, setDashboard] = React.useState({});
  const [employees, setEmployees] = React.useState([]);
  const [withdrawals, setWithdrawals] = React.useState([]);
  const [rules, setRules] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [canManage, setCanManage] = React.useState(false);
  const [slab, setSlab] = React.useState({ name: '', minAmount: '', maxAmount: '', ratePercent: '' });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await loadCommissionWallet();
      const summary = data.dashboard?.data && !data.dashboard.totalGenerated ? data.dashboard.data : data.dashboard;
      setDashboard(summary || {});
      setEmployees(data.employees);
      setWithdrawals(data.withdrawals);
      setRules(data.rules);
    } catch (error) {
      toast.error(hrmError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    setCanManage(sessionCan('COMMISSION'));
    load();
  }, [load]);

  async function act(row, action) {
    try {
      await decideWithdrawal(row.id, action, {});
      toast.success(`Withdrawal ${action}.`);
      load();
    } catch (error) {
      toast.error(hrmError(error));
    }
  }

  async function addSlab(event) {
    event.preventDefault();
    try {
      await saveCommissionSlab({
        name: slab.name,
        minAmount: Number(slab.minAmount),
        maxAmount: slab.maxAmount === '' ? null : Number(slab.maxAmount),
        ratePercent: Number(slab.ratePercent),
      });
      setSlab({ name: '', minAmount: '', maxAmount: '', ratePercent: '' });
      toast.success('Commission slab saved');
      load();
    } catch (error) {
      toast.error(hrmError(error));
    }
  }

  const cards = [
    ['Generated', dashboard.totalGenerated, true],
    ['Paid', dashboard.totalPaid, true],
    ['Pending withdrawals', dashboard.pendingWithdrawals, false],
    ['Liability', dashboard.availableLiability, true],
    ['Closed leads', dashboard.totalClosedLeads, false],
    ['Sales', dashboard.totalSalesValue, true],
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Commission Wallet" description="Balances use approved and paid commission records. Withdrawals reserve the available balance until they are paid or rejected." />
      <div className="grid gap-3 md:grid-cols-3">
        {cards.map(([label, value, money]) => (
          <div key={label} className="rounded-xl border bg-white p-4">
            <div className="text-sm text-slate-500">{label}</div>
            <div className="text-xl font-semibold">{loading ? '…' : money ? inr(value) : (value ?? 0)}</div>
          </div>
        ))}
      </div>
      <DataTable
        label="Employee wallets"
        data={employees}
        columns={[
          { header: 'Employee', cell: (row) => row.name || '—' },
          { header: 'ID', accessorKey: 'employeeCode' },
          { header: 'Department', accessorKey: 'department' },
          { header: 'Earned', cell: (row) => inr(row.totalEarned) },
          { header: 'Withdrawn', cell: (row) => inr(row.totalWithdrawn) },
          { header: 'Available', cell: (row) => inr(row.availableBalance) },
          { header: 'Pending', cell: (row) => inr(row.pendingWithdrawal) },
          { header: 'Status', accessorKey: 'walletStatus' },
        ]}
      />
      <DataTable
        label="Withdrawals"
        data={withdrawals}
        columns={[
          { header: 'Employee', cell: (row) => `${row.employee?.firstName || ''} ${row.employee?.lastName || ''}`.trim() || row.employeeId },
          { header: 'Amount', cell: (row) => inr(row.amount) },
          { header: 'Method', accessorKey: 'method' },
          { header: 'Account', accessorKey: 'accountRef' },
          { header: 'Status', accessorKey: 'status' },
        ]}
        rowActions={canManage ? [
          { label: 'Approve', onSelect: (row) => act(row, 'approve') },
          { label: 'Reject', onSelect: (row) => act(row, 'reject') },
          { label: 'Mark paid', onSelect: (row) => act(row, 'paid') },
        ] : []}
      />
      <section className="rounded-xl border bg-white p-4">
        <h2 className="text-sm font-semibold">Commission slabs</h2>
        <ul className="mt-3 space-y-1 text-sm">
          {rules.map((rule) => (
            <li key={rule.id}>{rule.name}: ₹{rule.minAmount} – {rule.maxAmount ?? 'above'} at {rule.ratePercent}%</li>
          ))}
          {!rules.length ? <li className="text-slate-500">No slabs yet. Existing designation and employee commission rates still apply.</li> : null}
        </ul>
        {canManage ? (
          <form className="mt-4 grid gap-2 md:grid-cols-5" onSubmit={addSlab}>
            <Input placeholder="Name" value={slab.name} onChange={(event) => setSlab({ ...slab, name: event.target.value })} required />
            <Input placeholder="Min" value={slab.minAmount} onChange={(event) => setSlab({ ...slab, minAmount: event.target.value })} required />
            <Input placeholder="Max" value={slab.maxAmount} onChange={(event) => setSlab({ ...slab, maxAmount: event.target.value })} />
            <Input placeholder="Rate %" value={slab.ratePercent} onChange={(event) => setSlab({ ...slab, ratePercent: event.target.value })} required />
            <Button type="submit">Add slab</Button>
          </form>
        ) : null}
      </section>
    </div>
  );
}
