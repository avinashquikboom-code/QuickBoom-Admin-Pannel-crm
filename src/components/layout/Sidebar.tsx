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
  Layers,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
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

  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 1024);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showFullContent = isOpen || isMobile;

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300",
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        )}
        onClick={toggleSidebar}
      />
      
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ 
          width: isMobile ? 280 : (isOpen ? 280 : 80),
          x: isMobile ? (isOpen ? 0 : -280) : 0
        }}
        className={cn(
          "fixed lg:relative h-screen bg-white border-r border-slate-200 flex flex-col z-50 transition-all duration-300",
          !isOpen && "lg:items-center"
        )}
      >
        {/* Logo Section */}
        <div className={cn(
          "p-6 mb-2 flex items-center gap-3",
          !isOpen && "lg:justify-center"
        )}>
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl shadow-slate-900/20 group-hover:scale-105 transition-transform">
              {/* Logo Icon (Approximating the leaf/Q logo) */}
              <div className="relative w-8 h-8">
                <div className="absolute inset-0 border-4 border-white/20 rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 bg-primary-500 rounded-tr-[2rem] rounded-bl-lg transform -rotate-12 shadow-sm"></div>
              </div>
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 rounded-full border-2 border-white"></div>
          </div>
          {showFullContent && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col"
            >
              <span className="text-xl font-black text-slate-900 leading-none tracking-tight">
                QUIK<span className="text-primary-500">BOOM</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Admin Panel</span>
            </motion.div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                if (isMobile) toggleSidebar();
              }}
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
              {showFullContent && (
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
            !isOpen && "lg:justify-center"
          )}>
            <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white overflow-hidden flex-shrink-0">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
            </div>
            {showFullContent && (
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
              !isOpen && "lg:justify-center"
            )}
          >
            <LogOut className="w-5 h-5 min-w-[20px]" />
            {showFullContent && <span>Logout</span>}
          </button>
        </div>

        {/* Version Text */}
        {showFullContent && (
          <div className="px-6 py-4 text-center">
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
              v1.0.4 Premium
            </p>
          </div>
        )}

        {/* Toggle Button */}
        <button 
          onClick={toggleSidebar}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-white border border-slate-200 rounded-full items-center justify-center text-slate-400 hover:text-primary-600 hover:border-primary-200 transition-all shadow-sm z-50"
        >
          {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </motion.aside>
    </>
  );
};

export default Sidebar;
