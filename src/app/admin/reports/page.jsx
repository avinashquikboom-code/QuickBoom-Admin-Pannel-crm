'use client';

import * as React from 'react';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faBox, faBullhorn, faCalendar, faChartLine, faDownload, faFileInvoice, faFolder, faHandshake, faMoneyBill, faPhone, faSearch, faShareNodes, faShield, faStar, faUsers } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { toast } from '@/hooks/use-toast';
import { downloadReportPdf, loadReportCatalog, suiteError, viewReport } from '@/modules/suite/suite-api';

const ICONS = { star: faStar, handshake: faHandshake, users: faUsers, calendar: faCalendar, 'money-bill': faMoneyBill, 'file-invoice': faFileInvoice, phone: faPhone, boxes: faBox, bullhorn: faBullhorn, 'share-nodes': faShareNodes, 'chart-line': faChartLine, shield: faShield, folder: faFolder };

function favouriteKey() {
  if (typeof window === 'undefined') return 'qb-report-favourites';
  let userId = 'guest';
  let customerId = 'tenant';
  try {
    const user = JSON.parse(localStorage.getItem('quikboom-next-auth-storage') || '{}')?.state?.user;
    userId = user?.id || userId;
    customerId = user?.customerId || customerId;
  } catch { /* keep the guest key */ }
  return `qb-report-favourites:${customerId}:${userId}`;
}

