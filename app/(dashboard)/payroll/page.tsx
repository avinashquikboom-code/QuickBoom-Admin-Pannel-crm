'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Banknote,
  FileSpreadsheet,
  Zap,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  CheckCircle,
  Send,
  Building2,
  Filter,
  Plus,
  Sliders,
  FileText,
  Printer,
  Share2,
  Trash2,
  RefreshCw,
  Edit2,
  Percent,
  Eye,
  X,
  Search,
  Check,
  Calendar,
  User,
  ChevronDown,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminPageHeader, AdminButton, AdminFormDrawer, AdminPagination } from '@/components/admin';
import { getErrorMessage } from '@/lib/utils';
import { useAuthStore } from '@/lib/store';
import { generatePayrollGovernancePdf } from '@/lib/utils/payroll-pdf';

type PayrollSubmodule = 'dashboard' | 'processing' | 'structures' | 'history' | 'slips' | 'settings';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface SalaryStructureItem {
  id: number;
  employeeId: number;
  basicSalary: number;
  hra: number;
  allowances: number;
  specialAllowance: number;
  bonus: number;
  commission: number;
  overtime: number;
  otherEarnings: number;
  pf: number;
  esi: number;
  professionalTax: number;
  tds: number;
  otherDeductions: number;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  status: 'ACTIVE' | 'INACTIVE';
  employee?: {
    id: number;
    employeeCode: string;
    firstName: string;
    lastName: string;
    department?: { name: string };
    designation?: { name: string };
  };
}

