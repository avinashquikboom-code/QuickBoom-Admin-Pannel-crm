'use client';

import * as React from 'react';
import { Plug, AlertTriangle, CircleOff, Layers } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { KpiGrid } from '@/components/common/KpiCard';
import { IntegrationGrid, IntegrationConfigDrawer } from '@/components/integrations';
import {
  INTEGRATION_PROVIDERS,
  INTEGRATION_STATUS,
  createEmptyIntegrationValues,
  getIntegrationProvider,
  isIntegrationConfigured,
} from '@/config/integrations';
import { toast } from 'sonner';

function buildInitialStates() {
  /** @type {Record<string, { status: string, values: Record<string, unknown>, lastTestedAt: string | null, lastTestResult: object | null }>} */
  const map = {};
  for (const p of INTEGRATION_PROVIDERS) {
    map[p.id] = {
      status: INTEGRATION_STATUS.NOT_CONFIGURED,
      values: createEmptyIntegrationValues(p),
      lastTestedAt: null,
      lastTestResult: null,
    };
  }
  return map;
}

function uiOnlyTestResult() {
  return {
    status: 'Pending backend',
    httpCode: null,
    message:
      'UI preview only — connection was not verified. A successful server-side test is required before status can show Connected.',
    timestamp: new Date().toISOString(),
  };
}

export default function IntegrationsSettingsPage() {
  const [states, setStates] = React.useState(buildInitialStates);
  const [activeId, setActiveId] = React.useState(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const summary = React.useMemo(() => {
    const list = Object.values(states);
    let configured = 0;
    let notConfigured = 0;
    let issues = 0;
    let connected = 0;
    for (const s of list) {
      if (s.status === INTEGRATION_STATUS.CONNECTED) connected += 1;
      else if (s.status === INTEGRATION_STATUS.CONNECTION_FAILED) issues += 1;
      else if (s.status === INTEGRATION_STATUS.CONFIGURED) configured += 1;
      else notConfigured += 1;
    }
    return {
      total: INTEGRATION_PROVIDERS.length,
      connected,
      configured,
      notConfigured,
      issues,
    };
  }, [states]);

  const activeProvider = activeId ? getIntegrationProvider(activeId) : null;

  const openConfigure = (id) => {
    setActiveId(id);
    setDrawerOpen(true);
  };

  const updateState = (id, patch) => {
    setStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }));
  };

  const handleSave = (id, values) => {
    const provider = getIntegrationProvider(id);
    if (!provider) return;
    const configured = isIntegrationConfigured(provider, values);
    updateState(id, {
      values,
      status: configured ? INTEGRATION_STATUS.CONFIGURED : INTEGRATION_STATUS.NOT_CONFIGURED,
    });
  };

  const handleDisconnect = (id) => {
    const provider = getIntegrationProvider(id);
    if (!provider) return;
    updateState(id, {
      values: createEmptyIntegrationValues(provider),
      status: INTEGRATION_STATUS.NOT_CONFIGURED,
      lastTestedAt: null,
      lastTestResult: null,
    });
    toast.message('Integration disconnected (session state cleared).');
  };

  const handleTestConnection = (id) => {
    const provider = getIntegrationProvider(id);
    if (!provider) return;
    const current = states[id];
    if (!isIntegrationConfigured(provider, current.values)) {
      toast.error('Save required fields before testing.');
      return;
    }
    updateState(id, { status: INTEGRATION_STATUS.TESTING });
    window.setTimeout(() => {
      const result = uiOnlyTestResult();
      updateState(id, {
        status: INTEGRATION_STATUS.CONFIGURED,
        lastTestedAt: result.timestamp,
        lastTestResult: result,
      });
      toast.info(result.message);
    }, 600);
  };

  const handleTestPayload = (id, _payload) => {
    const provider = getIntegrationProvider(id);
    if (!provider) return;
    const result = uiOnlyTestResult();
    updateState(id, {
      lastTestedAt: result.timestamp,
      lastTestResult: result,
    });
    toast.info('Test action recorded in UI only — no SMS, email, or WhatsApp message was sent.');
  };

  const kpis = [
    { title: 'Total Integrations', value: summary.total, icon: Layers, description: 'Available providers' },
    { title: 'Connected', value: summary.connected, icon: Plug, description: 'Requires verified backend test' },
    { title: 'Not Configured', value: summary.notConfigured, icon: CircleOff },
    {
      title: 'Connection Issues',
      value: summary.issues,
      icon: AlertTriangle,
      iconColor: 'text-rose-600',
      iconBg: 'bg-rose-50 border-rose-100',
    },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="Integrations"
        description="Manage API credentials, configure external services and monitor your connected platforms from one place."
        category="SETTINGS"
        badge={`${summary.configured} configured`}
        badgeVariant="green"
      />

      <KpiGrid cards={kpis} />

      <IntegrationGrid
        providers={INTEGRATION_PROVIDERS}
        states={states}
        onConfigure={openConfigure}
        onTest={handleTestConnection}
      />

      <IntegrationConfigDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        provider={activeProvider}
        state={activeId ? states[activeId] : null}
        onSave={handleSave}
        onDisconnect={handleDisconnect}
        onTestConnection={handleTestConnection}
        onTestPayload={handleTestPayload}
      />
    </div>
  );
}
