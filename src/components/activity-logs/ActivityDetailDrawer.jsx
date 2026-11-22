'use client';

import * as React from 'react';
import {
  X,
  Clock,
  Calendar,
  User,
  Shield,
  Layers,
  Building,
  Smartphone,
  ShieldCheck,
  Copy,
  Check,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/common/Button';

function getActionBadgeStyle(action = '') {
  const act = String(action || '').toUpperCase();
  if (act.includes('CREATE') || act.includes('ADD') || act.includes('INSERT')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  if (act.includes('UPDATE') || act.includes('EDIT') || act.includes('PATCH') || act.includes('MODIFY')) {
    return 'bg-blue-50 text-blue-700 border-blue-200';
  }
  if (act.includes('DELETE') || act.includes('REMOVE') || act.includes('PURGE')) {
    return 'bg-rose-50 text-rose-700 border-rose-200';
  }
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

export function ActivityDetailDrawer({ activity, open, onClose }) {
  const [copied, setCopied] = React.useState(false);

  if (!open || !activity) return null;

  const handleCopyJson = () => {
    try {
      navigator.clipboard.writeText(JSON.stringify(activity, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const formattedDate = activity.createdAt
    ? new Date(activity.createdAt).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'medium',
      })
    : '—';

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-white shadow-2xl transition-transform animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/70">
          <div>
            <h3 className="text-base font-bold text-slate-900">Activity Log Details</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Record #{activity.id || '—'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/80 hover:text-slate-600 cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Action & Module Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Event Classification
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-500">Action:</span>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getActionBadgeStyle(
                      activity.action
                    )}`}
                  >
                    {activity.action || 'MUTATION'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-500">Module:</span>
                <div className="mt-1 font-semibold text-slate-800">
                  {activity.module || 'System'}
                </div>
              </div>

              <div className="col-span-2">
                <span className="text-slate-500">Timestamp:</span>
                <div className="mt-1 font-mono text-slate-800 flex items-center gap-1.5">
                  <Clock className="size-3.5 text-slate-400" />
                  <span>{formattedDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actor & Identity */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Actor & User Information
            </span>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">User:</span>
                <span className="font-semibold text-slate-900">
                  {activity.userName || activity.user?.name || activity.user?.email || activity.userId || 'System'}
                </span>
              </div>
              {activity.userId && (
                <div className="flex items-center justify-between font-mono">
                  <span className="text-slate-500">User ID:</span>
                  <span className="text-slate-700">#{activity.userId}</span>
                </div>
              )}
              {activity.ipAddress && (
                <div className="flex items-center justify-between font-mono">
                  <span className="text-slate-500">IP Address:</span>
                  <span className="text-slate-700">{activity.ipAddress}</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Activity Description
            </span>
            <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
              {activity.description || 'No description recorded.'}
            </p>
          </div>

          {/* Event Payload */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Metadata & Payload
              </span>
              <button
                type="button"
                onClick={handleCopyJson}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="size-3 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
            </div>
            <pre className="max-h-60 overflow-y-auto rounded-lg bg-slate-900 p-3 text-[11px] font-mono text-emerald-400 leading-relaxed">
              {JSON.stringify(activity.details || activity.metadata || activity, null, 2)}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-3 bg-slate-50 flex items-center justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs"
          >
            Close
          </Button>
        </div>
      </div>
    </>
  );
}
