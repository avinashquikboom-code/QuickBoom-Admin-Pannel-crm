import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  Target, 
  Briefcase, 
  DollarSign, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  FileText,
  Calendar,
  Layers,
  MessageSquare,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: UserCheck, label: 'Attendance', path: '/attendance' },
  { icon: Users, label: 'Employees', path: '/employees' },
  { icon: Target, label: 'Lead Management', path: '/leads' },
  { icon: ShieldCheck, label: 'CRM Features', path: '/crm' },
  { icon: Layers, label: 'Projects', path: '/projects' },
  { icon: Briefcase, label: 'HRM Module', path: '/hrm' },
  { icon: DollarSign, label: 'Finance', path: '/finance' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 280 : 80 }}
      className={cn(
        "relative h-screen bg-white border-r border-slate-200 flex flex-col z-30 transition-all duration-300",
        !isOpen && "items-center"
      )}
    >
      {/* Logo Section */}
      <div className={cn(
        "p-6 flex items-center gap-3",
        !isOpen && "justify-center"
      )}>
        <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
          <TrendingUp className="text-white w-6 h-6" />
        </div>
        {isOpen && (
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xl font-bold text-slate-900 tracking-tight"
          >
            QUIK BOOM
          </motion.span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group",
              isActive 
                ? "bg-primary-50 text-primary-600 font-semibold" 
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5 min-w-[20px]",
              "transition-colors duration-200"
            )} />
            {isOpen && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="whitespace-nowrap"
              >
                {item.label}
              </motion.span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Profile / Logout Section */}
      <div className="p-4 border-t border-slate-100">
        <div className={cn(
          "flex items-center gap-3 p-2 rounded-xl bg-slate-50 mb-2",
          !isOpen && "justify-center"
        )}>
          <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white overflow-hidden">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
          </div>
          {isOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">Avinash Magar</p>
              <p className="text-xs text-slate-500 truncate">Super Admin</p>
            </div>
          )}
        </div>
        
        <button 
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all",
            !isOpen && "justify-center"
          )}
        >
          <LogOut className="w-5 h-5 min-w-[20px]" />
          {isOpen && <span>Logout</span>}
        </button>
      </div>

      {/* Version Text */}
      {isOpen && (
        <div className="px-6 py-4 text-center">
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
            v1.0.4 Premium
          </p>
        </div>
      )}

      {/* Toggle Button */}
      <button 
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-primary-600 hover:border-primary-200 transition-all shadow-sm"
      >
        {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
    </motion.aside>
  );
};

export default Sidebar;
