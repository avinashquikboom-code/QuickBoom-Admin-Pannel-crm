'use client';

import * as React from 'react';
import {
  Layers,
  Users,
  Briefcase,
  CheckCircle2,
  Plus,
  Search,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Check,
  X,
  SlidersHorizontal,
  AlertCircle,
  CircleDot,
} from 'lucide-react';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { TemplateSelector, VariableMapping, requiredVariables } from './TemplateSelector';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Textarea } from '@/components/common/Textarea';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { AdminRowActions } from '@/components/common/AdminRowActions';
import { StatusBadge } from '@/components/common/StatusBadge';
import { TruncatedText } from '@/components/common/TruncatedText';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/Select';
import { toast } from '@/hooks/use-toast';
import api from '../../../lib/api';
import { bulkDealStages, crmError, loadDealStage, loadDealStages, loadLeadStage, loadLeadStages, reassignDealStage, reassignLeadStage, removeDealStage, removeLeadStage, saveDealStage, saveLeadStage } from '@/modules/crm/crm-api';
import { envelope, rowsOf } from '@/modules/templates/template-shared';

const STAGE_EMAIL_SAMPLE_VARS = {
  customerName: 'Sample Lead',
  leadName: 'Sample Lead',
  companyName: 'Sample Company Pvt Ltd',
  customerEmail: 'lead@example.com',
  leadPhone: '919876543210',
  oldStage: 'New',
  newStage: 'Current stage',
  salesOwner: 'CRM Executive',
  assignedEmployeeName: 'CRM Executive',
  stage: 'Current stage',
  phone: '919876543210',
  currentDate: '15/01/2025',
  currentTime: '10:30 AM',
};

const STAGE_WHATSAPP_SAMPLE_VARS = {
  leadName: 'Sample Lead',
  name: 'Sample Lead',
  customerName: 'Sample Lead',
  companyName: 'Sample Company Pvt Ltd',
  businessName: 'Sample Company Pvt Ltd',
  phone: '919876543210',
  userName: 'CRM Executive',
  assignedEmployeeName: 'CRM Executive',
  assignedEmployeePhone: '919876543210',
  stage: 'Current stage',
};

const emptyForm = {
  type: 'Lead',
  name: '',
  order: '',
  probability: '',
  description: '',
  color: '#163A2E',
  bgColor: '#E8F1EC',
  borderColor: '#E2E8E5',
  isActive: true,
  emailEnabled: false,
  emailTemplateId: '',
  emailVariableMappingJson: '',
  emailTestAddress: '',
  whatsappEnabled: false,
  whatsappTemplateId: '',
  whatsappVariableMappingJson: '',
  whatsappTestPhone: '',
};
const keyOf = (stage) => `${stage.type}:${stage.id}`;
const usageOf = (stage) => (stage?.type === 'Lead'
  ? Number(stage.leadsCount || stage._count?.leads || 0)
  : Number(stage?.dealsCount ?? stage?._count?.deals ?? 0));
const usageInMessage = (message) => {
  const match = String(message || '').match(/used by (\d+)/i);
  return match ? Number(match[1]) : 0;
};

