'use client';

import * as React from 'react';
import Link from 'next/link';
import api from '../../../../lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { KpiGrid } from '@/components/common/KpiCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SegmentedTabs } from '@/components/ui/segmented-tabs';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faBullhorn, faDownload, faMessage, faPlus, faRotate } from '@fortawesome/free-solid-svg-icons';
import { toast } from '@/hooks/use-toast';
import { downloadCsv, envelope, pageOf, Pager, rowsOf, TemplateTable } from '../template-shared';
import { MetaTemplateDetails } from './meta-shared';

const LIST_TABS = [
  { label: 'All Templates', value: 'ALL' },
  { label: 'Single Templates', value: 'SINGLE' },
  { label: 'Campaigns', value: 'CAMPAIGN' },
];

export function MetaTemplatesAll() {
  const [rows, setRows] = React.useState([]);
  const [stats, setStats] = React.useState({});
  const [listTab, setListTab] = React.useState('ALL');
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('ALL');
  const [language, setLanguage] = React.useState('ALL');
  const [languageChoices, setLanguageChoices] = React.useState(['ALL']);
  const [category, setCategory] = React.useState('ALL');
  const [templateType, setTemplateType] = React.useState('ALL');
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);
  const [pages, setPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [syncing, setSyncing] = React.useState(false);
  const [syncInfo, setSyncInfo] = React.useState(null);
  const [selected, setSelected] = React.useState(null);
  const [testPhone, setTestPhone] = React.useState('');
  const [testCountry, setTestCountry] = React.useState('+91');
  const [testVariables, setTestVariables] = React.useState({});
  const [testSending, setTestSending] = React.useState(false);
  const [testResult, setTestResult] = React.useState(null);

  const sourceFilter = listTab === 'SINGLE' ? 'SINGLE' : listTab === 'CAMPAIGN' ? 'CAMPAIGN' : templateType !== 'ALL' ? templateType : undefined;

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const payload = envelope(
        await api.get('/templates/meta', {
          params: {
            page,
            limit,
            search: search || undefined,
            status: status === 'ALL' ? undefined : status,
            language: language === 'ALL' ? undefined : language,
            category: category === 'ALL' ? undefined : category,
            source: sourceFilter,
          },
        }),
      );
      const list = rowsOf(payload);
      const pagination = pageOf(payload, { page, totalPages: 1, total: list.length });
      setRows(list);
      if (language === 'ALL') {
        setLanguageChoices(['ALL', ...Array.from(new Set(list.map((row) => row.language).filter(Boolean)))]);
      }
      setPages(Math.max(1, Number(pagination.totalPages) || 1));
      setTotal(Number(pagination.total) || list.length);
      if (payload?.stats) setStats(payload.stats);
    } catch (err) {
      setError(err?.response?.data?.message || 'Meta templates could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, status, language, category, sourceFilter]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function sync() {
    setSyncing(true);
    try {
      const result = envelope(await api.post('/templates/meta/sync', {}));
      setSyncInfo(result);
      if (result?.success === false) toast.error(result?.message || 'Meta sync failed.');
      else toast.success(result?.message || 'Meta templates synchronized');
      load();
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Meta sync failed.';
      setSyncInfo({ success: false, message });
      toast.error(message);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="min-w-0 w-full max-w-full space-y-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <PageHeader
        title="WhatsApp Meta Templates"
        icon={faMessage}
        description="Manage your WhatsApp Business templates, create new templates and run campaigns."
        actions={
          <div className="flex min-w-0 w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button type="button" variant="outline" disabled={syncing} onClick={sync} className="w-full sm:w-auto">
              <FontAwesomeIcon icon={faRotate} className="mr-2" />
              {syncing ? 'Syncing…' : 'Sync from Meta'}
            </Button>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/admin/sections/meta-templates/create">
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Add Single Template
              </Link>
            </Button>
            <Button asChild variant="secondary" className="w-full sm:w-auto">
              <Link href="/admin/sections/meta-templates/campaigns">
                <FontAwesomeIcon icon={faBullhorn} className="mr-2" />
                Create Campaign
              </Link>
            </Button>
          </div>
        }
      />

      <KpiGrid
        className="grid-cols-1 min-[440px]:grid-cols-2 xl:grid-cols-6"
        cards={[
          { title: 'All Templates', value: stats.total || 0, icon: faMessage },
          { title: 'Approved', value: stats.approved || 0, icon: faMessage },
          { title: 'Pending', value: stats.pending || 0, icon: faMessage },
          { title: 'Rejected', value: stats.rejected || 0, icon: faMessage },
          { title: 'Paused', value: stats.paused || 0, icon: faMessage },
          { title: 'Disabled', value: stats.disabled || 0, icon: faMessage },
        ]}
      />

      <SegmentedTabs tabs={LIST_TABS} value={listTab} onChange={(value) => { setListTab(value); setPage(1); }} />

      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <Input
          value={search}
          onChange={(event) => { setSearch(event.target.value); setPage(1); }}
          placeholder="Search template name or code"
          className="h-10 w-full min-w-0 lg:max-w-sm"
        />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="h-10 w-full rounded-md border border-[#E2E8E5] bg-white px-3 text-sm lg:w-auto">
          {['ALL', 'APPROVED', 'PENDING', 'REJECTED', 'PAUSED', 'DISABLED'].map((item) => (
            <option key={item} value={item}>{item === 'ALL' ? 'All statuses' : item}</option>
          ))}
        </select>
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="h-10 w-full rounded-md border border-[#E2E8E5] bg-white px-3 text-sm lg:w-auto">
          {['ALL', 'UTILITY', 'MARKETING', 'AUTHENTICATION'].map((item) => (
            <option key={item} value={item}>{item === 'ALL' ? 'All categories' : item}</option>
          ))}
        </select>
        <select value={language} onChange={(e) => { setLanguage(e.target.value); setPage(1); }} className="h-10 w-full rounded-md border border-[#E2E8E5] bg-white px-3 text-sm lg:w-auto">
          {languageChoices.map((item) => (
            <option key={item} value={item}>{item === 'ALL' ? 'All languages' : item}</option>
          ))}
        </select>
        {listTab === 'ALL' ? (
          <select value={templateType} onChange={(e) => { setTemplateType(e.target.value); setPage(1); }} className="h-10 w-full rounded-md border border-[#E2E8E5] bg-white px-3 text-sm lg:w-auto">
            {['ALL', 'META_SYNC', 'QB_SINGLE', 'QB_CAMPAIGN'].map((item) => (
              <option key={item} value={item}>{item === 'ALL' ? 'All origins' : item.replace('QB_', 'QB ').replace('META_', 'Meta ')}</option>
            ))}
          </select>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className="w-full lg:w-auto"
          onClick={() => downloadCsv('meta-templates.csv', [{ key: 'name', label: 'Name' }, { key: 'templateName', label: 'Code' }, { key: 'language', label: 'Language' }, { key: 'status', label: 'Status' }], rows)}
        >
          <FontAwesomeIcon icon={faDownload} className="mr-2" />
          Export CSV
        </Button>
      </div>

      {syncInfo ? (
        <p className={`text-sm ${syncInfo.success === false ? 'text-red-600' : 'text-[#718078]'}`}>
          Fetched {syncInfo.fetched ?? 0}, added {syncInfo.created ?? 0}, updated {syncInfo.updated ?? 0}, unchanged {syncInfo.unchanged ?? 0}, failed {syncInfo.failed?.length ?? 0}. {syncInfo.message}
        </p>
      ) : null}

      <div className="hidden md:block">
        <TemplateTable
          loading={loading}
          error={error}
          rows={rows}
          empty="No WhatsApp templates are available. Sync from Meta or create a single template."
          columns={['Name', 'Code', 'Language', 'Category', 'Approval', 'Actions']}
          render={(row) => (
            <tr key={row.id} className="border-t border-[#E2E8E5]">
              <td className="px-3 py-3">{row.name}</td>
              <td className="px-3 py-3 font-mono text-xs">{row.templateName || row.key}</td>
              <td className="px-3 py-3">{row.language}</td>
              <td className="px-3 py-3">{row.category}</td>
              <td className="px-3 py-3">
                <span className="rounded-full bg-[#E8F1EC] px-2 py-1 text-xs font-semibold text-[#163A2E]">{row.status}</span>
              </td>
              <td className="whitespace-nowrap px-3 py-3">
                <button type="button" className="mr-3 text-[#163A2E]" onClick={() => setSelected(row)}>View</button>
                <button
                  type="button"
                  className="text-[#163A2E]"
                  onClick={async () => {
                    await api.patch(`/templates/meta/${row.id}/toggle`, {});
                    load();
                  }}
                >
                  {row.isLocalActive ? 'Deactivate' : 'Activate'}
                </button>
              </td>
            </tr>
          )}
        />
      </div>

      <div className="space-y-3 md:hidden">
        {loading ? <p className="rounded-xl border p-5 text-sm">Loading templates…</p> : error ? <p className="rounded-xl border border-red-200 p-4 text-sm text-red-700">{error}</p> : rows.length ? rows.map((row) => (
          <article key={row.id} className="space-y-2 rounded-xl border border-[#E2E8E5] bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="min-w-0 break-words font-semibold">{row.name}</h3>
              <span className="shrink-0 rounded-full bg-[#E8F1EC] px-2 py-1 text-xs">{row.status}</span>
            </div>
            <p className="break-all font-mono text-xs text-[#718078]">{row.templateName || row.key}</p>
            <p className="text-xs text-[#718078]">{row.category} · {row.language}</p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setSelected(row)}>View</Button>
              <Button type="button" variant="outline" className="flex-1" onClick={async () => { await api.patch(`/templates/meta/${row.id}/toggle`, {}); load(); }}>{row.isLocalActive ? 'Deactivate' : 'Activate'}</Button>
            </div>
          </article>
        )) : <p className="rounded-xl border p-5 text-sm text-[#718078]">No templates found.</p>}
      </div>

      <Pager page={page} pages={pages} limit={limit} total={total} onPage={setPage} onLimit={(value) => { setLimit(value); setPage(1); }} />

      {selected ? (
        <div className="fixed inset-0 z-50 bg-black/25" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
          <aside className="ml-auto flex h-[100dvh] w-full max-w-[min(520px,100vw)] flex-col overflow-hidden border-l bg-white shadow-xl">
            <div className="flex items-start justify-between border-b p-5">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#718078]">Template Details</p>
                <h2 className="mt-1 break-words text-lg font-bold">{selected.name}</h2>
                <span className="mt-2 inline-flex rounded-full bg-[#E8F1EC] px-2 py-1 text-xs">{selected.status}</span>
              </div>
              <button className="min-h-11 min-w-11 rounded-lg border" aria-label="Close details" onClick={() => setSelected(null)}>×</button>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
              <MetaTemplateDetails template={selected} />
              <section className="space-y-3 rounded-xl border p-4">
                <h3 className="font-semibold">Test send</h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[110px_1fr]">
                  <select value={testCountry} onChange={(e) => setTestCountry(e.target.value)} className="h-11 rounded-md border px-2">
                    <option value="+91">+91</option>
                    <option value="+1">+1</option>
                  </select>
                  <input value={testPhone} onChange={(e) => setTestPhone(e.target.value)} placeholder="Phone number" className="h-11 rounded-md border px-3" />
                </div>
                <Button
                  type="button"
                  disabled={testSending || !testPhone.trim()}
                  onClick={async () => {
                    setTestSending(true);
                    setTestResult(null);
                    try {
                      const result = envelope(await api.post('/templates/meta/test-send', {
                        templateId: selected.id,
                        to: `${testCountry}${testPhone.replace(/\D/g, '')}`,
                        variables: testVariables,
                      }));
                      setTestResult({ ok: true, text: `Accepted · ${result.messageId || result.status || 'OK'}` });
                    } catch (err) {
                      setTestResult({ ok: false, text: err?.response?.data?.message || err?.message || 'Test send failed' });
                    } finally {
                      setTestSending(false);
                    }
                  }}
                >
                  {testSending ? 'Sending…' : 'Send test'}
                </Button>
                {testResult ? <p className={`text-sm ${testResult.ok ? 'text-emerald-700' : 'text-red-700'}`}>{testResult.text}</p> : null}
              </section>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
