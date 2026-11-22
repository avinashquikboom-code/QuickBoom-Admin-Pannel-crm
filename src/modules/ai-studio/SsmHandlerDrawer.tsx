// @ts-nocheck
'use client';

import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Share2,
  User,
  Building2,
  Mail,
  Phone,
  Link as LinkIcon,
  Key,
  Calendar,
  Briefcase,
  AlertCircle,
  Eye,
  Pencil,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { createHandler, updateHandler, socialError } from '@/modules/social/social-api';

interface SsmHandlerDrawerProps {
  open: boolean;
  onClose: () => void;
  handler?: any | null;
  mode?: 'create' | 'edit' | 'view';
  onSuccess?: () => void;
}

const PLATFORMS = [
  { id: 'INSTAGRAM', name: 'Instagram' },
  { id: 'FACEBOOK', name: 'Facebook' },
  { id: 'YOUTUBE', name: 'YouTube' },
  { id: 'LINKEDIN', name: 'LinkedIn' },
  { id: 'TIKTOK', name: 'TikTok' },
  { id: 'TWITTER', name: 'Twitter / X' },
];

export function SsmHandlerDrawer({
  open,
  onClose,
  handler,
  mode = 'create',
  onSuccess,
}: SsmHandlerDrawerProps) {
  const [formMode, setFormMode] = React.useState<'create' | 'edit' | 'view'>(mode);
  const [loading, setLoading] = React.useState(false);

  const [form, setForm] = React.useState({
    platform: 'INSTAGRAM',
    accountName: '',
    accountUrl: '',
    socialMediaId: '',
    customerId: '',
    handlerName: '',
    handlerEmail: '',
    handlerPhone: '',
    workType: 'FULL_TIME',
    status: 'ACTIVE',
    password: '',
    notes: '',
  });

  React.useEffect(() => {
    setFormMode(mode);
    if (handler && (mode === 'edit' || mode === 'view')) {
      setForm({
        platform: handler.platform || 'INSTAGRAM',
        accountName: handler.accountName || '',
        accountUrl: handler.accountUrl || '',
        socialMediaId: handler.socialMediaId || '',
        customerId: handler.customerId ? String(handler.customerId) : '',
        handlerName: handler.handlerName || '',
        handlerEmail: handler.handlerEmail || '',
        handlerPhone: handler.handlerPhone || '',
        workType: handler.workType || 'FULL_TIME',
        status: handler.status || 'ACTIVE',
        password: '',
        notes: handler.notes || '',
      });
    } else {
      setForm({
        platform: 'INSTAGRAM',
        accountName: '',
        accountUrl: '',
        socialMediaId: '',
        customerId: '',
        handlerName: '',
        handlerEmail: '',
        handlerPhone: '',
        workType: 'FULL_TIME',
        status: 'ACTIVE',
        password: '',
        notes: '',
      });
    }
  }, [open, handler, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.accountName.trim()) {
      toast.error('Account Name is required');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        platform: form.platform,
        accountName: form.accountName.trim(),
        accountUrl: form.accountUrl.trim() || undefined,
        socialMediaId: form.socialMediaId.trim() || undefined,
        customerId: form.customerId ? Number(form.customerId) : undefined,
        handlerName: form.handlerName.trim() || undefined,
        handlerEmail: form.handlerEmail.trim() || undefined,
        handlerPhone: form.handlerPhone.trim() || undefined,
        workType: form.workType || undefined,
        status: form.status,
        notes: form.notes.trim() || undefined,
      };

      if (form.password && form.password.trim()) {
        payload.password = form.password.trim();
      }

      if (formMode === 'edit' && handler?.id) {
        await updateHandler(handler.id, payload);
        toast.success('Social media handler updated successfully');
      } else {
        await createHandler(payload);
        toast.success('Social media handler created successfully');
      }

      onClose();
      onSuccess?.();
    } catch (err: any) {
      toast.error(socialError(err) || 'Failed to save handler record');
    } finally {
      setLoading(false);
    }
  };

  const isView = formMode === 'view';

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-[520px] p-0 flex flex-col bg-white">
        <SheetHeader className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#20C466]">
              {formMode === 'create' ? 'NEW HANDLER ASSIGNMENT' : formMode === 'edit' ? 'EDIT ASSIGNMENT' : 'HANDLER DETAILS'}
            </span>
            {handler && (
              <Badge
                variant="outline"
                className={
                  form.status === 'ACTIVE'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-slate-100 text-slate-800'
                }
              >
                {form.status}
              </Badge>
            )}
          </div>
          <SheetTitle className="text-xl font-bold text-[#163A2E] mt-1">
            {formMode === 'create' ? 'Add Social Media Handler' : form.accountName || 'Handler Details'}
          </SheetTitle>
          <SheetDescription className="text-xs text-slate-500">
            {isView
              ? 'Inspecting access details and credentials stored securely on file.'
              : 'Configure social account identity, assigned staff, and platform access.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Platform & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-slate-700 font-semibold">Social Platform</Label>
              {isView ? (
                <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-800">
                  {form.platform}
                </div>
              ) : (
                <Select
                  value={form.platform}
                  onValueChange={(val) => setForm({ ...form, platform: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-700 font-semibold">Status</Label>
              {isView ? (
                <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-800">
                  {form.status}
                </div>
              ) : (
                <Select
                  value={form.status}
                  onValueChange={(val) => setForm({ ...form, status: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="PAUSED">Paused</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Account Identity */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="font-bold uppercase tracking-wider text-slate-400 text-[11px]">
              Account Identity
            </h4>

            <div className="space-y-1.5">
              <Label className="text-slate-700 font-semibold">
                Account Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Acme Corp Official"
                value={form.accountName}
                onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                required
                disabled={isView}
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-slate-700 font-semibold">Account URL</Label>
                <Input
                  placeholder="https://instagram.com/acme"
                  value={form.accountUrl}
                  onChange={(e) => setForm({ ...form, accountUrl: e.target.value })}
                  disabled={isView}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-700 font-semibold">Social Media ID / Handle</Label>
                <Input
                  placeholder="@acmecorp or ID"
                  value={form.socialMediaId}
                  onChange={(e) => setForm({ ...form, socialMediaId: e.target.value })}
                  disabled={isView}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-700 font-semibold">Customer ID</Label>
              <Input
                type="number"
                placeholder="Target customer ID (e.g. 1)"
                value={form.customerId}
                onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                disabled={isView}
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Handler Contact */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="font-bold uppercase tracking-wider text-slate-400 text-[11px]">
              Assigned Handler Details
            </h4>

            <div className="space-y-1.5">
              <Label className="text-slate-700 font-semibold">Handler Staff Name</Label>
              <Input
                placeholder="e.g. Priya Sharma"
                value={form.handlerName}
                onChange={(e) => setForm({ ...form, handlerName: e.target.value })}
                disabled={isView}
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-slate-700 font-semibold">Handler Email</Label>
                <Input
                  type="email"
                  placeholder="handler@agency.com"
                  value={form.handlerEmail}
                  onChange={(e) => setForm({ ...form, handlerEmail: e.target.value })}
                  disabled={isView}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-700 font-semibold">Handler Phone</Label>
                <Input
                  placeholder="+91 98765 43210"
                  value={form.handlerPhone}
                  onChange={(e) => setForm({ ...form, handlerPhone: e.target.value })}
                  disabled={isView}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-700 font-semibold">Work Type</Label>
              {isView ? (
                <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-800">
                  {form.workType}
                </div>
              ) : (
                <Select
                  value={form.workType}
                  onValueChange={(val) => setForm({ ...form, workType: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Work Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FULL_TIME">Full-time Staff</SelectItem>
                    <SelectItem value="PART_TIME">Part-time</SelectItem>
                    <SelectItem value="CONTRACT">Contractor</SelectItem>
                    <SelectItem value="FREELANCE">Freelance Specialist</SelectItem>
                    <SelectItem value="AGENCY">Agency Partner</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Credentials Security */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="font-bold uppercase tracking-wider text-slate-400 text-[11px] flex items-center justify-between">
              <span>Security & Credentials</span>
              <span className="text-[10px] text-emerald-700 font-semibold">
                Protected at Rest
              </span>
            </h4>

            {isView ? (
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Key className="size-4 text-emerald-600" />
                  <span className="font-semibold text-slate-800">
                    {handler?.passwordOnFile ? 'Encrypted Credential Stored' : 'No Secret Stored On File'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Plaintext credentials and OAuth tokens are never returned over administrative endpoints.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-slate-700 font-semibold">
                  {formMode === 'edit' ? 'Update Password / Token (leave blank to keep unchanged)' : 'Account Password / Access Secret'}
                </Label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="h-9 text-xs font-mono"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-slate-700 font-semibold">Internal Notes</Label>
              <Textarea
                placeholder="Access instructions, 2FA notes, or posting schedule notes..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                disabled={isView}
                rows={2}
                className="text-xs resize-none"
              />
            </div>
          </div>

          <SheetFooter className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2 -mx-6 -mb-6 mt-6">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              {isView ? 'Close' : 'Cancel'}
            </Button>
            {isView ? (
              <Button
                type="button"
                size="sm"
                onClick={() => setFormMode('edit')}
                className="bg-[#163A2E] hover:bg-[#163A2E]/90 text-white"
              >
                <Pencil className="size-3.5 mr-1" />
                Edit Handler
              </Button>
            ) : (
              <Button
                type="submit"
                size="sm"
                disabled={loading}
                className="bg-[#163A2E] hover:bg-[#163A2E]/90 text-white"
              >
                {loading ? 'Saving...' : formMode === 'edit' ? 'Save Changes' : 'Create Handler'}
              </Button>
            )}
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
