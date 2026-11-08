'use client';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import * as React from 'react';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/common/Select';
import { mockDepartments } from '@/lib/mock-data';
import { faMagnifyingGlass, faPhone } from '@fortawesome/free-solid-svg-icons';
import { faEnvelope, faEye } from '@fortawesome/free-regular-svg-icons';
export function EmployeeTable({ employees, onSelectEmployee, }) {
    const [search, setSearch] = React.useState('');
    const [selectedDept, setSelectedDept] = React.useState('All Departments');
    const [selectedStatus, setSelectedStatus] = React.useState('all');
    const filtered = React.useMemo(() => {
        return employees.filter((emp) => {
            const matchSearch = emp.name.toLowerCase().includes(search.toLowerCase()) ||
                emp.id.toLowerCase().includes(search.toLowerCase()) ||
                emp.email.toLowerCase().includes(search.toLowerCase()) ||
                emp.designation.toLowerCase().includes(search.toLowerCase());
            const matchDept = selectedDept === 'All Departments' || emp.department === selectedDept;
            const matchStatus = selectedStatus === 'all' || emp.status === selectedStatus;
            return matchSearch && matchDept && matchStatus;
        });
    }, [employees, search, selectedDept, selectedStatus]);
    const columns = [
        {
            header: 'Employee',
            cell: (emp) => (<div className="flex items-center gap-3">
          <Avatar className="size-9 border border-slate-200">
            <AvatarImage src={emp.avatar} alt={emp.name}/>
            <AvatarFallback className="bg-brand text-primary-foreground text-xs">
              {emp.firstName[0]}
              {emp.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 leading-tight">
              {emp.name}
            </span>
            <span className="text-xs text-slate-400 font-mono">{emp.id}</span>
          </div>
        </div>),
        },
        {
            header: 'Department & Role',
            accessorFn: (employee) => `${employee.department} ${employee.designation}`, 
            cell: (emp) => (<div className="flex flex-col">
          <span className="font-medium text-slate-800">{emp.designation}</span>
          <span className="text-xs text-brand-dark font-medium">
            {emp.department}
          </span>
        </div>),
        },
        {
            header: 'Contact Info',
            accessorKey: 'email',
            cell: (emp) => (<div className="flex flex-col text-xs text-slate-500 space-y-0.5">
          <span className="flex items-center gap-1.5 truncate">
            <FontAwesomeIcon icon={faEnvelope} className="size-3.5 text-slate-400 shrink-0"/>
            {emp.email}
          </span>
          <span className="flex items-center gap-1.5">
            <FontAwesomeIcon icon={faPhone} className="size-3.5 text-slate-400 shrink-0"/>
            {emp.phone}
          </span>
        </div>),
        },
        {
            header: 'Employment',
            accessorKey: 'employmentType',
            cell: (emp) => (<div className="flex flex-col text-xs">
          <span className="font-semibold text-slate-800">
            {emp.employmentType}
          </span>
          <span className="text-slate-400">Joined {emp.joinDate}</span>
        </div>),
        },
        {
            header: 'Status',
            cell: (emp) => <StatusBadge status={emp.status}/>,
        },
        {
            header: 'Actions',
            className: 'text-right',
            cell: (emp) => (<div className="flex items-center justify-end gap-1.5">
          <Button size="sm" variant="outline" onClick={() => onSelectEmployee(emp)} className="h-8 px-2.5 text-xs text-slate-700 hover:text-brand-dark hover:bg-brand-light border-slate-200">
            <FontAwesomeIcon icon={faEye} className="size-3.5 mr-1 text-slate-400"/>
            View Profile
          </Button>
        </div>),
        },
    ];
    return (<div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="relative flex-1 sm:max-w-xs">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-slate-400"/>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee by name, ID, role..." className="h-9 pl-8 pr-3 text-xs border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-brand"/>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Department Filter */}
          <Select value={selectedDept} onValueChange={setSelectedDept}>
            <SelectTrigger className="h-9 text-xs border-slate-200 w-44 bg-slate-50/50">
              <SelectValue placeholder="Department"/>
            </SelectTrigger>
            <SelectContent>
              {mockDepartments.map((dept) => (<SelectItem key={dept} value={dept} className="text-xs">
                  {dept}
                </SelectItem>))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="h-9 text-xs border-slate-200 w-32 bg-slate-50/50">
              <SelectValue placeholder="Status"/>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                All Status
              </SelectItem>
              <SelectItem value="active" className="text-xs">
                Active
              </SelectItem>
              <SelectItem value="on_leave" className="text-xs">
                On Leave
              </SelectItem>
              <SelectItem value="inactive" className="text-xs">
                Inactive
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Employees DataTable */}
      <DataTable enableRowSelection label="Employees" columns={columns} data={filtered} pageSize={8} emptyState={<div className="py-8 text-center text-slate-500">
            No employees found matching the filters.
          </div>}/>
    </div>);
}
