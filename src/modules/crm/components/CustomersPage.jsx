'use client';
import { currencyFormatter } from "@/lib/currency";

import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { DataTable } from '@/components/common/DataTable';
import * as React from 'react';
import { faBuilding, faMagnifyingGlass, faPhone, faPlus } from '@fortawesome/free-solid-svg-icons';
import { faEnvelope } from '@fortawesome/free-regular-svg-icons';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { FormDrawer, DrawerFormField } from '@/components/common/drawers/FormDrawer';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/common/Drawer';
import { Label } from '@/components/common/Label';
import { mockContacts } from '@/modules/crm/services/mock-data';
import { toast } from 'sonner';
export default function CustomersPage() {
    const [contacts, setContacts] = React.useState(mockContacts);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [selectedContact, setSelectedContact] = React.useState(null);
    const [isAddOpen, setIsAddOpen] = React.useState(false);
    // New customer form state
    const [newName, setNewName] = React.useState('');
    const [newCompany, setNewCompany] = React.useState('');
    const [newRole, setNewRole] = React.useState('');
    const [newEmail, setNewEmail] = React.useState('');
    const [newPhone, setNewPhone] = React.useState('');
    const [newLocation, setNewLocation] = React.useState('');
    const currency = currencyFormatter;
    const filtered = contacts.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const totalRev = filtered.reduce((acc, c) => acc + c.totalRevenue, 0);
    const handleAddCustomer = (e) => {
        e.preventDefault();
        if (!newName || !newCompany || !newEmail) {
            toast.error('Please fill name, company and email.');
            return;
        }
        const newObj = {
            id: `CUST-${1000 + contacts.length + 1}`,
            name: newName,
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            company: newCompany,
            email: newEmail,
            phone: newPhone || '+1 (555) 123-4567',
            role: newRole || 'Head of Procurement',
            dealsCount: 1,
            totalRevenue: 25000,
            status: 'active',
            location: newLocation || 'San Francisco, CA',
            lastContacted: new Date().toISOString().split('T')[0],
        };
        setContacts([newObj, ...contacts]);
        setIsAddOpen(false);
        toast.success(`Customer ${newName} added successfully!`);
        setNewName('');
        setNewCompany('');
        setNewRole('');
        setNewEmail('');
        setNewPhone('');
        setNewLocation('');
    };
    return (<div className="space-y-6">
      <PageHeader title="Enterprise Customers & Accounts" description="Maintain client relationships, contract histories, and account portfolio values." badge="CRM" badgeVariant="green" actions={<Button size="sm" onClick={() => setIsAddOpen(true)} className="bg-brand hover:bg-primary-hover text-primary-foreground gap-1.5 shadow-sm text-xs">
            <FontAwesomeIcon icon={faPlus} className="size-4"/>
            <span>Add Customer</span>
          </Button>}/>

      {/* KPI summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200/80 shadow-2xs">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-xs font-medium text-slate-500">Active Accounts</CardTitle>
            <div className="text-2xl font-bold text-slate-900 mt-1">{filtered.length}</div>
          </CardHeader>
        </Card>
        <Card className="border-slate-200/80 shadow-2xs">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-xs font-medium text-slate-500">Lifetime Portfolio Revenue</CardTitle>
            <div className="text-2xl font-bold text-brand-dark mt-1">{currency.format(totalRev)}</div>
          </CardHeader>
        </Card>
        <Card className="border-slate-200/80 shadow-2xs">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-xs font-medium text-slate-500">Avg Deal Size</CardTitle>
            <div className="text-2xl font-bold text-brand mt-1">
              {currency.format(totalRev / (filtered.length || 1))}
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Search */}
      <Card className="border-slate-200/80 shadow-2xs">
        <CardContent className="p-4">
          <div className="relative w-full sm:w-80">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400"/>
            <Input placeholder="Filter by customer name, company, email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9 text-xs border-slate-200 bg-slate-50/50"/>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <DataTable data={filtered} columns={[
{ header: 'Contact', cell: (c) => <>
                    <div>{c.name}</div>
                    <div className="text-[11px] text-slate-400">{c.email}</div>
                  </> },
{ header: 'Organization', cell: (c) => <>
                    <div className="font-semibold text-slate-800">{c.company}</div>
                    <div className="text-[11px] text-slate-500">{c.role}</div>
                  </> },
{ header: 'Location', cell: (c) => <>{c.location}</> },
{ header: 'Closed Deals', cell: (c) => <>{c.dealsCount}</> },
{ header: 'Revenue', cell: (c) => <>{currency.format(c.totalRevenue)}</> },
{ header: 'Status', cell: (c) => <>
                    <StatusBadge status={c.status}/>
                  </> },
{ header: 'Actions', cell: (c) => <>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedContact(c)} className="h-8 text-brand hover:text-brand-dark hover:bg-brand-light text-xs font-semibold">
                      Dossier
                    </Button>
                  </>, className: 'text-right' }
]} />
        </div>
      </Card>

      {/* Customer Profile Drawer */}
      {selectedContact && (
        <Sheet open={!!selectedContact} onOpenChange={() => setSelectedContact(null)}>
          <SheetContent side="right" className="sm:max-w-[480px] w-full p-0 flex flex-col gap-0 bg-white border-l border-slate-200/90 shadow-2xl rounded-l-2xl overflow-hidden">
            <SheetHeader className="border-b border-slate-200/80 px-6 py-4.5 text-left">
              <SheetTitle className="text-base font-bold text-slate-900">Customer Profile</SheetTitle>
              <SheetDescription className="text-xs text-slate-500 mt-0.5">
                Enterprise relationship metrics for {selectedContact.company}
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg space-y-2 border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">{selectedContact.name}</span>
                  <StatusBadge status={selectedContact.status}/>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <FontAwesomeIcon icon={faBuilding} className="size-3.5 text-slate-400"/>
                  <span>{selectedContact.company} ({selectedContact.role})</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <FontAwesomeIcon icon={faEnvelope} className="size-3.5 text-slate-400"/>
                  <span>{selectedContact.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <FontAwesomeIcon icon={faPhone} className="size-3.5 text-slate-400"/>
                  <span>{selectedContact.phone}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Revenue</span>
                  <div className="text-base font-bold text-brand-dark">{currency.format(selectedContact.totalRevenue)}</div>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Last Contacted</span>
                  <div className="text-sm font-semibold text-slate-800">{selectedContact.lastContacted}</div>
                </div>
              </div>
            </div>

            <div className="shrink-0 flex items-center justify-end border-t border-slate-200/80 bg-slate-50/80 px-6 py-4">
              <Button variant="outline" size="sm" onClick={() => setSelectedContact(null)} className="h-9 px-4 text-xs font-medium text-slate-700">
                Close
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Add Customer FormDrawer */}
      <FormDrawer
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        title="Add Enterprise Customer"
        description="Register a new corporate buyer or long-term account."
        onSubmit={handleAddCustomer}
        submitLabel="Save Account"
        size="standard"
      >
        <div className="grid grid-cols-2 gap-3">
          <DrawerFormField label="Full Name" required>
            <Input required placeholder="e.g. Maria Santos" value={newName} onChange={(e) => setNewName(e.target.value)} className="h-9 text-xs"/>
          </DrawerFormField>
          <DrawerFormField label="Company" required>
            <Input required placeholder="e.g. Globex Corp" value={newCompany} onChange={(e) => setNewCompany(e.target.value)} className="h-9 text-xs"/>
          </DrawerFormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <DrawerFormField label="Job Title / Role">
            <Input placeholder="VP Operations" value={newRole} onChange={(e) => setNewRole(e.target.value)} className="h-9 text-xs"/>
          </DrawerFormField>
          <DrawerFormField label="Email" required>
            <Input type="email" required placeholder="maria@globex.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="h-9 text-xs"/>
          </DrawerFormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <DrawerFormField label="Phone">
            <Input placeholder="+1 (555) 000-0000" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="h-9 text-xs"/>
          </DrawerFormField>
          <DrawerFormField label="HQ Location">
            <Input placeholder="Chicago, IL" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} className="h-9 text-xs"/>
          </DrawerFormField>
        </div>
      </FormDrawer>
    </div>);
}
