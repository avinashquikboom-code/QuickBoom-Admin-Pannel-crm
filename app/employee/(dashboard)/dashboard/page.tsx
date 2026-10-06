'use client';

import React from 'react';
import { useEmployeeAuthStore } from '@/lib/employee-store';
import { Clock3, CalendarDays, FileText, LayoutDashboard, MonitorSmartphone } from 'lucide-react';
import { hasPermission } from '@/lib/access-control';
import Link from 'next/link';

export default function EmployeeDashboardPage() {
  const user = useEmployeeAuthStore((state) => state.user);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Welcome back, {user?.firstName || 'Employee'}! 👋
        </h1>
        <p className="text-slate-500 font-medium">
          Here is an overview of your work, attendance, and schedules for today.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Quick Links / Metrics */}
        {hasPermission(user, 'employee.attendance.view') && (
          <Link href="/employee/attendance" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock3 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500">Attendance</p>
                <p className="text-lg font-black text-slate-900">Mark Today</p>
              </div>
            </div>
          </Link>
        )}
        
        {hasPermission(user, 'employee.leave.view') && (
          <Link href="/employee/leaves" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all group cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CalendarDays className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500">Leaves</p>
                <p className="text-lg font-black text-slate-900">Request Leave</p>
              </div>
            </div>
          </Link>
        )}
        
        {hasPermission(user, 'employee.remote_work.view') && (
          <Link href="/employee/remote-work" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-purple-300 hover:shadow-md transition-all group cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <MonitorSmartphone className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500">Remote Work</p>
                <p className="text-lg font-black text-slate-900">Apply WFH</p>
              </div>
            </div>
          </Link>
        )}

        {hasPermission(user, 'employee.salary.view') && (
          <Link href="/employee/salary-slips" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-amber-300 hover:shadow-md transition-all group cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500">Payslips</p>
                <p className="text-lg font-black text-slate-900">View Salary</p>
              </div>
            </div>
          </Link>
        )}
      </div>
      
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center mt-8">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <LayoutDashboard className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-slate-900 mb-2">Employee Portal Active</h3>
        <p className="text-slate-500 max-w-md mx-auto">
          You are successfully logged into the isolated Employee Web application. Navigate using the sidebar to access your authorized modules.
        </p>
      </div>
    </div>
  );
}
