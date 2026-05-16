import React, { useState } from 'react';
import { 
  Bell, 
  CheckCheck, 
  MessageSquare, 
  UserPlus, 
  AlertCircle, 
  Calendar, 
  DollarSign, 
  Search,
  MoreVertical,
  Filter,
  Trash2,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  id: string;
  type: 'mention' | 'lead' | 'leave' | 'finance' | 'system';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  avatar?: string;
}

const initialNotifications: Notification[] = [
  {
    id: '1',
    type: 'mention',
    title: 'Sanjay Kumar mentioned you',
    message: 'Hey Avinash, please check the proposal for Project X and give your feedback.',
    time: '2 mins ago',
    isRead: false,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sanjay'
  },
  {
    id: '2',
    type: 'lead',
    title: 'New Hot Lead Assigned',
    message: 'A new lead "Global Tech Solutions" has been assigned to your pipeline.',
    time: '45 mins ago',
    isRead: false,
  },
  {
    id: '3',
    type: 'leave',
    title: 'Leave Request Pending',
    message: 'Priya Sharma has requested sick leave for tomorrow. Action required.',
    time: '2 hours ago',
    isRead: true,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya'
  },
  {
    id: '4',
    type: 'finance',
    title: 'Payment Received',
    message: 'Invoice #INV-2024-001 for "Sarah Bakery" has been paid in full.',
    time: '5 hours ago',
    isRead: true,
  },
  {
    id: '5',
    type: 'system',
    title: 'System Update Successful',
    message: 'QuickBoom Admin has been updated to v1.0.4 with new features.',
    time: '1 day ago',
    isRead: true,
  }
];

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = activeFilter === 'unread' 
    ? notifications.filter(n => !n.isRead) 
    : notifications;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'mention': return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'lead': return <UserPlus className="w-5 h-5 text-emerald-500" />;
      case 'leave': return <Calendar className="w-5 h-5 text-purple-500" />;
      case 'finance': return <DollarSign className="w-5 h-5 text-amber-500" />;
      default: return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'mention': return 'bg-blue-50';
      case 'lead': return 'bg-emerald-50';
      case 'leave': return 'bg-purple-50';
      case 'finance': return 'bg-amber-50';
      default: return 'bg-slate-50';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500 font-medium">Stay updated with the latest activities and alerts</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all as read
          </button>
          <button className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all shadow-sm">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <button 
            onClick={() => setActiveFilter('all')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-bold text-sm ${
              activeFilter === 'all' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Bell className="w-5 h-5" />
            All Notifications
          </button>
          <button 
            onClick={() => setActiveFilter('unread')}
            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all font-bold text-sm ${
              activeFilter === 'unread' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5" />
              Unread
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeFilter === 'unread' ? 'bg-white/20 text-white' : 'bg-rose-50 text-rose-600'
            }`}>
              {notifications.filter(n => !n.isRead).length}
            </span>
          </button>
          
          <div className="pt-6 pb-2 px-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Categories</p>
          </div>
          {['Mentions', 'Leads', 'HRM', 'Finance', 'System'].map(cat => (
            <button key={cat} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-500 hover:bg-slate-50 text-sm font-medium transition-all">
              <div className="w-2 h-2 rounded-full bg-slate-300"></div>
              {cat}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="relative group mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search in notifications..." 
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all shadow-sm font-medium"
            />
          </div>

          <AnimatePresence>
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification, idx) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`relative p-5 rounded-3xl border transition-all hover:shadow-md cursor-pointer group ${
                    notification.isRead ? 'bg-white border-slate-100' : 'bg-primary-50/30 border-primary-100 shadow-sm'
                  }`}
                >
                  <div className="flex gap-4">
                    <div className="relative shrink-0">
                      {notification.avatar ? (
                        <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white shadow-sm">
                          <img src={notification.avatar} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 border-white shadow-sm ${getBgColor(notification.type)}`}>
                          {getIcon(notification.type)}
                        </div>
                      )}
                      {!notification.isRead && (
                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-primary-500 rounded-full border-2 border-white shadow-sm"></div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className={`text-sm font-bold truncate ${notification.isRead ? 'text-slate-900' : 'text-primary-900'}`}>
                          {notification.title}
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {notification.time}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                        {notification.message}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                        className="p-1.5 hover:bg-rose-50 hover:text-rose-500 rounded-lg text-slate-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="card-premium flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">No Notifications</h3>
                <p className="text-sm text-slate-500 max-w-xs mt-2">You're all caught up! Check back later for new alerts.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
