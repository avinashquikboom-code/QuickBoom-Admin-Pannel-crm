'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Kanban,
  CheckSquare,
  Building2,
  FileText,
  Settings,
  LogOut,
  Zap,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Leads', href: '/leads', icon: Users },
  { name: 'Sales Pipeline', href: '/crm', icon: Kanban },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Contacts', href: '/contacts', icon: Building2 },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  return (
    <aside className="w-64 bg-white text-[#0F172A] flex flex-col h-screen sticky top-0 border-r border-[#E2E8F0]">
      {/* QuikBoom Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-[#E2E8F0] justify-between">
        <div className="flex items-center gap-2.5 font-bold text-lg text-[#0F172A]">
          <div className="w-8 h-8 rounded-lg bg-[#0F766E] flex items-center justify-center text-white shadow-xs">
            <Zap className="w-4 h-4 fill-white text-white" />
          </div>
          <span className="tracking-tight">QuikBoom CRM</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-lg transition-all ${
                isActive
                  ? 'bg-[#0F766E] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC]">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1 mr-2">
            <p className="text-xs font-semibold text-[#0F172A] truncate">
              {user ? `${user.firstName} ${user.lastName}` : 'QuikBoom Admin'}
            </p>
            <p className="text-[11px] text-[#64748B] truncate">
              {user?.tenantName || 'Enterprise CRM'}
            </p>
          </div>
          <button
            onClick={() => {
              logout();
              window.location.href = '/login';
            }}
            className="p-1.5 hover:bg-[#E2E8F0] rounded-lg text-[#64748B] hover:text-[#DC2626] transition-colors cursor-pointer"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
