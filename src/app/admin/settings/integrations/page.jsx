'use client';

import * as React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  disconnectIntegration,
  loadIntegrations,
  saveIntegration,
  setIntegrationEnabled,
  suiteError,
  testIntegration,
  loadIntegrationModels,
} from '@/modules/suite/suite-api';
import { toast } from '@/hooks/use-toast';
import { IntegrationsKpiGrid } from '@/components/integrations/IntegrationsKpiGrid';
import { IntegrationCard } from '@/components/integrations/IntegrationCard';
import { IntegrationConfigDrawer } from '@/components/integrations/IntegrationConfigDrawer';
import { GoogleMapsIntegrationModal } from '@/components/integrations/GoogleMapsIntegrationModal';
import {
  RotateCw,
  Plus,
  Search,
  Sparkles,
  CreditCard,
  MapPin,
  MessageSquare,
  HardDrive,
  Mail,
  Filter,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
} from 'lucide-react';

const PRESENTATION = {
  OPENAI: {
    name: 'OpenAI',
    category: 'AI Providers',
    categoryKey: 'AI',
    description: 'GPT-4o, reasoning models and multimodal intelligence for generative workflows.',
  },
  GEMINI: {
    name: 'Google Gemini',
    category: 'AI Providers',
    categoryKey: 'AI',
    description: 'Google Gemini 2.0 Flash & Pro multimodal models for real-time CRM intelligence.',
  },
  ANTHROPIC: {
    name: 'Claude AI',
    category: 'AI Providers',
    categoryKey: 'AI',
    description: 'Advanced AI models for business intelligence, content generation, data analysis and intelligent automation.',
  },
  RAZORPAY: {
    name: 'Razorpay',
    category: 'Payments',
    categoryKey: 'PAYMENTS',
    description: 'Accept online customer payments, subscription billing, and automated webhooks.',
  },
  GOOGLE_MAPS: {
    name: 'Google Maps',
    category: 'Maps & Location',
    categoryKey: 'MAPS',
    description: 'Geocoding, location lookup, distance calculation and places data capture.',
  },
  WHATSAPP: {
    name: 'WhatsApp Business',
    category: 'Messaging',
    categoryKey: 'MESSAGING',
    description: 'Meta WhatsApp Business API for automated notifications, proposals and alerts.',
  },
  MSG91: {
    name: 'MSG91',
    category: 'Messaging',
    categoryKey: 'MESSAGING',
    description: 'Transactional SMS, multi-channel messaging and OTP delivery services.',
  },
  FIREBASE: {
    name: 'Firebase',
    category: 'Messaging',
    categoryKey: 'MESSAGING',
    description: 'Firebase Cloud Messaging (FCM) for real-time mobile push notifications.',
  },
  AWS: {
    name: 'AWS S3',
    category: 'Storage',
    categoryKey: 'STORAGE',
    description: 'Amazon S3 cloud storage for proposal documents, PDFs, and captured photos.',
  },
  SMTP: {
    name: 'SMTP Email',
    category: 'Email',
    categoryKey: 'EMAIL',
    description: 'Transactional and outgoing system emails, salary slips, and proposal dispatch.',
  },
};

const CATEGORIES = [
  { key: 'ALL', label: 'All', icon: Layers },
  { key: 'AI Providers', label: 'AI Providers', icon: Sparkles },
  { key: 'Payments', label: 'Payments', icon: CreditCard },
  { key: 'Maps & Location', label: 'Maps', icon: MapPin },
  { key: 'Messaging', label: 'Messaging', icon: MessageSquare },
  { key: 'Storage', label: 'Storage', icon: HardDrive },
  { key: 'Email', label: 'Email', icon: Mail },
];

