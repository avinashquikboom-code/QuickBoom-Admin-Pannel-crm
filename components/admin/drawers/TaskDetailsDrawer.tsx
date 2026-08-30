'use client';

import React from 'react';
import Link from 'next/link';
import {
  CheckSquare,
  Clock,
  User,
  Users,
  Building,
  Calendar,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { AdminFormDrawer } from '../dialogs/AdminFormDrawer';

export interface TaskDetailsDrawerProps {
  taskId: number | string | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (task: any) => void;
}

export function TaskDetailsDrawer({
  taskId,
  isOpen,
  onClose,
  onEdit,
}: TaskDetailsDrawerProps) {
  const {
    data: task,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-task-details-drawer', taskId],
    enabled: isOpen && !!taskId,
    queryFn: async () => {
      if (!taskId) return null;
      const res: any = await api.get(`/tasks/${taskId}`);
      return res?.data || res;
    },
  });

  if (!isOpen) return null;

  return (
    <AdminFormDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={task?.title || 'Task Details'}
      description={task ? `Priority: ${task.priority || 'MEDIUM'} • Due ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}` : 'Loading task details...'}
      icon={CheckSquare}
      maxWidth="sm:max-w-[580px]"
      footer={
        <div className="flex items-center justify-between w-full">
          <Link
            href={`/tasks/${taskId}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-all cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Full Page View</span>
          </Link>

          <div className="flex items-center gap-2">
            {onEdit && task && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(task);
                }}
                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Edit Task
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      }
    >
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-400">Loading task instructions...</p>
        </div>
      ) : isError || !task ? (
        <div className="py-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-800">Failed to load task</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {(error as any)?.message || 'Task not found or network connection error.'}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      ) : (
        <div className="space-y-5 text-xs">
          {/* Summary Card */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="font-mono text-[10px] font-bold text-slate-400">
                  TASK #{task.id}
                </span>
                <h3 className="text-base font-black text-slate-900 leading-tight mt-0.5">{task.title}</h3>
                <p className="text-xs text-slate-500 font-medium">{task.category || 'Operations'}</p>
              </div>

              <span
                className={`px-2.5 py-1 rounded-full font-black text-[10px] inline-flex items-center gap-1 ${
                  task.status === 'COMPLETED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : task.status === 'UNDER_REVIEW'
                    ? 'bg-purple-100 text-purple-800'
                    : task.status === 'IN_PROGRESS'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {task.status || 'PENDING'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Assigned Employee</span>
                <p className="font-bold text-slate-800 mt-0.5">
                  {task.employee ? `${task.employee.firstName} ${task.employee.lastName}` : 'Unassigned'}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Department</span>
                <p className="font-bold text-slate-800 mt-0.5">{task.department?.name || 'General Operations'}</p>
              </div>
            </div>
          </div>

          {/* Description & Timing */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-600" /> Instructions & Scope
            </h4>
            <p className="text-xs text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
              {task.description || 'No detailed instructions provided for this task.'}
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600" /> Deadline & Schedule
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Due Date</span>
                <p className="font-bold text-slate-800 mt-0.5">
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'} {task.dueTime || ''}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Priority Level</span>
                <p className="font-bold text-slate-800 mt-0.5">{task.priority || 'MEDIUM'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminFormDrawer>
  );
}
