'use client';

import * as React from 'react';
import { AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/common/Textarea';
import { Separator } from '@/components/ui/separator';

const UI_ONLY_NOTICE =
  'UI preview only — live provider testing is not connected to the backend yet.';

export function IntegrationTestPanel({ type, onRunTest, testing, lastResult }) {
  const [mobile, setMobile] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [subject, setSubject] = React.useState('QB Suite — SMTP test');
  const [templateName, setTemplateName] = React.useState('');
  const [templateLang, setTemplateLang] = React.useState('en');

  const handleTest = (mode) => {
    const payload =
      type === 'sms'
        ? { mobile, message, mode }
        : type === 'whatsapp'
          ? { mobile, message, templateName, templateLang, mode }
          : { email, subject, message, mode };
    onRunTest?.(payload);
  };

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
      <div className="flex gap-2 rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-[11px] text-amber-900">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        <p>{UI_ONLY_NOTICE}</p>
      </div>

      {type === 'sms' && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Test mobile number</Label>
            <Input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="+91 98765 43210" className="h-9 text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Test message</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className="text-xs" placeholder="QB Suite test SMS" />
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="text-xs"
            disabled={testing}
            onClick={() => handleTest('sms')}
          >
            Send Test SMS
          </Button>
        </div>
      )}

      {type === 'whatsapp' && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Test recipient mobile number</Label>
            <Input value={mobile} onChange={(e) => setMobile(e.target.value)} className="h-9 text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Test message</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className="text-xs" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Template name (optional)</Label>
              <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} className="h-9 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Template language (optional)</Label>
              <Input value={templateLang} onChange={(e) => setTemplateLang(e.target.value)} className="h-9 text-xs" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" className="text-xs" disabled={testing} onClick={() => handleTest('connection')}>
              Test Connection
            </Button>
            <Button type="button" size="sm" className="bg-brand text-primary-foreground text-xs hover:bg-primary-hover" disabled={testing} onClick={() => handleTest('message')}>
              Send Test Message
            </Button>
          </div>
        </div>
      )}

      {type === 'email' && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Recipient email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-9 text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="h-9 text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Test message</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className="text-xs" />
          </div>
          <Button type="button" size="sm" variant="outline" className="text-xs" disabled={testing} onClick={() => handleTest('email')}>
            Send Test Email
          </Button>
        </div>
      )}

      {lastResult ? (
        <>
          <Separator />
          <div className="space-y-2 text-xs text-slate-700">
            <p className="flex items-center gap-1.5 font-semibold text-slate-900">
              <AlertCircle className="size-3.5 text-amber-600" aria-hidden />
              Test result
            </p>
            <p>
              <span className="font-medium">Status:</span> {lastResult.status}
            </p>
            {lastResult.httpCode != null ? (
              <p>
                <span className="font-medium">HTTP:</span> {lastResult.httpCode}
              </p>
            ) : null}
            <p>
              <span className="font-medium">Message:</span> {lastResult.message}
            </p>
            {lastResult.timestamp ? (
              <p className="text-[11px] text-slate-500">
                {new Date(lastResult.timestamp).toLocaleString()}
              </p>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