const FIELDS = {
  AWS: [
    { key: 'accessKeyId', label: 'Access Key ID', required: true },
    { key: 'secretAccessKey', label: 'Secret Access Key', secret: true, required: true },
    { key: 'region', label: 'Region', required: true, placeholder: 'ap-south-1' },
    { key: 'bucket', label: 'Bucket Name', required: true },
    { key: 'customDomain', label: 'Custom Domain (CloudFront)' },
  ],
  MSG91: [
    { key: 'authKey', label: 'Authentication Key', secret: true, required: true },
    { key: 'senderId', label: 'Sender ID' },
    { key: 'templateId', label: 'Template ID' },
    { key: 'otpExpiry', label: 'OTP Expiry (seconds)', type: 'number', group: 'config' },
  ],
  GOOGLE_MAPS: [
    { key: 'apiKey', label: 'Google Maps API Key', secret: true, required: true },
  ],
  WHATSAPP: [
    { key: 'accessToken', label: 'Access Token', secret: true, required: true },
    { key: 'phoneNumberId', label: 'Phone Number ID', required: true },
    { key: 'businessAccountId', label: 'Business Account ID', required: true },
    { key: 'appId', label: 'Meta App ID' },
    { key: 'verifyToken', label: 'Webhook Verify Token', secret: true },
    { key: 'apiVersion', label: 'API Version', placeholder: 'v21.0' },
  ],
  SMTP: [
    { key: 'host', label: 'SMTP Host', group: 'config', required: true, placeholder: 'smtp.gmail.com' },
    { key: 'port', label: 'Port', type: 'number', group: 'config', required: true, placeholder: '587' },
    { key: 'security', label: 'Encryption', type: 'select', group: 'config', options: ['TLS', 'SSL', 'NONE'], required: true },
    { key: 'username', label: 'Username', required: true },
    { key: 'password', label: 'Password', secret: true, required: true },
    { key: 'fromEmail', label: 'From Email', group: 'config', required: true },
    { key: 'fromName', label: 'From Name', group: 'config' },
  ],
  GEMINI: [
    { key: 'apiKey', label: 'API Key', secret: true, required: true },
    {
      key: 'model',
      label: 'Model Selection',
      group: 'config',
      type: 'select',
      options: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
      defaultValue: 'gemini-2.0-flash',
    },
  ],
  OPENAI: [
    { key: 'apiKey', label: 'API Key', secret: true, required: true },
    {
      key: 'imageModel',
      label: 'Model Selection',
      type: 'select',
      options: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
      defaultValue: 'gpt-4o-mini',
    },
  ],
  ANTHROPIC: [
    { key: 'integrationName', label: 'Integration Name', group: 'config', placeholder: 'Claude AI' },
    { key: 'apiKey', label: 'API Key', secret: true, required: true },
    {
      key: 'model',
      label: 'Model Selection',
      group: 'config',
      type: 'select',
      options: ['claude-sonnet-5', 'claude-opus-5', 'claude-haiku-4-5-20251001'],
      defaultValue: 'claude-sonnet-5',
    },
    { key: 'maxTokens', label: 'Maximum Output Tokens', group: 'config', type: 'number', placeholder: '1024' },
    { key: 'temperature', label: 'Temperature (supported models only)', group: 'config', type: 'number', placeholder: '1', min: 0, max: 1, step: 0.1 },
  ],
  FIREBASE: [
    { key: 'projectId', label: 'Project ID', required: true },
    { key: 'clientEmail', label: 'Client Email', required: true },
    { key: 'privateKey', label: 'Private Key', secret: true, required: true },
    { key: 'messagingSenderId', label: 'Messaging Sender ID' },
  ],
  RAZORPAY: [
    { key: 'environment', label: 'Environment', group: 'environment', type: 'select', options: ['TEST', 'LIVE'], required: true },
    { key: 'keyId', label: 'Key ID', required: true },
    { key: 'keySecret', label: 'Key Secret', secret: true, required: true },
    { key: 'webhookSecret', label: 'Webhook Secret', secret: true },
  ],
};

