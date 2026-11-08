'use client';

import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { FormDrawer } from '@/components/common/drawers';
import { DrawerFormField } from '@/components/common/drawers/DrawerFormField';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { IntegrationTestPanel } from './integration-test-panel';
import { INTEGRATION_ICONS } from './integration-icons';
import { INTEGRATION_STATUS } from '@/config/integrations';
import { toast } from 'sonner';

function SecretInput({ id, value, onChange, placeholder, disabled }) {
  const [show, setShow] = React.useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="h-9 pr-10 text-xs"
        autoComplete="off"
      />
      <button
        type="button"
        className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Hide value' : 'Show value'}
      >
        {show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
      </button>
    </div>
  );
}

function validateProvider(provider, values) {
  const errors = {};
  for (const field of provider.fields) {
    if (!field.required || field.type === 'switch') continue;
    const v = values[field.key];
    if (typeof v !== 'string' || !v.trim()) {
      errors[field.key] = `${field.label} is required.`;
    }
    if (field.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      errors[field.key] = 'Enter a valid email.';
    }
  }
  return errors;
}

export function IntegrationConfigDrawer({
  open,
  onOpenChange,
  provider,
  state,
  onSave,
  onDisconnect,
  onTestConnection,
  onTestPayload,
}) {
  const [draft, setDraft] = React.useState({});
  const [errors, setErrors] = React.useState({});
  const [dirty, setDirty] = React.useState(false);
  const [testing, setTesting] = React.useState(false);

  React.useEffect(() => {
    if (open && provider) {
      setDraft({ ...(state?.values ?? {}) });
      setErrors({});
      setDirty(false);
    }
  }, [open, provider, state?.values]);

  if (!provider) return null;

  const Icon = INTEGRATION_ICONS[provider.id] ?? INTEGRATION_ICONS.default;

  const handleClose = (next) => {
    if (!next && dirty) {
      const ok = window.confirm('You have unsaved changes. Discard them?');
      if (!ok) return;
    }
    onOpenChange(next);
  };

  const setField = (key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    const nextErrors = validateProvider(provider, draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error('Fix validation errors before saving.');
      return;
    }
    onSave(provider.id, { ...draft });
    setDirty(false);
    toast.success('Configuration saved (session only — not sent to server).');
  };

  const runTestConnection = async () => {
    setTesting(true);
    try {
      await onTestConnection?.(provider.id);
    } finally {
      setTesting(false);
    }
  };

  return (
    <FormDrawer
      open={open}
      onOpenChange={handleClose}
      title={provider.name}
      description={provider.description}
      size={provider.drawerSize === 'xl' ? 'xl' : provider.drawerSize === 'large' ? 'large' : 'standard'}
      onSubmit={handleSubmit}
      submitLabel="Save Configuration"
      loading={state?.status === INTEGRATION_STATUS.TESTING}
      footerExtra={
        <div className="flex w-full flex-wrap justify-between gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => {
              if (dirty && !window.confirm('Discard unsaved changes and disconnect?')) return;
              onDisconnect?.(provider.id);
              setDirty(false);
              onOpenChange(false);
            }}
          >
            Disconnect
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="text-xs"
            disabled={testing}
            onClick={runTestConnection}
          >
            Test Connection
          </Button>
        </div>
      }
    >
      <div className="mb-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5">
        <div className="flex size-10 items-center justify-center rounded-lg bg-brand-light text-brand">
          <Icon className="size-5" aria-hidden />
        </div>
        <p className="text-[11px] leading-snug text-slate-600">
          Credentials are held in memory for this session only. They are not stored in localStorage or sent to an API yet.
        </p>
      </div>

      {provider.fields.map((field) => (
        <DrawerFormField
          key={field.key}
          id={`int-${provider.id}-${field.key}`}
          label={field.label}
          required={field.required}
          error={errors[field.key]}
          hint={field.secret ? 'Value is masked after save.' : undefined}
        >
          {field.type === 'switch' ? (
            <div className="flex items-center gap-2">
              <Switch
                id={`int-${provider.id}-${field.key}`}
                checked={Boolean(draft[field.key])}
                onCheckedChange={(v) => setField(field.key, v)}
              />
              <span className="text-[11px] text-slate-500">{draft[field.key] ? 'Enabled' : 'Disabled'}</span>
            </div>
          ) : field.type === 'select' ? (
            <Select value={draft[field.key] ?? ''} onValueChange={(v) => setField(field.key, v)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                {(field.options || []).map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : field.secret || field.type === 'password' ? (
            <SecretInput
              id={`int-${provider.id}-${field.key}`}
              value={draft[field.key] ?? ''}
              onChange={(e) => setField(field.key, e.target.value)}
              placeholder={field.placeholder}
            />
          ) : (
            <Input
              id={`int-${provider.id}-${field.key}`}
              type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
              value={draft[field.key] ?? ''}
              onChange={(e) => setField(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="h-9 text-xs"
              min={field.min}
              max={field.max}
              step={field.step}
            />
          )}
        </DrawerFormField>
      ))}

      {provider.testPanel ? (
        <IntegrationTestPanel
          type={provider.testPanel}
          testing={testing}
          lastResult={state?.lastTestResult}
          onRunTest={(payload) => onTestPayload?.(provider.id, payload)}
        />
      ) : null}
    </FormDrawer>
  );
}
