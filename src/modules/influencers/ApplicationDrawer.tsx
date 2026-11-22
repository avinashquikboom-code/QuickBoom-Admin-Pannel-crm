// @ts-nocheck
'use client';

import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Mail,
  Phone,
  MapPin,
  TrendingUp,
  Star,
  ExternalLink,
} from 'lucide-react';
import { Instagram, Youtube } from './SocialIcons';
import { type InfluencerItem } from '../../../lib/services/influencer.service';

interface ApplicationDrawerProps {
  application: InfluencerItem | null;
  open: boolean;
  onClose: () => void;
  onApprove: (item: InfluencerItem) => void;
  onReject: (item: InfluencerItem) => void;
  onSuspend: (item: InfluencerItem) => void;
}

export function ApplicationDrawer({
  application,
  open,
  onClose,
  onApprove,
  onReject,
  onSuspend,
}: ApplicationDrawerProps) {
  if (!application) return null;

  const isPending = application.status === 'PENDING';
  const isApproved = application.status === 'APPROVED' || application.status === 'ACTIVE';
  const isRejected = application.status === 'REJECTED';
  const isSuspended = application.status === 'SUSPENDED';

  return (
    <Sheet open={open} onOpenChange={(val) => !val && onClose()}>
      <SheetContent
        side="right"
        className="h-full gap-0 overflow-hidden bg-white p-0 data-[side=right]:!w-full data-[side=right]:!max-w-none data-[side=right]:sm:!w-[68vw] data-[side=right]:sm:!max-w-[68vw] data-[side=right]:lg:!w-[520px] data-[side=right]:lg:!max-w-[520px]"
      >
        {/* Header */}
        <SheetHeader className="border-b border-slate-100 bg-[#F7F9F8] px-5 py-5 pr-12 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-[#169F4D]">
              <User className="size-5" />
            </span>
            <div className="min-w-0">
              <SheetTitle className="text-lg font-bold text-slate-900 truncate">
                {application.name}
              </SheetTitle>
              <SheetDescription className="mt-0.5 text-xs text-slate-500">
                Application received on{' '}
                {application.createdAt
                  ? new Date(application.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : '—'}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Status Alert Banner */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
              isApproved
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
                : isRejected
                ? 'bg-rose-50/80 border-rose-200 text-rose-800'
                : isSuspended
                ? 'bg-amber-50/80 border-amber-200 text-amber-800'
                : 'bg-blue-50/80 border-blue-200 text-blue-800'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-bold">
              {isApproved && <CheckCircle2 className="size-4 text-emerald-600" />}
              {isRejected && <XCircle className="size-4 text-rose-600" />}
              {isSuspended && <AlertCircle className="size-4 text-amber-600" />}
              {isPending && <Calendar className="size-4 text-blue-600" />}
              <span>
                Status: {application.status}
              </span>
            </div>
            <span className="text-[11px] font-medium opacity-80">
              {isPending
                ? 'Awaiting review decision'
                : isApproved
                ? 'Creator is active in Influencer Hub'
                : isRejected
                ? 'Application declined'
                : 'Account currently suspended'}
            </span>
          </div>

          {/* Rejection reason note if exists */}
          {application.rejectionReason && (
            <div className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-200/80 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 block">
                Review Decision Note
              </span>
              <p className="text-xs text-rose-900 leading-relaxed">
                {application.rejectionReason}
              </p>
            </div>
          )}

          {/* Applicant Avatar & Details */}
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#F7F9F8] border border-slate-100">
            <div className="size-16 rounded-2xl overflow-hidden bg-emerald-50 border border-emerald-100 shrink-0 flex items-center justify-center">
              {application.profileImage || application.avatarUrl ? (
                <img
                  src={application.profileImage || application.avatarUrl || ''}
                  alt={application.name}
                  className="size-full object-cover"
                />
              ) : (
                <User className="size-8 text-[#163A2E]" />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <h3 className="font-bold text-slate-900 text-base truncate">{application.name}</h3>
              <p className="text-xs font-semibold text-emerald-700 truncate">
                {application.handle ? `@${application.handle.replace(/^@/, '')}` : 'No username set'}
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3 text-slate-400" />
                  {application.city || application.location || 'India'}
                </span>
                <span>•</span>
                <span className="font-semibold text-slate-700">
                  {application.categoryName || application.category?.name || 'General'}
                </span>
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Followers
              </span>
              <span className="text-lg font-extrabold text-slate-900 mt-0.5 block">
                {application.followersCount || Number(application.followers || 0).toLocaleString()}
              </span>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Engagement Rate
              </span>
              <span className="text-lg font-extrabold text-emerald-700 mt-0.5 block">
                {application.engagementRate || 0}%
              </span>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Info</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 flex items-center gap-2">
                  <Mail className="size-3.5 text-slate-400" />
                  Email
                </span>
                <span className="font-semibold text-slate-800">{application.email || '—'}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 flex items-center gap-2">
                  <Phone className="size-3.5 text-slate-400" />
                  Phone
                </span>
                <span className="font-semibold text-slate-800">{application.phone || '—'}</span>
              </div>
            </div>
          </div>

          {/* Social Profiles */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Social Channels</h4>
            <div className="space-y-2 text-xs">
              {application.instagramHandle && (
                <a
                  href={`https://instagram.com/${application.instagramHandle.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-800 hover:text-pink-600 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Instagram className="size-4 text-pink-500" />
                    <span className="font-semibold">{application.instagramHandle}</span>
                  </span>
                  <ExternalLink className="size-3.5 opacity-60" />
                </a>
              )}
              {application.youtubeHandle && (
                <a
                  href={`https://youtube.com/${application.youtubeHandle.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-800 hover:text-red-600 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Youtube className="size-4 text-red-500" />
                    <span className="font-semibold">{application.youtubeHandle}</span>
                  </span>
                  <ExternalLink className="size-3.5 opacity-60" />
                </a>
              )}
            </div>
          </div>

          {/* Bio */}
          {application.bio && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bio</h4>
              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed whitespace-pre-line">
                {application.bio}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-[#F7F9F8] px-5 py-4 sm:px-6">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl border-slate-200 text-xs font-semibold"
          >
            Close
          </Button>

          <div className="flex items-center gap-2">
            {!isRejected && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onClose();
                  onReject(application);
                }}
                className="rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold"
              >
                Reject
              </Button>
            )}

            {!isSuspended && !isPending && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onClose();
                  onSuspend(application);
                }}
                className="rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50 text-xs font-semibold"
              >
                Suspend
              </Button>
            )}

            {!isApproved && (
              <Button
                type="button"
                onClick={() => {
                  onClose();
                  onApprove(application);
                }}
                className="rounded-xl bg-[#20C466] hover:bg-[#1bb05b] text-white text-xs font-bold"
              >
                Approve Application
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