export default function IntegrationsPage() {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [activeCategory, setActiveCategory] = React.useState('ALL');
  const [activeStatus, setActiveStatus] = React.useState('ALL');
  const [tests, setTests] = React.useState({});
  const [testing, setTesting] = React.useState('');
  const [activeRow, setActiveRow] = React.useState(null);
  const [refresh, setRefresh] = React.useState(0);
  const [saving, setSaving] = React.useState(false);
  const [lastSync, setLastSync] = React.useState(null);
  const [mapsApiKey, setMapsApiKey] = React.useState('');
  const [mapsModalOpen, setMapsModalOpen] = React.useState(false);
  const [addDialogOpen, setAddDialogOpen] = React.useState(false);
  const [claudeModels, setClaudeModels] = React.useState([]);
  const [claudeModelsLoading, setClaudeModelsLoading] = React.useState(false);

  // Load integrations from backend
  React.useEffect(() => {
    let alive = true;
    if (refresh > 0) setRefreshing(true);
    else setLoading(true);

    loadIntegrations()
      .then((items) => {
        if (!alive) return;
        const normalized = Array.isArray(items) ? items : [];
        setRows(normalized);
        setError('');
        setLastSync(new Date());
      })
      .catch((err) => {
        if (!alive) return;
        setError(suiteError(err));
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
        setRefreshing(false);
      });

    return () => {
      alive = false;
    };
  }, [refresh]);

  React.useEffect(() => {
    if (activeRow?.provider !== 'ANTHROPIC' || !activeRow.configured) return;
    let alive = true;
    setClaudeModelsLoading(true);
    loadIntegrationModels('ANTHROPIC')
      .then((response) => { if (alive) setClaudeModels(Array.isArray(response) ? response : response?.data || []); })
      .catch(() => { if (alive) setClaudeModels([]); })
      .finally(() => { if (alive) setClaudeModelsLoading(false); });
    return () => { alive = false; };
  }, [activeRow]);

  // Merge runtime status
  const normalizedRows = rows.map((row) => ({
    ...row,
    displayName: PRESENTATION[row.provider]?.name || row.displayName || row.provider,
    category: PRESENTATION[row.provider]?.category || row.category || 'Other',
    description: PRESENTATION[row.provider]?.description || `Connect ${row.displayName || row.provider} with QB Suite.`,
    status: calculateStatus(row, tests[row.provider]),
  }));
  const activeFields = React.useMemo(() => {
    const configuredFields = activeRow ? FIELDS[activeRow.provider] || activeRow.fields || [] : [];
    if (activeRow?.provider !== 'ANTHROPIC' || !claudeModels.length) return configuredFields;
    return configuredFields.map((field) => field.key === 'model' ? { ...field, options: claudeModels.map((item) => ({ value: item.id, label: item.name && item.name !== item.id ? `${item.name} (${item.id})` : item.id })) } : field);
  }, [activeRow?.provider, activeRow?.fields, claudeModels]);

  // Filtering
  const filteredRows = normalizedRows.filter((row) => {
    const q = query.trim().toLowerCase();
    const nameMatches =
      !q ||
      row.displayName.toLowerCase().includes(q) ||
      String(row.provider).toLowerCase().includes(q) ||
      row.category.toLowerCase().includes(q);

    const categoryMatches =
      activeCategory === 'ALL' ||
      row.category === activeCategory ||
      (activeCategory === 'Maps & Location' && row.category.includes('Maps'));

    const statusMatches =
      activeStatus === 'ALL' ||
      row.status === activeStatus ||
      (activeStatus === 'ERROR' && row.status === 'ERROR');

    return nameMatches && categoryMatches && statusMatches;
  });

  // Calculate KPIs
  const counts = {
    total: normalizedRows.length,
    connected: normalizedRows.filter((r) => r.status === 'CONNECTED').length,
    missing: normalizedRows.filter((r) => r.status === 'NOT_CONFIGURED').length,
    issues: normalizedRows.filter((r) => r.status === 'ERROR').length,
  };

  // Category counts
  const categoryCounts = React.useMemo(() => {
    const map = { ALL: normalizedRows.length };
    for (const cat of CATEGORIES) {
      if (cat.key === 'ALL') continue;
      map[cat.key] = normalizedRows.filter(
        (r) => r.category === cat.key || (cat.key === 'Maps & Location' && r.category.includes('Maps'))
      ).length;
    }
    return map;
  }, [normalizedRows]);

  // AI Providers split
  const aiRows = filteredRows.filter((r) => r.category === 'AI Providers');
  const otherRows = filteredRows.filter((r) => r.category !== 'AI Providers');

  // Grouped remaining categories
  const otherCategories = ['Payments', 'Maps & Location', 'Messaging', 'Storage', 'Email'];
  const groupedOther = otherCategories
    .map((cat) => ({
      name: cat,
      rows: otherRows.filter((r) => r.category === cat),
    }))
    .filter((g) => g.rows.length > 0);

  // Open drawer / modal
  const handleOpenConfig = (row) => {
    if (row.provider === 'GOOGLE_MAPS') {
      setMapsApiKey('');
      setActiveRow(row);
      setMapsModalOpen(true);
      return;
    }
    setActiveRow(row);
  };

  // Save configuration
  const handleSaveConfig = async (row, payload) => {
    if (saving) return;
    setSaving(true);
    try {
      // Test first for validation
      const testRes = await testIntegration(row.provider, payload);
      const body =
        testRes?.data && typeof testRes.data === 'object' && !Array.isArray(testRes.data)
          ? testRes.data
          : testRes;
      const ok = body?.success !== false && !/fail|error/i.test(String(body?.status || ''));

      if (!ok) {
        toast.error(body?.message || 'Connection test failed. The integration was not saved.');
        setRefresh((v) => v + 1);
        return;
      }

      await saveIntegration(row.provider, { ...payload, isEnabled: payload.isEnabled !== false });
      setActiveRow(null);
      setRefresh((v) => v + 1);
      toast.success(`${row.displayName || row.provider} saved and verified successfully!`);
    } catch (err) {
      toast.error(suiteError(err));
    } finally {
      setSaving(false);
    }
  };

  // Google Maps save
  const handleSaveGoogleMaps = async () => {
    if (!activeRow || activeRow.provider !== 'GOOGLE_MAPS') return;
    const trimmed = mapsApiKey.trim();
    if (!trimmed && !hasSavedKey(activeRow)) {
      toast.error('Enter a Google Maps API key to enable this integration.');
      return;
    }
    await handleSaveConfig(activeRow, {
      credentials: trimmed ? { apiKey: trimmed } : {},
      config: {},
    });
    setMapsModalOpen(false);
  };

  // Live Test
  const handleTestConnection = async (row, explicitPayload = null) => {
    if (testing) return;
    if (!explicitPayload && (!row.configured || row.source === 'NONE' || row.status === 'NOT_CONFIGURED')) {
      toast.error('Configure this integration with valid credentials before testing.');
      return;
    }

    setTesting(row.provider);
    try {
      const res = await testIntegration(row.provider, explicitPayload || {});
      const body = res?.data && typeof res.data === 'object' && !Array.isArray(res.data) ? res.data : res;
      const ok = body?.success !== false && !/fail|error/i.test(String(body?.status || ''));
      const at = formatTimestamp(body?.lastTestedAt) || new Date().toLocaleTimeString();

      if (!ok) {
        const msg = body?.message || 'Connection test failed';
        setTests((prev) => ({ ...prev, [row.provider]: { ok: false, message: msg, at } }));
        toast.error(msg);
        setRefresh((v) => v + 1);
        return;
      }

      const msg = body?.message || 'Connection verified successfully!';
      setTests((prev) => ({ ...prev, [row.provider]: { ok: true, message: msg, at } }));
      toast.success(msg);
      setRefresh((v) => v + 1);
    } catch (err) {
      const msg = suiteError(err);
      setTests((prev) => ({
        ...prev,
        [row.provider]: { ok: false, message: msg, at: new Date().toLocaleTimeString() },
      }));
      toast.error(msg);
    } finally {
      setTesting('');
    }
  };

  // Toggle active status
  const handleToggleStatus = async (row) => {
    if (row.isEnabled && !window.confirm(`Disable ${row.displayName}? AI and other requests using this provider will stop.`)) return;
    try {
      await setIntegrationEnabled(row.provider, !row.isEnabled);
      setRefresh((v) => v + 1);
      toast.success(`${row.displayName} ${row.isEnabled ? 'disabled' : 'enabled'}.`);
    } catch (err) {
      toast.error(suiteError(err));
    }
  };

  // Disconnect provider
  const handleDisconnect = async (row) => {
    if (
      !window.confirm(
        `Disconnect ${row.displayName}? Saved API keys and credentials for this service will be removed.`
      )
    ) {
      return;
    }
    try {
      await disconnectIntegration(row.provider);
      setRefresh((v) => v + 1);
      toast.success(`${row.displayName} disconnected.`);
      if (activeRow?.provider === row.provider) setActiveRow(null);
    } catch (err) {
      toast.error(suiteError(err));
    }
  };

  return (
    <div className="w-full min-w-0 space-y-6 overflow-x-hidden pb-12">
      {/* 1. Header */}
      <PageHeader
        title="Integrations"
        description="Manage and configure third-party services connected to QB Suite."
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRefresh((v) => v + 1)}
              disabled={loading || refreshing}
              className="h-9 px-3 text-xs font-semibold border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs"
            >
              <RotateCw className={`mr-1.5 size-3.5 ${refreshing || loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => setAddDialogOpen(true)}
              className="h-9 px-3.5 text-xs font-semibold bg-[#20C466] hover:bg-[#1bb05a] text-white shadow-2xs"
            >
              <Plus className="mr-1.5 size-4" />
              Add Integration
            </Button>
          </div>
        }
      />

      {/* Sync timestamp bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-[#718096]">
        <div className="flex items-center gap-2">
          <span className="inline-block size-2 rounded-full bg-[#20C466]" />
          <span>Real-time third-party provider status & monitoring</span>
        </div>
        <div>
          Last synchronized:{' '}
          <strong className="font-semibold text-[#172033]">
            {lastSync ? lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
          </strong>
        </div>
      </div>

      {/* 2. Animated KPI Overview */}
      <IntegrationsKpiGrid
        counts={counts}
        onFilterClick={(status) => setActiveStatus(status)}
      />

      {/* 3. Search and Category Filter Toolbar */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#718096]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search integrations by name or category..."
              className="h-10 pl-9 pr-8 text-xs rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-colors"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {[
              { id: 'ALL', label: 'All Status' },
              { id: 'CONNECTED', label: 'Connected' },
              { id: 'NOT_CONFIGURED', label: 'Not Configured' },
              { id: 'ERROR', label: 'Issues' },
              { id: 'DISABLED', label: 'Disabled' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setActiveStatus(st.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeStatus === st.id
                    ? 'bg-[#173D30] text-white shadow-2xs'
                    : 'bg-slate-100/70 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Horizontal Category Filter Pills with Counts */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100 pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const count = categoryCounts[cat.key] || 0;
            const isSelected = activeCategory === cat.key;

            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveCategory(cat.key)}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-[#EAF7EF] border-emerald-300 text-[#173D30] shadow-2xs ring-1 ring-emerald-400/40'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`size-3.5 ${isSelected ? 'text-[#20C466]' : 'text-slate-400'}`} />
                <span>{cat.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error state if load failed */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setRefresh((v) => v + 1)}
            className="h-8 text-xs border-rose-300 hover:bg-rose-100"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-64 rounded-2xl border border-slate-200 bg-white p-5 animate-pulse space-y-4"
            >
              <div className="flex justify-between items-start">
                <div className="size-12 rounded-xl bg-slate-100" />
                <div className="w-20 h-5 rounded-full bg-slate-100" />
              </div>
              <div className="w-32 h-4 rounded bg-slate-100" />
              <div className="w-full h-10 rounded bg-slate-100" />
              <div className="w-full h-9 rounded bg-slate-100 mt-6" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredRows.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center space-y-3">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-50 text-[#173D30]">
            <Filter className="size-5" />
          </div>
          <h3 className="text-sm font-bold text-[#172033]">No integrations found</h3>
          <p className="text-xs text-[#718096] max-w-sm mx-auto">
            No connected services match your current search &ldquo;{query}&rdquo; or selected filters.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setQuery('');
              setActiveCategory('ALL');
              setActiveStatus('ALL');
            }}
            className="text-xs font-semibold text-[#173D30]"
          >
            Clear all filters
          </Button>
        </div>
      )}

      {/* Content: Categorized View */}
      {!loading && !error && filteredRows.length > 0 && (
        <div className="space-y-8">
          {/* 4. AI Providers - Prominent Section */}
          {(activeCategory === 'ALL' || activeCategory === 'AI Providers') && aiRows.length > 0 && (
            <section className="space-y-3.5">
              <div className="flex items-center justify-between border-b border-emerald-100/80 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-100 text-[#173D30]">
                    <Sparkles className="size-4 text-[#20C466]" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#172033] flex items-center gap-2">
                      AI Providers
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF7EF] text-[#173D30] border border-emerald-200/60">
                        {aiRows.length} Platforms
                      </span>
                    </h2>
                  </div>
                </div>
                <p className="text-xs text-[#718096] hidden sm:block">
                  Generative intelligence, reasoning models & agent workflows
                </p>
              </div>

              {/* 3-Column AI Provider Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
                {aiRows.map((row) => (
                  <IntegrationCard
                    key={row.provider}
                    row={row}
                    label={row.displayName}
                    category={row.category}
                    description={row.description}
                    status={row.status}
                    isTesting={testing === row.provider}
                    testedAt={tests[row.provider]?.at || formatTimestamp(row.config?.lastTestedAt)}
                    errorMessage={
                      tests[row.provider]?.ok === false
                        ? tests[row.provider].message
                        : row.config?.lastTestError
                    }
                    successMessage={
                      tests[row.provider]?.ok === true ? tests[row.provider].message : null
                    }
                    onConfigure={handleOpenConfig}
                    onTest={handleTestConnection}
                    onToggleStatus={handleToggleStatus}
                    onDisconnect={handleDisconnect}
                    isFeaturedAi={true}
                  />
                ))}
              </div>
            </section>
          )}

          {/* 5. Other Categorized Sections */}
          {groupedOther.map((group) => (
            <section key={group.name} className="space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#172033]">{group.name}</h2>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                    {group.rows.length} {group.rows.length === 1 ? 'Service' : 'Services'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
                {group.rows.map((row) => (
                  <IntegrationCard
                    key={row.provider}
                    row={row}
                    label={row.displayName}
                    category={row.category}
                    description={row.description}
                    status={row.status}
                    isTesting={testing === row.provider}
                    testedAt={tests[row.provider]?.at || formatTimestamp(row.config?.lastTestedAt)}
                    errorMessage={
                      tests[row.provider]?.ok === false
                        ? tests[row.provider].message
                        : row.config?.lastTestError
                    }
                    successMessage={
                      tests[row.provider]?.ok === true ? tests[row.provider].message : null
                    }
                    onConfigure={handleOpenConfig}
                    onTest={handleTestConnection}
                    onToggleStatus={handleToggleStatus}
                    onDisconnect={handleDisconnect}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Configuration Drawer */}
      <IntegrationConfigDrawer
        open={Boolean(activeRow && activeRow.provider !== 'GOOGLE_MAPS')}
        onOpenChange={(next) => {
          if (!next && !saving) setActiveRow(null);
        }}
        row={activeRow}
        label={activeRow ? activeRow.displayName : ''}
        category={activeRow ? activeRow.category : ''}
        fields={activeFields}
        saving={saving}
        testing={testing}
        testResult={activeRow ? tests[activeRow.provider] : null}
        onSave={handleSaveConfig}
        onTest={handleTestConnection}
        onToggleStatus={handleToggleStatus}
        onDisconnect={handleDisconnect}
      />

      {/* Google Maps Modal */}
      <GoogleMapsIntegrationModal
        open={mapsModalOpen}
        onOpenChange={(next) => {
          if (!next && !saving) {
            setMapsModalOpen(false);
            setActiveRow(null);
            setMapsApiKey('');
          }
        }}
        apiKey={mapsApiKey}
        onApiKeyChange={setMapsApiKey}
        onSave={handleSaveGoogleMaps}
        saving={saving}
        hasSavedKey={activeRow ? hasSavedKey(activeRow) : false}
      />

      {/* Add Integration Information Dialog */}
      {addDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in-0 duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-[#20C466]">
                  <Plus className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172033]">Add Integration</h3>
                  <p className="text-xs text-[#718096]">QB Suite Connected Architecture</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAddDialogOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs leading-relaxed text-slate-700 space-y-2">
              <p>
                All <strong>10 official QB Suite integrations</strong> (AI Providers, Razorpay, Google Maps, WhatsApp, MSG91, Firebase, AWS S3, and SMTP) are already registered in your admin console.
              </p>
              <p>
                To enable a new service, locate its card on this page and click <strong>Configure</strong> to supply your API credentials.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                size="sm"
                onClick={() => setAddDialogOpen(false)}
                className="bg-[#173D30] hover:bg-[#205541] text-white text-xs px-4"
              >
                Got It
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function calculateStatus(row, runtimeTest) {
  if (!row.configured || row.source === 'NONE') return 'NOT_CONFIGURED';
  if (row.isEnabled === false) return 'DISABLED';
  if (runtimeTest && runtimeTest.ok === false) return 'ERROR';
  if (runtimeTest && runtimeTest.ok === true) return 'CONNECTED';
  if (row.config?.lastTestResult === 'FAILED') return 'ERROR';
  if (row.config?.lastTestResult === 'SUCCESS') return 'CONNECTED';
  return 'NOT_TESTED';
}

function formatTimestamp(value) {
  if (!value || value === '—') return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
}

function hasSavedKey(row) {
  return Boolean(row && (row.configured || row.source === 'DATABASE' || row.credentials?.apiKey));
}
