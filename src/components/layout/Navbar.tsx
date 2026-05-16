import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  ChevronDown, 
  Clock, 
  Menu,
  CreditCard,
  CircleDot,
  Settings,
  User,
  LogOut,
  Activity,
  Shield
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice.ts';

interface NavbarProps {
  toggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
  const [time, setTime] = useState(new Date());
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={toggleSidebar}
          className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-lg"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl w-full max-w-md border border-slate-200 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/10 transition-all">
          <Search className="w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search leads, employees, projects..." 
            className="bg-transparent border-none outline-none text-sm w-full text-slate-600 placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        {/* Real-time clock */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-600">
          <Clock className="w-4 h-4 text-primary-500" />
          <span className="text-xs font-medium uppercase">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>

        {/* Credits badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-primary-50 text-primary-600 rounded-lg border border-primary-100">
          <CreditCard className="w-4 h-4" />
          <span className="text-xs font-bold">12,450 Credits</span>
        </div>

        {/* Online Status */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <CircleDot className="w-5 h-5 text-green-500 animate-pulse" />
            <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <span className="hidden sm:inline text-xs font-semibold text-slate-500 uppercase tracking-wider">Online</span>
        </div>

        <NavLink 
          to="/notifications"
          className={({ isActive }) => `relative p-2 rounded-xl transition-colors ${
            isActive ? 'bg-primary-50 text-primary-600' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Bell className="w-6 h-6" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        </NavLink>

        {/* Global Settings Shortcut */}
        <NavLink 
          to="/settings"
          className={({ isActive }) => `p-2 rounded-xl transition-colors ${
            isActive ? 'bg-primary-50 text-primary-600' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Settings className="w-6 h-6" />
        </NavLink>

        {/* Profile Dropdown */}
        <div className="relative">
          <div 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 pl-4 border-l border-slate-200 cursor-pointer group"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-900 group-hover:text-primary-600 transition-colors">Avinash Magar</p>
              <p className="text-[10px] font-medium text-slate-500 uppercase">Super Admin</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden transition-transform group-hover:scale-105">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
          </div>

          <AnimatePresence>
            {isProfileOpen && (
              <>
                {/* Backdrop to close on click outside */}
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsProfileOpen(false)}
                ></div>
                
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-20"
                >
                  <div className="p-4 bg-slate-50 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-900">Avinash Magar</p>
                    <p className="text-xs text-slate-500 font-medium">admin@quikboom.com</p>
                  </div>
                  
                  <div className="p-2">
                    {[
                      { icon: User, label: 'My Profile', path: '/settings' },
                      { icon: Activity, label: 'Activity Log', path: '/activity' },
                      { icon: Shield, label: 'Account Security', path: '/settings' },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={() => {
                          navigate(item.path);
                          setIsProfileOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-primary-600 transition-all"
                      >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                  
                  <div className="p-2 border-t border-slate-100">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-50 transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
