'use client';
import { CURRENCY_SYMBOL, currencyFormatter } from "@/lib/currency";

import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import * as React from 'react';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { FormDrawer, DrawerFormField } from '@/components/common/drawers/FormDrawer';
import { Label } from '@/components/common/Label';
import { Input } from '@/components/common/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { toast } from 'sonner';
const mockCampaigns = [
    {
        id: 'CMP-101',
        name: 'Q4 Enterprise Cloud Modernization',
        channel: 'LinkedIn',
        budget: 8500,
        spent: 6200,
        leadsGenerated: 34,
        roi: '3.4x',
        status: 'active',
        startDate: '2026-10-01',
    },
    {
        id: 'CMP-102',
        name: 'HRM Suite Product Launch Broadcast',
        channel: 'Email',
        budget: 2500,
        spent: 2100,
        leadsGenerated: 58,
        roi: '4.8x',
        status: 'active',
        startDate: '2026-10-15',
    },
    {
        id: 'CMP-103',
        name: 'Automated WhatsApp Re-engagement',
        channel: 'WhatsApp',
        budget: 1500,
        spent: 980,
        leadsGenerated: 42,
        roi: '5.2x',
        status: 'active',
        startDate: '2026-10-20',
    },
    {
        id: 'CMP-104',
        name: 'SMB Retargeting Showcase',
        channel: 'Meta',
        budget: 4000,
        spent: 4000,
        leadsGenerated: 29,
        roi: '2.8x',
        status: 'completed',
        startDate: '2026-09-01',
    },
];
export default function CampaignsPage() {
    const [campaigns, setCampaigns] = React.useState(mockCampaigns);
    const [isAddOpen, setIsAddOpen] = React.useState(false);
    const [name, setName] = React.useState('');
    const [channel, setChannel] = React.useState('Email');
    const [budget, setBudget] = React.useState('');
    const currency = currencyFormatter;
    const handleCreate = (e) => {
        e.preventDefault();
        if (!name || !budget) {
            toast.error('Please enter campaign title and budget.');
            return;
        }
        const c = {
            id: `CMP-${100 + campaigns.length + 1}`,
            name,
            channel,
            budget: parseFloat(budget),
            spent: 0,
            leadsGenerated: 0,
            roi: 'Pending',
            status: 'active',
            startDate: new Date().toISOString().split('T')[0],
        };
        setCampaigns([c, ...campaigns]);
        setIsAddOpen(false);
        setName('');
        setBudget('');
        toast.success('Campaign scheduled and broadcast ready!');
    };
    return (<div className="space-y-6">
      <PageHeader title="Marketing & Ad Campaigns" description="Multi-channel acquisition pipelines across LinkedIn, Email and Meta networks." badge="CRM" badgeVariant="green" actions={<Button size="sm" onClick={() => setIsAddOpen(true)} className="bg-brand hover:bg-primary-hover text-primary-foreground gap-1.5 shadow-sm text-xs">
            <FontAwesomeIcon icon={faPlus} className="size-4"/>
            <span>Launch Campaign</span>
          </Button>}/>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-slate-200/80 shadow-2xs">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-xs font-medium text-slate-500">Active Campaigns</CardTitle>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {campaigns.filter((c) => c.status === 'active').length}
            </div>
          </CardHeader>
        </Card>
        <Card className="border-slate-200/80 shadow-2xs">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-xs font-medium text-slate-500">Total Budget</CardTitle>
            <div className="text-2xl font-bold text-brand-dark mt-1">
              {currency.format(campaigns.reduce((a, c) => a + c.budget, 0))}
            </div>
          </CardHeader>
        </Card>
        <Card className="border-slate-200/80 shadow-2xs">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-xs font-medium text-slate-500">Leads Attributed</CardTitle>
            <div className="text-2xl font-bold text-brand mt-1">
              {campaigns.reduce((a, c) => a + c.leadsGenerated, 0)}
            </div>
          </CardHeader>
        </Card>
        <Card className="border-slate-200/80 shadow-2xs">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-xs font-medium text-slate-500">Avg Channel ROI</CardTitle>
            <div className="text-2xl font-bold text-sky-600 mt-1">4.1x</div>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {campaigns.map((c) => (<Card key={c.id} className="border-slate-200/80 shadow-2xs hover:border-brand-light transition-all">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-700 font-semibold">
                  {c.channel}
                </Badge>
                <Badge className={c.status === 'active'
                ? 'bg-brand-light text-brand-dark border-none'
                : 'bg-slate-100 text-slate-700 border-none'}>
                  {c.status.toUpperCase()}
                </Badge>
              </div>
              <CardTitle className="text-base font-bold text-slate-900 mt-2">{c.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50/80 rounded-lg text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold">BUDGET</span>
                  <div className="font-bold text-slate-800">{currency.format(c.budget)}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold">LEADS</span>
                  <div className="font-bold text-brand-dark">{c.leadsGenerated}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold">EST. ROI</span>
                  <div className="font-bold text-brand-dark">{c.roi}</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Started: {c.startDate}</span>
                <span className="font-medium text-slate-700">Spent: {currency.format(c.spent)}</span>
              </div>
            </CardContent>
          </Card>))}
      </div>

      {/* Launch Campaign FormDrawer */}
      <FormDrawer
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        title="Launch Growth Campaign"
        description="Setup ad spends and attribution channels for new lead generation."
        onSubmit={handleCreate}
        submitLabel="Activate Campaign"
        size="standard"
      >
        <DrawerFormField label="Campaign Name" required>
          <Input required placeholder="e.g. Q1 Healthcare Inbound" value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-xs"/>
        </DrawerFormField>

        <div className="grid grid-cols-2 gap-3">
          <DrawerFormField label="Attribution Channel">
            <Select value={channel} onValueChange={(val) => setChannel(val || 'Email')}>
              <SelectTrigger className="h-9 text-xs w-full">
                <SelectValue placeholder="Channel"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LinkedIn">LinkedIn Ads</SelectItem>
                <SelectItem value="Email">Email Sequence</SelectItem>
                <SelectItem value="WhatsApp">WhatsApp Broadcast</SelectItem>
                <SelectItem value="Meta">Meta Network</SelectItem>
              </SelectContent>
            </Select>
          </DrawerFormField>

          <DrawerFormField label={`Allocated Budget (${CURRENCY_SYMBOL})`} required>
            <Input type="number" required placeholder="5000" value={budget} onChange={(e) => setBudget(e.target.value)} className="h-9 text-xs"/>
          </DrawerFormField>
        </div>
      </FormDrawer>
    </div>);
}
