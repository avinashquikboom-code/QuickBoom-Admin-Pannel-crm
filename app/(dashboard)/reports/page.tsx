'use client';

import React, { useState, useMemo } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  Users,
  DollarSign,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  Briefcase,
  MapPin,
  TrendingUp,
  Search,
  Filter,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { getErrorMessage } from '@/lib/utils';
import ReportsService, {
  ReportModuleType,
  ReportSummary,
  ExportReportPayload,
} from '@/lib/services/reports.service';
import { AdminDataTable, ColumnDef } from '@/components/admin/tables/AdminDataTable';
import { AdminPagination } from '@/components/admin/tables/AdminPagination';
import { AdminStatCard } from '@/components/admin/cards/AdminStatCard';
import { AdminStatusBadge } from '@/components/admin/badges/AdminStatusBadge';

// Helper for quick date presets
function getDatePreset(preset: 'TODAY' | '7DAYS' | '30DAYS' | 'MONTH') {
  const now = new Date();
  const toStr = now.toISOString().split('T')[0];

  if (preset === 'TODAY') {
    return { from: toStr, to: toStr };
  }
  if (preset === '7DAYS') {
    const past = new Date();
    past.setDate(past.getDate() - 7);
    return { from: past.toISOString().split('T')[0], to: toStr };
  }
  if (preset === '30DAYS') {
    const past = new Date();
    past.setDate(past.getDate() - 30);
    return { from: past.toISOString().split('T')[0], to: toStr };
  }
  // This month (from 1st)
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: firstDay.toISOString().split('T')[0], to: toStr };
}

