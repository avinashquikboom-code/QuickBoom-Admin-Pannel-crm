"use client";
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { mockLeads } from '@/lib/mock-data';
const initialSorting = [{ id: 'createdAt', desc: true }];
const columns = [
  { header: 'Lead Name', accessorKey: 'name', cell: (lead) => <div><p className="font-semibold">{lead.name}</p><p className="text-xs text-muted-foreground">{lead.company}</p></div> },
  { header: 'Source', accessorKey: 'source' },
  { header: 'Status', accessorKey: 'status', cell: (lead) => <StatusBadge status={lead.status} showIcon={false} /> },
  { header: 'Assigned To', accessorKey: 'assignedTo' },
  { header: 'Created On', accessorKey: 'createdAt', cell: (lead) => new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(lead.createdAt)) },
];
export function RecentLeadsTable() {
  return <Card><CardHeader><div className="flex flex-wrap items-center justify-between gap-2"><div><CardTitle>Recent Leads</CardTitle><CardDescription>Latest leads captured across all channels</CardDescription></div><Link href="/admin/crm/leads"><Button variant="outline" size="sm">View all leads</Button></Link></div></CardHeader>
    <CardContent><DataTable label="Recent leads" columns={columns} data={mockLeads} initialSorting={initialSorting} pageSize={5} emptyState="No leads match your search." /></CardContent></Card>;
}
