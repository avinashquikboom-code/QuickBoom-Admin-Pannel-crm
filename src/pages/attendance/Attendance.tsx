import React, { useState } from 'react';
import { 
  Clock, 
  MapPin, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  XCircle, 
  Coffee,
  Play,
  Square,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Smartphone
} from 'lucide-react';
import { motion } from 'framer-motion';

const Attendance: React.FC = () => {
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Attendance Management</h1>
          <p className="text-sm text-slate-500 font-medium">Track your work hours and manage team presence</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
          <div className="px-4 py-2 text-center border-r border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</p>
            <p className="text-sm font-bold text-slate-900">{currentTime.toLocaleDateString()}</p>
          </div>
          <div className="px-4 py-2 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time</p>
            <p className="text-sm font-bold text-primary-600">{currentTime.toLocaleTimeString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Punch In/Out Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card-premium relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full -mr-16 -mt-16 ${isPunchedIn ? 'bg-red-500' : 'bg-primary-500'}`}></div>
            
            <h3 className="text-lg font-bold text-slate-900 mb-6">Attendance Punch</h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isPunchedIn ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Current Location</p>
                    <p className="text-sm font-bold text-slate-900">Office - Mumbai HQ</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">IN RANGE</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Check In</p>
                  <p className="text-lg font-bold text-slate-900">{isPunchedIn ? '09:42 AM' : '--:--'}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Hours</p>
                  <p className="text-lg font-bold text-slate-900">{isPunchedIn ? '01:24 H' : '00:00 H'}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {!isPunchedIn ? (
                  <button 
                    onClick={() => setIsPunchedIn(true)}
                    className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-primary-500/25 active:scale-95 flex items-center justify-center gap-3"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    Punch In Now
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setIsOnBreak(!isOnBreak)}
                      className={`flex-1 font-bold py-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-3 border-2 ${
                        isOnBreak 
                        ? 'bg-orange-500 text-white border-orange-500' 
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Coffee className="w-5 h-5" />
                      {isOnBreak ? 'End Break' : 'Take Break'}
                    </button>
                    <button 
                      onClick={() => setIsPunchedIn(false)}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-red-500/25 active:scale-95 flex items-center justify-center gap-3"
                    >
                      <Square className="w-5 h-5 fill-current" />
                      Punch Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card-premium">
            <h3 className="text-lg font-bold text-slate-900 mb-4">My Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Monitor className="w-4 h-4" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">Web Login</p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-slate-400">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <p className="text-sm font-semibold">Mobile App</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-slate-300"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Reports/Calendar */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card-premium">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Attendance Calendar</h3>
                <p className="text-xs text-slate-500">View your monthly attendance patterns</p>
              </div>
              <div className="flex items-center gap-3">
                <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50"><ChevronLeft className="w-4 h-4" /></button>
                <span className="text-sm font-bold text-slate-700 uppercase">May 2026</span>
                <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-4 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-4">
              {/* Dummy calendar dates */}
              {Array.from({ length: 31 }).map((_, i) => {
                const day = i + 1;
                const isToday = day === 16;
                const isWeekend = (day % 7 === 0 || day % 7 === 1);
                const status = day < 16 ? (isWeekend ? 'holiday' : 'present') : (day === 16 ? 'current' : 'future');

                return (
                  <div 
                    key={day} 
                    className={`h-16 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                      isToday ? 'bg-primary-50 border-primary-200 shadow-sm ring-2 ring-primary-500/10' :
                      status === 'present' ? 'bg-emerald-50/30 border-emerald-100' :
                      status === 'holiday' ? 'bg-slate-50 border-slate-100' :
                      'bg-white border-slate-50'
                    }`}
                  >
                    <span className={`text-sm font-bold ${isToday ? 'text-primary-600' : 'text-slate-700'}`}>{day}</span>
                    {status === 'present' && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>}
                    {status === 'holiday' && <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>}
                    {isToday && <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse"></div>}
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex items-center justify-center gap-8 border-t border-slate-50 pt-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="text-xs font-bold text-slate-500 uppercase">Present</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-xs font-bold text-slate-500 uppercase">Absent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-xs font-bold text-slate-500 uppercase">Late</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-slate-300 rounded-full"></div>
                <span className="text-xs font-bold text-slate-500 uppercase">Holiday</span>
              </div>
            </div>
          </div>

          <div className="card-premium">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Logs</h3>
            <div className="space-y-4">
              {[
                { date: '15 May', in: '09:28 AM', out: '06:34 PM', status: 'Present', duration: '9h 6m' },
                { date: '14 May', in: '10:05 AM', out: '07:12 PM', status: 'Late', duration: '9h 7m' },
                { date: '13 May', in: '09:42 AM', out: '06:22 PM', status: 'Present', duration: '8h 40m' },
              ].map((log, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase leading-none">{log.date.split(' ')[1]}</span>
                      <span className="text-sm font-bold text-slate-900">{log.date.split(' ')[0]}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{log.in} - {log.out}</p>
                      <p className="text-xs text-slate-500 font-medium">Work Duration: {log.duration}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                    log.status === 'Present' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {log.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