export default function PayrollPage() {
  const [activeTab, setActiveTab] = useState<PayrollSubmodule>('dashboard');
  const now = new Date();
  const currentMonthName = MONTH_NAMES[now.getMonth()] || 'September';
  const currentYearStr = String(now.getFullYear()) || '2026';
  const [selectedMonth, setSelectedMonth] = useState(currentMonthName);
  const [selectedYear, setSelectedYear] = useState(currentYearStr);
  const [selectedDept, setSelectedDept] = useState('All');
  const queryClient = useQueryClient();

  // Client-side mount flag for Recharts & browser safety
  const [isMounted, setIsMounted] = useState(false);
  const [payTarget, setPayTarget] = useState<any>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Policy Settings State
  const [workingDays, setWorkingDays] = useState(30);
  const [overtimeRate, setOvertimeRate] = useState(1.5);
  const [pfRate, setPfRate] = useState(12);
  const [esiRate, setEsiRate] = useState(0.75);
  const [taxExemptionLimit, setTaxExemptionLimit] = useState(300000);

  // Structure Drawer state
  const [isStructureOpen, setIsStructureOpen] = useState(false);
  const [editingStructureId, setEditingStructureId] = useState<number | null>(null);
  const [structEmployeeId, setStructEmployeeId] = useState('');
  const [structBasic, setStructBasic] = useState<number>(35000);
  const [structHra, setStructHra] = useState<number>(14000);
  const [structAllowances, setStructAllowances] = useState<number>(6000);
  const [structSpecial, setStructSpecial] = useState<number>(5000);
  const [structPf, setStructPf] = useState<number>(4200);
  const [structEsi, setStructEsi] = useState<number>(260);
  const [structProfTax, setStructProfTax] = useState<number>(200);
  const [structTds, setStructTds] = useState<number>(1500);

  // Salary Slip Modal state
  const [selectedSlip, setSelectedSlip] = useState<any | null>(null);
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [slipSearch, setSlipSearch] = useState('');

  // Auto calculate Gross & Net for structure builder
  const structGross = Number(structBasic || 0) + Number(structHra || 0) + Number(structAllowances || 0) + Number(structSpecial || 0);
  const structDeductions = Number(structPf || 0) + Number(structEsi || 0) + Number(structProfTax || 0) + Number(structTds || 0);
  const structNet = Math.max(0, structGross - structDeductions);

  // Pagination states
  const [structuresPage, setStructuresPage] = useState(1);
  const [structuresPageSize, setStructuresPageSize] = useState(20);
  const [structSearch, setStructSearch] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(20);
  const [slipsPage, setSlipsPage] = useState(1);
  const [slipsPageSize, setSlipsPageSize] = useState(20);

  // Month number helper (1-12)
  const selectedMonthNum = MONTH_NAMES.indexOf(selectedMonth) >= 0 ? MONTH_NAMES.indexOf(selectedMonth) + 1 : 8;

  // 1. Current Period Payroll Query
  const {
    data: currentPayrollRes,
    isLoading: isCurrentPayrollLoading,
    refetch: refetchCurrentPayroll,
  } = useQuery({
    queryKey: ['admin-current-payroll', selectedMonthNum, selectedYear, selectedDept],
    queryFn: async () => {
      try {
        const res: any = await api.get('/admin/payroll', {
          params: {
            month: selectedMonthNum,
            year: Number(selectedYear),
            departmentId: selectedDept !== 'All' ? selectedDept : undefined,
          },
        });
        const items = res?.data?.data || res?.data?.items || res?.data || (Array.isArray(res) ? res : []);
        return Array.isArray(items) && items.length > 0 ? items[0] : null;
      } catch {
        return null;
      }
    },
  });
  const currentPayroll = currentPayrollRes;
  const currentBatchStatus = currentPayroll?.status || 'UNPROCESSED';

  // 2. Departments Query
  const { data: departmentsList = [] } = useQuery({
    queryKey: ['departments-for-payroll'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/departments');
        const d = res?.data?.data || res?.data?.items || res?.data;
        return Array.isArray(d) ? d : [];
      } catch {
        return [];
      }
    },
  });

  // 3. Payroll Policy Query
  const { data: payrollPolicyRes } = useQuery({
    queryKey: ['admin-payroll-policy'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/admin/payroll/policy');
        const data = res?.data?.data || res?.data;
        if (data) {
          if (data.workingDaysPerMonth) setWorkingDays(Number(data.workingDaysPerMonth));
          if (data.overtimeMultiplier) setOvertimeRate(Number(data.overtimeMultiplier));
          if (data.pfPercent) setPfRate(Number(data.pfPercent));
          if (data.esiPercent) setEsiRate(Number(data.esiPercent));
          if (data.taxExemptionLimit) setTaxExemptionLimit(Number(data.taxExemptionLimit));
        }
        return data;
      } catch {
        return null;
      }
    },
  });

  // 4. Payroll History Query
  const { data: payrollHistoryRes, refetch: refetchHistory } = useQuery({
    queryKey: ['admin-payroll-history', historyPage, historyPageSize],
    queryFn: async () => {
      try {
        const res: any = await api.get('/admin/payroll/history', {
          params: { page: historyPage, limit: historyPageSize },
        });
        const items = res?.data?.data || res?.data?.items || res?.data || (Array.isArray(res) ? res : []);
        const pagination = res?.pagination || res?.meta || res?.data?.pagination || {
          page: historyPage,
          pageSize: historyPageSize,
          total: Array.isArray(items) ? items.length : 0,
          totalPages: 1,
        };
        return { items: Array.isArray(items) ? items : [], pagination };
      } catch {
        return { items: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 } };
      }
    },
  });
  const payrollHistory = payrollHistoryRes?.items || [];
  const historyPagination = payrollHistoryRes?.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 1 };

  // 5. Salary Structures Query
  const { data: salaryStructuresRes, refetch: refetchStructures } = useQuery({
    queryKey: ['admin-salary-structures', structuresPage, structuresPageSize],
    queryFn: async () => {
      try {
        const res: any = await api.get('/admin/payroll/structures', {
          params: { page: structuresPage, limit: structuresPageSize },
        });
        const items = res?.data?.data || res?.data?.items || res?.data || (Array.isArray(res) ? res : []);
        const pagination = res?.pagination || res?.meta || res?.data?.pagination || {
          page: structuresPage,
          pageSize: structuresPageSize,
          total: Array.isArray(items) ? items.length : 0,
          totalPages: 1,
        };
        return { items: Array.isArray(items) ? items : [], pagination };
      } catch {
        return { items: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 } };
      }
    },
  });
  const salaryStructures = salaryStructuresRes?.items || [];
  const structuresPagination = salaryStructuresRes?.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 1 };

  // 6. Salary Slips Query
  const { data: salarySlipsRes, refetch: refetchSlips } = useQuery({
    queryKey: ['admin-salary-slips', slipsPage, slipsPageSize, slipSearch, selectedMonthNum, selectedYear],
    queryFn: async () => {
      try {
        const res: any = await api.get('/admin/payroll/slips', {
          params: {
            page: slipsPage,
            limit: slipsPageSize,
            search: slipSearch || undefined,
            month: selectedMonthNum,
            year: Number(selectedYear),
          },
        });
        const items = res?.data?.data || res?.data?.items || res?.data || (Array.isArray(res) ? res : []);
        const pagination = res?.pagination || res?.meta || res?.data?.pagination || {
          page: slipsPage,
          pageSize: slipsPageSize,
          total: Array.isArray(items) ? items.length : 0,
          totalPages: 1,
        };
        return { items: Array.isArray(items) ? items : [], pagination };
      } catch {
        return { items: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 } };
      }
    },
  });
  const salarySlips = salarySlipsRes?.items || [];
  const slipsPagination = salarySlipsRes?.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 1 };

  // 7. Employees Query for Structure Form
  const { data: employeesList = [] } = useQuery({
    queryKey: ['employees-for-payroll'],
    queryFn: async () => {
      const res = await api.get('/employees');
      const d = res.data?.data || res.data;
      return Array.isArray(d) ? d : d?.employees || [];
    },
  });

  // Mutations
  const calculateMutation = useMutation({
    mutationFn: async () => {
      return api.post('/admin/payroll/calculate', {
        month: selectedMonthNum,
        year: Number(selectedYear) || 2026,
        departmentId: selectedDept !== 'All' ? selectedDept : undefined,
      });
    },
    onSuccess: (res: any) => {
      const msg = res?.data?.message || 'Payroll calculated successfully for active staff!';
      toast.success(msg);
      queryClient.invalidateQueries({ queryKey: ['admin-current-payroll'] });
      queryClient.invalidateQueries({ queryKey: ['admin-payroll-history'] });
      queryClient.invalidateQueries({ queryKey: ['admin-salary-slips'] });
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err));
    },
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      return api.post('/admin/payroll/approve', {
        payrollId: currentPayroll?.id,
      });
    },
    onSuccess: (res: any) => {
      const msg = res?.data?.message || 'Payroll approved by HR Finance Admin.';
      toast.success(msg);
      queryClient.invalidateQueries({ queryKey: ['admin-current-payroll'] });
      queryClient.invalidateQueries({ queryKey: ['admin-payroll-history'] });
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err));
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      return api.post('/admin/payroll/generate', {
        payrollId: currentPayroll?.id,
        month: selectedMonthNum,
        year: Number(selectedYear),
      });
    },
    onSuccess: (res: any) => {
      const msg = res?.data?.message || 'Salary slips batch generated successfully!';
      toast.success(msg);
      queryClient.invalidateQueries({ queryKey: ['admin-current-payroll'] });
      queryClient.invalidateQueries({ queryKey: ['admin-salary-slips'] });
      queryClient.invalidateQueries({ queryKey: ['admin-payroll-history'] });
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err));
    },
  });

  const payItemMutation = useMutation({
    mutationFn: async (itemId: number) => api.post(`/admin/payroll/items/${itemId}/pay`, {}),
    onSuccess: (res: any) => {
      const item = res?.data?.data;
      const email = item?.emailStatus || '';
      const whatsapp = item?.whatsappStatus || '';
      toast.success(`Payroll marked as paid. Email ${email || 'updated'}. WhatsApp ${whatsapp || 'updated'}.`);
      setPayTarget(null);
      queryClient.invalidateQueries({ queryKey: ['admin-current-payroll'] });
      queryClient.invalidateQueries({ queryKey: ['admin-salary-slips'] });
      queryClient.invalidateQueries({ queryKey: ['admin-payroll-history'] });
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err));
    },
  });

  const disburseMutation = useMutation({
    mutationFn: async () => {
      return api.post('/admin/payroll/disburse', {
        payrollId: currentPayroll?.id,
      });
    },
    onSuccess: (res: any) => {
      const msg = res?.data?.message || 'Salary disbursed and claims/loans marked settled!';
      toast.success(msg);
      queryClient.invalidateQueries({ queryKey: ['admin-current-payroll'] });
      queryClient.invalidateQueries({ queryKey: ['admin-payroll-history'] });
      queryClient.invalidateQueries({ queryKey: ['admin-salary-slips'] });
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err));
    },
  });

  const savePolicyMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/admin/payroll/policy', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Payroll policy parameters updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-payroll-policy'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const saveStructureMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/admin/payroll/structures', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success(editingStructureId ? 'Salary structure updated' : 'Salary structure saved');
      setIsStructureOpen(false);
      resetStructureForm();
      queryClient.invalidateQueries({ queryKey: ['admin-salary-structures'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const deleteStructureMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/admin/payroll/structures/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Salary structure removed');
      queryClient.invalidateQueries({ queryKey: ['admin-salary-structures'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const resetStructureForm = () => {
    setEditingStructureId(null);
    setStructEmployeeId('');
    setStructBasic(35000);
    setStructHra(14000);
    setStructAllowances(6000);
    setStructSpecial(5000);
    setStructPf(4200);
    setStructEsi(260);
    setStructProfTax(200);
    setStructTds(1500);
  };

  const handleStructureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!structEmployeeId) {
      toast.error('Please select an employee');
      return;
    }
    saveStructureMutation.mutate({
      id: editingStructureId || undefined,
      employeeId: Number(structEmployeeId),
      basicSalary: Number(structBasic),
      hra: Number(structHra),
      allowances: Number(structAllowances),
      specialAllowance: Number(structSpecial),
      pf: Number(structPf),
      esi: Number(structEsi),
      professionalTax: Number(structProfTax),
      tds: Number(structTds),
    });
  };

  const handleBasicChange = (val: number) => {
    setStructBasic(val);
    setStructHra(Math.round(val * 0.4));
    setStructPf(Math.round(val * 0.12));
    setStructEsi(Math.round(val * 0.0075));
  };

  const handleSavePolicy = () => {
    savePolicyMutation.mutate({
      workingDaysPerMonth: workingDays,
      overtimeMultiplier: overtimeRate,
      pfPercent: pfRate,
      esiPercent: esiRate,
      taxExemptionLimit,
    });
  };

  // Dynamic Pie Chart Aggregation from current batch or active structures
  const currentItems = currentPayroll?.items || [];
  const dynamicBasic = currentItems.reduce((acc: number, item: any) => acc + (Number(item.basicSalary) || 0), 0) || 9500000;
  const dynamicAllowances = currentItems.reduce((acc: number, item: any) => acc + (Number(item.allowances) || 0) + (Number(item.commission) || 0) + (Number(item.reimbursement) || 0), 0) || 5500000;
  const dynamicStatutory = currentItems.reduce((acc: number, item: any) => acc + (Number(item.deductions) || 0), 0) || 1200000;
  const dynamicLoansAndTaxes = currentItems.reduce((acc: number, item: any) => acc + (Number(item.loanDeduction) || 0) + (Number(item.unpaidLeaveDeduction) || 0), 0) || 1050000;

  const payrollBreakdownData = [
    { name: 'Basic Salary', value: dynamicBasic, color: '#23C45E' },
    { name: 'Allowances & Claims', value: dynamicAllowances, color: '#1AA14D' },
    { name: 'Statutory (PF/ESI)', value: dynamicStatutory, color: '#F59E0B' },
    { name: 'Loans & Other Ded.', value: dynamicLoansAndTaxes, color: '#DC2626' },
  ];

  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0);
  };

  const handleExportPayrollPdf = async () => {
    try {
      setIsExportingPdf(true);
      setIsExportDropdownOpen(false);

      // 1. Fetch detailed payroll if current batch has an ID to get full relations
      let payrollData = currentPayroll;
      if (currentPayroll?.id) {
        try {
          const detailRes: any = await api.get(`/admin/payroll/${currentPayroll.id}`);
          if (detailRes?.data?.data || detailRes?.data) {
            payrollData = detailRes.data?.data || detailRes.data;
          }
        } catch {
          // fallback to currentPayroll in state
        }
      }

      // 2. Fetch slips for this period to enrich slipNumber if available
      const slipMap: Record<number, string> = {};
      try {
        const slipsRes: any = await api.get('/admin/payroll/slips', {
          params: { month: selectedMonthNum, year: Number(selectedYear), limit: 100 },
        });
        const slips = slipsRes?.data?.data || slipsRes?.data?.items || slipsRes?.data || [];
        if (Array.isArray(slips)) {
          slips.forEach((s: any) => {
            if (s.employeeId && s.slipNumber) {
              slipMap[s.employeeId] = s.slipNumber;
            }
          });
        }
      } catch {
        // optional slips enrichment
      }

      // 3. Normalize items list for the report
      let itemsList: any[] = [];
      let totalGross = 0;
      let totalDeductions = 0;
      let totalNet = 0;
      let totalDisbursed = 0;
      let pendingPayments = 0;
      let totalAdvances = 0;
      let totalClaims = 0;

      if (payrollData?.items && payrollData.items.length > 0) {
        itemsList = payrollData.items.map((it: any) => {
          const empCode = it.employee?.employeeCode || `EMP-${it.employeeId}`;
          const empName = it.employee
            ? `${it.employee.firstName || ''} ${it.employee.lastName || ''}`.trim()
            : `Staff #${it.employeeId}`;
          const dept = it.employee?.department?.name || it.employee?.designation?.name || 'General';
          const basic = Number(it.basicSalary || 0);
          const hra = Number(it.hra || 0);
          const allowances = Number(it.allowances || 0);
          const special = Number(it.specialAllowance || 0);
          const bonus = Number(it.bonus || 0);
          const commission = Number(it.commission || 0);
          const reimbursement = Number(it.reimbursement || 0);
          const gross = Number(
            it.grossSalary || basic + hra + allowances + special + bonus + commission + reimbursement
          );
          const deductions = Number(
            it.totalDeductions ??
              Number(it.deductions || 0) +
                Number(it.loanDeduction || 0) +
                Number(it.unpaidLeaveDeduction || 0)
          );
          const net = Number(it.netSalary ?? gross - deductions);
          const isPaid = it.status === 'PAID';

          totalGross += gross;
          totalDeductions += deductions;
          totalNet += net;
          if (isPaid) totalDisbursed += net;
          else pendingPayments += net;
          if (it.advanceDeduction) totalAdvances += Number(it.advanceDeduction);
          if (it.reimbursement) totalClaims += Number(it.reimbursement);

          const slipNumber = it.salarySlips?.[0]?.slipNumber || slipMap[it.employeeId] || undefined;

          return {
            employeeCode: empCode,
            employeeName: empName,
            department: dept,
            basicSalary: basic,
            hra: hra,
            medical: 0,
            travel: 0,
            allowances,
            specialAllowance: special,
            bonus,
            commission,
            reimbursement,
            grossSalary: gross,
            totalDeductions: deductions,
            netSalary: net,
            status: it.status || payrollData.status || 'CALCULATED',
            slipNumber,
          };
        });
      } else if (salaryStructures && salaryStructures.length > 0) {
        // If cycle not yet calculated into batch, export configured active staff structures
        itemsList = salaryStructures.map((st: any) => {
          const empCode = st.employee?.employeeCode || `EMP-${st.employeeId}`;
          const empName = st.employee
            ? `${st.employee.firstName || ''} ${st.employee.lastName || ''}`.trim()
            : `Staff #${st.employeeId}`;
          const dept = st.employee?.department?.name || st.employee?.designation?.name || 'General';
          const basic = Number(st.basicSalary || 0);
          const hra = Number(st.hra || 0);
          const allowances = Number(st.allowances || 0);
          const special = Number(st.specialAllowance || 0);
          const bonus = Number(st.bonus || 0);
          const gross = Number(st.grossSalary || basic + hra + allowances + special + bonus);
          const deductions = Number(st.totalDeductions || 0);
          const net = Number(st.netSalary || gross - deductions);

          totalGross += gross;
          totalDeductions += deductions;
          totalNet += net;
          pendingPayments += net;

          return {
            employeeCode: empCode,
            employeeName: empName,
            department: dept,
            basicSalary: basic,
            hra: hra,
            allowances,
            specialAllowance: special,
            bonus,
            grossSalary: gross,
            totalDeductions: deductions,
            netSalary: net,
            status: 'CONFIGURED',
          };
        });
      }

      if (itemsList.length === 0) {
        toast.error('No employee payroll records or salary structures available for the selected cycle.');
        return;
      }

      const companyName = useAuthStore.getState().user?.customerName || 'QB Suite';

      await generatePayrollGovernancePdf({
        companyName,
        month: selectedMonth,
        year: selectedYear,
        status: payrollData?.status || 'CONFIGURED',
        departmentName:
          selectedDept !== 'All'
            ? departmentsList.find((d: any) => String(d.id) === String(selectedDept))?.name
            : 'All Departments',
        summary: {
          totalEmployees: itemsList.length,
          grossSalary: payrollData?.grossSalary || totalGross,
          totalDeductions: payrollData?.totalDeductions || totalDeductions,
          netSalary: payrollData?.netSalary || totalNet,
          totalDisbursed: totalDisbursed,
          pendingPayments: pendingPayments,
          totalAdvances: totalAdvances,
          totalExpenseClaims: totalClaims,
        },
        items: itemsList,
      });

      toast.success(`Payroll Governance Report for ${selectedMonth} ${selectedYear} downloaded successfully!`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to export Payroll PDF');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* 1. STANDARD PAGE HEADER */}
      <AdminPageHeader
        title="Payroll & Compensation"
        description="Automated salary calculations, tax withholdings, approved expense claims, loan installments, and live slip generation."
        icon={Banknote}
        iconColor="text-[#1AA14D]"
        badge={{
          text: 'ENTERPRISE PAYROLL ENGINE',
          icon: Banknote,
          variant: 'emerald',
        }}
        breadcrumbs={[
          { label: 'Workforce', href: '/employees' },
          { label: 'Payroll' },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Export Payroll Data Dropdown - PDF only */}
            <div className="relative">
              <div className="inline-flex rounded-xl shadow-xs overflow-hidden border border-slate-200 bg-white">
                <button
                  type="button"
                  onClick={handleExportPayrollPdf}
                  disabled={isExportingPdf}
                  className="inline-flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
                  title="Download Payroll Report (.pdf)"
                >
                  {isExportingPdf ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                  )}
                  <span>Export Payroll Data</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsExportDropdownOpen((prev) => !prev)}
                  disabled={isExportingPdf}
                  className="px-2 py-2 hover:bg-slate-50 text-slate-500 border-l border-slate-200 transition-all cursor-pointer"
                  title="Export options"
                  aria-label="Export options dropdown"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {isExportDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsExportDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in-50 duration-150">
                    <button
                      type="button"
                      onClick={handleExportPayrollPdf}
                      disabled={isExportingPdf}
                      className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block text-xs font-black truncate text-slate-900">
                          Download Payroll Report (.pdf)
                        </span>
                        <span className="block text-[10px] text-slate-400 font-medium">
                          Print-ready audit & compensation PDF
                        </span>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>

            <AdminButton
              variant="primary"
              size="md"
              icon={Zap}
              onClick={() => setActiveTab('processing')}
            >
              Run Payroll Cycle
            </AdminButton>
          </div>
        }
      />

      {/* Submodule Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'dashboard' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Payroll Dashboard
        </button>
        <button
          onClick={() => setActiveTab('processing')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'processing' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Payroll Processing
        </button>
        <button
          onClick={() => setActiveTab('structures')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'structures' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Salary Structures & Formulas
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'history' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Payroll History
        </button>
        <button
          onClick={() => setActiveTab('slips')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'slips' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Salary Slips
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'settings' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Payroll Settings
        </button>
      </div>

      {/* Submodule 1: Payroll Dashboard */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Top Metrics Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Configured Structures</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{structuresPagination.total || salaryStructures.length}</p>
              <span className="text-[11px] font-bold text-emerald-600">Active Staff</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Gross Salary Payout</span>
              <p className="text-xl font-black text-slate-900 mt-1">
                {currentPayroll ? formatCurrency(currentPayroll.grossSalary) : (payrollHistory[0] ? formatCurrency(payrollHistory[0].gross) : '₹0')}
              </p>
              <span className="text-[11px] font-bold text-slate-500">{selectedMonth} {selectedYear}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Total Deductions</span>
              <p className="text-xl font-black text-rose-600 mt-1">
                {currentPayroll ? formatCurrency(currentPayroll.totalDeductions) : (payrollHistory[0] ? formatCurrency(payrollHistory[0].deductions) : '₹0')}
              </p>
              <span className="text-[11px] font-bold text-slate-500">Loans, PF, Tax, Leaves</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Net Payroll Disbursed</span>
              <p className="text-xl font-black text-emerald-700 mt-1">
                {currentPayroll ? formatCurrency(currentPayroll.netSalary) : (payrollHistory[0] ? formatCurrency(payrollHistory[0].net) : '₹0')}
              </p>
              <span className="text-[11px] font-bold text-emerald-600">Net Payout</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Current Status</span>
              <p className="text-lg font-black text-emerald-600 mt-1">{currentBatchStatus}</p>
              <span className="text-[11px] font-bold text-slate-500">{selectedMonth} {selectedYear} Run</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Generated Slips</span>
              <p className="text-2xl font-black text-indigo-600 mt-1">{slipsPagination.total || salarySlips.length}</p>
              <span className="text-[11px] font-bold text-emerald-600">Ready for Download</span>
            </div>
          </div>

          {/* Payroll Visual Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-extrabold text-slate-900">Gross vs Net Monthly Trend</h3>
                <span className="text-xs text-slate-400">Live Backend Aggregation</span>
              </div>
              <div className="h-64">
                {isMounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={payrollHistory}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="gross" fill="#23C45E" radius={[6, 6, 0, 0]} name="Gross Salary" />
                      <Bar dataKey="net" fill="#1AA14D" radius={[6, 6, 0, 0]} name="Net Salary" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full bg-slate-50 animate-pulse rounded-xl" />
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <h3 className="text-sm font-extrabold text-slate-900 mb-4">Earnings & Deductions Distribution</h3>
              <div className="h-64 flex items-center justify-center">
                {isMounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={payrollBreakdownData} innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value">
                        {payrollBreakdownData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full bg-slate-50 animate-pulse rounded-xl" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submodule 2: Payroll Processing */}
      {activeTab === 'processing' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Payroll Cycle Processing Engine</h3>
                <p className="text-xs text-slate-500">Filter, calculate, approve, generate, and disburse payroll batch.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                >
                  {MONTH_NAMES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                >
                  <option value="2027">2027</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                </select>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                >
                  <option value="All">All Departments</option>
                  {departmentsList.map((dept: any) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => refetchCurrentPayroll()}
                  className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 cursor-pointer"
                  title="Refresh Batch"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleExportPayrollPdf}
                  disabled={isExportingPdf}
                  className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                  title="Download Payroll Report (.pdf)"
                >
                  {isExportingPdf ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                  <span>Download Report (.pdf)</span>
                </button>
              </div>
            </div>

            {/* Current Batch Status Banner */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl text-white ${
                  currentBatchStatus === 'PAID' ? 'bg-emerald-600' :
                  currentBatchStatus === 'GENERATED' ? 'bg-amber-600' :
                  currentBatchStatus === 'APPROVED' ? 'bg-indigo-600' :
                  currentBatchStatus === 'CALCULATED' ? 'bg-blue-600' : 'bg-slate-600'
                }`}>
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Payroll Cycle:</span>
                    <span className="text-xs font-black text-slate-900">{selectedMonth} {selectedYear}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                      currentBatchStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                      currentBatchStatus === 'GENERATED' ? 'bg-amber-100 text-amber-800' :
                      currentBatchStatus === 'APPROVED' ? 'bg-indigo-100 text-indigo-800' :
                      currentBatchStatus === 'CALCULATED' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {currentBatchStatus}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {currentPayroll
                      ? `${currentPayroll.totalEmployees || currentPayroll.items?.length || 0} Employees in this run • Total Net: ${formatCurrency(currentPayroll.netSalary)}`
                      : 'No payroll cycle calculated yet for this month.'}
                  </p>
                </div>
              </div>

              {currentPayroll && (
                <div className="flex items-center gap-4 text-xs font-medium">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Gross Payout</span>
                    <span className="font-bold text-slate-900">{formatCurrency(currentPayroll.grossSalary)}</span>
                  </div>
                  <div className="border-l border-slate-200 pl-4">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Deductions</span>
                    <span className="font-bold text-rose-600">{formatCurrency(currentPayroll.totalDeductions)}</span>
                  </div>
                  <div className="border-l border-slate-200 pl-4">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Net Payout</span>
                    <span className="font-black text-emerald-700">{formatCurrency(currentPayroll.netSalary)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Workflow Action Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              <button
                onClick={() => calculateMutation.mutate()}
                disabled={calculateMutation.isPending}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer disabled:opacity-50 active:scale-95 transition-all"
              >
                <Play className="w-4 h-4" /> {calculateMutation.isPending ? 'Calculating...' : '1. Calculate Payroll'}
              </button>
              <button
                onClick={() => approveMutation.mutate()}
                disabled={approveMutation.isPending || !currentPayroll || currentBatchStatus === 'APPROVED' || currentBatchStatus === 'GENERATED' || currentBatchStatus === 'PAID'}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer disabled:opacity-50 active:scale-95 transition-all"
              >
                <CheckCircle className="w-4 h-4" /> {approveMutation.isPending ? 'Approving...' : '2. Approve Batch'}
              </button>
              <button
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending || !currentPayroll || currentBatchStatus === 'DRAFT' || currentBatchStatus === 'GENERATED' || currentBatchStatus === 'PAID'}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer disabled:opacity-50 active:scale-95 transition-all"
              >
                <FileText className="w-4 h-4" /> {generateMutation.isPending ? 'Generating...' : '3. Generate Slips'}
              </button>
              <button
                onClick={() => disburseMutation.mutate()}
                disabled={disburseMutation.isPending || !currentPayroll || currentBatchStatus === 'PAID'}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer disabled:opacity-50 active:scale-95 transition-all"
              >
                <Send className="w-4 h-4" /> {disburseMutation.isPending ? 'Disbursing...' : '4. Disburse Payout'}
              </button>
            </div>
          </div>

          {/* Current Batch Payroll Items Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Employee Itemized Payroll Run</h3>
                <p className="text-xs text-slate-400">Real-time attendance days, approved expense claims, loans, commissions, and deductions</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase border-b border-slate-100">
                  <tr>
                    <th className="p-3">Employee</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Days (P / A / L)</th>
                    <th className="p-3">Basic</th>
                    <th className="p-3">Allowances</th>
                    <th className="p-3">Comm.</th>
                    <th className="p-3 text-emerald-700">Reimbursement</th>
                    <th className="p-3 text-rose-600">Loan Ded.</th>
                    <th className="p-3 text-rose-600">Unpaid Leave</th>
                    <th className="p-3">Gross</th>
                    <th className="p-3">Deductions</th>
                    <th className="p-3 font-black">Net Salary</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Payable</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {!currentPayroll || !currentPayroll.items || currentPayroll.items.length === 0 ? (
                    <tr>
                      <td colSpan={15} className="p-8 text-center text-slate-400">
                        {isCurrentPayrollLoading
                          ? 'Loading current payroll items...'
                          : `No calculated payroll records for ${selectedMonth} ${selectedYear}. Click "1. Calculate Payroll" to run calculation.`}
                      </td>
                    </tr>
                  ) : (
                    currentPayroll.items.map((item: any) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-bold text-slate-900">
                          {item.employee?.firstName} {item.employee?.lastName}
                          <span className="block text-[10px] text-slate-400 font-normal">{item.employee?.employeeCode}</span>
                        </td>
                        <td className="p-3 text-slate-600">{item.employee?.department?.name || 'General'}</td>
                        <td className="p-3 text-slate-600">
                          <span className="font-semibold text-emerald-700">{item.presentDays || 0}P</span> /{' '}
                          <span className="font-semibold text-rose-600">{item.absentDays || 0}A</span> /{' '}
                          <span className="font-semibold text-amber-600">{item.unpaidLeaves || 0}L</span>
                        </td>
                        <td className="p-3 text-slate-800">₹{Number(item.basicSalary || 0).toLocaleString('en-IN')}</td>
                        <td className="p-3 text-slate-800">₹{Number(item.allowances || 0).toLocaleString('en-IN')}</td>
                        <td className="p-3 text-slate-800">₹{Number(item.commission || 0).toLocaleString('en-IN')}</td>
                        <td className="p-3 font-bold text-emerald-700">₹{Number(item.reimbursement || 0).toLocaleString('en-IN')}</td>
                        <td className="p-3 font-bold text-rose-600">₹{Number(item.loanDeduction || 0).toLocaleString('en-IN')}</td>
                        <td className="p-3 font-bold text-rose-600">₹{Number(item.unpaidLeaveDeduction || 0).toLocaleString('en-IN')}</td>
                        <td className="p-3 font-bold text-slate-900">₹{Number(item.grossSalary || 0).toLocaleString('en-IN')}</td>
                        <td className="p-3 text-rose-600">₹{Number((Number(item.deductions || 0) + Number(item.loanDeduction || 0) + Number(item.unpaidLeaveDeduction || 0))).toLocaleString('en-IN')}</td>
                        <td className="p-3 font-black text-emerald-700">₹{Number(item.netSalary || 0).toLocaleString('en-IN')}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                            item.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                            item.status === 'APPROVED' ? 'bg-indigo-100 text-indigo-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {item.status}
                          </span>
                          {item.status === 'PAID' && (
                            <span className="block text-[10px] text-slate-500 mt-1">{item.emailStatus || 'EMAIL_PENDING'} · {item.whatsappStatus || 'WHATSAPP_PENDING'}</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-700">{item.calculationSnapshot?.payableDays ?? item.payableDays ?? '—'}</td>
                        <td className="p-3">
                          {item.status === 'PAID' ? (
                            <span className="text-[11px] font-bold text-emerald-700">PAID</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setPayTarget(item)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold cursor-pointer"
                            >
                              Mark as Paid
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Submodule 3: Salary Structures & Formulas */}
      {activeTab === 'structures' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Configured Salary Structures</h3>
              <p className="text-xs text-slate-500">Define base salaries, statutory rules (PF, ESI, PT), and allowances per employee.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  resetStructureForm();
                  setIsStructureOpen(true);
                }}
                className="px-3.5 py-1.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Structure</span>
              </button>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search employee or code"
                  value={structSearch}
                  onChange={(e) => setStructSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium w-48 sm:w-60 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <button
                onClick={() => refetchStructures()}
                className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase border-b border-slate-100">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Basic Salary</th>
                  <th className="p-3">HRA</th>
                  <th className="p-3">Allowances</th>
                  <th className="p-3">Deductions</th>
                  <th className="p-3">Net Payout</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {salaryStructures.filter((st: any) => {
                  if (!structSearch.trim()) return true;
                  const q = structSearch.toLowerCase();
                  const name = `${st.employee?.firstName || ''} ${st.employee?.lastName || ''}`.toLowerCase();
                  const code = (st.employee?.employeeCode || '').toLowerCase();
                  return name.includes(q) || code.includes(q);
                }).length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No salary structures configured yet. Click "Add Structure" to set up employee compensation.
                    </td>
                  </tr>
                ) : (
                  salaryStructures
                    .filter((st: any) => {
                      if (!structSearch.trim()) return true;
                      const q = structSearch.toLowerCase();
                      const name = `${st.employee?.firstName || ''} ${st.employee?.lastName || ''}`.toLowerCase();
                      const code = (st.employee?.employeeCode || '').toLowerCase();
                      return name.includes(q) || code.includes(q);
                    })
                    .map((st: any) => {
                      const empName = `${st.employee?.firstName || ''} ${st.employee?.lastName || ''}`.trim() || `Employee #${st.employeeId}`;
                      const deptName = st.employee?.department?.name || st.employee?.designation?.name || 'General';
                      return (
                        <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-[10px]">
                                {empName.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{empName}</p>
                                <p className="text-[10px] text-slate-400">{st.employee?.employeeCode || `#${st.employeeId}`} • {deptName}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 font-semibold text-slate-700">{formatCurrency(st.basicSalary)}</td>
                          <td className="p-3 text-slate-600">{formatCurrency(st.hra)}</td>
                          <td className="p-3 text-slate-600">{formatCurrency(Number(st.allowances || 0) + Number(st.specialAllowance || 0))}</td>
                          <td className="p-3 font-medium text-rose-600">{formatCurrency(st.totalDeductions || (Number(st.pf || 0) + Number(st.esi || 0) + Number(st.professionalTax || 0)))}</td>
                          <td className="p-3 font-black text-emerald-700">{formatCurrency(st.netSalary)}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {st.status || 'ACTIVE'}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingStructureId(st.id);
                                  setStructEmployeeId(String(st.employeeId));
                                  setStructBasic(st.basicSalary || 0);
                                  setStructHra(st.hra || 0);
                                  setStructAllowances(st.allowances || 0);
                                  setStructSpecial(st.specialAllowance || 0);
                                  setStructPf(st.pf || 0);
                                  setStructEsi(st.esi || 0);
                                  setStructProfTax(st.professionalTax || 200);
                                  setStructTds(st.tds || 0);
                                  setIsStructureOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Structure"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this salary structure?')) {
                                    deleteStructureMutation.mutate(st.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Structure"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {activeTab === 'slips' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Generated Salary Slips</h3>
              <p className="text-xs text-slate-500">Download, print, or review individual employee salary statements.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
                className="px-3.5 py-1.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{generateMutation.isPending ? 'Generating...' : `Generate Slips (${selectedMonth} ${selectedYear})`}</span>
              </button>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search employee or slip #"
                  value={slipSearch}
                  onChange={(e) => {
                    setSlipSearch(e.target.value);
                    setSlipsPage(1);
                  }}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium w-48 sm:w-60 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <button
                onClick={() => refetchSlips()}
                className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase border-b border-slate-100">
                <tr>
                  <th className="p-3">Slip Number</th>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Pay Period</th>
                  <th className="p-3">Attendance</th>
                  <th className="p-3">Gross Salary</th>
                  <th className="p-3">Net Salary</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {salarySlips.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No salary slips generated for this period yet. Run payroll calculation and slip generation.
                    </td>
                  </tr>
                ) : (
                  salarySlips.map((slip: any) => (
                    <tr key={slip.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-bold text-slate-900">{slip.slipNumber}</td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-900">{slip.employee?.firstName} {slip.employee?.lastName}</span>
                        <span className="block text-[10px] text-slate-400">{slip.employee?.employeeCode}</span>
                      </td>
                      <td className="p-3 text-slate-500">{slip.payPeriod}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {slip.workingDays ?? slip.payrollItem?.workingDays ?? 0} Working
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                            {slip.presentDays ?? slip.payrollItem?.presentDays ?? 0} Present
                          </span>
                          {(slip.absentDays ?? slip.payrollItem?.absentDays ?? 0) > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700">
                              {slip.absentDays ?? slip.payrollItem?.absentDays} Absent
                            </span>
                          )}
                          {((slip.paidLeaveDays ?? slip.payrollItem?.paidLeaveDays ?? 0) + (slip.unpaidLeaveDays ?? slip.payrollItem?.unpaidLeaveDays ?? 0)) > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700">
                              {(slip.paidLeaveDays ?? slip.payrollItem?.paidLeaveDays ?? 0) + (slip.unpaidLeaveDays ?? slip.payrollItem?.unpaidLeaveDays ?? 0)} Leave
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 font-semibold">₹{Number(slip.grossSalary || 0).toLocaleString('en-IN')}</td>
                      <td className="p-3 font-bold text-emerald-700">₹{Number(slip.netSalary || 0).toLocaleString('en-IN')}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                          slip.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {slip.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedSlip(slip);
                              setIsSlipModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-indigo-600" /> View Slip
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <AdminPagination
            page={slipsPage}
            pageSize={slipsPageSize}
            total={slipsPagination.total}
            totalPages={slipsPagination.totalPages}
            onPageChange={setSlipsPage}
            onPageSizeChange={(size) => {
              setSlipsPageSize(size);
              setSlipsPage(1);
            }}
          />
        </div>
      )}

      {/* Submodule 6: Payroll Settings */}
      {activeTab === 'settings' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">Customer Payroll Policy Parameters</h3>
            <p className="text-xs text-slate-500">Configure standard working days, overtime multiplier, and statutory deduction rates.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Working Days per Month</label>
              <input
                type="number"
                value={workingDays}
                onChange={(e) => setWorkingDays(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Overtime Multiplier</label>
              <input
                type="number"
                step="0.1"
                value={overtimeRate}
                onChange={(e) => setOvertimeRate(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Provident Fund (PF %)</label>
              <input
                type="number"
                value={pfRate}
                onChange={(e) => setPfRate(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Employee State Insurance (ESI %)</label>
              <input
                type="number"
                step="0.05"
                value={esiRate}
                onChange={(e) => setEsiRate(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Tax Exemption Limit (₹)</label>
              <input
                type="number"
                value={taxExemptionLimit}
                onChange={(e) => setTaxExemptionLimit(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleSavePolicy}
              disabled={savePolicyMutation.isPending}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50 transition-all active:scale-95"
            >
              {savePolicyMutation.isPending ? 'Saving Policy...' : 'Save Policy Configuration'}
            </button>
          </div>
        </div>
      )}

      {/* Salary Structure Drawer */}
      <AdminFormDrawer
        isOpen={isStructureOpen}
        onClose={() => {
          setIsStructureOpen(false);
          resetStructureForm();
        }}
        title={editingStructureId ? 'Edit Salary Structure' : 'Formula & Salary Structure Builder'}
        subtitle="Configure earnings components and statutory deduction percentages"
      >
        <form onSubmit={handleStructureSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Select Employee <span className="text-red-500">*</span>
            </label>
            <select
              value={structEmployeeId}
              onChange={(e) => setStructEmployeeId(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">-- Choose Employee --</option>
              {employeesList.map((emp: any) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeCode})
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/50 rounded-lg text-xs">
            <span className="font-bold text-emerald-800 dark:text-emerald-300">Auto-Formula Helper: </span>
            Changing Basic Salary auto-calculates 40% HRA and 12% PF according to standard statutory rules.
          </div>

          <div className="border-t border-slate-100 pt-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Earnings Components</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">Basic Salary (₹) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={structBasic}
                  onChange={(e) => handleBasicChange(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">HRA (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={structHra}
                  onChange={(e) => setStructHra(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">Allowances (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={structAllowances}
                  onChange={(e) => setStructAllowances(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">Special Allowance (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={structSpecial}
                  onChange={(e) => setStructSpecial(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Deductions Components</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">Provident Fund (PF ₹)</label>
                <input
                  type="number"
                  min="0"
                  value={structPf}
                  onChange={(e) => setStructPf(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">ESI (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={structEsi}
                  onChange={(e) => setStructEsi(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">Professional Tax (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={structProfTax}
                  onChange={(e) => setStructProfTax(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">TDS Tax (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={structTds}
                  onChange={(e) => setStructTds(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-xl space-y-1 text-xs">
            <div className="flex justify-between font-semibold text-slate-700">
              <span>Gross Earnings:</span>
              <span>{formatCurrency(structGross)}</span>
            </div>
            <div className="flex justify-between font-semibold text-rose-600">
              <span>Total Deductions:</span>
              <span>- {formatCurrency(structDeductions)}</span>
            </div>
            <div className="flex justify-between font-black text-emerald-700 text-sm pt-1 border-t border-slate-200">
              <span>Calculated Net Salary:</span>
              <span>{formatCurrency(structNet)}</span>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsStructureOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveStructureMutation.isPending}
              className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {saveStructureMutation.isPending ? 'Saving...' : 'Save Structure'}
            </button>
          </div>
        </form>
      </AdminFormDrawer>

      {/* Itemized Salary Slip Modal */}
      {isSlipModalOpen && selectedSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Official Payslip Statement</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {selectedSlip.slipNumber} • {selectedSlip.payPeriod} • Period Date: {selectedSlip.date || (selectedSlip.generatedAt ? new Date(selectedSlip.generatedAt).toISOString().split('T')[0] : '')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSlipModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Employee Info Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Employee Name</span>
                <span className="font-bold text-slate-900">{selectedSlip.employee?.firstName} {selectedSlip.employee?.lastName}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Employee Code</span>
                <span className="font-bold text-slate-900">{selectedSlip.employee?.employeeCode}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Department</span>
                <span className="font-bold text-slate-900">{selectedSlip.employee?.department?.name || 'General'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
                <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 font-black rounded-md text-[10px]">
                  {selectedSlip.status}
                </span>
              </div>
            </div>

            {/* Attendance & Working Days Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-indigo-50/50 border border-indigo-100/80 p-4 rounded-2xl text-xs">
              <div>
                <span className="text-[10px] uppercase font-black text-slate-400 block">Working Days</span>
                <span className="text-sm font-black text-slate-900">
                  {selectedSlip.workingDays ?? selectedSlip.payrollItem?.workingDays ?? 0} days
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-black text-emerald-600 block">Present Days</span>
                <span className="text-sm font-black text-emerald-700">
                  {selectedSlip.presentDays ?? selectedSlip.payrollItem?.presentDays ?? 0} days
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-black text-rose-600 block">Absent Days</span>
                <span className="text-sm font-black text-rose-700">
                  {selectedSlip.absentDays ?? selectedSlip.payrollItem?.absentDays ?? 0} days
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-black text-amber-600 block">Approved Leave</span>
                <span className="text-sm font-black text-amber-700">
                  {selectedSlip.paidLeaveDays ?? selectedSlip.payrollItem?.paidLeaveDays ?? 0} paid
                  {(selectedSlip.unpaidLeaveDays ?? selectedSlip.payrollItem?.unpaidLeaveDays ?? 0) > 0 ? ` + ${selectedSlip.unpaidLeaveDays ?? selectedSlip.payrollItem?.unpaidLeaveDays} LOP` : ''}
                </span>
              </div>
            </div>

            {/* Salary Breakdown Table */}
            {(() => {
              const earningsItems: [string, number][] = [
                ['Basic Salary', selectedSlip.basicSalary || 0],
                ['HRA Allowance', selectedSlip.hra || 0],
                ['Allowances & Special', selectedSlip.allowances || 0],
              ];
              if (selectedSlip.payrollItem?.commission > 0) earningsItems.push(['Earned Commission', selectedSlip.payrollItem.commission]);
              if (selectedSlip.payrollItem?.reimbursement > 0) earningsItems.push(['Expense Reimbursement', selectedSlip.payrollItem.reimbursement]);

              const deductionsItems: [string, number][] = [
                ['Provident Fund (PF)', selectedSlip.pf || 0],
                ['ESI Contribution', selectedSlip.esi || 0],
                ['TDS / Income Tax', selectedSlip.tds || 0],
              ];
              if (selectedSlip.payrollItem?.loanDeduction > 0) deductionsItems.push(['Loan EMI Deduction', selectedSlip.payrollItem.loanDeduction]);
              if (selectedSlip.payrollItem?.unpaidLeaveDeduction > 0) deductionsItems.push(['Loss of Pay (LOP)', selectedSlip.payrollItem.unpaidLeaveDeduction]);

              const maxRows = Math.max(earningsItems.length, deductionsItems.length);

              return (
                <div className="space-y-4 text-xs">
                  <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#0F763E] text-white">
                          <th className="py-2.5 px-3.5 font-bold uppercase tracking-wider text-[11px] w-[30%]">EARNINGS</th>
                          <th className="py-2.5 px-3.5 font-bold uppercase tracking-wider text-[11px] text-right w-[20%]">AMOUNT</th>
                          <th className="py-2.5 px-3.5 font-bold uppercase tracking-wider text-[11px] w-[30%] border-l border-emerald-700/60">DEDUCTIONS</th>
                          <th className="py-2.5 px-3.5 font-bold uppercase tracking-wider text-[11px] text-right w-[20%]">AMOUNT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {Array.from({ length: maxRows }).map((_, idx) => {
                          const earn = earningsItems[idx];
                          const ded = deductionsItems[idx];
                          return (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                              <td className="py-2.5 px-3.5 text-slate-700 font-medium">{earn ? earn[0] : ''}</td>
                              <td className="py-2.5 px-3.5 text-right font-bold text-slate-900 whitespace-nowrap tabular-nums">
                                {earn ? formatCurrency(earn[1]) : ''}
                              </td>
                              <td className="py-2.5 px-3.5 text-slate-700 font-medium border-l border-slate-100">{ded ? ded[0] : ''}</td>
                              <td className="py-2.5 px-3.5 text-right font-bold text-rose-600 whitespace-nowrap tabular-nums">
                                {ded ? formatCurrency(ded[1]) : ''}
                              </td>
                            </tr>
                          );
                        })}
                        {/* Totals Row */}
                        <tr className="bg-slate-100/80 font-bold border-t-2 border-slate-200">
                          <td className="py-2.5 px-3.5 text-slate-900 font-black">Total Gross Salary</td>
                          <td className="py-2.5 px-3.5 text-right font-black text-slate-900 whitespace-nowrap tabular-nums">
                            {formatCurrency(selectedSlip.grossSalary)}
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-900 font-black border-l border-slate-200">Total Deductions</td>
                          <td className="py-2.5 px-3.5 text-right font-black text-rose-600 whitespace-nowrap tabular-nums">
                            {formatCurrency(selectedSlip.totalDeductions)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Net Payable Section */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#E8F9EE] border border-[#86EFAC] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div>
                      <span className="text-[11px] font-black uppercase text-[#15803D] tracking-wider block">
                        NET PAYABLE (TAKE HOME SALARY)
                      </span>
                      <p className="text-2xl sm:text-3xl font-black text-[#15803D] mt-0.5 tabular-nums">
                        {formatCurrency(selectedSlip.netSalary)}
                      </p>
                    </div>
                    <div className="flex flex-col sm:items-end gap-2">
                      <p className="text-[11px] font-medium text-slate-600 leading-relaxed">
                        Confidential Document — Generated electronically by QB Suite
                      </p>
                      <button
                        onClick={() => {
                          const token = localStorage.getItem('token') || '';
                          const win = window.open(`/api/v1/admin/payroll/slips/${selectedSlip.id}/pdf`, '_blank');
                          if (!win) window.print();
                        }}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer self-start sm:self-auto transition-colors"
                      >
                        <Printer className="w-4 h-4" /> Download Official PDF
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
      {payTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-3">
            <h3 className="font-extrabold text-slate-900">Are you sure you want to mark this payroll as Paid?</h3>
            <p className="text-sm text-slate-600">Employee: {payTarget.employee?.firstName} {payTarget.employee?.lastName}</p>
            <p className="text-sm text-slate-600">Payroll Month: {selectedMonth} {selectedYear}</p>
            <p className="text-sm text-slate-600">Net Salary: ₹{Number(payTarget.netSalary || 0).toLocaleString('en-IN')}</p>
            <p className="text-sm text-slate-600">Payment status: {payTarget.status}</p>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setPayTarget(null)} className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold cursor-pointer">Cancel</button>
              <button
                type="button"
                disabled={payItemMutation.isPending}
                onClick={() => payItemMutation.mutate(payTarget.id)}
                className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold cursor-pointer"
              >
                {payItemMutation.isPending ? 'Marking...' : 'Mark as Paid'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

