'use client';

import React from 'react';
import { Plus, CheckSquare, Clock, AlertCircle } from 'lucide-react';

const tasks = [
  { id: '1', title: 'Schedule product demo with TechCorp', priority: 'HIGH', dueDate: 'Today, 4:00 PM', status: 'PENDING' },
  { id: '2', title: 'Send updated enterprise proposal to Acme', priority: 'MEDIUM', dueDate: 'Tomorrow', status: 'PENDING' },
  { id: '3', title: 'Follow up on contract renewal with GlobalMedia', priority: 'LOW', dueDate: 'Aug 18, 2026', status: 'COMPLETED' },
];

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Task Management</h1>
          <p className="text-sm text-[#64748B]">Track to-dos, follow-ups, and customer touchpoints.</p>
        </div>
        <button className="inline-flex items-center gap-2 bg-[#0F766E] hover:bg-[#115E59] text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-xs cursor-pointer">
          <Plus className="w-4 h-4" /> Create New Task
        </button>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-xs">
        <div className="divide-y divide-[#E2E8F0]">
          {tasks.map((task) => (
            <div key={task.id} className="p-4 flex items-center justify-between hover:bg-[#F8FAFC] transition-colors">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  defaultChecked={task.status === 'COMPLETED'}
                  className="w-4 h-4 text-[#0F766E] rounded focus:ring-[#0F766E] accent-[#0F766E]"
                />
                <div>
                  <h4 className={`text-sm font-semibold ${task.status === 'COMPLETED' ? 'line-through text-[#64748B]' : 'text-[#0F172A]'}`}>
                    {task.title}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-[#64748B] mt-1">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {task.dueDate}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      task.priority === 'HIGH' ? 'bg-red-100 text-[#DC2626]' : 'bg-amber-100 text-[#F59E0B]'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
              </div>

              <button className="text-xs text-[#0F766E] font-medium hover:underline cursor-pointer">
                Edit
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
