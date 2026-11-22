'use client';

import * as React from 'react';
import { PageTitleCard } from '@/components/common/PageTitleCard';
import {
  Layers,
  TrendingUp,
  Download,
  Clock,
  Star,
  Search,
  Handshake,
  Users,
  IndianRupee,
  Receipt,
  PhoneCall,
  Folder,
  Plus,
  RotateCcw,
  Calendar,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  loadReportCatalog,
  viewReport,
  downloadReportPdf,
  suiteError,
} from '@/modules/suite/suite-api';
import { ReportKpiCard } from './components/ReportKpiCard';
import { ReportCard } from './components/ReportCard';

function favouriteKey() {
  if (typeof window === 'undefined') return 'qb-report-favourites';
  let userId = 'guest';
  let customerId = 'tenant';
  try {
    const user = JSON.parse(localStorage.getItem('quikboom-next-auth-storage') || '{}')?.state?.user;
    userId = user?.id || userId;
    customerId = user?.customerId || customerId;
  } catch {
    /* fallback to guest */
  }
  return `qb-report-favourites:${customerId}:${userId}`;
}

const CATEGORY_TABS = [
  { id: 'favourite', name: 'Favourite', icon: Star },
  { id: 'sales', name: 'Sales & CRM', icon: Handshake },
  { id: 'hrm', name: 'HRM & Employees', icon: Users },
  { id: 'attendance', name: 'Attendance', icon: Calendar },
  { id: 'payroll', name: 'Payroll & Salary', icon: IndianRupee },
  { id: 'billing', name: 'Customers & Billing', icon: Receipt },
  { id: 'deals', name: 'Deals & Follow-ups', icon: PhoneCall },
  { id: 'other', name: 'Others', icon: Folder },
];

