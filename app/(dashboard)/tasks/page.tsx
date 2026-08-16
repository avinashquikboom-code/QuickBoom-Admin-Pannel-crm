'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, CheckSquare, Clock, AlertCircle, Filter, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Task {
  id: string;
  title: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  dueDate: string;
  status: 'PENDING' | 'COMPLETED';
}

const initialTasks: Task[] = [
  { id: '1', title: 'Schedule product demo with TechCorp', priority: 'HIGH', dueDate: 'Today, 4:00 PM', status: 'PENDING' },
  { id: '2', title: 'Send updated enterprise proposal to Acme', priority: 'MEDIUM', dueDate: 'Tomorrow', status: 'PENDING' },
  { id: '3', title: 'Follow up on contract renewal with GlobalMedia', priority: 'LOW', dueDate: 'Aug 18, 2026', status: 'COMPLETED' },
  { id: '4', title: 'Conduct quarterly sales review with Navi Mumbai team', priority: 'HIGH', dueDate: 'Aug 20, 2026', status: 'PENDING' },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: t.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED' } : t))
    );
    toast.success('Task status updated');
  };

  return (
    <div className="space-y-8">
      {/* Header Title Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-lg border border-emerald-800">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 font-extrabold text-xs uppercase tracking-wider mb-1">
            <CheckSquare className="w-4 h-4 text-emerald-400" /> WORKFORCE TASK MANAGEMENT
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Tasks & Action Items
          </h1>
          <p className="text-xs md:text-sm text-slate-200 mt-1 font-medium">
            Track customer to-dos, team follow-ups, operational deadlines, and touchpoints.
          </p>
        </div>

        <Link
          href="/tasks/create"
          className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-extrabold transition-all shadow-md cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Create New Task
        </Link>
      </div>

      {/* Task Stream Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 text-sm">Action Items List</h3>
          <span className="text-xs font-bold text-slate-500">{tasks.length} Total Tasks</span>
        </div>

        <div className="divide-y divide-slate-100">
          {tasks.map((task) => (
            <div key={task.id} className="p-5 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={task.status === 'COMPLETED'}
                  onChange={() => toggleTask(task.id)}
                  className="w-5 h-5 text-emerald-600 rounded-md focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                />
                <div>
                  <h4 className={`text-sm font-bold ${task.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                    {task.title}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-medium">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-400" /> {task.dueDate}</span>
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black border ${
                      task.priority === 'HIGH' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {task.priority} PRIORITY
                    </span>
                  </div>
                </div>
              </div>

              <button onClick={() => toast(`Editing task: ${task.title}`)} className="text-xs text-emerald-700 font-bold hover:underline cursor-pointer">
                Edit
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