export function StageManagement() {
  const [stages, setStages] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState([]);
  const [drawer, setDrawer] = React.useState(null);
  const [form, setForm] = React.useState(emptyForm);
  const [saving, setSaving] = React.useState(false);
  const [confirm, setConfirm] = React.useState(null);
  const [targetStageId, setTargetStageId] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [stageType, setStageType] = React.useState('Lead');
  const [status, setStatus] = React.useState('ALL');
  const [sort, setSort] = React.useState('order');
  const [page, setPage] = React.useState(1);
  const [tab, setTab] = React.useState('General');
  const [templateLoading, setTemplateLoading] = React.useState(false);
  const [templateError, setTemplateError] = React.useState('');
  const [initialForm, setInitialForm] = React.useState(null);
  const [validationError, setValidationError] = React.useState('');
  const [emailTemplates, setEmailTemplates] = React.useState([]);
  const [metaTemplates, setMetaTemplates] = React.useState([]);
  const [emailPreview, setEmailPreview] = React.useState(null);
  const [emailPreviewLoading, setEmailPreviewLoading] = React.useState(false);
  const [emailTestSending, setEmailTestSending] = React.useState(false);
  const [waPreview, setWaPreview] = React.useState(null);
  const [waPreviewLoading, setWaPreviewLoading] = React.useState(false);
  const [waTestSending, setWaTestSending] = React.useState(false);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const [leadStages, dealStages] = await Promise.all([
        loadLeadStages().catch(() => []),
        loadDealStages(false).then((result) => (result.stages || []).map((stage) => ({ ...stage, type: 'Deal' }))).catch(() => []),
      ]);
      const rows = [...leadStages, ...dealStages];
      setStages(rows);
      setSelected((current) => current.filter((key) => rows.some((stage) => keyOf(stage) === key)));
    } catch (error) {
      toast.error(crmError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { refresh(); }, [refresh]);

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    const rows = stages.filter((stage) => {
      if (stageType !== 'ALL' && stage.type !== stageType) return false;
      if (status === 'ACTIVE' && stage.isActive === false) return false;
      if (status === 'INACTIVE' && stage.isActive !== false) return false;
      if (!query) return true;
      return [stage.name, stage.description, stage.key, stage.type].some((value) => String(value || '').toLowerCase().includes(query));
    });
    const valueOf = (stage) => {
      if (sort === 'name') return stage.name || '';
      if (sort === 'status') return stage.isActive === false ? 'Inactive' : 'Active';
      if (sort === 'created') return stage.createdAt || '';
      const typePrefix = stage.type === 'Deal' ? '2' : '1';
      const orderNum = String(stage.order ?? stage.sortOrder ?? 0).padStart(5, '0');
      return `${typePrefix}_${orderNum}`;
    };
    return [...rows].sort((a, b) => String(valueOf(a)).localeCompare(String(valueOf(b)), undefined, { numeric: true }));
  }, [stages, stageType, search, status, sort]);

  const pageSize = 20;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  React.useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);

  const fillForm = (stage) => { const next = stage ? {
      type: stage.type || 'Lead',
      name: stage.name || '',
      order: stage.order ?? stage.sortOrder ?? '',
      probability: stage.probability ?? '',
      description: stage.description || '',
      color: stage.color || '#163A2E',
      bgColor: stage.bgColor || '#E8F1EC',
      borderColor: stage.borderColor || '#E2E8E5',
      isActive: stage.isActive !== false,
      emailEnabled: stage.emailEnabled !== false,
      emailTemplateId: stage.emailTemplateId || stage.emailTemplate?.id || '',
      emailVariableMappingJson: stage.emailVariableMapping ? JSON.stringify(stage.emailVariableMapping, null, 2) : '',
      emailTestAddress: '',
      whatsappEnabled: stage.whatsappEnabled !== false,
      whatsappTemplateId: stage.whatsappTemplateId || stage.whatsappTemplate?.id || '',
      whatsappVariableMappingJson: stage.whatsappVariableMapping ? JSON.stringify(stage.whatsappVariableMapping, null, 2) : '',
      whatsappTestPhone: '',
    } : emptyForm; setForm(next); setInitialForm(next); };

  const stageEmailVariables = React.useCallback(() => {
    const vars = {
      ...STAGE_EMAIL_SAMPLE_VARS,
      newStage: form.name || STAGE_EMAIL_SAMPLE_VARS.newStage,
      stage: form.name || STAGE_EMAIL_SAMPLE_VARS.newStage,
    };
    if (!form.emailVariableMappingJson?.trim()) return vars;
    try {
      const mapping = JSON.parse(form.emailVariableMappingJson);
      Object.entries(mapping).forEach(([key, source]) => {
        const src = String(source || '').trim();
        vars[key] = vars[src] ?? src;
      });
    } catch {
      /* ignore */
    }
    return vars;
  }, [form.name, form.emailVariableMappingJson]);

  const selectedEmailTemplate = React.useMemo(
    () => emailTemplates.find((item) => String(item.id) === String(form.emailTemplateId)),
    [emailTemplates, form.emailTemplateId],
  );

  const runEmailPreview = async () => {
    if (!form.emailTemplateId || !selectedEmailTemplate || selectedEmailTemplate.isActive === false) {
      toast.error('Select an active email template first.');
      return;
    }
    setEmailPreviewLoading(true);
    try {
      const tpl = selectedEmailTemplate;
      const payload = await api.post('/email/templates/preview', {
        subject: tpl?.subject || 'Stage update',
        body: tpl?.body || '',
        variables: stageEmailVariables(),
      });
      const body = payload?.data || payload;
      setEmailPreview(body);
      toast.success('Email preview generated.');
    } catch (error) {
      toast.error(crmError(error));
    } finally {
      setEmailPreviewLoading(false);
    }
  };

  const runEmailTestSend = async () => {
    if (!form.emailTemplateId || !selectedEmailTemplate || selectedEmailTemplate.isActive === false) {
      toast.error('Select an active email template first.');
      return;
    }
    const to = String(form.emailTestAddress || '').trim();
    if (!to) {
      toast.error('Enter a test email address.');
      return;
    }
    setEmailTestSending(true);
    try {
      await api.post('/email/templates/test-send', {
        templateId: Number(form.emailTemplateId),
        to,
        variables: stageEmailVariables(),
      });
      toast.success('Test email sent.');
    } catch (error) {
      toast.error(crmError(error));
    } finally {
      setEmailTestSending(false);
    }
  };

  const stageWhatsAppVariables = React.useCallback(() => {
    const vars = { ...STAGE_WHATSAPP_SAMPLE_VARS, stage: form.name || STAGE_WHATSAPP_SAMPLE_VARS.stage };
    if (!form.whatsappVariableMappingJson?.trim()) return vars;
    try {
      const mapping = JSON.parse(form.whatsappVariableMappingJson);
      Object.entries(mapping).forEach(([key, source]) => {
        const src = String(source || '').trim();
        vars[key] = vars[src] ?? src;
      });
    } catch {
      /* ignore until save validates JSON */
    }
    return vars;
  }, [form.name, form.whatsappVariableMappingJson]);

  const selectedMetaTemplate = React.useMemo(
    () => metaTemplates.find((item) => String(item.id) === String(form.whatsappTemplateId)),
    [metaTemplates, form.whatsappTemplateId],
  );

  const runWhatsappPreview = async () => {
    if (!form.whatsappTemplateId || waTemplateUnusable(selectedMetaTemplate)) {
      toast.error('Select an approved, sendable Meta template first.');
      return;
    }
    setWaPreviewLoading(true);
    try {
      const payload = envelope(await api.post('/templates/meta/preview', {
        templateId: Number(form.whatsappTemplateId),
        body: selectedMetaTemplate?.body,
        headerContent: selectedMetaTemplate?.headerContent,
        variables: stageWhatsAppVariables(),
      }));
      setWaPreview(payload?.preview || payload?.body || payload);
      toast.success('Preview generated.');
    } catch (error) {
      toast.error(crmError(error));
    } finally {
      setWaPreviewLoading(false);
    }
  };

  const runWhatsappTestSend = async () => {
    if (!form.whatsappTemplateId || waTemplateUnusable(selectedMetaTemplate)) {
      toast.error('Select an approved, sendable Meta template first.');
      return;
    }
    const phone = String(form.whatsappTestPhone || '').trim();
    if (!phone) {
      toast.error('Enter a test mobile number.');
      return;
    }
    setWaTestSending(true);
    try {
      await api.post('/templates/meta/test-send', {
        templateId: Number(form.whatsappTemplateId),
        templateName: selectedMetaTemplate?.templateName,
        language: selectedMetaTemplate?.language || 'en_US',
        to: phone,
        variables: stageWhatsAppVariables(),
      });
      toast.success('Test WhatsApp sent.');
    } catch (error) {
      toast.error(crmError(error));
    } finally {
      setWaTestSending(false);
    }
  };

  const loadTemplates = async (sync = false) => {
    setTemplateLoading(true); setTemplateError('');
    try {
      if (sync) await api.post('/templates/meta/sync', {});
      const fetchAll = async (url) => {
        const all = [];
        for (let page = 1; page <= 100; page++) {
          const payload = await api.get(url, { params: { page, limit: 100 } });
          const rows = rowsOf(envelope(payload)); all.push(...rows);
          if (rows.length < 100) break;
        }
        return all;
      };
      const [emails, metas] = await Promise.all([fetchAll('/email/templates'), fetchAll('/templates/meta')]);
      setEmailTemplates(emails); setMetaTemplates(metas);
      if (sync) toast.success('Templates synchronized with Meta.');
    } catch (error) { setTemplateError(`Could not load templates: ${crmError(error)}. Try again.`); }
    finally { setTemplateLoading(false); }
  };

  const open = async (mode, stage) => {
    const effectiveType = stage?.type || (stageType !== 'ALL' ? stageType : 'Lead');
    const initialStage = stage || { ...emptyForm, type: effectiveType };
    setTab('General'); setValidationError(''); setEmailPreview(null); setWaPreview(null);
    setDrawer({ mode, stage: initialStage });
    fillForm(initialStage);
    if (effectiveType === 'Lead') loadTemplates();
    if (!stage?.id) return;
    try {
      const detail = stage.type === 'Deal' ? await loadDealStage(stage.id) : await loadLeadStage(stage.id);
      fillForm({ ...stage, ...detail, type: stage.type });
    } catch (error) {
      toast.error(crmError(error));
    }
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error('Stage name is required.');
      return;
    }
    if (form.type === 'Lead' && ((form.emailEnabled && (!selectedEmailTemplate || selectedEmailTemplate.isActive === false)) || (form.whatsappEnabled && waTemplateUnusable(selectedMetaTemplate)))) { setValidationError('Choose an eligible template for each enabled automation, or disable that channel.'); return; }
    for (const [enabled, template, kind, raw] of [[form.emailEnabled, selectedEmailTemplate, 'email', form.emailVariableMappingJson], [form.whatsappEnabled, selectedMetaTemplate, 'whatsapp', form.whatsappVariableMappingJson]]) {
      if (!enabled || form.type !== 'Lead') continue;
      let mapping; try { mapping = raw ? JSON.parse(raw) : {}; } catch { setValidationError(`${kind} mapping is invalid. Select the required fields again.`); return; }
      const missing = requiredVariables(template, kind).filter((key) => !String(mapping[key] || '').trim());
      if (missing.length) { setTab(kind === 'email' ? 'Email Automation' : 'WhatsApp Automation'); setValidationError(`Map the required ${kind} variables: ${missing.join(', ')}.`); return; }
    }
    setValidationError('');
    setSaving(true);
    try {
      const id = drawer?.mode === 'edit' ? drawer.stage.id : undefined;
      if (form.type === 'Deal') await saveDealStage(form, id);
      else {
        let emailVariableMapping;
        let whatsappVariableMapping;
        if (form.emailVariableMappingJson?.trim()) {
          try {
            emailVariableMapping = JSON.parse(form.emailVariableMappingJson);
          } catch {
            toast.error('Email variable mapping must be valid JSON.');
            setSaving(false);
            return;
          }
        }
        if (form.whatsappVariableMappingJson?.trim()) {
          try {
            whatsappVariableMapping = JSON.parse(form.whatsappVariableMappingJson);
          } catch {
            toast.error('WhatsApp variable mapping must be valid JSON.');
            setSaving(false);
            return;
          }
        }
        await saveLeadStage({
          ...form,
          emailTemplateId: form.emailTemplateId ? Number(form.emailTemplateId) : null,
          emailVariableMapping,
          whatsappTemplateId: form.whatsappTemplateId ? Number(form.whatsappTemplateId) : null,
          whatsappVariableMapping,
        }, id);
      }
      toast.success(id ? 'Stage updated.' : 'Stage created.');
      setDrawer(null);
      await refresh();
    } catch (error) {
      toast.error(crmError(error));
    } finally {
      setSaving(false);
    }
  };

  const recordsFor = (keys) => stages.filter((stage) => keys.includes(keyOf(stage)));

  const setActive = async (keys, isActive) => {
    const records = recordsFor(keys);
    try {
      const deals = records.filter((stage) => stage.type === 'Deal');
      const leads = records.filter((stage) => stage.type === 'Lead');
      if (deals.length === 1) await saveDealStage({ isActive, name: deals[0].name }, deals[0].id);
      else if (deals.length) await bulkDealStages(deals.map((stage) => stage.id), isActive ? 'activate' : 'deactivate');
      await Promise.all(leads.map((stage) => saveLeadStage({ isActive, name: stage.name }, stage.id)));
      toast.success(isActive ? 'Stage activated.' : 'Stage deactivated.');
      await refresh();
    } catch (error) {
      toast.error(crmError(error));
    }
  };

  const runDelete = async (keys) => {
    const records = recordsFor(keys);
    const failures = [];
    const deals = records.filter((stage) => stage.type === 'Deal');
    const leads = records.filter((stage) => stage.type === 'Lead');
    if (deals.length === 1) {
      try { await removeDealStage(deals[0].id); } catch (error) {
        const message = crmError(error);
        const used = usageInMessage(message);
        if (used > 0) {
          setTargetStageId('');
          setConfirm({ ids: [keyOf(deals[0])], key: keyOf(deals[0]), stageId: deals[0].id, name: deals[0].name, used, type: 'Deal' });
          return;
        }
        failures.push(message);
      }
    } else if (deals.length) {
      const result = await bulkDealStages(deals.map((stage) => stage.id), 'delete');
      (result?.failures || result?.data?.failures || []).forEach((failure) => failures.push(failure.message));
    }
    for (const stage of leads) {
      try { await removeLeadStage(stage.id); } catch (error) { failures.push(crmError(error)); }
    }
    if (failures.length) toast.error(failures[0] || 'Some stages could not be deleted.');
    else toast.success(records.length === 1 ? 'Stage deleted.' : 'Selected unused stages deleted.');
    await refresh();
  };

  const reassignAndDelete = async () => {
    if (!confirm?.stageId || !targetStageId) {
      toast.error(`Choose another ${confirm?.type === 'Deal' ? 'deal' : 'lead'} stage first.`);
      return;
    }
    try {
      if (confirm.type === 'Deal') await reassignDealStage(confirm.stageId, targetStageId);
      else await reassignLeadStage(confirm.stageId, targetStageId);
      toast.success('Records were moved and the stage was deleted.');
      setSelected((current) => current.filter((key) => key !== confirm.key));
      await refresh();
    } catch (error) {
      toast.error(crmError(error));
    }
  };

  const replacementStages = confirm?.used > 0
    ? stages.filter((stage) => stage.type === confirm.type && String(stage.id) !== String(confirm.stageId))
    : [];

  const viewing = drawer?.mode === 'view';
  const dealForm = form.type === 'Deal';

  const waTemplateUnusable = (tpl) =>
    !tpl || tpl.sendable === false || tpl.isPlaceholder === true || tpl.isLocalActive === false ||
    !String(tpl.metaTemplateId || '').trim() || String(tpl.metaTemplateId || '').trim().startsWith('seed_') ||
    String(tpl.status || tpl.metaStatus || '').toUpperCase() !== 'APPROVED';

  const waStatusOf = (stage) => {
    if (stage.type === 'Deal') return null;
    if (stage.whatsappEnabled === false) return { label: 'Disabled', cls: 'bg-slate-100 text-slate-600 border border-slate-200' };
    const tplId = stage.whatsappTemplateId || stage.whatsappTemplate?.id;
    if (tplId) {
      const tpl = (stage.whatsappTemplate && String(stage.whatsappTemplate.id) === String(tplId))
        ? stage.whatsappTemplate
        : metaTemplates.find((item) => String(item.id) === String(tplId));
      if (!tpl) return { label: 'Invalid config', cls: 'bg-rose-50 text-rose-700 border border-rose-200' };
      if (tpl.isLocalActive === false) return { label: 'Inactive', cls: 'bg-amber-50 text-amber-800 border border-amber-200' };
      const status = String(tpl.status || tpl.metaStatus || '').toUpperCase();
      if (status && status !== 'APPROVED') return { label: `Template ${status.toLowerCase()}`, cls: 'bg-amber-50 text-amber-800 border border-amber-200' };
      if (waTemplateUnusable(tpl)) return { label: 'Not approved on Meta', cls: 'bg-rose-50 text-rose-700 border border-rose-200' };
      return { label: 'Configured', cls: 'bg-emerald-50 text-emerald-800 border border-emerald-200' };
    }
    return { label: 'Not configured', cls: 'bg-amber-50 text-amber-800 border border-amber-200' };
  };

  const emailStatusOf = (stage) => {
    if (stage.type === 'Deal') return null;
    if (stage.emailEnabled === false) return { label: 'Disabled', cls: 'bg-slate-100 text-slate-600 border border-slate-200' };
    if (!stage.emailTemplateId && !stage.emailTemplate?.id) return { label: 'Not configured', cls: 'bg-amber-50 text-amber-800 border border-amber-200' };
    const tpl = stage.emailTemplate;
    if (!tpl) return { label: 'Invalid template', cls: 'bg-rose-50 text-rose-700 border border-rose-200' };
    if (tpl.isActive === false || tpl.deletedAt) return { label: 'Inactive', cls: 'bg-amber-50 text-amber-800 border border-amber-200' };
    if (tpl.isActive !== true) return { label: 'Status unavailable', cls: 'bg-slate-100 text-slate-600 border border-slate-200' };
    return { label: 'Configured', cls: 'bg-emerald-50 text-emerald-800 border border-emerald-200' };
  };

  const whatsappTemplateFor = (stage) => {
    const templateId = stage.whatsappTemplateId || stage.whatsappTemplate?.id;
    return stage.whatsappTemplate && String(stage.whatsappTemplate.id) === String(templateId)
      ? stage.whatsappTemplate
      : metaTemplates.find((item) => String(item.id) === String(templateId));
  };

  const emailTemplateFor = (stage) => stage.emailTemplate ||
    emailTemplates.find((item) => String(item.id) === String(stage.emailTemplateId));

  const mappingCell = (template, status, channel) => (
    <div className="min-w-[170px] space-y-1">
      <p className="max-w-[200px] truncate font-semibold text-slate-900 text-xs" title={template ? `${template.name || template.templateName} · ID ${template.id}` : ''}>
        {template ? `${template.name || template.templateName}` : 'No template mapped'}
      </p>
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${status?.cls || 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
        <span className={`size-1.5 rounded-full ${status?.label === 'Configured' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
        {status?.label || `${channel} unavailable`}
      </span>
    </div>
  );

  const leadStagesCount = stages.filter((stage) => stage.type === 'Lead').length;
  const dealStagesCount = stages.filter((stage) => stage.type === 'Deal').length;
  const active = stages.filter((stage) => stage.isActive !== false).length;
  const allVisibleSelected = visible.length > 0 && visible.every((stage) => selected.includes(keyOf(stage)));

  const handleExport = () => {
    if (!filtered.length) {
      toast.error('No stages to export');
      return;
    }
    const headers = [
      'Stage Name',
      'Stage Key',
      'Pipeline Type',
      'Order',
      'Probability (%)',
      'Color',
      'WhatsApp Template',
      'WhatsApp Status',
      'Email Template',
      'Email Status',
      'Status',
    ];
    const rows = filtered.map((s) => [
      `"${(s.name || '').replace(/"/g, '""')}"`,
      `"${(s.key || '').replace(/"/g, '""')}"`,
      `"${s.type || 'Lead'}"`,
      `"${s.order ?? s.sortOrder ?? 0}"`,
      `"${s.probability ?? ''}"`,
      `"${s.color || ''}"`,
      `"${(whatsappTemplateFor(s)?.name || 'None').replace(/"/g, '""')}"`,
      `"${(waStatusOf(s)?.label || 'N/A').replace(/"/g, '""')}"`,
      `"${(emailTemplateFor(s)?.name || 'None').replace(/"/g, '""')}"`,
      `"${(emailStatusOf(s)?.label || 'N/A').replace(/"/g, '""')}"`,
      `"${s.isActive === false ? 'Inactive' : 'Active'}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `crm_stages_${stageType.toLowerCase()}_export.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Stages Exported', {
      description: `Exported ${filtered.length} stages to CSV.`,
    });
  };

  return (
    <div className="w-full min-w-0 max-w-none space-y-5 sm:space-y-6 overflow-x-hidden">
      {/* ── 1. Top Pipeline Switcher & Actions ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => { setStageType('Lead'); setPage(1); }}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition shadow-xs ${
              stageType === 'Lead'
                ? 'bg-[#107569] text-white shadow-xs'
                : 'border border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Users className="size-4" />
            <span>Lead Stages</span>
            <span
              className={`ml-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                stageType === 'Lead' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {leadStagesCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setStageType('Deal'); setPage(1); }}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition shadow-xs ${
              stageType === 'Deal'
                ? 'bg-[#107569] text-white shadow-xs'
                : 'border border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Briefcase className="size-4" />
            <span>Deal Stages</span>
            <span
              className={`ml-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                stageType === 'Deal' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {dealStagesCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setStageType('ALL'); setPage(1); }}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition shadow-xs ${
              stageType === 'ALL'
                ? 'bg-[#107569] text-white shadow-xs'
                : 'border border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Layers className="size-4" />
            <span>All Stages</span>
            <span
              className={`ml-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                stageType === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {stages.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border-slate-200 text-xs font-semibold text-slate-600 hover:text-[#107569]"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#107569] px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#0e6359]"
          >
            <Download className="size-3.5" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* ── 2. Page Header ──────────────────────────────────────────────────── */}
      <PageHeader
        category="SALES & CRM"
        title="Stage Management"
        description="Configure sales lead and deal stages, win probabilities, automated WhatsApp & Email templates, and progression order."
        actions={
          <Button
            onClick={() => open('create')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#107569] px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-[#0e6359]"
          >
            <Plus className="size-4" />
            <span>Add Stage</span>
          </Button>
        }
      />

      {/* ── 3. Four Dashboard Statistics Cards (Strictly Primary Brand Theme) ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Stages */}
        <div className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Stages
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#163A2E]">
              {stages.length}
            </p>
            <p className="text-xs text-slate-400">All configured CRM stages</p>
          </div>
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 ring-1 ring-slate-200/60">
            <Layers className="size-6" />
          </div>
        </div>

        {/* Lead Stages */}
        <div className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Lead Stages
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#163A2E]">
              {leadStagesCount}
            </p>
            <p className="text-xs text-emerald-600 font-medium">Prospect lifecycle & automation</p>
          </div>
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60">
            <Users className="size-6" />
          </div>
        </div>

        {/* Deal Stages */}
        <div className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Deal Stages
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800">
              {dealStagesCount}
            </p>
            <p className="text-xs text-slate-400">Revenue pipeline & win probability</p>
          </div>
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 ring-1 ring-slate-200/60">
            <Briefcase className="size-6" />
          </div>
        </div>

        {/* Active Stages */}
        <div className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Active Stages
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#163A2E]">
              {active}
            </p>
            <p className="text-xs text-emerald-600 font-medium">
              {stages.filter((s) => s.emailTemplateId || s.whatsappTemplateId).length} mapped with automation
            </p>
          </div>
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60">
            <CheckCircle2 className="size-6" />
          </div>
        </div>
      </div>

      {/* ── 4. Unified Filter & Bulk Actions Bar ──────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search stages by name, description, or key..."
              className="h-10 pl-9 pr-3 text-xs sm:text-sm rounded-xl border-slate-200 bg-slate-50/60 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-[#107569] w-full"
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); setPage(1); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Right Dropdowns & Bulk Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-full sm:w-36">
              <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
                <SelectTrigger className="h-10 text-xs sm:text-sm rounded-xl border-slate-200 bg-slate-50/60 focus:ring-[#107569]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-40">
              <Select value={sort} onValueChange={(v) => setSort(v)}>
                <SelectTrigger className="h-10 text-xs sm:text-sm rounded-xl border-slate-200 bg-slate-50/60 focus:ring-[#107569]">
                  <SelectValue placeholder="Sort Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="order">Display Order</SelectItem>
                  <SelectItem value="name">Stage Name</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="created">Created Date</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selected.length > 0 && (
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                <span className="text-xs font-semibold text-slate-700 mr-1">
                  {selected.length} selected:
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActive(selected, true)}
                  className="h-8 rounded-lg border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                >
                  Activate
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActive(selected, false)}
                  className="h-8 rounded-lg border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Deactivate
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirm({ ids: selected })}
                  className="h-8 rounded-lg border-rose-200 bg-rose-50 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                >
                  Delete
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 5. Stages Table ──────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#E2E8E5] bg-[#F4F9F6] text-xs font-bold uppercase tracking-wider text-[#163A2E]">
                <th className="py-3.5 pl-6 pr-3 w-10">
                  <input
                    aria-label="Select visible stages"
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={(event) =>
                      setSelected(
                        event.target.checked
                          ? [...new Set([...selected, ...visible.map(keyOf)])]
                          : selected.filter((key) => !visible.some((stage) => keyOf(stage) === key))
                      )
                    }
                    className="size-4 rounded text-[#107569] focus:ring-emerald-400 accent-[#107569]"
                  />
                </th>
                <th className="py-3.5 px-4">Stage Name</th>
                <th className="py-3.5 px-4">Pipeline</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4">Color & Order</th>
                <th className="py-3.5 px-4">Win Prob.</th>
                <th className="py-3.5 px-4">WhatsApp Automation</th>
                <th className="py-3.5 px-4">Email Automation</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 pl-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((stage) => {
                const isDeal = stage.type === 'Deal';
                const isStageSelected = selected.includes(keyOf(stage));
                return (
                  <tr
                    key={keyOf(stage)}
                    className={`transition-colors hover:bg-slate-50/70 ${
                      isStageSelected ? 'bg-emerald-50/30' : ''
                    }`}
                  >
                    <td className="py-3.5 pl-6 pr-3">
                      <input
                        aria-label={`Select ${stage.name}`}
                        type="checkbox"
                        checked={isStageSelected}
                        onChange={(event) =>
                          setSelected((current) =>
                            event.target.checked
                              ? [...current, keyOf(stage)]
                              : current.filter((key) => key !== keyOf(stage))
                          )
                        }
                        className="size-4 rounded text-[#107569] focus:ring-emerald-400 accent-[#107569]"
                      />
                    </td>

                    {/* Stage Name & Key */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 leading-tight">
                          {stage.name}
                        </span>
                        {stage.key && (
                          <span className="text-[11px] font-mono text-slate-400 mt-0.5">
                            {stage.key}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Pipeline Type */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {isDeal ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200">
                          <span className="size-1.5 rounded-full bg-slate-500" />
                          Deal Pipeline
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200/80">
                          <span className="size-1.5 rounded-full bg-[#107569]" />
                          Lead Stage
                        </span>
                      )}
                    </td>

                    {/* Description */}
                    <td className="py-3.5 px-4 min-w-[140px] max-w-[220px]">
                      <TruncatedText
                        value={stage.description}
                        maxWidth="max-w-[220px]"
                        className="text-xs text-slate-500"
                        label="Stage Description"
                      />
                    </td>

                    {/* Color & Step Order */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className="size-3.5 rounded-full border border-slate-300 shadow-2xs shrink-0"
                          style={{ background: stage.color || '#107569' }}
                          title={`Color: ${stage.color}`}
                        />
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-lg bg-emerald-50 text-[11px] font-bold text-[#107569] border border-emerald-200/60 font-mono">
                          #{stage.order ?? stage.sortOrder ?? '0'}
                        </span>
                      </div>
                    </td>

                    {/* Probability */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {isDeal ? (
                        <span className="inline-flex items-center rounded-lg bg-slate-50 border border-slate-200 px-2 py-0.5 text-xs font-bold text-[#163A2E]">
                          {stage.probability ?? 0}%
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 font-mono">—</span>
                      )}
                    </td>

                    {/* WhatsApp Template */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {isDeal ? (
                        <span className="text-xs text-slate-400 font-mono">—</span>
                      ) : (
                        mappingCell(whatsappTemplateFor(stage), waStatusOf(stage), 'WhatsApp')
                      )}
                    </td>

                    {/* Email Template */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {isDeal ? (
                        <span className="text-xs text-slate-400 font-mono">—</span>
                      ) : (
                        mappingCell(emailTemplateFor(stage), emailStatusOf(stage), 'Email')
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          stage.isActive === false
                            ? 'bg-slate-100 text-slate-600 border border-slate-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            stage.isActive === false ? 'bg-slate-400' : 'bg-emerald-500'
                          }`}
                        />
                        {stage.isActive === false ? 'Inactive' : 'Active'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 pl-4 pr-6 text-right whitespace-nowrap">
                      <AdminRowActions
                        record={stage}
                        recordName={stage.name}
                        onView={() => open('view', stage)}
                        viewLabel="View Stage Details"
                        onEdit={() => open('edit', stage)}
                        editLabel="Edit Stage"
                        onToggleStatus={() => setActive([keyOf(stage)], stage.isActive === false)}
                        statusLabel={stage.isActive === false ? 'Activate Stage' : 'Deactivate Stage'}
                        onDelete={() => {
                          setTargetStageId('');
                          setConfirm({
                            ids: [keyOf(stage)],
                            key: keyOf(stage),
                            stageId: stage.id,
                            name: stage.name,
                            used: usageOf(stage),
                            type: stage.type,
                          });
                        }}
                        deleteLabel="Delete Stage"
                        confirmDelete={false}
                      />
                    </td>
                  </tr>
                );
              })}
              {!loading && visible.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-16 text-center">
                    <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-[#107569] ring-1 ring-emerald-200/60">
                      <Layers className="size-7" />
                    </div>
                    <h3 className="mt-4 text-base font-bold text-slate-800">No stages found</h3>
                    <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                      {search || status !== 'ALL' || stageType !== 'ALL'
                        ? 'No pipeline stages match the specified search or filter criteria.'
                        : 'No pipeline stages configured yet. Click "Add Stage" to create one.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200/90 px-6 py-3.5 bg-slate-50/50 text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-700">{filtered.length > 0 ? (page - 1) * pageSize + 1 : 0}</span> to{' '}
            <span className="font-semibold text-slate-700">{Math.min(page * pageSize, filtered.length)}</span> of{' '}
            <span className="font-semibold text-slate-700">{filtered.length}</span> stages
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="h-8 px-2 rounded-lg border-slate-200 text-slate-600 hover:text-[#107569] disabled:opacity-40"
            >
              <ChevronLeft className="size-3.5" />
              <span className="sr-only">Previous</span>
            </Button>

            <div className="flex items-center px-2 font-medium text-slate-700">
              <span className="flex size-7 items-center justify-center rounded-lg bg-[#107569] text-white text-xs font-bold">
                {page}
              </span>
              <span className="mx-1 text-slate-400">/</span>
              <span className="text-slate-600 font-semibold">{pageCount}</span>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= pageCount}
              onClick={() => setPage(page + 1)}
              className="h-8 px-2 rounded-lg border-slate-200 text-slate-600 hover:text-[#107569] disabled:opacity-40"
            >
              <ChevronRight className="size-3.5" />
              <span className="sr-only">Next</span>
            </Button>
          </div>
        </div>
      </div>
      <FormDrawer size="md" contentClassName="sm:max-w-[720px]" open={Boolean(drawer)} onOpenChange={(open) => { if (!open && (!initialForm || JSON.stringify(form) === JSON.stringify(initialForm) || window.confirm('Discard unsaved changes?'))) setDrawer(null); }} title={drawer?.mode === 'edit' ? 'Edit Stage' : drawer?.mode === 'view' ? 'Stage Details' : 'Add Stage'} description="Stage name is required." showFooter={!viewing} submitLabel={drawer?.mode === 'edit' ? 'Update Stage' : 'Save Stage'} loading={saving} onSubmit={save}>
        <div className="space-y-4">
          {!dealForm && <nav aria-label="Stage sections" className="flex gap-1 border-b">{['General', 'Email Automation', 'WhatsApp Automation'].map((name) => <button key={name} type="button" onClick={() => setTab(name)} className={`px-3 py-2 text-sm font-medium ${tab === name ? 'border-b-2 border-emerald-700 text-emerald-700' : 'text-slate-500'}`}>{name}</button>)}</nav>}
          {validationError && <p role="alert" className="text-sm text-red-700">{validationError}</p>}
          {templateError && <p role="alert" className="text-sm text-red-700">{templateError} <button type="button" className="underline" onClick={() => loadTemplates()}>Retry</button></p>}
          <div hidden={!dealForm && tab !== 'General'} className="space-y-4">
          {drawer?.mode === 'create' ? (
            <div>
              <Label htmlFor="stage-type">Pipeline Type</Label>
              <select
                id="stage-type"
                value={form.type}
                onChange={(event) => { setForm({ ...form, type: event.target.value }); if (event.target.value === 'Lead') loadTemplates(); }}
                className="h-10 w-full rounded-md border border-[#E2E8E5] bg-white px-3 text-sm font-medium"
              >
                <option value="Lead">Lead Stage (Prospect lifecycle & auto-messaging)</option>
                <option value="Deal">Deal Stage (Revenue pipeline with win probability)</option>
              </select>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs">
              <span className="font-medium text-slate-600">Pipeline Type:</span>
              <span className={`font-semibold ${form.type === 'Deal' ? 'text-slate-700' : 'text-[#107569]'}`}>
                {form.type === 'Deal' ? 'Deal Pipeline' : 'Lead Stage'}
              </span>
            </div>
          )}
          <div><Label htmlFor="stage-name">Stage Name</Label><Input id="stage-name" value={form.name} disabled={viewing} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label htmlFor="stage-order">Display Order</Label><Input id="stage-order" type="number" value={form.order} disabled={viewing} onChange={(event) => setForm({ ...form, order: event.target.value })} /></div>
            {dealForm && <div><Label htmlFor="stage-probability">Probability (%)</Label><Input id="stage-probability" type="number" min="0" max="100" value={form.probability} disabled={viewing} onChange={(event) => setForm({ ...form, probability: event.target.value })} /></div>}
          </div>
          {dealForm && <div><Label htmlFor="stage-description">Description</Label><Textarea id="stage-description" value={form.description} disabled={viewing} onChange={(event) => setForm({ ...form, description: event.target.value })} /></div>}
          <div><Label htmlFor="stage-color">Color</Label><Input id="stage-color" type="color" value={form.color} disabled={viewing} onChange={(event) => setForm({ ...form, color: event.target.value })} /></div>
          <label className="flex items-center gap-2 text-sm text-[#172B24]"><input type="checkbox" checked={form.isActive} disabled={viewing} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />Active</label>
          </div>
          <div hidden={dealForm || tab !== 'Email Automation'} className="space-y-4">
          {!dealForm ? (
            <h3 className="mt-2 border-t border-[#E2E8E5] pt-4 text-sm font-bold text-[#172B24]">Email stage automation</h3>
          ) : null}
          {!dealForm && <label className="flex items-center gap-2 text-sm text-[#172B24]"><input type="checkbox" checked={form.emailEnabled} disabled={viewing} onChange={(event) => setForm({ ...form, emailEnabled: event.target.checked })} />Enable automatic email on stage entry</label>}
          {!dealForm && (
            <>
              <TemplateSelector label="Email template" kind="email" items={emailTemplates} value={form.emailTemplateId} loading={templateLoading} disabled={viewing} isEligible={(item) => item.isActive !== false} onChange={(value) => { setForm({ ...form, emailTemplateId: value }); setEmailPreview(null); }} />
              {selectedEmailTemplate && <div className="rounded-md bg-emerald-50 p-3 text-sm"><strong>Subject:</strong> {selectedEmailTemplate.subject}<div className="mt-2 whitespace-pre-wrap">{selectedEmailTemplate.body}</div></div>}
              <VariableMapping template={selectedEmailTemplate} kind="email" value={form.emailVariableMappingJson} disabled={viewing} onChange={(value) => setForm({ ...form, emailVariableMappingJson: value })} />
              {!viewing && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button type="button" size="sm" variant="outline" disabled={emailPreviewLoading} onClick={runEmailPreview}>
                    {emailPreviewLoading ? 'Preview…' : 'Preview email'}
                  </Button>
                </div>
              )}
              {emailPreview ? (
                <div className="rounded-md border border-[#E2E8E5] bg-[#F7F9F8] p-3 text-sm text-[#172B24] space-y-2">
                  {emailPreview.subject ? <p className="font-semibold">Subject: {emailPreview.subject}</p> : null}
                  <div className="whitespace-pre-wrap">{emailPreview.body || JSON.stringify(emailPreview, null, 2)}</div>
                </div>
              ) : null}
              {!viewing && (
                <>
                  <Label htmlFor="stage-email-test">Test email address</Label>
                  <Input id="stage-email-test" value={form.emailTestAddress} onChange={(event) => setForm({ ...form, emailTestAddress: event.target.value })} placeholder="you@company.com" />
                  <Button type="button" size="sm" variant="outline" disabled={emailTestSending} onClick={runEmailTestSend}>
                    {emailTestSending ? 'Sending…' : 'Send test email'}
                  </Button>
                </>
              )}
            </>
          )}
          </div>
          <div hidden={dealForm || tab !== 'WhatsApp Automation'} className="space-y-4">
          {!dealForm ? (
            <h3 className="mt-2 border-t border-[#E2E8E5] pt-4 text-sm font-bold text-[#172B24]">WhatsApp stage automation</h3>
          ) : null}
          {!dealForm && <label className="flex items-center gap-2 text-sm text-[#172B24]"><input type="checkbox" checked={form.whatsappEnabled} disabled={viewing} onChange={(event) => setForm({ ...form, whatsappEnabled: event.target.checked })} />Enable automatic WhatsApp on stage entry</label>}
          {!dealForm && (
            <>
              <div className="flex justify-end"><Button type="button" variant="outline" size="sm" disabled={templateLoading} onClick={() => loadTemplates(true)}>Refresh templates</Button></div>
              <TemplateSelector label="Approved Meta template" kind="whatsapp" items={metaTemplates} value={form.whatsappTemplateId} loading={templateLoading} disabled={viewing} isEligible={(item) => !waTemplateUnusable(item)} onChange={(value) => { setForm({ ...form, whatsappTemplateId: value }); setWaPreview(null); }} />
              {selectedMetaTemplate && <div className="rounded-md bg-emerald-50 p-3 text-sm space-y-2">{selectedMetaTemplate.headerContent && <p><strong>Header:</strong> {selectedMetaTemplate.headerContent}</p>}<p className="whitespace-pre-wrap">{selectedMetaTemplate.body}</p>{selectedMetaTemplate.footer && <p>{selectedMetaTemplate.footer}</p>}{selectedMetaTemplate.buttons && <p>Buttons: {JSON.stringify(selectedMetaTemplate.buttons)}</p>}</div>}
              {form.whatsappTemplateId && waTemplateUnusable(selectedMetaTemplate) ? (
                <p className="text-xs text-rose-600">The mapped template is not approved on Meta (local placeholder or unapproved). Select a Meta-synced APPROVED template and save, or run Meta Templates → Sync.</p>
              ) : null}
              <VariableMapping template={selectedMetaTemplate} kind="whatsapp" value={form.whatsappVariableMappingJson} disabled={viewing} onChange={(value) => setForm({ ...form, whatsappVariableMappingJson: value })} />
              <p className="text-xs text-[#718078]">When a lead enters this stage, the approved template is sent with mapped lead fields. Details Send also triggers the Send Details package when configured.</p>
              {!viewing && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button type="button" size="sm" variant="outline" disabled={waPreviewLoading} onClick={runWhatsappPreview}>
                    {waPreviewLoading ? 'Preview…' : 'Preview message'}
                  </Button>
                </div>
              )}
              {waPreview ? (
                <div className="rounded-md border border-[#E2E8E5] bg-[#F7F9F8] p-3 text-sm text-[#172B24] whitespace-pre-wrap">
                  {typeof waPreview === 'string' ? waPreview : (waPreview.body || JSON.stringify(waPreview, null, 2))}
                </div>
              ) : null}
              {!viewing && (
                <>
                  <Label htmlFor="stage-wa-test-phone">Test mobile number</Label>
                  <Input
                    id="stage-wa-test-phone"
                    value={form.whatsappTestPhone}
                    onChange={(event) => setForm({ ...form, whatsappTestPhone: event.target.value })}
                    placeholder="e.g. 919876543210"
                  />
                  <Button type="button" size="sm" variant="outline" disabled={waTestSending} onClick={runWhatsappTestSend}>
                    {waTestSending ? 'Sending…' : 'Send test WhatsApp'}
                  </Button>
                </>
              )}
            </>
          )}
          </div>
        </div>
      </FormDrawer>
      <ConfirmDialog open={Boolean(confirm)} onOpenChange={(open) => !open && setConfirm(null)} variant="destructive" title={confirm?.used > 0 ? 'Stage is in use' : 'Delete stage?'} description={confirm?.used > 0 ? (
        <span className="block space-y-3">
          <span className="block">{`"${confirm.name}" is used by ${confirm.used} ${confirm.type === 'Lead' ? 'lead' : 'deal'} record${confirm.used === 1 ? '' : 's'}. Those records are not deleted. Move them to another ${confirm.type === 'Lead' ? 'lead' : 'deal'} stage, or deactivate this stage.`}</span>
          {replacementStages.length > 0 ? (
            <select aria-label="Replacement stage" className="h-9 w-full rounded-md border border-[#E2E8E5] bg-white px-2 text-sm text-[#172B24]" value={targetStageId} onChange={(event) => setTargetStageId(event.target.value)}>
              <option value="">Select a {confirm.type === 'Lead' ? 'lead' : 'deal'} stage</option>
              {replacementStages.map((stage) => <option key={keyOf(stage)} value={stage.id}>{stage.name}{stage.isActive === false ? ' (inactive)' : ''}</option>)}
            </select>
          ) : <span className="block">No other active {confirm.type === 'Lead' ? 'lead' : 'deal'} stage is available. Deactivate this stage instead.</span>}
        </span>
      ) : 'This stage is not used by any records. It will be removed from the list and from mobile filters.'} confirmLabel={confirm?.used > 0 ? (replacementStages.length && targetStageId ? 'Move and delete' : 'Deactivate') : 'Delete'} onConfirm={() => (confirm?.used > 0 ? (replacementStages.length && targetStageId ? reassignAndDelete() : setActive(confirm.ids, false)) : runDelete(confirm.ids))} />
    </div>
  );
}