export default function ReportsPage() {
  const [downloadingType, setDownloadingType] = useState<string | null>(null);

  // Date Range state (Default to past 30 days)
  const defaultPreset = useMemo(() => getDatePreset('30DAYS'), []);
  const [datePreset, setDatePreset] = useState<'TODAY' | '7DAYS' | '30DAYS' | 'MONTH' | 'CUSTOM'>('30DAYS');
  const [dateFrom, setDateFrom] = useState(defaultPreset.from);
  const [dateTo, setDateTo] = useState(defaultPreset.to);

  // Active module tab
  const [activeModule, setActiveModule] = useState<ReportModuleType>('ATTENDANCE');

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Handler to change preset
  const handlePresetChange = (preset: 'TODAY' | '7DAYS' | '30DAYS' | 'MONTH') => {
    setDatePreset(preset);
    const range = getDatePreset(preset);
    setDateFrom(range.from);
    setDateTo(range.to);
    setPage(1);
  };

  // 1. Fetch Real Summary KPIs
  const {
    data: summaryData,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
    isFetching: isSummaryFetching,
  } = useQuery({
    queryKey: ['admin-reports-summary', dateFrom, dateTo],
    queryFn: async () => {
      return ReportsService.getSummary({ dateFrom, dateTo });
    },
    staleTime: 60000,
  });

  // 2. Fetch Real Paginated Module Data
  const {
    data: moduleDataResponse,
    isLoading: isDataLoading,
    refetch: refetchData,
    isFetching: isDataFetching,
  } = useQuery({
    queryKey: ['admin-reports-data', activeModule, dateFrom, dateTo, statusFilter, search, page],
    queryFn: async () => {
      return ReportsService.getReportData({
        type: activeModule,
        dateFrom,
        dateTo,
        status: statusFilter,
        search: search.trim() || undefined,
        page,
        limit: pageSize,
      });
    },
    staleTime: 30000,
  });

  // Master Export Action
  const handleExport = async (reportType: ReportModuleType, format: 'CSV' | 'PDF' = 'CSV') => {
    try {
      setDownloadingType(`${reportType}-${format}`);
      const payload: ExportReportPayload = {
        reportType,
        format,
        dateFrom,
        dateTo,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: search.trim() || undefined,
      };

      const result = await ReportsService.exportReport(payload);

      if (result?.data) {
        const blob = new Blob([result.data], {
          type: format === 'CSV' ? 'text/csv;charset=utf-8;' : 'application/pdf',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', result.filename || `report_${reportType.toLowerCase()}.${format.toLowerCase()}`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success(`${reportType} report exported successfully (${result.rowsCount || 0} rows)`);
      } else {
        toast.success(`${reportType} report exported successfully`);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDownloadingType(null);
    }
  };

  // Switch Module Tab
  const handleTabChange = (mod: ReportModuleType) => {
    setActiveModule(mod);
    setStatusFilter('ALL');
    setSearch('');
    setPage(1);
  };

  // Define Columns depending on Active Module
  const columns: ColumnDef<any>[] = useMemo(() => {
    switch (activeModule) {
      case 'ATTENDANCE':
        return [
          {
            key: 'date',
            header: 'Date',
            render: (item) => <span className="font-bold text-slate-800">{item.date}</span>,
          },
          {
            key: 'employee',
            header: 'Employee',
            render: (item) => (
              <div>
                <p className="font-bold text-slate-900">{item.employeeName}</p>
                <p className="text-[11px] text-slate-500 font-mono">{item.employeeCode} • {item.department}</p>
              </div>
            ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (item) => <AdminStatusBadge status={item.status} />,
          },
          {
            key: 'punchIn',
            header: 'Punch In / Out',
            render: (item) => (
              <div className="text-[11px] space-y-0.5">
                <p className="text-slate-700 font-medium">In: {item.punchIn ? new Date(item.punchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</p>
                <p className="text-slate-500">Out: {item.punchOut ? new Date(item.punchOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</p>
              </div>
            ),
          },
          {
            key: 'workingHours',
            header: 'Hours Worked',
            render: (item) => (
              <div className="font-bold text-slate-900">
                {item.workingHours} hrs
                {item.breakDuration > 0 && (
                  <span className="block text-[10px] font-normal text-slate-400">Break: {item.breakDuration}h</span>
                )}
              </div>
            ),
          },
          {
            key: 'office',
            header: 'Office / Mode',
            render: (item) => (
              <span className="text-[11px] text-slate-600 font-medium">
                {item.office} <span className="text-[10px] text-slate-400 font-mono">({item.workMode})</span>
              </span>
            ),
          },
        ];

      case 'PAYROLL':
        return [
          {
            key: 'slipNumber',
            header: 'Slip No',
            render: (item) => <span className="font-mono font-bold text-slate-900">{item.slipNumber}</span>,
          },
          {
            key: 'employee',
            header: 'Employee',
            render: (item) => (
              <div>
                <p className="font-bold text-slate-900">{item.employeeName}</p>
                <p className="text-[11px] text-slate-500">{item.employeeCode} • {item.department}</p>
              </div>
            ),
          },
          {
            key: 'payPeriod',
            header: 'Pay Period',
            render: (item) => <span className="font-semibold text-slate-700">{item.payPeriod}</span>,
          },
          {
            key: 'grossSalary',
            header: 'Gross Salary',
            render: (item) => <span className="font-medium text-slate-700">₹{Number(item.grossSalary || 0).toLocaleString('en-IN')}</span>,
          },
          {
            key: 'totalDeductions',
            header: 'Deductions',
            render: (item) => <span className="font-medium text-rose-600">-₹{Number(item.totalDeductions || 0).toLocaleString('en-IN')}</span>,
          },
          {
            key: 'netSalary',
            header: 'Net Payout',
            render: (item) => <span className="font-black text-emerald-700">₹{Number(item.netSalary || 0).toLocaleString('en-IN')}</span>,
          },
          {
            key: 'status',
            header: 'Status',
            render: (item) => <AdminStatusBadge status={item.status} />,
          },
        ];

      case 'LEAVES':
        return [
          {
            key: 'employee',
            header: 'Employee',
            render: (item) => (
              <div>
                <p className="font-bold text-slate-900">{item.employeeName}</p>
                <p className="text-[11px] text-slate-500">{item.employeeCode} • {item.department}</p>
              </div>
            ),
          },
          {
            key: 'leaveType',
            header: 'Leave Type',
            render: (item) => <span className="font-semibold text-slate-800">{item.leaveType}</span>,
          },
          {
            key: 'duration',
            header: 'Duration',
            render: (item) => (
              <div>
                <p className="font-bold text-slate-800">{item.days} Day{item.days > 1 ? 's' : ''}</p>
                <p className="text-[10px] text-slate-500">{item.fromDate} to {item.toDate}</p>
              </div>
            ),
          },
          {
            key: 'reason',
            header: 'Reason',
            render: (item) => <p className="text-slate-600 max-w-xs truncate" title={item.reason}>{item.reason}</p>,
          },
          {
            key: 'status',
            header: 'Status',
            render: (item) => <AdminStatusBadge status={item.status} />,
          },
        ];

      case 'EMPLOYEES':
        return [
          {
            key: 'code',
            header: 'Code',
            render: (item) => <span className="font-mono font-bold text-slate-900">{item.employeeCode}</span>,
          },
          {
            key: 'name',
            header: 'Employee Name',
            render: (item) => (
              <div>
                <p className="font-bold text-slate-900">{item.name}</p>
                <p className="text-[11px] text-slate-500">{item.email}</p>
              </div>
            ),
          },
          {
            key: 'department',
            header: 'Department / Role',
            render: (item) => (
              <div>
                <p className="font-semibold text-slate-800">{item.department}</p>
                <p className="text-[11px] text-slate-500">{item.designation}</p>
              </div>
            ),
          },
          {
            key: 'office',
            header: 'Assigned Office',
            render: (item) => <span className="text-slate-700">{item.office}</span>,
          },
          {
            key: 'status',
            header: 'Status',
            render: (item) => <AdminStatusBadge status={item.status} />,
          },
          {
            key: 'joiningDate',
            header: 'Joining Date',
            render: (item) => <span className="text-slate-600 font-mono text-[11px]">{item.joiningDate}</span>,
          },
        ];

      case 'VISITS':
        return [
          {
            key: 'date',
            header: 'Date & Time',
            render: (item) => (
              <div>
                <p className="font-bold text-slate-900">{item.date}</p>
                <p className="text-[10px] text-slate-500">{item.time}</p>
              </div>
            ),
          },
          {
            key: 'client',
            header: 'Client / Purpose',
            render: (item) => (
              <div>
                <p className="font-bold text-slate-900">{item.clientName}</p>
                <p className="text-[11px] text-slate-500">{item.purpose}</p>
              </div>
            ),
          },
          {
            key: 'employee',
            header: 'Assigned Field Staff',
            render: (item) => (
              <div>
                <p className="font-semibold text-slate-800">{item.assignedEmployee}</p>
                <p className="text-[10px] text-slate-500 font-mono">{item.employeeCode}</p>
              </div>
            ),
          },
          {
            key: 'location',
            header: 'Meeting Location',
            render: (item) => <p className="text-[11px] text-slate-600 max-w-xs truncate" title={item.location}>{item.location}</p>,
          },
          {
            key: 'status',
            header: 'Status',
            render: (item) => <AdminStatusBadge status={item.status} />,
          },
        ];

      default:
        return [];
    }
  }, [activeModule]);

  // Tab configurations
  const tabs: { id: ReportModuleType; label: string; icon: any }[] = [
    { id: 'ATTENDANCE', label: 'Attendance', icon: Clock },
    { id: 'PAYROLL', label: 'Payroll & Salary', icon: DollarSign },
    { id: 'LEAVES', label: 'Leave Requests', icon: Calendar },
    { id: 'EMPLOYEES', label: 'Employee Roster', icon: Users },
    { id: 'VISITS', label: 'Field Client Visits', icon: MapPin },
  ];

  const tableData = moduleDataResponse?.items || [];
  const pagination = moduleDataResponse?.pagination || { page: 1, limit: pageSize, total: 0, totalPages: 1 };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* Top Hero Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-700/60 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-[#23C45E]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-[#23C45E] border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#23C45E] animate-pulse" />
                Live Data & Audit Export Engine
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Reports & Data Export Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl leading-relaxed">
              Generate structured, audit-ready dataset exports across attendance records, payroll slips, leave requests, and employee rosters.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleExport(activeModule, 'CSV')}
              disabled={downloadingType !== null}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-2xl text-xs shadow-md shadow-[#23C45E]/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {downloadingType === `${activeModule}-CSV` ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Export {tabs.find((t) => t.id === activeModule)?.label || 'Report'} (CSV)</span>
            </button>
            <button
              onClick={() => {
                refetchSummary();
                refetchData();
              }}
              className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-2xl border border-slate-700 transition-all cursor-pointer"
              title="Refresh report data"
            >
              <RefreshCw className={`w-4 h-4 ${(isSummaryFetching || isDataFetching) ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Global Filter Bar: Date Range Presets & Custom Pickers */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Preset Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 md:pb-0">
          <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1 shrink-0">
            <Calendar className="w-3.5 h-3.5" /> Date Range:
          </span>
          <button
            type="button"
            onClick={() => handlePresetChange('TODAY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              datePreset === 'TODAY'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => handlePresetChange('7DAYS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              datePreset === '7DAYS'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Last 7 Days
          </button>
          <button
            type="button"
            onClick={() => handlePresetChange('30DAYS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              datePreset === '30DAYS'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Last 30 Days
          </button>
          <button
            type="button"
            onClick={() => handlePresetChange('MONTH')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              datePreset === 'MONTH'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            This Month
          </button>
        </div>

        {/* Custom Date Pickers */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-400">From:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDatePreset('CUSTOM');
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            />
          </div>
          <span className="text-slate-300 font-bold">→</span>
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-400">To:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDatePreset('CUSTOM');
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Real Live KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <AdminStatCard
          title="Attendance Rate"
          value={isSummaryLoading ? '...' : (summaryData?.attendance?.presentRate || '100%')}
          description={`${summaryData?.attendance?.present || 0} Present / ${summaryData?.attendance?.totalRecords || 0} Records`}
          icon={CheckCircle}
          iconBg="primary"
        />
        <AdminStatCard
          title="Active Workforce"
          value={isSummaryLoading ? '...' : String(summaryData?.workforce?.active ?? 0)}
          description={`Total Registered: ${summaryData?.workforce?.total ?? 0}`}
          icon={Users}
          iconBg="blue"
        />
        <AdminStatCard
          title="Net Payroll Disbursed"
          value={
            isSummaryLoading
              ? '...'
              : `₹${Number(summaryData?.payroll?.netDisbursed || 0).toLocaleString('en-IN')}`
          }
          description={`${summaryData?.payroll?.slipsGenerated || 0} Slips Generated`}
          icon={DollarSign}
          iconBg="amber"
        />
        <AdminStatCard
          title="Leave Requests"
          value={isSummaryLoading ? '...' : String(summaryData?.leaves?.total ?? 0)}
          description={`${summaryData?.leaves?.pending || 0} Pending • ${summaryData?.leaves?.approved || 0} Approved`}
          icon={Calendar}
          iconBg="purple"
        />
      </div>

      {/* Module Navigation Tabs */}
      <div className="bg-white p-2 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeModule === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {isActive && (
                <span className="w-2 h-2 rounded-full bg-[#23C45E]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar for the active module */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder={`Search ${tabs.find((t) => t.id === activeModule)?.label.toLowerCase()}...`}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#23C45E] focus:outline-none text-slate-900 font-semibold"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Status filter dropdown if applicable */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-[#23C45E] cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            {activeModule === 'ATTENDANCE' && (
              <>
                <option value="PRESENT">Present</option>
                <option value="HALF_DAY">Half Day</option>
                <option value="ABSENT">Absent</option>
                <option value="LATE">Late</option>
                <option value="ON_LEAVE">On Leave</option>
              </>
            )}
            {activeModule === 'PAYROLL' && (
              <>
                <option value="GENERATED">Generated</option>
                <option value="PAID">Paid</option>
                <option value="PENDING">Pending</option>
              </>
            )}
            {activeModule === 'LEAVES' && (
              <>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </>
            )}
            {activeModule === 'EMPLOYEES' && (
              <>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </>
            )}
            {activeModule === 'VISITS' && (
              <>
                <option value="SCHEDULED">Scheduled</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </>
            )}
          </select>

          <button
            onClick={() => handleExport(activeModule, 'CSV')}
            disabled={downloadingType !== null}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            {downloadingType === `${activeModule}-CSV` ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>Export View</span>
          </button>
        </div>
      </div>

      {/* Real Data Table */}
      <AdminDataTable
        columns={columns}
        data={tableData}
        loading={isDataLoading}
        emptyTitle={`No ${tabs.find((t) => t.id === activeModule)?.label} records found`}
        emptyDescription="Try adjusting your date range, search query, or status filter to see more data."
      />

      {/* Pagination Footer */}
      {pagination.total > 0 && (
        <div className="flex justify-end pt-2">
          <AdminPagination
            page={pagination.page}
            pageSize={pageSize}
            total={pagination.total}
            totalPages={pagination.totalPages}
            onPageChange={(p) => setPage(p)}
            showPageSizeSelector={false}
          />
        </div>
      )}

      {/* Quick Export Cards Section (Preserved from existing UI design) */}
      <div className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">Direct Data Export Modules</h3>
            <p className="text-xs text-slate-500 font-medium">Download full master ledger dumps formatted as structured CSVs.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Attendance Summary */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Attendance Records</h3>
                <p className="text-xs text-slate-500 mt-1">Export employee punch timestamps, working hours, and location tags.</p>
              </div>
            </div>
            <div className="pt-2 flex gap-2">
              <button
                onClick={() => handleExport('ATTENDANCE', 'CSV')}
                disabled={downloadingType !== null}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all active:scale-95"
              >
                {downloadingType === 'ATTENDANCE-CSV' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} CSV Export
              </button>
            </div>
          </div>

          {/* Payroll & Salary Ledger */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Payroll & Salary Ledger</h3>
                <p className="text-xs text-slate-500 mt-1">Detailed breakdown of gross earnings, deductions, and net salary payouts.</p>
              </div>
            </div>
            <div className="pt-2 flex gap-2">
              <button
                onClick={() => handleExport('PAYROLL', 'CSV')}
                disabled={downloadingType !== null}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all active:scale-95"
              >
                {downloadingType === 'PAYROLL-CSV' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} CSV Export
              </button>
            </div>
          </div>

          {/* Leave Requests */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Leave & Holiday Audit</h3>
                <p className="text-xs text-slate-500 mt-1">Historical leave requests, approval logs, leave balance adjustments, and dates.</p>
              </div>
            </div>
            <div className="pt-2 flex gap-2">
              <button
                onClick={() => handleExport('LEAVES', 'CSV')}
                disabled={downloadingType !== null}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all active:scale-95"
              >
                {downloadingType === 'LEAVES-CSV' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} CSV Export
              </button>
            </div>
          </div>

          {/* Employee Directory */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Employee Master Directory</h3>
                <p className="text-xs text-slate-500 mt-1">Full personnel roster with department, designation, branch, and contact details.</p>
              </div>
            </div>
            <div className="pt-2 flex gap-2">
              <button
                onClick={() => handleExport('EMPLOYEES', 'CSV')}
                disabled={downloadingType !== null}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all active:scale-95"
              >
                {downloadingType === 'EMPLOYEES-CSV' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} CSV Export
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
