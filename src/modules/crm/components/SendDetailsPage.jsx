'use client';

import * as React from 'react';
import {
  FileText,
  Upload,
  Eye,
  RotateCcw,
  Sliders,
  Send,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  Layers,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Trash2,
  Edit,
  Check,
  X,
  Building,
  Mail,
  Phone,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { faEnvelope, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { toast } from '@/hooks/use-toast';
import {
  loadSendDetailsDocuments,
  updateSendDetailsDocument,
  uploadSendDetailsFile,
  loadSendDetailsConfig,
  updateSendDetailsConfig,
  loadSendDetailsHistory,
  retrySendDetails,
  crmError,
} from '../crm-api';
import { cn } from '@/lib/utils';

export const isDocUploaded = (doc) =>
  doc?.isUploaded === true ||
  doc?.uploadStatus === 'UPLOADED' ||
  Boolean(
    String(doc?.fileUrl || '').trim() &&
      !/storage\.qbapp\.online\/documents\//i.test(String(doc.fileUrl))
  );

export const CATEGORY_LABELS = {
  COMPANY_PROFILE: 'Company Profile (PDF)',
  SERVICE_CATALOGUE: 'Service / Product Catalogue',
  PRICING_QUOTATION: 'Pricing / Quotation',
  PACKAGES_PLANS: 'Packages and Plans',
  PORTFOLIO_PROJECTS: 'Portfolio / Previous Projects',
};

export const CATEGORY_DESCRIPTIONS = {
  COMPANY_PROFILE: 'Official company overview, credentials, mission, and leadership deck.',
  SERVICE_CATALOGUE: 'Full service menu, specifications, and client delivery scope.',
  PRICING_QUOTATION: 'Standard commercial pricing, engagement models, and rate cards.',
  PACKAGES_PLANS: 'Subscription packages, monthly retainer options, and service bundles.',
  PORTFOLIO_PROJECTS: 'Case studies, verified past results, client references, and work samples.',
};

function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return '—';
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function SendDetailsPage() {
  const [loading, setLoading] = React.useState(true);
  const [documents, setDocuments] = React.useState([]);
  const [config, setConfig] = React.useState({
    isAutomationEnabled: true,
    whatsappEnabled: true,
    emailEnabled: true,
    whatsappTemplateName: 'lead_stage_details_sent',
    emailSubject: 'Company Details & Service Information',
    emailBody: '',
  });
  const [history, setHistory] = React.useState([]);
  const [savingConfig, setSavingConfig] = React.useState(false);
  const [uploadingDocId, setUploadingDocId] = React.useState(null);
  const [retryingId, setRetryingId] = React.useState(null);
  const [expandedId, setExpandedId] = React.useState(null);
  const [editingDoc, setEditingDoc] = React.useState(null);
  const [pendingRemoveDoc, setPendingRemoveDoc] = React.useState(null);

  // Filters for delivery history
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [channelFilter, setChannelFilter] = React.useState('');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const fileInputRef = React.useRef(null);
  const [activeUploadDocId, setActiveUploadDocId] = React.useState(null);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [docsData, configData, historyData] = await Promise.all([
        loadSendDetailsDocuments().catch(() => []),
        loadSendDetailsConfig().catch(() => null),
        loadSendDetailsHistory().catch(() => []),
      ]);

      if (Array.isArray(docsData)) setDocuments(docsData);
      if (configData) setConfig(configData);
      if (Array.isArray(historyData)) setHistory(historyData);
    } catch (err) {
      toast.error('Failed to load Send Details automation data');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Save Automation Config
  const handleSaveConfig = async () => {
    try {
      setSavingConfig(true);
      await updateSendDetailsConfig(config);
      toast.success('Send Details automation settings saved successfully');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update configuration');
    } finally {
      setSavingConfig(false);
    }
  };

  // Toggle Single Document Active Status
  const handleToggleDoc = async (doc) => {
    try {
      const nextActive = !doc.isActive;
      const updated = await updateSendDetailsDocument(doc.id, { isActive: nextActive });
      setDocuments((prev) => prev.map((d) => (d.id === doc.id ? updated : d)));
      toast.success(`"${doc.title}" is now ${nextActive ? 'Active' : 'Inactive'}`);
    } catch (err) {
      toast.error('Failed to update document status');
    }
  };

  // Trigger PDF File Selection
  const triggerFileUpload = (docId) => {
    setActiveUploadDocId(docId);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // Handle PDF Upload
  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadDocId) return;

    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Only PDF documents are allowed.');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      toast.error('File size exceeds the 25MB attachment limit.');
      return;
    }

    try {
      setUploadingDocId(activeUploadDocId);
      toast.info(`Uploading ${file.name}...`);
      const uploadResult = await uploadSendDetailsFile(file);

      await updateSendDetailsDocument(activeUploadDocId, {
        fileUrl: uploadResult.fileUrl,
        fileName: uploadResult.fileName,
        fileSize: uploadResult.fileSize,
        fileType: uploadResult.fileType || 'application/pdf',
      });

      const refreshed = await loadSendDetailsDocuments();
      if (Array.isArray(refreshed)) setDocuments(refreshed);
      toast.success('Company document uploaded successfully');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Document upload failed');
    } finally {
      setUploadingDocId(null);
      setActiveUploadDocId(null);
    }
  };

  // Save Edit Document Form
  const handleSaveDocModal = async (e) => {
    e.preventDefault();
    if (!editingDoc) return;
    try {
      const updated = await updateSendDetailsDocument(editingDoc.id, {
        title: editingDoc.title,
        description: editingDoc.description,
        fileUrl: editingDoc.fileUrl,
        version: editingDoc.version,
      });
      setDocuments((prev) => prev.map((d) => (d.id === editingDoc.id ? updated : d)));
      setEditingDoc(null);
      toast.success('Document details updated successfully');
    } catch (err) {
      toast.error('Failed to update document');
    }
  };

  // Preview PDF
  const handlePreview = (doc) => {
    const url = doc?.previewUrl || doc?.fileUrl;
    if (!isDocUploaded(doc) || !url) {
      toast.error('Upload a PDF first to enable preview.');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Remove File Confirmation
  const handleConfirmRemoveFile = async () => {
    if (!pendingRemoveDoc) return;
    const doc = pendingRemoveDoc;
    setPendingRemoveDoc(null);
    try {
      await updateSendDetailsDocument(doc.id, {
        fileUrl: '',
        fileName: '',
        fileSize: 0,
        fileType: 'application/pdf',
      });
      const refreshed = await loadSendDetailsDocuments();
      if (Array.isArray(refreshed)) setDocuments(refreshed);
      toast.success(`Removed uploaded PDF for "${doc.title}"`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to remove document file');
    }
  };

  // Retry Delivery
  const handleRetry = async (deliveryId) => {
    try {
      setRetryingId(deliveryId);
      const result = await retrySendDetails(deliveryId, { channel: 'ALL' });
      const status = result?.overallStatus || result?.data?.overallStatus;
      if (status === 'FAILED') {
        toast.error(
          result?.whatsappError ||
            result?.emailError ||
            result?.data?.whatsappError ||
            result?.data?.emailError ||
            'Delivery retry failed'
        );
      } else {
        toast.success(
          status === 'COMPLETED' || status === 'SENT'
            ? 'Delivery completed successfully'
            : 'Retry attempt completed'
        );
      }
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Retry failed');
    } finally {
      setRetryingId(null);
    }
  };

  // KPI Calculations from actual backend data
  const totalSends = history.length;
  const automatedSends = history.filter((h) => h.triggerType === 'AUTOMATIC').length;
  const successfulSends = history.filter(
    (h) => h.overallStatus === 'SENT' || h.overallStatus === 'COMPLETED'
  ).length;
  const successRate =
    totalSends > 0 ? Math.round((successfulSends / totalSends) * 100) : 100;
  const activeDocsCount = documents.filter((d) => d.isActive).length;
  const uploadedDocsCount = documents.filter((d) => isDocUploaded(d)).length;

  // Filter Delivery History
  const filteredHistory = React.useMemo(() => {
    return history.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchLead = String(item.leadId || '').includes(q);
        const matchPhone = String(item.recipientPhone || '').toLowerCase().includes(q);
        const matchEmail = String(item.recipientEmail || '').toLowerCase().includes(q);
        if (!matchLead && !matchPhone && !matchEmail) return false;
      }
      if (statusFilter) {
        if (
          statusFilter === 'SUCCESS' &&
          item.overallStatus !== 'SENT' &&
          item.overallStatus !== 'COMPLETED'
        )
          return false;
        if (statusFilter === 'FAILED' && item.overallStatus !== 'FAILED') return false;
        if (
          statusFilter === 'PARTIAL' &&
          item.overallStatus !== 'PARTIAL' &&
          item.overallStatus !== 'PARTIALLY_COMPLETED'
        )
          return false;
      }
      if (channelFilter) {
        if (
          channelFilter === 'WHATSAPP' &&
          !item.channels?.includes('WHATSAPP') &&
          !item.whatsappStatus
        )
          return false;
        if (
          channelFilter === 'EMAIL' &&
          !item.channels?.includes('EMAIL') &&
          !item.emailStatus
        )
          return false;
      }
      if (dateFrom) {
        const itemDate = new Date(item.createdAt).toISOString().slice(0, 10);
        if (itemDate < dateFrom) return false;
      }
      if (dateTo) {
        const itemDate = new Date(item.createdAt).toISOString().slice(0, 10);
        if (itemDate > dateTo) return false;
      }
      return true;
    });
  }, [history, searchQuery, statusFilter, channelFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / itemsPerPage));
  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 pb-28 w-full min-w-0">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        className="hidden"
        accept="application/pdf,.pdf"
      />

      {/* 1. Header with Breadcrumbs, Title, Subtitle & Refresh Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>CRM</span>
            <span>/</span>
            <span className="font-semibold text-[#173D30]">Send Details Automation</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-[#173D30] tracking-tight">
              Send Details Automation & Documents
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-[#173D30] border border-emerald-200">
              <span
                className={cn(
                  'size-1.5 rounded-full',
                  config.isAutomationEnabled ? 'bg-[#20C466]' : 'bg-slate-400'
                )}
              />
              {config.isAutomationEnabled ? 'Automation Active' : 'Automation Paused'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated company document delivery through WhatsApp and Email triggered whenever leads transition to the &ldquo;Details Sent&rdquo; stage.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={loadData}
            variant="outline"
            size="sm"
            disabled={loading}
            className="h-9 gap-1.5 rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#173D30] shadow-2xs"
          >
            <RotateCcw className={cn('size-3.5 text-slate-500', loading && 'animate-spin')} />
            <span>Refresh</span>
          </Button>

          <Button
            onClick={handleSaveConfig}
            disabled={savingConfig}
            size="sm"
            className="h-9 gap-1.5 rounded-xl bg-[#173D30] hover:bg-[#123026] text-white text-xs font-semibold shadow-xs"
          >
            <Check className="size-4 text-[#20C466]" />
            <span>{savingConfig ? 'Saving...' : 'Save Settings'}</span>
          </Button>
        </div>
      </div>

      {/* 2. Four Summary Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Automation Status */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">Automation Status</span>
            <div
              className={cn(
                'size-8 rounded-xl flex items-center justify-center border',
                config.isAutomationEnabled
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              )}
            >
              <Sliders className="size-4 text-[#20C466]" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-[#173D30] tracking-tight">
              {config.isAutomationEnabled ? 'Active' : 'Paused'}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              WhatsApp: {config.whatsappEnabled ? 'On' : 'Off'} · Email:{' '}
              {config.emailEnabled ? 'On' : 'Off'}
            </p>
          </div>
          <div
            className={cn(
              'absolute top-0 left-0 right-0 h-1',
              config.isAutomationEnabled ? 'bg-[#20C466]' : 'bg-slate-300'
            )}
          />
        </div>

        {/* Card 2: Active Documents */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">Active Documents</span>
            <div className="size-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
              <FileText className="size-4 text-blue-600" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {activeDocsCount}{' '}
              <span className="text-sm font-semibold text-slate-400">/ {documents.length}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {uploadedDocsCount} of {documents.length} uploaded to storage
            </p>
          </div>
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
        </div>

        {/* Card 3: Automated Sends */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">Automated Sends</span>
            <div className="size-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200">
              <Send className="size-4 text-purple-600" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {totalSends}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {automatedSends} triggered via pipeline transitions
            </p>
          </div>
          <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500" />
        </div>

        {/* Card 4: Success Rate */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">Delivery Success Rate</span>
            <div className="size-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200">
              <CheckCircle2 className="size-4 text-[#16A34A]" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-[#16A34A] tracking-tight">
              {successRate}%
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {successfulSends} of {totalSends} delivered successfully
            </p>
          </div>
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#16A34A]" />
        </div>
      </div>

      {/* 3. Automation Workflow Configuration (WhatsApp & Email Cards) */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-[#173D30] border border-emerald-200">
              <Sliders className="size-5 text-[#20C466]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Automation Workflow Configuration
              </h2>
              <p className="text-xs text-slate-500">
                When a lead transitions to <strong className="text-slate-800">Details Sent</strong>, the CRM automatically delivers the active documents below.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-700">Automatic Send Details:</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.isAutomationEnabled}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, isAutomationEnabled: e.target.checked }))
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#173D30]" />
            </label>
            <span
              className={cn(
                'text-xs font-bold',
                config.isAutomationEnabled ? 'text-[#16A34A]' : 'text-slate-400'
              )}
            >
              {config.isAutomationEnabled ? 'ENABLED' : 'PAUSED'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* WhatsApp Automation Card */}
          <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center">
                  <FontAwesomeIcon icon={faWhatsapp} className="size-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-slate-900">WhatsApp Automation</h3>
                  <span className="text-[10px] text-slate-500">Interactive Document Messaging</span>
                </div>
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={config.whatsappEnabled}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, whatsappEnabled: e.target.checked }))
                  }
                  className="size-4 rounded border-slate-300 text-[#173D30] focus:ring-[#20C466]"
                />
                <span
                  className={cn(
                    'text-[11px]',
                    config.whatsappEnabled ? 'text-emerald-700 font-bold' : 'text-slate-400'
                  )}
                >
                  {config.whatsappEnabled ? 'Active' : 'Disabled'}
                </span>
              </label>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Meta Template Name</Label>
              <Input
                value={config.whatsappTemplateName || ''}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, whatsappTemplateName: e.target.value }))
                }
                placeholder="e.g. lead_stage_details_sent"
                className="h-9 text-xs bg-white"
              />
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Delivers approved WhatsApp template with direct download links to the lead mobile number upon stage transition.
            </p>
          </div>

          {/* Email Automation Card */}
          <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-lg bg-blue-100/70 text-blue-700 flex items-center justify-center">
                  <FontAwesomeIcon icon={faEnvelope} className="size-3.5" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-slate-900">Email Automation</h3>
                  <span className="text-[10px] text-slate-500">SMTP PDF Attachment Package</span>
                </div>
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={config.emailEnabled}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, emailEnabled: e.target.checked }))
                  }
                  className="size-4 rounded border-slate-300 text-[#173D30] focus:ring-[#20C466]"
                />
                <span
                  className={cn(
                    'text-[11px]',
                    config.emailEnabled ? 'text-blue-700 font-bold' : 'text-slate-400'
                  )}
                >
                  {config.emailEnabled ? 'Active' : 'Disabled'}
                </span>
              </label>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Email Subject Line</Label>
              <Input
                value={config.emailSubject || ''}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, emailSubject: e.target.value }))
                }
                placeholder="Company Details & Service Information"
                className="h-9 text-xs bg-white"
              />
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Dispatches branded HTML email with all active PDF documents attached directly to lead email address.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Company Documents (Five Document Cards) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="size-4 text-[#20C466]" />
              Company Documents (5 Required Assets)
            </h2>
            <p className="text-xs text-slate-500">
              Upload each PDF once. All active documents are bundled into the automated multi-channel delivery package.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 font-semibold text-emerald-800 border border-emerald-200">
              <span className="size-1.5 rounded-full bg-[#20C466]" />
              {activeDocsCount} of {documents.length} Active
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 font-semibold text-slate-700 border border-slate-200">
              {uploadedDocsCount} of {documents.length} Uploaded
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {documents.map((doc) => {
            const uploaded = isDocUploaded(doc);
            const isUploading = uploadingDocId === doc.id;

            return (
              <div
                key={doc.id || doc.category}
                className={cn(
                  'rounded-2xl border bg-white p-4 shadow-2xs flex flex-col justify-between transition-all relative overflow-hidden',
                  !doc.isActive && 'opacity-65 bg-slate-50/60 border-slate-200',
                  doc.isActive && uploaded && 'border-slate-200/90 hover:border-emerald-300',
                  doc.isActive && !uploaded && 'border-amber-200 bg-amber-50/20'
                )}
              >
                {/* Top Category Tag & Active Switch */}
                <div>
                  <div className="flex items-start justify-between gap-1.5 mb-2">
                    <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 uppercase tracking-tight truncate max-w-[150px]">
                      {CATEGORY_LABELS[doc.category] || doc.category}
                    </span>
                    <label className="flex cursor-pointer items-center gap-1 text-[11px] font-semibold shrink-0">
                      <input
                        type="checkbox"
                        checked={doc.isActive}
                        onChange={() => handleToggleDoc(doc)}
                        className="size-3.5 rounded border-slate-300 text-[#173D30] focus:ring-[#20C466]"
                      />
                      <span className={doc.isActive ? 'text-[#173D30]' : 'text-slate-400'}>
                        {doc.isActive ? 'Active' : 'Off'}
                      </span>
                    </label>
                  </div>

                  <h3 className="font-bold text-xs text-slate-900 line-clamp-1" title={doc.title}>
                    {doc.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {doc.description || CATEGORY_DESCRIPTIONS[doc.category] || 'Document asset'}
                  </p>
                </div>

                {/* Metadata & Status Card */}
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold',
                        uploaded
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      )}
                    >
                      <span
                        className={cn(
                          'size-1.5 rounded-full',
                          uploaded ? 'bg-emerald-500' : 'bg-amber-500'
                        )}
                      />
                      {uploaded ? 'Uploaded' : 'Missing PDF'}
                    </span>

                    <span className="text-[10px] font-mono text-slate-400">
                      v{doc.version || '1.0'}
                    </span>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-2 text-[10px] space-y-0.5 text-slate-600 border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">File:</span>
                      <span
                        className="font-medium text-slate-800 truncate max-w-[110px]"
                        title={doc.fileName || 'Not uploaded'}
                      >
                        {uploaded ? doc.fileName || 'document.pdf' : 'Not uploaded'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Size:</span>
                      <span className="text-slate-700">
                        {uploaded ? formatFileSize(doc.fileSize) : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Document Actions */}
                  <div className="flex items-center gap-1 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isUploading}
                      onClick={() => triggerFileUpload(doc.id)}
                      className="flex-1 h-7 text-[11px] gap-1 px-2 border-slate-200 text-slate-700 hover:text-[#173D30] hover:bg-slate-50"
                    >
                      <Upload className="size-3" />
                      <span>{isUploading ? 'Uploading...' : uploaded ? 'Replace' : 'Upload'}</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!uploaded}
                      onClick={() => handlePreview(doc)}
                      className="h-7 px-2 text-[11px] gap-1 border-slate-200 text-slate-700 hover:text-[#173D30]"
                      title="Preview PDF"
                    >
                      <Eye className="size-3" />
                      <span className="hidden sm:inline">Preview</span>
                    </Button>

                    <button
                      type="button"
                      onClick={() => setEditingDoc({ ...doc })}
                      className="size-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
                      title="Edit Document Info"
                    >
                      <Edit className="size-3" />
                    </button>

                    {uploaded && (
                      <button
                        type="button"
                        onClick={() => setPendingRemoveDoc(doc)}
                        className="size-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
                        title="Remove uploaded file"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Delivery History & Status Logs */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Send className="size-4 text-[#20C466]" />
              Delivery History & Status Logs
            </h2>
            <p className="text-xs text-slate-500">
              Auditable records of all automated and manual Send Details dispatches across WhatsApp and Email channels.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              className="h-8 gap-1.5 rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#173D30]"
            >
              <RotateCcw className="size-3 text-slate-500" />
              <span>Sync Status</span>
            </Button>
          </div>
        </div>

        {/* Filters bar */}
        <div className="p-3.5 bg-slate-50/50 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by Lead ID or contact..."
              className="pl-8 h-8 text-xs rounded-lg border-slate-200 bg-white"
            />
          </div>

          <div>
            <select
              aria-label="Filter by delivery status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#173D30]"
            >
              <option value="">All statuses</option>
              <option value="SUCCESS">Completed / Sent</option>
              <option value="PARTIAL">Partial</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          <div>
            <select
              aria-label="Filter by channel"
              value={channelFilter}
              onChange={(e) => {
                setChannelFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#173D30]"
            >
              <option value="">All channels</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="EMAIL">Email</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <Input
              type="date"
              aria-label="From Date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setCurrentPage(1);
              }}
              className="h-8 text-xs rounded-lg border-slate-200 bg-white flex-1"
            />
            <span className="text-slate-400">to</span>
            <Input
              type="date"
              aria-label="To Date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setCurrentPage(1);
              }}
              className="h-8 text-xs rounded-lg border-slate-200 bg-white flex-1"
            />
          </div>
        </div>

        {/* History Table */}
        {paginatedHistory.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <Send className="size-8 text-slate-300 mx-auto" />
            <h3 className="font-semibold text-slate-800">No delivery logs found</h3>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Stage transitions to &ldquo;Details Sent&rdquo; or manual dispatches will be recorded here automatically.
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto min-w-0">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-600">
                  <th className="py-3 px-3.5 min-w-[150px]">Lead / Recipient</th>
                  <th className="py-3 px-3 min-w-[110px]">Trigger</th>
                  <th className="py-3 px-3 min-w-[130px]">WhatsApp</th>
                  <th className="py-3 px-3 min-w-[130px]">Email</th>
                  <th className="py-3 px-3 min-w-[100px]">Overall Status</th>
                  <th className="py-3 px-3 min-w-[100px]">Documents</th>
                  <th className="py-3 px-3 min-w-[130px]">Sent At</th>
                  <th className="py-3 px-3 text-right min-w-[110px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedHistory.map((record) => {
                  const isExpanded = expandedId === record.id;
                  const isRetrying = retryingId === record.id;
                  const canRetry =
                    record.whatsappStatus === 'FAILED' ||
                    record.emailStatus === 'FAILED' ||
                    record.overallStatus === 'PARTIAL' ||
                    record.overallStatus === 'PARTIALLY_COMPLETED' ||
                    record.overallStatus === 'FAILED';

                  return (
                    <React.Fragment key={record.id}>
                      <tr className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3.5">
                          <div className="font-bold text-slate-900 text-xs">
                            Lead #{record.leadId}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate max-w-[160px]">
                            {record.recipientPhone || record.recipientEmail || '—'}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold',
                              record.triggerType === 'AUTOMATIC'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            )}
                          >
                            {record.triggerType}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border shadow-2xs',
                              record.whatsappStatus === 'SENT'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : record.whatsappStatus === 'FAILED'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            )}
                          >
                            <FontAwesomeIcon icon={faWhatsapp} className="size-3 text-emerald-600" />
                            <span>{record.whatsappStatus || 'SKIPPED'}</span>
                          </span>
                          {record.whatsappStatus === 'FAILED' && record.whatsappError && (
                            <p
                              className="text-[10px] text-rose-600 truncate max-w-[130px] mt-0.5"
                              title={record.whatsappError}
                            >
                              {record.whatsappError}
                            </p>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border shadow-2xs',
                              record.emailStatus === 'SENT'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : record.emailStatus === 'FAILED'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            )}
                          >
                            <FontAwesomeIcon icon={faEnvelope} className="size-3 text-blue-600" />
                            <span>{record.emailStatus || 'SKIPPED'}</span>
                          </span>
                          {record.emailStatus === 'FAILED' && record.emailError && (
                            <p
                              className="text-[10px] text-rose-600 truncate max-w-[130px] mt-0.5"
                              title={record.emailError}
                            >
                              {record.emailError}
                            </p>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border shadow-2xs',
                              record.overallStatus === 'SENT' || record.overallStatus === 'COMPLETED'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : record.overallStatus === 'PARTIAL' ||
                                  record.overallStatus === 'PARTIALLY_COMPLETED'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            )}
                          >
                            <span
                              className={cn(
                                'size-1.5 rounded-full',
                                record.overallStatus === 'SENT' ||
                                  record.overallStatus === 'COMPLETED'
                                  ? 'bg-emerald-500'
                                  : record.overallStatus === 'PARTIAL' ||
                                    record.overallStatus === 'PARTIALLY_COMPLETED'
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              )}
                            />
                            {record.overallStatus}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-[11px] text-slate-600">
                          {Array.isArray(record.documentIds)
                            ? `${record.documentIds.length} files`
                            : '5 files'}
                        </td>

                        <td className="py-3 px-3 text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(record.createdAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </td>

                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {canRetry && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isRetrying}
                                onClick={() => handleRetry(record.id)}
                                className="h-7 px-2 text-[11px] text-rose-700 border-rose-200 hover:bg-rose-50"
                                title="Retry delivery"
                              >
                                <RotateCcw className={cn('size-3', isRetrying && 'animate-spin')} />
                                <span>{isRetrying ? 'Retrying...' : 'Retry'}</span>
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setExpandedId(isExpanded ? null : record.id)}
                              className="h-7 px-2 text-[11px] text-slate-600 hover:text-slate-900"
                            >
                              {isExpanded ? 'Hide' : 'Details'}
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable audit log row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80">
                          <td colSpan={8} className="py-3 px-4 text-xs text-slate-700 space-y-1.5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-white border border-slate-200/80">
                              <div>
                                <p className="font-semibold text-slate-800 flex items-center gap-1">
                                  <FontAwesomeIcon icon={faWhatsapp} className="text-emerald-600" />
                                  WhatsApp Dispatch Record
                                </p>
                                <p className="text-[11px] text-slate-600 mt-1">
                                  Status: <strong>{record.whatsappStatus}</strong>
                                  {record.whatsappMessageId
                                    ? ` · Message ID: ${record.whatsappMessageId}`
                                    : ''}
                                  {record.whatsappRetryCount
                                    ? ` · Retries: ${record.whatsappRetryCount}`
                                    : ''}
                                </p>
                                {record.whatsappError && (
                                  <p className="text-[11px] text-rose-600 mt-0.5">
                                    Error: {record.whatsappError}
                                  </p>
                                )}
                              </div>

                              <div>
                                <p className="font-semibold text-slate-800 flex items-center gap-1">
                                  <FontAwesomeIcon icon={faEnvelope} className="text-blue-600" />
                                  Email Dispatch Record
                                </p>
                                <p className="text-[11px] text-slate-600 mt-1">
                                  Status: <strong>{record.emailStatus}</strong>
                                  {record.emailMessageId
                                    ? ` · Message ID: ${record.emailMessageId}`
                                    : ''}
                                  {record.emailRetryCount
                                    ? ` · Retries: ${record.emailRetryCount}`
                                    : ''}
                                </p>
                                {record.emailError && (
                                  <p className="text-[11px] text-rose-600 mt-0.5">
                                    Error: {record.emailError}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="p-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing{' '}
            <span className="font-semibold text-slate-800">
              {filteredHistory.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-800">
              {Math.min(currentPage * itemsPerPage, filteredHistory.length)}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-slate-800">{filteredHistory.length}</span>{' '}
            deliveries
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="h-8 gap-1 rounded-lg text-xs"
            >
              <ChevronLeft className="size-3.5" />
              <span>Previous</span>
            </Button>

            <span className="px-2 font-medium text-slate-700">
              Page {currentPage} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="h-8 gap-1 rounded-lg text-xs"
            >
              <span>Next</span>
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* 6. Edit Document Drawer */}
      <FormDrawer
        open={Boolean(editingDoc)}
        onOpenChange={(open) => {
          if (!open) setEditingDoc(null);
        }}
        title={`Edit Document: ${editingDoc?.title || ''}`}
        description="Update document category metadata and storage configuration."
        onSubmit={handleSaveDocModal}
      >
        {editingDoc && (
          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Display Title</Label>
              <Input
                required
                value={editingDoc.title || ''}
                onChange={(e) => setEditingDoc({ ...editingDoc, title: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Description</Label>
              <textarea
                rows={3}
                value={editingDoc.description || ''}
                onChange={(e) => setEditingDoc({ ...editingDoc, description: e.target.value })}
                className="w-full rounded-md border border-slate-200 bg-white p-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#173D30]"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Version</Label>
              <Input
                value={editingDoc.version || '1.0'}
                onChange={(e) => setEditingDoc({ ...editingDoc, version: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">File Storage URL</Label>
              <Input
                value={editingDoc.fileUrl || ''}
                onChange={(e) => setEditingDoc({ ...editingDoc, fileUrl: e.target.value })}
                placeholder="https://... or /uploads/..."
                className="h-9 text-xs font-mono"
              />
            </div>
          </div>
        )}
      </FormDrawer>

      {/* 7. Confirm File Removal Dialog */}
      <ConfirmDialog
        open={Boolean(pendingRemoveDoc)}
        onOpenChange={(open) => {
          if (!open) setPendingRemoveDoc(null);
        }}
        variant="destructive"
        title="Remove Document File"
        description={`Are you sure you want to remove the uploaded PDF file for "${pendingRemoveDoc?.title}"? This document will be marked as missing until a new file is uploaded.`}
        confirmLabel="Remove File"
        onConfirm={handleConfirmRemoveFile}
      />
    </div>
  );
}