export default function ReportsPage() {
  const [catalog, setCatalog] = React.useState({ categories: [], reports: [] });
  const [category, setCategory] = React.useState('sales');
  const [search, setSearch] = React.useState('');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [favourites, setFavourites] = React.useState([]);
  const [active, setActive] = React.useState(null);
  const [preview, setPreview] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    try { setFavourites(JSON.parse(localStorage.getItem(favouriteKey()) || '[]')); } catch { setFavourites([]); }
    loadReportCatalog().then((payload) => {
      const body = payload?.data?.categories ? payload.data : payload?.categories ? payload : payload?.data || {};
      setCatalog({ categories: body.categories || [], reports: body.reports || [] });
    }).catch((err) => setError(suiteError(err)));
  }, []);

  const toggleFavourite = (id) => {
    const next = favourites.includes(id) ? favourites.filter((item) => item !== id) : [...favourites, id];
    setFavourites(next);
    localStorage.setItem(favouriteKey(), JSON.stringify(next));
  };

  const reports = catalog.reports.filter((report) => {
    const text = `${report.name} ${report.description} ${report.category}`.toLowerCase();
    if (search && !text.includes(search.trim().toLowerCase())) return false;
    if (category === 'favourite') return favourites.includes(report.id);
    return report.category === category;
  });

  const openReport = async (report, page = 1) => {
    if (!report.available) return;
    setActive(report);
    setLoading(true);
    setError('');
    try {
      const payload = await viewReport({ reportId: report.id, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, status: status || undefined, department: status || undefined, page, limit: 20 });
      const body = payload?.data?.rows ? payload.data : payload?.rows ? payload : payload?.data || payload;
      setPreview(body);
    } catch (err) {
      setPreview(null);
      setError(suiteError(err));
      toast.error(suiteError(err));
    } finally {
      setLoading(false);
    }
  };

  const download = async (report) => {
    if (!report.available) return;
    try {
      const blob = await downloadReportPdf({ reportId: report.id, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, status: status || undefined, department: status || undefined, limit: 500, page: 1 });
      const file = blob instanceof Blob ? blob : new Blob([blob], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(file);
      link.download = `${report.id}.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      toast.error(suiteError(err));
    }
  };

  return <div className="w-full min-w-0 max-w-none space-y-5">
    <div className="flex w-full min-w-0 flex-col gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold text-[#172B24]">Reports & Analytics</h1>
        <p className="text-sm text-[#718078]">Generate, view and download business reports.</p>
      </div>
      <div className="grid w-full min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        <div className="relative sm:col-span-1"><FontAwesomeIcon icon={faSearch} className="absolute left-3 top-2.5 text-[#718078]" /><Input className="pl-9" placeholder="Search reports..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
        <Input type="date" aria-label="Start date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
        <Input type="date" aria-label="End date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
      </div>
    </div>
    <div className="flex gap-2 overflow-x-auto pb-1">
      {catalog.categories.map((item) => <button key={item.id} type="button" className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm ${category === item.id ? 'border-[#163A2E] bg-[#163A2E] text-white' : 'border-[#E2E8E5] bg-white text-[#172B24]'}`} onClick={() => setCategory(item.id)}><FontAwesomeIcon icon={ICONS[item.icon] || faFolder} />{item.name}</button>)}
    </div>
    {error && !active && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    <div className="grid w-full min-w-0 max-w-none gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))]">
      {reports.map((report) => <article key={report.id} className="flex min-w-0 flex-col rounded-2xl border border-[#E2E8E5] bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2"><span className="inline-flex size-9 items-center justify-center rounded-lg bg-[#E8F1EC] text-[#163A2E]"><FontAwesomeIcon icon={ICONS[catalog.categories.find((item) => item.id === report.category)?.icon] || faFolder} /></span><h2 className="font-semibold text-[#172B24]">{report.name}</h2></div>
          <button type="button" aria-label={favourites.includes(report.id) ? 'Remove favourite' : 'Add favourite'} onClick={() => toggleFavourite(report.id)}><FontAwesomeIcon icon={favourites.includes(report.id) ? faStar : faStarRegular} className={favourites.includes(report.id) ? 'text-[#D97706]' : 'text-[#718078]'} /></button>
        </div>
        <p className="mt-2 flex-1 text-sm text-[#718078]">{report.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button className="bg-[#163A2E] hover:bg-[#204C3D]" disabled={!report.available} onClick={() => openReport(report)}>{report.available ? 'View Report' : 'Not available'}</Button>
          <Button variant="outline" disabled={!report.available} onClick={() => download(report)}><FontAwesomeIcon icon={faDownload} className="mr-2" />Download PDF</Button>
        </div>
      </article>)}
      {!reports.length && <p className="text-sm text-[#718078]">No reports match this search.</p>}
    </div>
    <FormDrawer open={Boolean(active)} onOpenChange={(open) => { if (!open) { setActive(null); setPreview(null); } }} title={active?.name || 'Report'} description={active?.description || ''} size="xl" showFooter={false}>
      {active && <div className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <Input type="date" aria-label="Report start" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          <Input type="date" aria-label="Report end" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          {(active.filters || []).includes('status') && <Input placeholder="Status" value={status} onChange={(event) => setStatus(event.target.value)} />}
          {(active.filters || []).includes('stage') && <Input placeholder="Deal stage" value={status} onChange={(event) => setStatus(event.target.value)} />}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button className="bg-[#163A2E] hover:bg-[#204C3D]" onClick={() => openReport(active)}>Apply Filters</Button>
          <Button variant="outline" onClick={() => { setDateFrom(''); setDateTo(''); setStatus(''); }}>Reset Filters</Button>
          <Button variant="outline" onClick={() => openReport(active)}>Refresh Report</Button>
          <Button variant="outline" onClick={() => download(active)}><FontAwesomeIcon icon={faDownload} className="mr-2" />Download PDF</Button>
        </div>
        {loading && <p className="text-sm text-[#718078]">Loading report…</p>}
        {error && <p className="text-sm text-red-700">{error}</p>}
        {preview && <div className="space-y-2 text-sm">
          <p className="text-[#718078]">Period {preview.dateRange?.from} to {preview.dateRange?.to} · {preview.summary?.records ?? 0} records · Generated {preview.generatedAt ? new Date(preview.generatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : ''}</p>
          <div className="overflow-x-auto rounded-xl border border-[#E2E8E5]">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-[#E8F1EC] text-[#163A2E]"><tr>{(preview.columns || []).map((column) => <th key={column} className="px-3 py-2 font-medium">{column}</th>)}</tr></thead>
              <tbody>{(preview.rows || []).map((row, index) => <tr key={index} className="border-t border-[#E2E8E5]">{(preview.columns || []).map((column) => <td key={column} className="px-3 py-2">{String(row[column] ?? '—')}</td>)}</tr>)}{!(preview.rows || []).length && <tr><td className="px-3 py-6 text-[#718078]" colSpan={Math.max((preview.columns || []).length, 1)}>No records match these filters.</td></tr>}</tbody>
            </table>
          </div>
          <div className="flex justify-end gap-2"><Button variant="outline" size="sm" disabled={(preview.pagination?.page || 1) <= 1} onClick={() => openReport(active, (preview.pagination?.page || 1) - 1)}>Previous</Button><Button variant="outline" size="sm" disabled={(preview.pagination?.page || 1) >= (preview.pagination?.totalPages || 1)} onClick={() => openReport(active, (preview.pagination?.page || 1) + 1)}>Next</Button></div>
        </div>}
      </div>}
    </FormDrawer>
  </div>;
}
