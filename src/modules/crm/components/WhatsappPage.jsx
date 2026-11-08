'use client';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import * as React from 'react';
import { faCheckDouble, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { toast } from 'sonner';
export default function WhatsAppPage() {
    const [recipient, setRecipient] = React.useState('+1 (555) 234-5678');
    const [template, setTemplate] = React.useState('proposal_reminder');
    const [customMsg, setCustomMsg] = React.useState('Hi Sarah, this is Alexander from QB Suite. Your enterprise proposal is ready for review. Would tomorrow 2 PM EST work for a 15-minute walkthrough?');
    const [logs, setLogs] = React.useState([
        {
            id: 'WA-901',
            to: '+1 (555) 234-5678',
            name: 'Sarah Jenkins',
            template: 'Proposal Follow-up',
            status: 'Read',
            time: '10:45 AM',
        },
        {
            id: 'WA-902',
            to: '+1 (555) 890-1234',
            name: 'Michael Chang',
            template: 'Contract Renewal Notice',
            status: 'Delivered',
            time: '09:20 AM',
        },
        {
            id: 'WA-903',
            to: '+1 (555) 345-6789',
            name: 'Alexander Vance',
            template: 'Demo Confirmation',
            status: 'Read',
            time: 'Yesterday',
        },
    ]);
    const handleSend = (e) => {
        e.preventDefault();
        if (!recipient || !customMsg) {
            toast.error('Recipient and message required.');
            return;
        }
        const newLog = {
            id: `WA-${1000 + logs.length + 1}`,
            to: recipient,
            name: 'Active Lead',
            template: 'Custom Outreach',
            status: 'Delivered',
            time: 'Just now',
        };
        setLogs([newLog, ...logs]);
        toast.success(`WhatsApp message dispatched to ${recipient}`);
    };
    return (<div className="space-y-6">
      <PageHeader title="WhatsApp Business API Gateway" description="Official Meta Cloud API pipeline for conversational sales and customer support automation." badge="WhatsApp" badgeVariant="green" actions={<Badge className="bg-brand-light text-brand-dark border-none gap-1.5 py-1 px-3">
            <span className="size-2 rounded-full bg-brand animate-pulse"/>
            <span>Webhook: Connected</span>
          </Badge>}/>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-slate-200/80 shadow-2xs">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-xs font-medium text-slate-500">Messages Sent Today</CardTitle>
            <div className="text-2xl font-bold text-slate-900 mt-1">482</div>
          </CardHeader>
        </Card>
        <Card className="border-slate-200/80 shadow-2xs">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-xs font-medium text-slate-500">Delivery Rate</CardTitle>
            <div className="text-2xl font-bold text-brand mt-1">99.4%</div>
          </CardHeader>
        </Card>
        <Card className="border-slate-200/80 shadow-2xs">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-xs font-medium text-slate-500">Read Rate</CardTitle>
            <div className="text-2xl font-bold text-brand-dark mt-1">87.2%</div>
          </CardHeader>
        </Card>
        <Card className="border-slate-200/80 shadow-2xs">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-xs font-medium text-slate-500">API Tier</CardTitle>
            <div className="text-2xl font-bold text-slate-900 mt-1">Tier 2 (10k/day)</div>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Outbound Messaging Console */}
        <Card className="lg:col-span-1 border-slate-200/80 shadow-2xs">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FontAwesomeIcon icon={faWhatsapp} className="size-5 text-brand"/>
              <span>Outreach Simulator</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Dispatch pre-approved Meta WhatsApp templates to prospects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSend} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Phone Number (E.164)</label>
                <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} className="h-8 text-xs"/>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Message Content</label>
                <Textarea rows={4} value={customMsg} onChange={(e) => setCustomMsg(e.target.value)} className="text-xs resize-none"/>
              </div>

              <Button type="submit" size="sm" className="w-full bg-brand hover:bg-primary-hover text-primary-foreground gap-2">
                <FontAwesomeIcon icon={faPaperPlane} className="size-4"/>
                <span>Send via WhatsApp API</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Message Logs */}
        <Card className="lg:col-span-2 border-slate-200/80 shadow-2xs">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900">
              Live Delivery Stream
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Real-time delivery receipts and customer interaction timestamps
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {logs.map((log) => (<div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-brand-light text-brand">
                      <FontAwesomeIcon icon={faWhatsapp} className="size-4"/>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-xs">{log.name}</div>
                      <div className="text-[11px] text-slate-400">{log.to} • {log.template}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-[10px] bg-brand-light text-brand-dark border-brand-light gap-1">
                      <FontAwesomeIcon icon={faCheckDouble} className="size-3"/>
                      <span>{log.status}</span>
                    </Badge>
                    <span className="text-[11px] text-slate-400">{log.time}</span>
                  </div>
                </div>))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>);
}