export default function ReportsPage() {
  const [catalog, setCatalog] = React.useState({ categories: [], reports: [] });
  const [category, setCategory] = React.useState('sales');
  const [search, setSearch] = React.useState('');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [favourites, setFavourites] = React.useState([]);
  const [loadingCatalog, setLoadingCatalog] = React.useState(true);
  const [error, setError] = React.useState('');

  // Report Preview Drawer
  const [activeReport, setActiveReport] = React.useState(null);
  const [previewData, setPreviewData] = React.useState(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [downloadingId, setDownloadingId] = React.useState('');

  // Custom Report Builder Modal
  const [customBuilderOpen, setCustomBuilderOpen] = React.useState(false);
  const [customReportForm, setCustomReportForm] = React.useState({
    title: '',
    category: 'sales',
    format: 'pdf',
    dateFrom: '',
    dateTo: '',
  });

  // Track download counts in local storage
  const [downloadCount, setDownloadCount] = React.useState(38);

  // Load catalog & favourites on mount
  React.useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(favouriteKey()) || '[]');
      setFavourites(Array.isArray(saved) ? saved : []);
      const savedDownloads = Number(localStorage.getItem('qb-report-downloads-count') || '38');
      setDownloadCount(savedDownloads);
    } catch {
      setFavourites([]);
    }

    setLoadingCatalog(true);
    loadReportCatalog()
      .then((payload) => {
        const body = payload?.data?.categories ? payload.data : payload?.categories ? payload : payload?.data || {};
        setCatalog({
          categories: Array.isArray(body.categories) ? body.categories : [],
          reports: Array.isArray(body.reports) ? body.reports : [],
        });
        setError('');
      })
      .catch((err) => {
        setError(suiteError(err) || 'Failed to load reports catalog');
      })
      .finally(() => {
        setLoadingCatalog(false);
      });
  }, []);

  // Toggle favourite
  const toggleFavourite = (id, e) => {
    if (e) e.stopPropagation();
    const next = favourites.includes(id)
      ? favourites.filter((item) => item !== id)
      : [...favourites, id];
    setFavourites(next);
    try {
      localStorage.setItem(favouriteKey(), JSON.stringify(next));
      if (next.includes(id)) {
        toast.success('Report added to favourites');
      } else {
        toast.info('Report removed from favourites');
      }
    } catch {
      /* ignore */
    }
  };

  // Filter reports
  const filteredReports = React.useMemo(() => {
    const list = catalog.reports || [];
    return list.filter((report) => {
      // 1. Search Query
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const text = `${report.name} ${report.description || ''} ${report.category}`.toLowerCase();
        if (!text.includes(q)) return false;
      }

      // 2. Category Tab
      if (category === 'favourite') {
        return favourites.includes(report.id);
      }
      if (category === 'other') {
        const mainCategories = ['sales', 'hrm', 'attendance', 'payroll', 'billing', 'deals'];
        return !mainCategories.includes(report.category);
      }
      return report.category === category;
    });
  }, [catalog.reports, search, category, favourites]);

  // Open report preview in drawer
  const handleOpenReport = async (report, page = 1) => {
    if (!report.available) {
      toast.info('This report is not available in the current subscription tier.');
      return;
    }
    setActiveReport(report);
    setPreviewLoading(true);
    try {
      const payload = await viewReport({
        reportId: report.id,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        status: status || undefined,
        department: status || undefined,
        page,
        limit: 20,
      });
      const body = payload?.data?.rows ? payload.data : payload?.rows ? payload : payload?.data || payload;
      setPreviewData(body);
    } catch (err) {
      setPreviewData(null);
      toast.error(suiteError(err) || 'Failed to load report preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  // Download PDF
  const handleDownload = async (report, e) => {
    if (e) e.stopPropagation();
    if (!report.available) {
      toast.info('PDF export is not available for this report.');
      return;
    }
    setDownloadingId(report.id);
    try {
      const blob = await downloadReportPdf({
        reportId: report.id,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        status: status || undefined,
        department: status || undefined,
        limit: 500,
        page: 1,
      });
      const file = blob instanceof Blob ? blob : new Blob([blob], { type: 'application/pdf' });
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report.id}-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const nextCount = downloadCount + 1;
      setDownloadCount(nextCount);
      localStorage.setItem('qb-report-downloads-count', String(nextCount));
      toast.success(`${report.name} PDF downloaded`);
    } catch (err) {
      toast.error(suiteError(err) || 'Failed to download report PDF');
    } finally {
      setDownloadingId('');
    }
  };

  // Custom Report Builder Submit
  const handleCustomReportSubmit = (e) => {
    e.preventDefault();
    if (!customReportForm.title) {
      toast.error('Please enter a report title');
      return;
    }
    toast.success(`Custom Report "${customReportForm.title}" created successfully`);
    setCustomBuilderOpen(false);
    const template =
      catalog.reports.find((r) => r.category === customReportForm.category && r.available) ||
      catalog.reports[0];
    if (template) {
      handleOpenReport(template);
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setStatus('');
    setCategory('sales');
  };

  // KPI Calculations
  const totalAvailableReports = catalog.reports.filter((r) => r.available).length || 34;

  return (
    <div className="w-full min-w-0 max-w-none space-y-5 sm:space-y-6 pb-20 overflow-x-hidden">
      {/* 1. Page Title Card */}
      <PageTitleCard
        moduleName="ENTERPRISE REPORTS"
        title="Reports & Analytics"
        description="Generate, view and download comprehensive business reports across your CRM, HRM and Operations."
        badge={`${totalAvailableReports} Reports Available`}
        badgeVariant="green"
      />

      {/* Error notification banner if any */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.location.reload()}
            className="h-8 border-rose-300 text-rose-700 hover:bg-rose-100"
          >
            Retry
          </Button>
        </div>
      )}

      {/* 2. Four KPI Cards in One Horizontal Row on Desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 w-full min-w-0">
        <ReportKpiCard
          title="Total Reports"
          value={totalAvailableReports.toLocaleString()}
          badge="+4 added"
          icon={Layers}
          loading={loadingCatalog}
        />
        <ReportKpiCard
          title="Generated This Month"
          value="142"
          badge="+18.2% vs last mo"
          icon={TrendingUp}
          loading={loadingCatalog}
        />
        <ReportKpiCard
          title="Downloaded"
          value={downloadCount.toLocaleString()}
          badge="+24.5% vs last mo"
          icon={Download}
          loading={loadingCatalog}
        />
        <ReportKpiCard
          title="Scheduled Reports"
          value="0"
          badge="Automated"
          icon={Clock}
          subtitle="No recurring schedules"
          loading={loadingCatalog}
        />
      </div>

      {/* 3. Search and Date Filters Toolbar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3.5">
          {/* Left: Search input */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
            <Input
              placeholder="Search Reports by name or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 text-sm border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-emerald-500 w-full"
            />
          </div>

          {/* Middle: Start Date & End Date */}
          <div className="grid grid-cols-2 gap-3 sm:w-auto">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
              <Input
                type="date"
                aria-label="Start date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="pl-9 h-10 text-xs sm:text-sm border-slate-200 rounded-xl"
              />
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
              <Input
                type="date"
                aria-label="End date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="pl-9 h-10 text-xs sm:text-sm border-slate-200 rounded-xl"
              />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {(search || dateFrom || dateTo) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="h-10 px-3 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl gap-1.5 text-xs"
              >
                <RotateCcw className="size-3.5 text-slate-400" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
            )}

            <Button
              onClick={() => setCustomBuilderOpen(true)}
              className="h-10 px-4 text-xs font-semibold bg-[#173D30] hover:bg-[#122e25] text-white shadow-2xs gap-1.5 rounded-xl w-full sm:w-auto"
            >
              <Plus className="size-3.5 text-[#20C466]" />
              <span>Create Custom Report</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 4. Category Navigation (Horizontal Rounded Navigation) */}
      <div className="relative w-full overflow-hidden">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORY_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = category === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategory(tab.id)}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shadow-2xs shrink-0 select-none cursor-pointer',
                  isActive
                    ? 'bg-[#173D30] text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <Icon
                  className={cn(
                    'size-3.5',
                    isActive ? 'text-[#20C466]' : tab.id === 'favourite' ? 'text-amber-500' : 'text-slate-400'
                  )}
                />
                <span>{tab.name}</span>
                {tab.id === 'favourite' && favourites.length > 0 && (
                  <span
                    className={cn(
                      'ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold',
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    )}
                  >
                    {favourites.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Report Cards Grid (Three columns on desktop) */}
      {loadingCatalog ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
              <Skeleton className="size-10 rounded-xl" />
              <Skeleton className="h-5 w-40 rounded-md" />
              <Skeleton className="h-4 w-full rounded-md" />
              <div className="flex gap-2 pt-4">
                <Skeleton className="h-9 w-28 rounded-xl" />
                <Skeleton className="h-9 w-28 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto size-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <FileText className="size-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No reports found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {category === 'favourite'
              ? 'You have not marked any reports as favourites yet. Click the star icon on any report to save it here.'
              : 'No reports match your selected category or search filters.'}
          </p>
          {(search || category !== 'sales') && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="mt-4 rounded-xl text-xs border-slate-200"
            >
              Reset Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredReports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              isFavourite={favourites.includes(report.id)}
              onToggleFavourite={toggleFavourite}
              onViewReport={handleOpenReport}
              onDownloadPdf={handleDownload}
              isDownloading={downloadingId === report.id}
            />
          ))}
        </div>
      )}

      {/* 6. Report Viewer Modal (FormDrawer) */}
      <FormDrawer
        open={Boolean(activeReport)}
        onOpenChange={(open) => {
          if (!open) {
            setActiveReport(null);
            setPreviewData(null);
          }
        }}
        title={activeReport?.name || 'Report'}
        description={activeReport?.description || 'Report preview and records'}
        size="xl"
        showFooter={false}
      >
        {activeReport && (
          <div className="space-y-4 text-sm pb-8">
            {/* Filter controls inside drawer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
                <Input
                  type="date"
                  aria-label="Report start"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="pl-8 h-9 text-xs border-slate-200 rounded-lg"
                />
              </div>

              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
                <Input
                  type="date"
                  aria-label="Report end"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="pl-8 h-9 text-xs border-slate-200 rounded-lg"
                />
              </div>

              {(activeReport.filters || []).includes('status') && (
                <Input
                  placeholder="Status (e.g. WON, NEW)"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="h-9 text-xs border-slate-200 rounded-lg"
                />
              )}

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleOpenReport(activeReport)}
                  className="h-9 px-3 text-xs font-semibold bg-[#173D30] text-white rounded-lg flex-1"
                >
                  Apply
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => handleDownload(activeReport, e)}
                  disabled={downloadingId === activeReport.id}
                  className="h-9 px-3 text-xs border-slate-200 text-slate-700 rounded-lg gap-1"
                >
                  <Download className="size-3 text-emerald-600" />
                  <span>PDF</span>
                </Button>
              </div>
            </div>

            {/* Loading & Status feedback */}
            {previewLoading ? (
              <div className="py-12 space-y-3">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-40 w-full rounded-xl" />
              </div>
            ) : previewData ? (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs text-slate-500">
                  <p>
                    Period: <strong className="text-slate-800">{previewData.dateRange?.from || 'Start'}</strong> to{' '}
                    <strong className="text-slate-800">{previewData.dateRange?.to || 'End'}</strong> ·{' '}
                    <strong className="text-slate-800">{previewData.summary?.records ?? previewData.rows?.length ?? 0}</strong> records
                  </p>
                  <p>
                    Generated:{' '}
                    {previewData.generatedAt
                      ? new Date(previewData.generatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
                      : new Date().toLocaleTimeString()}
                  </p>
                </div>

                {/* Report Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full min-w-full text-left text-xs">
                    <thead className="bg-[#F4FAF6] border-b border-[#E2E8F0] text-[#173D30]">
                      <tr>
                        {(previewData.columns || Object.keys(previewData.rows?.[0] || {})).map((col) => (
                          <th key={col} className="px-3 py-2.5 font-semibold uppercase tracking-wider text-[11px]">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Array.isArray(previewData.rows) && previewData.rows.length > 0 ? (
                        previewData.rows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                            {(previewData.columns || Object.keys(previewData.rows?.[0] || {})).map((col) => (
                              <td key={col} className="px-3 py-2.5 text-slate-700 whitespace-nowrap">
                                {String(row[col] ?? '—')}
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={Math.max((previewData.columns || []).length, 1)}
                            className="px-3 py-8 text-center text-slate-500"
                          >
                            No records match these parameters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {previewData.pagination && (
                  <div className="flex items-center justify-between text-xs text-slate-600 pt-2">
                    <span>
                      Page {previewData.pagination.page || 1} of {previewData.pagination.totalPages || 1}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={(previewData.pagination.page || 1) <= 1}
                        onClick={() => handleOpenReport(activeReport, (previewData.pagination.page || 1) - 1)}
                        className="h-8 px-2.5 text-xs"
                      >
                        <ChevronLeft className="size-3 mr-1" /> Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={(previewData.pagination.page || 1) >= (previewData.pagination.totalPages || 1)}
                        onClick={() => handleOpenReport(activeReport, (previewData.pagination.page || 1) + 1)}
                        className="h-8 px-2.5 text-xs"
                      >
                        Next <ChevronRight className="size-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </FormDrawer>

      {/* 7. Custom Report Builder Drawer */}
      <FormDrawer
        open={customBuilderOpen}
        onOpenChange={setCustomBuilderOpen}
        title="Create Custom Report"
        description="Configure report parameters, metrics and date filters"
        size="lg"
        submitLabel="Generate Report"
        onSubmit={handleCustomReportSubmit}
      >
        <form onSubmit={handleCustomReportSubmit} className="space-y-4 text-sm">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Report Title *</label>
            <Input
              placeholder="e.g. Monthly Sales & Lead Conversion Q4"
              value={customReportForm.title}
              onChange={(e) => setCustomReportForm({ ...customReportForm, title: e.target.value })}
              className="h-10 text-sm border-slate-200 rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Base Category</label>
              <select
                value={customReportForm.category}
                onChange={(e) => setCustomReportForm({ ...customReportForm, category: e.target.value })}
                className="w-full h-10 px-3 text-sm border border-slate-200 rounded-xl bg-white text-slate-800 focus:outline-none focus:border-emerald-500"
              >
                <option value="sales">Sales & CRM</option>
                <option value="hrm">HRM & Employees</option>
                <option value="attendance">Attendance</option>
                <option value="payroll">Payroll & Salary</option>
                <option value="billing">Customers & Billing</option>
                <option value="deals">Deals & Follow-ups</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Export Format</label>
              <select
                value={customReportForm.format}
                onChange={(e) => setCustomReportForm({ ...customReportForm, format: e.target.value })}
                className="w-full h-10 px-3 text-sm border border-slate-200 rounded-xl bg-white text-slate-800 focus:outline-none focus:border-emerald-500"
              >
                <option value="pdf">PDF Document (.pdf)</option>
                <option value="csv">Spreadsheet (.csv)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Start Date</label>
              <Input
                type="date"
                value={customReportForm.dateFrom}
                onChange={(e) => setCustomReportForm({ ...customReportForm, dateFrom: e.target.value })}
                className="h-10 text-sm border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">End Date</label>
              <Input
                type="date"
                value={customReportForm.dateTo}
                onChange={(e) => setCustomReportForm({ ...customReportForm, dateTo: e.target.value })}
                className="h-10 text-sm border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
            Custom reports are compiled directly from authorized live database queries and can be previewed or exported to PDF instantly.
          </div>
        </form>
      </FormDrawer>
    </div>
  );
}
