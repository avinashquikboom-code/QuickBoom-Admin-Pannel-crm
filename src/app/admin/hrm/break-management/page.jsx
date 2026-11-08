'use client';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import * as React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { FormDrawer, DrawerFormField } from '@/components/common/drawers/FormDrawer';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/common/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { Label } from '@/components/common/Label';
import { toast } from '@/hooks/use-toast';
import { faCheckCircle, faClock, faMagnifyingGlass, faMugHot, faPlus, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
const mockBreakRecords = [
    {
        id: 'BRK-101',
        employeeId: 'EMP-1001',
        employeeName: 'Sarah Jenkins',
        employeeAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        department: 'Engineering',
        breakType: 'Lunch Break',
        startTime: '12:30 PM',
        endTime: '01:15 PM',
        duration: '45m',
        status: 'completed',
        overstayMinutes: 0,
    },
    {
        id: 'BRK-102',
        employeeId: 'EMP-1002',
        employeeName: 'Alexander Vance',
        employeeAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        department: 'Engineering',
        breakType: 'Coffee Break',
        startTime: '03:15 PM',
        endTime: '03:40 PM',
        duration: '25m',
        status: 'exceeded',
        overstayMinutes: 10,
    },
    {
        id: 'BRK-103',
        employeeId: 'EMP-1003',
        employeeName: 'Priya Sharma',
        employeeAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
        department: 'Product & Design',
        breakType: 'Lunch Break',
        startTime: '01:00 PM',
        endTime: null,
        duration: '35m (ongoing)',
        status: 'active',
        overstayMinutes: 0,
    },
    {
        id: 'BRK-104',
        employeeId: 'EMP-1006',
        employeeName: 'Liam Chen',
        employeeAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
        department: 'Sales',
        breakType: 'Personal Break',
        startTime: '11:00 AM',
        endTime: '11:20 AM',
        duration: '20m',
        status: 'completed',
        overstayMinutes: 0,
    },
    {
        id: 'BRK-105',
        employeeId: 'EMP-1008',
        employeeName: 'Devon Kowalski',
        employeeAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
        department: 'Operations',
        breakType: 'Lunch Break',
        startTime: '12:00 PM',
        endTime: '01:10 PM',
        duration: '70m',
        status: 'exceeded',
        overstayMinutes: 10,
    },
];
export default function BreakManagementPage() {
    const [breaks, setBreaks] = React.useState(mockBreakRecords);
    const [search, setSearch] = React.useState('');
    const [selectedType, setSelectedType] = React.useState('all');
    const [logDialogOpen, setLogDialogOpen] = React.useState(false);
    const [formData, setFormData] = React.useState({
        employeeName: 'Sarah Jenkins',
        breakType: 'Coffee Break',
        startTime: '03:00 PM',
        endTime: '03:15 PM',
    });
    const filtered = React.useMemo(() => {
        return breaks.filter((b) => {
            const matchSearch = b.employeeName.toLowerCase().includes(search.toLowerCase()) ||
                b.employeeId.toLowerCase().includes(search.toLowerCase());
            const matchType = selectedType === 'all' || b.breakType === selectedType;
            return matchSearch && matchType;
        });
    }, [breaks, search, selectedType]);
    const handleAddBreak = (e) => {
        e.preventDefault();
        const newBreak = {
            id: `BRK-${100 + breaks.length + 1}`,
            employeeId: 'EMP-1001',
            employeeName: formData.employeeName,
            employeeAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
            department: 'Engineering',
            breakType: formData.breakType,
            startTime: formData.startTime,
            endTime: formData.endTime,
            duration: '15m',
            status: 'completed',
            overstayMinutes: 0,
        };
        setBreaks((prev) => [newBreak, ...prev]);
        setLogDialogOpen(false);
        toast.success('Break log recorded successfully');
    };
    const columns = [
        {
            header: 'Employee',
            cell: (rec) => (<div className="flex items-center gap-3">
          <Avatar className="size-8 border border-slate-200">
            <AvatarImage src={rec.employeeAvatar} alt={rec.employeeName}/>
            <AvatarFallback className="bg-brand text-primary-foreground text-xs">
              {rec.employeeName.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 leading-tight">
              {rec.employeeName}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {rec.employeeId} • {rec.department}
            </span>
          </div>
        </div>),
        },
        {
            header: 'Break Type',
            cell: (rec) => (<Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 font-medium text-xs shadow-none">
          {rec.breakType}
        </Badge>),
        },
        {
            header: 'Start Time',
            cell: (rec) => (<span className="font-mono text-xs font-medium text-slate-700">
          {rec.startTime}
        </span>),
        },
        {
            header: 'End Time',
            cell: (rec) => (<span className="font-mono text-xs font-medium text-slate-700">
          {rec.endTime || (<span className="text-brand-dark font-bold animate-pulse">In Progress</span>)}
        </span>),
        },
        {
            header: 'Duration',
            cell: (rec) => (<span className="font-semibold text-xs text-slate-900">
          {rec.duration}
        </span>),
        },
        {
            header: 'Policy Compliance',
            cell: (rec) => {
                if (rec.status === 'exceeded') {
                    return (<span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
              <FontAwesomeIcon icon={faTriangleExclamation} className="size-3"/>
              Overstay (+{rec.overstayMinutes}m)
            </span>);
                }
                if (rec.status === 'active') {
                    return (<span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-dark bg-brand-light border border-brand-light px-2 py-0.5 rounded">
              <FontAwesomeIcon icon={faClock} className="size-3"/>
              Active Now
            </span>);
                }
                return (<span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-dark bg-brand-light border border-brand-light px-2 py-0.5 rounded">
            <FontAwesomeIcon icon={faCheckCircle} className="size-3"/>
            Within Policy
          </span>);
            },
        },
    ];
    return (<div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader title="Break & Interval Management" description="Monitor lunch and short break durations in compliance with workplace time policies." actions={<Button size="sm" onClick={() => setLogDialogOpen(true)} className="bg-brand hover:bg-primary-hover text-primary-foreground font-medium text-xs h-9">
            <FontAwesomeIcon icon={faPlus} className="size-4 mr-1.5"/>
            Log Manual Break
          </Button>}/>

      {/* Break Policy KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">
              Standard Lunch Policy
            </span>
            <FontAwesomeIcon icon={faMugHot} className="size-4 text-brand"/>
          </div>
          <p className="text-xl font-bold text-slate-900 mt-1">60 Minutes</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Default allocated midday window
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-brand-light bg-brand-light/50">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-brand-dark uppercase">
              Active On Break Now
            </span>
            <FontAwesomeIcon icon={faClock} className="size-4 text-brand"/>
          </div>
          <p className="text-xl font-bold text-brand-dark mt-1">1 Employee</p>
          <p className="text-[11px] text-brand mt-0.5">
            Priya Sharma (Product Design)
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/50">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-rose-700 uppercase">
              Policy Overstay Flags
            </span>
            <FontAwesomeIcon icon={faTriangleExclamation} className="size-4 text-rose-600"/>
          </div>
          <p className="text-xl font-bold text-rose-800 mt-1">2 Flags Today</p>
          <p className="text-[11px] text-rose-600 mt-0.5">
            Automatically flagged for review
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="relative flex-1 sm:max-w-xs">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-slate-400"/>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by employee name..." className="h-9 pl-8 pr-3 text-xs border-slate-200 bg-slate-50/50 focus-visible:bg-white"/>
        </div>

        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="h-9 text-xs border-slate-200 w-44 bg-slate-50/50">
            <SelectValue placeholder="Break Type"/>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              All Break Types
            </SelectItem>
            <SelectItem value="Lunch Break" className="text-xs">
              Lunch Break
            </SelectItem>
            <SelectItem value="Coffee Break" className="text-xs">
              Coffee Break
            </SelectItem>
            <SelectItem value="Personal Break" className="text-xs">
              Personal Break
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <DataTable columns={columns} data={filtered} pageSize={8} emptyState={<div className="py-8 text-center text-slate-500">No break logs recorded.</div>}/>

      {/* Manual Break FormDrawer */}
      <FormDrawer
        open={logDialogOpen}
        onOpenChange={setLogDialogOpen}
        title="Record Manual Break Log"
        description="Log a break duration for offline or off-site personnel."
        onSubmit={handleAddBreak}
        submitLabel="Save Record"
        size="standard"
      >
        <DrawerFormField label="Employee Name" required>
          <Input value={formData.employeeName} onChange={(e) => setFormData((prev) => ({ ...prev, employeeName: e.target.value }))} className="h-9 text-xs"/>
        </DrawerFormField>

        <DrawerFormField label="Break Type" required>
          <Select value={formData.breakType} onValueChange={(val) => setFormData((prev) => ({ ...prev, breakType: val }))}>
            <SelectTrigger className="h-9 text-xs w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Lunch Break" className="text-xs">
                Lunch Break
              </SelectItem>
              <SelectItem value="Coffee Break" className="text-xs">
                Coffee Break
              </SelectItem>
              <SelectItem value="Personal Break" className="text-xs">
                Personal Break
              </SelectItem>
            </SelectContent>
          </Select>
        </DrawerFormField>

        <div className="grid grid-cols-2 gap-3">
          <DrawerFormField label="Start Time" required>
            <Input value={formData.startTime} onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))} className="h-9 text-xs font-mono"/>
          </DrawerFormField>
          <DrawerFormField label="End Time" required>
            <Input value={formData.endTime} onChange={(e) => setFormData((prev) => ({ ...prev, endTime: e.target.value }))} className="h-9 text-xs font-mono"/>
          </DrawerFormField>
        </div>
      </FormDrawer>
    </div>);
}
