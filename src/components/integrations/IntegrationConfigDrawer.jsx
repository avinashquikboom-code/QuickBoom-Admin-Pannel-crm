'use client';

import * as React from 'react';
import { ProviderLogo } from './ProviderLogos';
import { IntegrationStatusBadge } from './IntegrationCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { Eye, EyeOff, RefreshCw, CheckCircle2, AlertCircle, Trash2, Power } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function IntegrationConfigDrawer({
  open,
  onOpenChange,
  row,
  label,
  category,
  fields = [],
  saving,
  testing,
  testResult,
  onSave,
  onTest,
  onToggleStatus,
  onDisconnect,
}) {
  const [form, setForm] = React.useState({});
  const [reveal, setReveal] = React.useState({});
  const [isEnabled, setIsEnabled] = React.useState(true);

  React.useEffect(() => {
    if (!row) return;
    setIsEnabled(row.isEnabled !== false);
    const initial = {};
    fields.forEach((field) => {
      if (field.secret) return;
      const source =
        field.group === 'config'
          ? row.config
          : field.group === 'environment'
          ? { environment: row.environment }
          : row.credentials;
      const value =
        field.group === 'environment' ? row.environment : source?.[field.key];
      if (typeof value === 'boolean') initial[field.key] = value;
      else if (value != null && typeof value !== 'object')
        initial[field.key] = String(value);
      else if (field.defaultValue !== undefined)
        initial[field.key] = String(field.defaultValue);
    });
    setForm(initial);
    setReveal({});
  }, [row, fields]);

  if (!row) return null;

  const handleFieldChange = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = (e) => {
    e?.preventDefault?.();
    const credentials = {};
    const config = {};
    let environment;

    fields.forEach((field) => {
      const val = form[field.key];
      if (typeof val === 'boolean') {
        if (field.group === 'config') config[field.key] = val;
        return;
      }
      if (val == null || String(val).trim() === '') return;
      if (field.group === 'environment') environment = String(val).trim();
      else if (field.group === 'config')
        config[field.key] = field.type === 'number' ? Number(val) : String(val).trim();
      else credentials[field.key] = String(val).trim();
    });

    onSave(row, { credentials, config, environment, isEnabled });
  };

  const handleTestInDrawer = () => {
    const credentials = {};
    const config = {};
    let environment;

    fields.forEach((field) => {
      const val = form[field.key];
      if (val == null || String(val).trim() === '') return;
      if (field.group === 'environment') environment = String(val).trim();
      else if (field.group === 'config')
        config[field.key] = field.type === 'number' ? Number(val) : String(val).trim();
      else credentials[field.key] = String(val).trim();
    });

    onTest(row, { credentials, config, environment });
  };

  return (
    <FormDrawer
      open={open}
      onOpenChange={(next) => {
        if (!saving) onOpenChange(next);
      }}
      title={
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-2xs">
            <ProviderLogo provider={row.provider} size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-[#172033]">{label}</span>
              <IntegrationStatusBadge status={row.status} />
            </div>
            <p className="text-xs text-[#718096]">{category} Configuration</p>
          </div>
        </div>
      }
      description="Manage API keys, environment settings, and credentials. Passwords & tokens are masked for your security."
      submitLabel="Save & Enable"
      loading={saving}
      disabled={saving}
      onSubmit={handleSave}
    >
      <div className="space-y-6">
        {/* Enable / Disable Status Banner */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-slate-50/70 p-3.5">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-[#172033]">Integration Active State</p>
            <p className="text-[11px] text-[#718096]">
              {isEnabled
                ? 'Active and receiving requests in QB Suite'
                : 'Disabled: API calls to this service are paused'}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isEnabled}
            onClick={() => setIsEnabled(!isEnabled)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              isEnabled ? 'bg-[#20C466]' : 'bg-slate-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                isEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Dynamic Fields */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#718096]">
            Credentials & Parameters
          </h4>

          {fields.map((field) => {
            const isSecret = Boolean(field.secret);
            const isRevealed = Boolean(reveal[field.key]);

            return (
              <div key={field.key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor={field.key} className="text-xs font-semibold text-[#172033]">
                    {field.label}
                    {field.required && <span className="text-rose-500 ml-0.5">*</span>}
                  </Label>
                  {isSecret && (
                    <span className="text-[10px] text-slate-400">
                      Encrypted at rest
                    </span>
                  )}
                </div>

                {field.type === 'boolean' ? (
                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      id={field.key}
                      checked={Boolean(form[field.key])}
                      onChange={(e) => handleFieldChange(field.key, e.target.checked)}
                      className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs text-slate-700">Enable {field.label}</span>
                  </label>
                ) : field.options ? (
                  <select
                    id={field.key}
                    value={form[field.key] || field.options[0]}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 shadow-2xs focus:border-emerald-500 focus:outline-hidden"
                  >
                    {field.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="relative flex items-center">
                    <Input
                      id={field.key}
                      type={isSecret && !isRevealed ? 'password' : field.type === 'number' ? 'number' : 'text'}
                      autoComplete="new-password"
                      value={form[field.key] || ''}
                      placeholder={
                        isSecret
                          ? '•••••••••••••••• (Leave blank to keep saved secret)'
                          : field.placeholder || `Enter ${field.label.toLowerCase()}`
                      }
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      className="pr-10 text-xs h-10 rounded-xl border-slate-200 bg-white"
                    />
                    {isSecret && (
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() =>
                          setReveal((prev) => ({ ...prev, [field.key]: !prev[field.key] }))
                        }
                        className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600"
                      >
                        {isRevealed ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {row.provider === 'WHATSAPP' && row.config?.webhookUrl && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1">
              <p className="text-xs font-semibold text-slate-700">Meta Webhook Callback URL</p>
              <p className="text-[11px] font-mono select-all text-slate-600 break-all">
                {row.config.webhookUrl}
              </p>
            </div>
          )}
        </div>

        {/* Live Test In Drawer */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#172033]">Live Connectivity Test</p>
              <p className="text-[11px] text-[#718096]">
                Verify supplied or existing credentials against the provider API
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={testing === row.provider}
              onClick={handleTestInDrawer}
              className="h-8 text-xs font-semibold bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
            >
              {testing === row.provider ? (
                <span className="inline-flex items-center gap-1.5">
                  <RefreshCw className="size-3 animate-spin" />
                  Testing...
                </span>
              ) : (
                'Test Now'
              )}
            </Button>
          </div>

          {testResult && (
            <div
              className={`flex items-start gap-2 rounded-lg p-2.5 text-xs ${
                testResult.ok
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              {testResult.ok ? (
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="size-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{testResult.message}</p>
                {testResult.at && (
                  <p className="text-[10px] opacity-80 mt-0.5">Tested at: {testResult.at}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Disconnect Option if configured */}
        {row.status !== 'NOT_CONFIGURED' && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Need to clear all credentials?
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onDisconnect(row)}
              className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
            >
              <Trash2 className="size-3.5 mr-1" />
              Disconnect Provider
            </Button>
          </div>
        )}
      </div>
    </FormDrawer>
  );
}
