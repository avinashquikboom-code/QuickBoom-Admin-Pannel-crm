'use client';

import React, { useState } from 'react';
import { Bell, CheckCircle2, Clock, Calendar, Check, Trash2, Mail } from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  type: 'LEAVE' | 'ATTENDANCE' | 'CRM' | 'PAYROLL';
}

const mockNotifications: NotificationItem[] = [
  {
    id: '1',
    title: 'Leave Request Approved',
    message: 'Your casual leave request from 20-Aug to 22-Aug has been approved by HR.',
    time: '10 minutes ago',
    isRead: false,
    type: 'LEAVE',
  },
  {
    id: '2',
    title: 'New Lead Assigned',
    message: 'Lead "Apex Tech Solutions" (₹4,50,000) has been assigned to your sales pipeline.',
    time: '1 hour ago',
    isRead: false,
    type: 'CRM',
  },
  {
    id: '3',
    title: 'January Salary Slips Ready',
    message: 'Monthly payroll slips have been generated and dispatched to your profile.',
    time: 'Yesterday',
    isRead: true,
    type: 'PAYROLL',
  },
];

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>(mockNotifications);

  const markAllRead = () => {
    setItems(items.map((i) => ({ ...i, isRead: true })));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Notifications</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Real-time alerts, approval updates, and workflow notifications.
          </p>
        </div>

        <button
          onClick={markAllRead}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-all"
        >
          <Check className="w-4 h-4" /> Mark All as Read
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {items.map((item) => (
          <div
            key={item.id}
            className={`p-5 flex items-start justify-between transition-colors ${
              !item.isRead ? 'bg-indigo-50/40' : 'hover:bg-slate-50'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                <Bell className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                  {!item.isRead && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  )}
                </div>
                <p className="text-xs text-slate-600 font-medium">{item.message}</p>
                <p className="text-[11px] text-slate-400 font-semibold pt-1">{item.time}</p>
              </div>
            </div>

            <button
              onClick={() => setItems(items.filter((i) => i.id !== item.id))}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
