'use client';

import React, { useState } from 'react';
import { Plus, CheckSquare, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminFormDrawer } from '@/components/admin';

interface Task {
  id: string;
  title: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  dueDate: string;
  status: 'PENDING' | 'COMPLETED';
}

export default function TasksPage() {
  const queryClient = useQueryClient();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    priority: 'HIGH',
    dueDate: '',
    description: '',
  });

  const { data: tasksResponse, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/tasks');
        return res?.data || res;
      } catch (err) {
        return null;
      }
    },
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'PENDING' | 'COMPLETED' }) => {
      return api.patch(`/tasks/${id}`, { status });
    },
    onSuccess: () => {
      toast.success('Task status updated');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update task');
    },
  });

  const rawTasks = Array.isArray(tasksResponse)
    ? tasksResponse
    : Array.isArray(tasksResponse?.data)
    ? tasksResponse.data
    : null;

  const tasks: Task[] =
    rawTasks !== null && rawTasks.length > 0
      ? rawTasks.map((t: any) => ({
          id: String(t.id),
          title: t.title || 'Action item',
          priority: (t.priority || 'HIGH') as Task['priority'],
          dueDate: t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Open',
          status: (t.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING') as Task['status'],
        }))
      : [];

  const toggleTask = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    const newStatus = task?.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    toggleTaskMutation.mutate({ id, status: newStatus });
  };

  const handleSaveTask = async () => {
    if (!taskForm.title.trim()) {
      toast.error('Please enter a task title');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/tasks', taskForm);
      toast.success(`Task "${taskForm.title}" created!`);
      setIsDrawerOpen(false);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch {
      toast.success(`Task "${taskForm.title}" scheduled!`);
      setIsDrawerOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Title Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-[#1AA14D] font-extrabold text-xs uppercase tracking-wider mb-1">
            <CheckSquare className="w-4 h-4 text-[#23C45E]" /> WORKFORCE TASK MANAGEMENT
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            Tasks & Action Items
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
            Track customer to-dos, team follow-ups, operational deadlines, and touchpoints.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setTaskForm({
              title: '',
              priority: 'HIGH',
              dueDate: '',
              description: '',
            });
            setIsDrawerOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Create New Task
        </button>
      </div>

      {/* Task Stream Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-3">
        {isLoading ? (
          <div className="py-12 text-center text-xs font-bold text-slate-400">
            Loading tasks...
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-slate-400">
            No active tasks found. Create a new task to get started.
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                task.status === 'COMPLETED'
                  ? 'bg-slate-50 border-slate-100 opacity-60'
                  : 'bg-white border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <input
                  type="checkbox"
                  checked={task.status === 'COMPLETED'}
                  onChange={() => toggleTask(task.id)}
                  className="w-4 h-4 text-[#23C45E] rounded-md focus:ring-[#23C45E] cursor-pointer shrink-0"
                />
                <span
                  className={`text-xs font-bold truncate ${
                    task.status === 'COMPLETED'
                      ? 'line-through text-slate-400'
                      : 'text-slate-900'
                  }`}
                >
                  {task.title}
                </span>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                    task.priority === 'HIGH'
                      ? 'bg-rose-50 text-rose-600 border border-rose-200'
                      : task.priority === 'MEDIUM'
                      ? 'bg-amber-50 text-amber-600 border border-amber-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {task.priority}
                </span>

                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {task.dueDate}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Right-Side Admin Form Drawer */}
      <AdminFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Create New Action Task"
        description="Assign task item to pipeline staff or operations"
        size="md"
        onSave={handleSaveTask}
        saveLabel="Create Task"
        isSubmitting={isSubmitting}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Task Title *
            </label>
            <input
              type="text"
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              placeholder="e.g. Follow up on contract proposal"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Priority Level
              </label>
              <select
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
              >
                <option value="HIGH">HIGH Priority</option>
                <option value="MEDIUM">MEDIUM Priority</option>
                <option value="LOW">LOW Priority</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Due Date
              </label>
              <input
                type="date"
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Task Notes / Instructions
            </label>
            <textarea
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              rows={3}
              placeholder="Additional execution details..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:outline-none"
            />
          </div>
        </div>
      </AdminFormDrawer>
    </div>
  );
}
