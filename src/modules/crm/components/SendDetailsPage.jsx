'use client';

import * as React from 'react';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import {
  faPaperPlane,
  faFilePdf,
  faCheckCircle,
  faTimesCircle,
  faExclamationTriangle,
  faRotate,
  faUpload,
  faEye,
  faGear,
  faSliders,
  faFolderOpen,
  faEnvelope,
  faCheck,
  faPenToSquare,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { toast } from 'sonner';
import {
  loadSendDetailsDocuments,
  updateSendDetailsDocument,
  uploadSendDetailsFile,
  loadSendDetailsConfig,
  updateSendDetailsConfig,
  loadSendDetailsHistory,
  retrySendDetails,
  manualSendDetails,
} from '../crm-api';

const isDocUploaded = (doc) =>
  doc?.isUploaded === true ||
  doc?.uploadStatus === 'UPLOADED' ||
  (String(doc?.fileUrl || '').trim() && !/storage\.qbapp\.online\/documents\//i.test(String(doc.fileUrl)));

const CATEGORY_LABELS = {
  COMPANY_PROFILE: 'Company Profile (PDF)',
  SERVICE_CATALOGUE: 'Service / Product Catalogue',
  PRICING_QUOTATION: 'Pricing / Quotation',
  PACKAGES_PLANS: 'Packages and Plans',
  PORTFOLIO_PROJECTS: 'Portfolio / Previous Projects',
};

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
  const [detailId, setDetailId] = React.useState(null);
  const [editingDoc, setEditingDoc] = React.useState(null);

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
      toast.error('Failed to load Send Details data');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveConfig = async () => {
    try {
      setSavingConfig(true);
      await updateSendDetailsConfig(config);
      toast.success('Send Details configuration saved successfully');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update configuration');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleToggleDoc = async (doc) => {
    try {
      const updated = await updateSendDetailsDocument(doc.id, { isActive: !doc.isActive });
      setDocuments((prev) => prev.map((d) => (d.id === doc.id ? updated : d)));
      toast.success(`${doc.title} is now ${!doc.isActive ? 'Active' : 'Inactive'}`);
    } catch (err) {
      toast.error('Failed to update document status');
    }
  };

  const triggerFileUpload = (docId) => {
    setActiveUploadDocId(docId);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadDocId) return;

    try {
      setUploadingDocId(activeUploadDocId);
      toast.info(`Uploading ${file.name}...`);
      const uploadResult = await uploadSendDetailsFile(file);

      await updateSendDetailsDocument(activeUploadDocId, {
        fileUrl: uploadResult.fileUrl,
        fileName: uploadResult.fileName,
        fileSize: uploadResult.fileSize,
        fileType: uploadResult.fileType,
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
      toast.success('Document details updated');
    } catch (err) {
      toast.error('Failed to update document');
    }
  };

  const handlePreview = (doc) => {
    const url = doc?.previewUrl;
    if (!isDocUploaded(doc) || !url) {
      toast.error('Upload a PDF first to enable preview.');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleRemoveFile = async (doc) => {
    if (!isDocUploaded(doc)) return;
    if (!window.confirm(`Remove the uploaded PDF for "${doc.title}"?`)) return;
    try {
      await updateSendDetailsDocument(doc.id, { fileUrl: '', fileName: '', fileSize: 0, fileType: 'application/pdf' });
      const refreshed = await loadSendDetailsDocuments();
      if (Array.isArray(refreshed)) setDocuments(refreshed);
      toast.success('Document file removed');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to remove document file');
    }
  };

  const handleRetry = async (deliveryId) => {
    try {
      setRetryingId(deliveryId);
      const result = await retrySendDetails(deliveryId, { channel: 'ALL' });
      const status = result?.overallStatus || result?.data?.overallStatus;
      if (status === 'FAILED') toast.error(result?.whatsappError || result?.emailError || result?.data?.whatsappError || result?.data?.emailError || 'Delivery is still failed');
      else toast.success(status === 'COMPLETED' || status === 'SENT' ? 'Delivery completed' : 'Retry finished');
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Retry failed');
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        className="hidden"
        accept="application/pdf,.pdf"
      />

      <PageHeader
        title="Send Details Automation & Documents"
        subtitle="Manage the 5 business document assets and automatic WhatsApp/Email delivery triggered on 'Details Sent' stage."
      >
        <Button onClick={loadData} variant="outline" size="sm" className="gap-2">
          <FontAwesomeIcon icon={faRotate} className={loading ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </PageHeader>

      {/* SECTION 1: AUTOMATION & CHANNEL CONFIGURATION */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <FontAwesomeIcon icon={faSliders} className="size-5" />
              </div>
              <div>
                <CardTitle>Automation Workflow Configuration</CardTitle>
                <CardDescription>
                  When a lead transitions to <strong>Details Sent</strong>, the CRM automatically delivers the package below.
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
                <span>Automatic Send Details:</span>
                <input
                  type="checkbox"
                  checked={config.isAutomationEnabled}
                  onChange={(e) => setConfig({ ...config, isAutomationEnabled: e.target.checked })}
                  className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className={config.isAutomationEnabled ? 'text-emerald-600' : 'text-slate-400'}>
                  {config.isAutomationEnabled ? 'ENABLED' : 'PAUSED'}
                </span>
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* WHATSAPP CONFIG */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faWhatsapp} className="size-5 text-emerald-600" />
                  <span className="font-bold text-slate-800">WhatsApp Automation</span>
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={config.whatsappEnabled}
                    onChange={(e) => setConfig({ ...config, whatsappEnabled: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>{config.whatsappEnabled ? 'Active' : 'Disabled'}</span>
                </label>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">Meta Template Name</label>
                  <Input
                    value={config.whatsappTemplateName || ''}
                    onChange={(e) => setConfig({ ...config, whatsappTemplateName: e.target.value })}
                    placeholder="lead_stage_details_sent"
                    className="mt-1"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Sends approved template and document links to lead mobile phone upon stage transition.
                </p>
              </div>
            </div>

            {/* EMAIL CONFIG */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faEnvelope} className="size-5 text-indigo-600" />
                  <span className="font-bold text-slate-800">Email Automation</span>
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={config.emailEnabled}
                    onChange={(e) => setConfig({ ...config, emailEnabled: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{config.emailEnabled ? 'Active' : 'Disabled'}</span>
                </label>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">Email Subject Line</label>
                  <Input
                    value={config.emailSubject || ''}
                    onChange={(e) => setConfig({ ...config, emailSubject: e.target.value })}
                    placeholder="Company Details & Service Information"
                    className="mt-1"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Sends full branded HTML package with PDF attachments via SMTP to lead email address.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveConfig} disabled={savingConfig} className="bg-indigo-600 hover:bg-indigo-700">
              {savingConfig ? 'Saving...' : 'Save Workflow Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: COMPANY DOCUMENTS */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Company Documents</h3>
            <p className="text-sm text-slate-500">
              Upload each PDF once per tenant. Selected documents are attached to Email and WhatsApp when Send Details is triggered.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="outline" className="text-xs">
              {documents.filter((d) => d.isActive).length} of {documents.length} Active
            </Badge>
            <Badge
              variant="outline"
              className={`text-xs ${documents.filter((d) => isDocUploaded(d)).length === documents.length ? 'border-emerald-300 text-emerald-700' : 'border-amber-300 text-amber-700'}`}
            >
              {documents.filter((d) => isDocUploaded(d)).length} of {documents.length} Uploaded
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc, idx) => {
            const uploaded = isDocUploaded(doc);
            return (
            <Card key={doc.id || idx} className={`transition-all ${!doc.isActive ? 'opacity-60 bg-slate-50' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="secondary" className="text-xs font-semibold uppercase">
                    {CATEGORY_LABELS[doc.category] || doc.category}
                  </Badge>
                  <label className="flex cursor-pointer items-center gap-1.5 text-xs font-medium">
                    <input
                      type="checkbox"
                      checked={doc.isActive}
                      onChange={() => handleToggleDoc(doc)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{doc.isActive ? 'Active' : 'Inactive'}</span>
                  </label>
                </div>
                <CardTitle className="text-base font-bold text-slate-800 pt-1">{doc.title}</CardTitle>
                <CardDescription className="text-xs line-clamp-2">{doc.description || 'No description provided'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="flex items-center justify-between">
                  <Badge
                    className={`text-[10px] uppercase tracking-wide ${uploaded ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}
                  >
                    {uploaded ? 'Uploaded' : 'Missing PDF'}
                  </Badge>
                  {doc.uploadedAt && (
                    <span className="text-[10px] text-slate-500">
                      {new Date(doc.uploadedAt).toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">File:</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[180px]">
                      {uploaded ? doc.fileName || 'document.pdf' : 'Not uploaded'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Version:</span>
                    <span className="text-slate-700 font-mono">v{doc.version || '1.0'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Size:</span>
                    <span className="text-slate-700">
                      {doc.fileSize ? `${Math.round(doc.fileSize / 1024)} KB` : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => triggerFileUpload(doc.id)}
                    disabled={uploadingDocId === doc.id}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs gap-1.5"
                  >
                    <FontAwesomeIcon icon={faUpload} />
                    {uploadingDocId === doc.id ? 'Uploading...' : uploaded ? 'Replace PDF' : 'Upload PDF'}
                  </Button>

                  <Button
                    type="button"
                    onClick={() => handlePreview(doc)}
                    disabled={!uploaded}
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1.5"
                  >
                    <FontAwesomeIcon icon={faEye} />
                    Preview
                  </Button>

                  <Button
                    onClick={() => setEditingDoc({ ...doc })}
                    variant="ghost"
                    size="sm"
                    className="px-2 text-slate-600"
                  >
                    <FontAwesomeIcon icon={faPenToSquare} />
                  </Button>

                  {uploaded && (
                    <Button
                      onClick={() => handleRemoveFile(doc)}
                      variant="ghost"
                      size="sm"
                      className="px-2 text-red-600 hover:text-red-700"
                      title="Remove uploaded PDF"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
          })}
        </div>
      </div>

      {/* SECTION 3: RECENT DELIVERIES & RETRY */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Delivery History & Status Logs</CardTitle>
              <CardDescription>
                Auditable records of all automated and manual Send Details dispatches across WhatsApp and Email.
              </CardDescription>
            </div>
            <Button onClick={loadData} variant="outline" size="sm" className="gap-2 text-xs">
              <FontAwesomeIcon icon={faRotate} />
              Sync Status
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              No Send Details deliveries recorded yet. Stage transitions to &quot;Details Sent&quot; will be logged here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-700">
                  <tr>
                    <th className="px-4 py-3">Lead ID / Contact</th>
                    <th className="px-4 py-3">Trigger Type</th>
                    <th className="px-4 py-3">WhatsApp Status</th>
                    <th className="px-4 py-3">Email Status</th>
                    <th className="px-4 py-3">Overall Status</th>
                    <th className="px-4 py-3">Documents</th>
                    <th className="px-4 py-3">Date / Time</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((record) => (
                    <React.Fragment key={record.id}>
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <div>Lead #{record.leadId}</div>
                        <div className="text-xs text-slate-500 font-mono">
                          {record.recipientPhone || record.recipientEmail || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={record.triggerType === 'AUTOMATIC' ? 'default' : 'secondary'}
                          className="text-xs font-mono"
                        >
                          {record.triggerType}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                            record.whatsappStatus === 'SENT'
                              ? 'bg-emerald-100 text-emerald-800'
                              : record.whatsappStatus === 'FAILED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <FontAwesomeIcon icon={faWhatsapp} className="size-3" />
                          {record.whatsappStatus}
                        </span>
                        {record.whatsappStatus !== 'SENT' && record.whatsappError && (
                          <div className="text-[11px] text-rose-600 max-w-[140px] truncate" title={record.whatsappError}>
                            {record.whatsappError}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                            record.emailStatus === 'SENT'
                              ? 'bg-emerald-100 text-emerald-800'
                              : record.emailStatus === 'FAILED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <FontAwesomeIcon icon={faEnvelope} className="size-3" />
                          {record.emailStatus}
                        </span>
                        {record.emailStatus !== 'SENT' && record.emailError && (
                          <div className="text-[11px] text-rose-600 max-w-[140px] truncate" title={record.emailError}>
                            {record.emailError}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={`text-xs ${
                            record.overallStatus === 'SENT' || record.overallStatus === 'COMPLETED'
                              ? 'bg-emerald-600 text-white'
                              : record.overallStatus === 'PARTIAL' || record.overallStatus === 'PARTIALLY_COMPLETED'
                              ? 'bg-amber-500 text-white'
                              : record.overallStatus === 'PENDING' || record.overallStatus === 'PROCESSING'
                              ? 'bg-slate-500 text-white'
                              : 'bg-rose-600 text-white'
                          }`}
                        >
                          {record.overallStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {Array.isArray(record.documentIds) ? `${record.documentIds.length} files` : '5 files'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {new Date(record.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button type="button" variant="ghost" size="sm" className="text-xs" onClick={() => setDetailId(detailId === record.id ? null : record.id)}>Details</Button>
                        {(record.whatsappStatus === 'FAILED' || record.emailStatus === 'FAILED' || ((record.whatsappStatus === 'SKIPPED' || record.emailStatus === 'SKIPPED') && (record.whatsappError || record.emailError))) && (
                          <Button
                            onClick={() => handleRetry(record.id)}
                            disabled={retryingId === record.id}
                            variant="outline"
                            size="sm"
                            className="text-xs gap-1 border-rose-300 text-rose-700 hover:bg-rose-50"
                          >
                            <FontAwesomeIcon icon={faRotate} className={retryingId === record.id ? 'animate-spin' : ''} />
                            Retry
                          </Button>
                        )}
                      </td>
                    </tr>
                    {detailId === record.id && (
                      <tr className="bg-slate-50">
                        <td colSpan={8} className="px-4 py-3 text-xs text-slate-700 space-y-1">
                          <p>WhatsApp: {record.whatsappStatus}{record.whatsappStatus !== 'SENT' && record.whatsappError ? ` — ${record.whatsappError}` : ''}{record.whatsappMessageId ? ` · Message ${record.whatsappMessageId}` : ''} · Retries {record.whatsappRetryCount || 0}</p>
                          <p>Email: {record.emailStatus}{record.emailStatus !== 'SENT' && record.emailError ? ` — ${record.emailError}` : ''}{record.emailMessageId ? ` · Message ${record.emailMessageId}` : ''} · Retries {record.emailRetryCount || 0}</p>
                          <p>Attempted {new Date(record.updatedAt || record.createdAt).toLocaleString()}</p>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* EDIT DOCUMENT MODAL */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Edit Document: {editingDoc.title}</h3>
            <form onSubmit={handleSaveDocModal} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Display Title</label>
                <Input
                  value={editingDoc.title || ''}
                  onChange={(e) => setEditingDoc({ ...editingDoc, title: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Description</label>
                <Textarea
                  value={editingDoc.description || ''}
                  onChange={(e) => setEditingDoc({ ...editingDoc, description: e.target.value })}
                  rows={3}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">File URL (S3 / CDN)</label>
                <Input
                  value={editingDoc.fileUrl || ''}
                  onChange={(e) => setEditingDoc({ ...editingDoc, fileUrl: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Version</label>
                <Input
                  value={editingDoc.version || '1.0'}
                  onChange={(e) => setEditingDoc({ ...editingDoc, version: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setEditingDoc(null)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

