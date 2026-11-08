'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
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
  AlertTriangle,
  History,
  ShieldCheck,
  FileText,
  Check,
  X,
  ExternalLink,
  UploadCloud,
  ChevronRight,
  Eye,
  Flame,
  Zap,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '@/lib/utils';
import { AdminFormDrawer, AdminPageHeader, AdminButton } from '@/components/admin';

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params?.id ? String(params.id) : '';

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isSubmitProofOpen, setIsSubmitProofOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const [proofForm, setProofForm] = useState({
    fileUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=800&q=80',
    fileName: 'on_site_completion_proof.jpg',
    comment: 'Completed on-site task requirements with photo verification.',
  });

  // Fetch Task Details
  const { data: task, isLoading, refetch } = useQuery({
    queryKey: ['admin-task-detail', id],
    queryFn: async () => {
      try {
        const res: any = await api.get(`/tasks/${id}`);
        return res?.data || res;
      } catch (err) {
        return null;
      }
    },
    enabled: Boolean(id),
  });

  // Approve Mutation
  const approveMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/tasks/${id}/approve`, { comment: 'Approved by HR Administrator.' });
    },
    onSuccess: () => {
      toast.success('Task approved and marked COMPLETED! 🎉');
      queryClient.invalidateQueries({ queryKey: ['admin-task-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-tasks-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-tasks-metrics'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Reject Mutation
  const rejectMutation = useMutation({
    mutationFn: async (reason: string) => {
      if (!reason.trim()) {
        throw new Error('Rejection reason is mandatory.');
      }
      return api.post(`/tasks/${id}/reject`, { rejectionReason: reason.trim() });
    },
    onSuccess: () => {
      toast.success('Task proof rejected. Reopened for employee corrections.');
      setShowRejectInput(false);
      setRejectReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-task-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-tasks-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-tasks-metrics'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Submit Proof Mutation
  const submitProofMutation = useMutation({
    mutationFn: async () => {
      if (!proofForm.fileUrl.trim()) {
        throw new Error('Completion proof photo is required.');
      }
      return api.post(`/tasks/${id}/proof`, {
        fileUrl: proofForm.fileUrl.trim(),
        fileName: proofForm.fileName,
        comment: proofForm.comment,
      });
    },
    onSuccess: () => {
      toast.success('Photo proof submitted for HR review!');
      setIsSubmitProofOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-task-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-tasks-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-tasks-metrics'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  if (isLoading) {
    return (
      <div className="py-20 text-center text-slate-400 font-bold animate-pulse">
        Loading task profile #{id}...
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
        <p className="font-bold text-slate-700">Task #{id} not found</p>
        <Link href="/tasks" className="text-xs text-[#23C45E] font-bold mt-2 inline-block">
          Return to Tasks
        </Link>
      </div>
    );
  }

  const empName = task.employee ? `${task.employee.firstName} ${task.employee.lastName}` : 'Unassigned';
  const proofs = Array.isArray(task.proofs) ? task.proofs : [];
  const history = Array.isArray(task.history) ? task.history : [];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* 1. TOP PAGE HEADER */}
      <AdminPageHeader
        title={task.title}
        description={task.description || 'No detailed instructions provided.'}
        icon={CheckSquare}
        iconColor="text-emerald-600"
        badge={{
          text: `${task.taskNumber || `TSK-${task.id}`} • ${task.status === 'UNDER_REVIEW' ? 'Awaiting Review' : task.status}${task.isOverdue ? ' • OVERDUE' : ''}`,
          icon: CheckSquare,
          variant: task.status === 'COMPLETED' ? 'emerald' : task.isOverdue ? 'rose' : 'slate',
        }}
        breadcrumbs={[
          { label: 'Field Operations', href: '/tasks' },
          { label: 'Tasks', href: '/tasks' },
          { label: task.taskNumber || `Task #${task.id}` },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/tasks">
              <AdminButton
                variant="outline"
                size="md"
                icon={ArrowLeft}
              >
                Back to Tasks
              </AdminButton>
            </Link>

            {task.status !== 'COMPLETED' && (
              <AdminButton
                variant="outline"
                size="md"
                icon={UploadCloud}
                onClick={() => setIsSubmitProofOpen(true)}
              >
                Upload Proof
              </AdminButton>
            )}

            {(task.status === 'UNDER_REVIEW' || task.status === 'SUBMITTED') && (
              <AdminButton
                variant="primary"
                size="md"
                icon={ShieldCheck}
                onClick={() => {
                  window.scrollTo({ top: 500, behavior: 'smooth' });
                }}
              >
                Review Proof
              </AdminButton>
            )}
          </div>
        }
      />

      {/* 2. PRIORITY GUIDELINE BANNER */}
      {task.priority === 'URGENT' ? (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-4 sm:p-5 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 text-rose-600 animate-pulse" />
            </div>
            <div>
              <h4 className="font-black text-rose-900 text-sm">URGENT Priority — Critical Deliverable</h4>
              <p className="text-rose-700 font-medium mt-0.5">
                This is a top-priority action item requiring immediate execution and prompt photo verification.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0">
            Immediate SLA
          </span>
        </div>
      ) : task.priority === 'HIGH' ? (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4 sm:p-5 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="font-black text-amber-900 text-sm">HIGH Priority — Key Operational Milestone</h4>
              <p className="text-amber-700 font-medium mt-0.5">
                Must be completed within scheduled timeline. Requires photo proof upload before closure.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0">
            High Priority
          </span>
        </div>
      ) : null}

      {/* 3. TASK STATUS PROGRESSION STEPPER */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-4">Task Lifecycle Stage</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            {
              step: '1. Allocated',
              desc: 'Assigned to employee',
              active: true,
              done: task.status !== 'PENDING',
              icon: User,
            },
            {
              step: '2. In Progress',
              desc: 'Work commenced',
              active: task.status !== 'PENDING',
              done: ['SUBMITTED', 'UNDER_REVIEW', 'COMPLETED', 'REJECTED'].includes(task.status),
              icon: Clock,
            },
            {
              step: '3. Proof Submitted',
              desc: 'Photo proof attached',
              active: ['SUBMITTED', 'UNDER_REVIEW', 'COMPLETED', 'REJECTED'].includes(task.status),
              done: ['COMPLETED', 'REJECTED'].includes(task.status),
              icon: ImageIcon,
            },
            {
              step: '4. HR Verified',
              desc: task.status === 'REJECTED' ? 'Proof Rejected' : 'Approved & Closed',
              active: ['COMPLETED', 'REJECTED'].includes(task.status),
              done: task.status === 'COMPLETED',
              icon: task.status === 'REJECTED' ? XCircle : CheckCircle2,
              danger: task.status === 'REJECTED',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border transition-all ${
                item.done
                  ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                  : item.danger
                  ? 'bg-rose-50/50 border-rose-200 text-rose-950'
                  : item.active
                  ? 'bg-blue-50/50 border-blue-200 text-blue-950 ring-1 ring-blue-300'
                  : 'bg-slate-50/50 border-slate-200 text-slate-400 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider">{item.step}</span>
                <item.icon className="w-4 h-4 shrink-0" />
              </div>
              <p className="text-xs font-semibold">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Proof Gallery & HR Review */}
        <div className="lg:col-span-2 space-y-6">
          {/* PHOTO PROOF GALLERY */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-[#23C45E]" />
                  Completion Photo Proof
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Mandatory photo verification submitted by employee
                </p>
              </div>

              {proofs.length > 0 && (
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-[#1AA14D] border border-emerald-200 text-xs font-black">
                  {proofs.length} Attached
                </span>
              )}
            </div>

            {proofs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {proofs.map((proof: any) => (
                  <div key={proof.id} className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs">
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group">
                      <img
                        src={proof.fileUrl}
                        alt="Proof attachment"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                        onClick={() => setPreviewImage(proof.fileUrl)}
                      />
                      <button
                        type="button"
                        onClick={() => setPreviewImage(proof.fileUrl)}
                        className="absolute bottom-2 right-2 px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black text-white text-xs font-bold backdrop-blur-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <Eye className="w-3.5 h-3.5" /> Full Zoom
                      </button>
                    </div>

                    <div className="text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span className="truncate max-w-[180px]">{proof.fileName || 'completion_proof.jpg'}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {proof.fileSize ? `${Math.round(proof.fileSize / 1024)} KB` : 'Image'}
                        </span>
                      </div>
                      {proof.comment && (
                        <p className="text-slate-700 italic bg-white p-2.5 rounded-xl border border-slate-200 text-xs font-medium">
                          &quot;{proof.comment}&quot;
                        </p>
                      )}
                      <p className="text-slate-400 text-[10px] pt-1">
                        Uploaded on {proof.uploadedAt && !isNaN(new Date(proof.uploadedAt).getTime()) ? new Date(proof.uploadedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-6 space-y-3">
                <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
                <div>
                  <p className="text-sm font-black text-slate-800">No Photo Proof Attached Yet</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 font-medium">
                    Employee must upload photo proof before this task can be approved and closed.
                  </p>
                </div>
                <button
                  onClick={() => setIsSubmitProofOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload Proof Photo Now</span>
                </button>
              </div>
            )}
          </div>

          {/* HR APPROVAL / REJECTION CARD */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
              HR Review & Verification
            </h3>

            {task.status === 'COMPLETED' ? (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs space-y-1">
                <p className="font-black text-[#1AA14D] text-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Task Approved & Closed
                </p>
                <p className="text-slate-700 font-medium">
                  Verified by <strong>{task.approvedByName || 'HR Administrator'}</strong> on{' '}
                  {task.approvedAt && !isNaN(new Date(task.approvedAt).getTime()) ? new Date(task.approvedAt).toLocaleString() : 'N/A'}.
                </p>
              </div>
            ) : task.status === 'REJECTED' ? (
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-xs space-y-2">
                <p className="font-black text-rose-800 text-sm flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-600" /> Task Proof Rejected
                </p>
                <p className="text-slate-800 font-bold">
                  Rejection Reason: <span className="text-rose-700 font-semibold">&quot;{task.rejectionReason}&quot;</span>
                </p>
                <p className="text-slate-500 text-[11px]">
                  Rejected by {task.rejectedByName || 'HR'} on {task.rejectedAt && !isNaN(new Date(task.rejectedAt).getTime()) ? new Date(task.rejectedAt).toLocaleString() : ''}. Task reopened for employee corrections.
                </p>
              </div>
            ) : null}

            {/* Approval Controls */}
            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                <p className="font-bold text-slate-700">Actions for HR Administrator:</p>
                <p className="text-[11px]">Ensure photo proof is valid before approving.</p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowRejectInput(!showRejectInput)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-black rounded-xl text-xs cursor-pointer border border-rose-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Reject Proof</span>
                </button>

                <button
                  type="button"
                  disabled={approveMutation.isPending}
                  onClick={() => approveMutation.mutate()}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-xl text-xs cursor-pointer shadow-md shadow-[#23C45E]/20 active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>{approveMutation.isPending ? 'Approving...' : 'Approve & Mark Completed'}</span>
                </button>
              </div>
            </div>

            {/* Reject Form Dropdown */}
            {showRejectInput && (
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 space-y-3 animate-in fade-in-50">
                <label className="text-xs font-black text-rose-900 block">
                  Mandatory Rejection Reason *
                </label>
                <input
                  type="text"
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Photo proof is blurry or wrong document uploaded. Please upload signed copy."
                  className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs font-bold text-slate-900"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRejectInput(false)}
                    className="px-3 py-1.5 bg-white text-slate-700 font-bold rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={rejectMutation.isPending}
                    onClick={() => rejectMutation.mutate(rejectReason)}
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-lg text-xs shadow-xs"
                  >
                    {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Task Metadata & Audit Timeline */}
        <div className="space-y-6">
          {/* ALLOCATED EMPLOYEE */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-purple-600" /> Allocated Employee
            </h3>

            {task.employee ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200 font-black text-base flex items-center justify-center shrink-0">
                    {task.employee.firstName?.[0] || 'E'}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">{empName}</h4>
                    <p className="text-slate-400 font-semibold text-[11px]">{task.employee.employeeCode}</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Department:</span>
                    <span className="font-bold text-slate-800">{task.employee.department?.name || 'Operations'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Designation:</span>
                    <span className="font-bold text-slate-800">{task.employee.designation?.name || 'Staff'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Email:</span>
                    <span className="font-bold text-slate-800 truncate max-w-[160px]">{task.employee.email}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-slate-400 font-bold text-xs">
                No employee allocated
              </div>
            )}
          </div>

          {/* SCHEDULE & DUE DATETIME */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-3 text-xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-600" /> Deadline & Timings
            </h3>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Due Date:</span>
                <span className="font-extrabold text-slate-900">
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No Due Date'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Due Time:</span>
                <span className="font-extrabold text-slate-900">{task.dueTime || '06:30 PM'}</span>
              </div>
              {task.startDate && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Start Date:</span>
                  <span className="font-bold text-slate-800">
                    {new Date(task.startDate).toLocaleDateString()} {task.startTime || ''}
                  </span>
                </div>
              )}
            </div>

            {task.notes && (
              <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200/70 text-[11px] text-amber-900 space-y-1">
                <p className="font-bold">Instructions & Notes:</p>
                <p className="font-medium">{task.notes}</p>
              </div>
            )}
          </div>

          {/* TASK AUDIT HISTORY TIMELINE */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <History className="w-4 h-4 text-slate-600" /> Task History & Audit Log
            </h3>

            {history.length > 0 ? (
              <div className="relative pl-4 space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {history.map((h: any) => (
                  <div key={h.id} className="relative space-y-0.5 text-xs">
                    <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-[#23C45E] ring-4 ring-white" />
                    <p className="font-extrabold text-slate-900 text-[11px] uppercase tracking-wide">
                      {h.action.replace(/_/g, ' ')}
                    </p>
                    <p className="text-slate-600 font-medium text-[11px]">{h.comment || `Performed by ${h.performedByName || 'User'}`}</p>
                    <p className="text-slate-400 text-[10px]">
                      {h.createdAt && !isNaN(new Date(h.createdAt).getTime()) ? new Date(h.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 font-medium italic">No history records logged yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* 4. SUBMIT PROOF MODAL */}
      <AdminFormDrawer
        isOpen={isSubmitProofOpen}
        onClose={() => setIsSubmitProofOpen(false)}
        title="Submit Completion Photo Proof"
        subtitle={`Task: ${task.title}`}
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitProofMutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 font-medium">
            ⚠️ <strong>Mandatory Rule:</strong> Photo attachment is compulsory. The task cannot be submitted for completion without uploading at least one photo.
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Photo Proof URL *</label>
            <input
              type="text"
              required
              value={proofForm.fileUrl}
              onChange={(e) => setProofForm({ ...proofForm, fileUrl: e.target.value })}
              placeholder="https://res.cloudinary.com/... or uploaded photo link"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
            />
          </div>

          {proofForm.fileUrl && (
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
              <img src={proofForm.fileUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Completion Comments</label>
            <textarea
              rows={2}
              value={proofForm.comment}
              onChange={(e) => setProofForm({ ...proofForm, comment: e.target.value })}
              placeholder="Explain how the work was completed..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsSubmitProofOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitProofMutation.isPending}
              className="px-5 py-2 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-xl text-xs cursor-pointer shadow-md shadow-[#23C45E]/20"
            >
              {submitProofMutation.isPending ? 'Submitting...' : 'Submit for HR Review'}
            </button>
          </div>
        </form>
      </AdminFormDrawer>

      {/* 5. IMAGE ZOOM PREVIEW MODAL */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-3xl overflow-hidden border border-white/20 p-2">
            <img src={previewImage} alt="Full resolution proof" className="max-w-full max-h-[85vh] object-contain rounded-2xl" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black text-white rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
