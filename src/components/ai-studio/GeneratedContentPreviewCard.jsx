'use client';

import * as React from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Edit2,
  Save,
  Send,
  Calendar,
  Share2,
  AlertCircle,
  ExternalLink,
  RotateCw,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { toast } from '@/hooks/use-toast';
import { updateGeneration, publishSocialPost } from '@/modules/social/social-api';

const PLATFORM_LIMITS = {
  INSTAGRAM: 2200,
  FACEBOOK: 63206,
  LINKEDIN: 3000,
  YOUTUBE: 5000,
  TIKTOK: 2200,
};

export function GeneratedContentPreviewCard({
  generation,
  customerId,
  selectedAccountId,
  onPublishSuccess,
  className = '',
}) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [caption, setCaption] = React.useState(generation?.caption || '');
  const [hashtags, setHashtags] = React.useState(
    Array.isArray(generation?.hashtags) ? generation.hashtags.join(' ') : ''
  );
  const [saving, setSaving] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  // Scheduling state
  const [isScheduleOpen, setIsScheduleOpen] = React.useState(false);
  const [scheduleDate, setScheduleDate] = React.useState('');
  const [scheduleTime, setScheduleTime] = React.useState('18:00');

  React.useEffect(() => {
    if (generation) {
      setCaption(generation.caption || '');
      setHashtags(
        Array.isArray(generation.hashtags)
          ? generation.hashtags.join(' ')
          : generation.hashtags || ''
      );
      setIsEditing(false);
    }
  }, [generation]);

  if (!generation) return null;

  const platform = String(generation.platform || 'INSTAGRAM').toUpperCase();
  const maxLimit = PLATFORM_LIMITS[platform] || 2200;
  const currentLength = (caption + ' ' + hashtags).trim().length;
  const isOverLimit = currentLength > maxLimit;

  // Copy full caption + hashtags
  const handleCopy = () => {
    try {
      const fullText = `${caption}\n\n${hashtags}`.trim();
      navigator.clipboard.writeText(fullText);
      setCopied(true);
      toast.success('Caption & hashtags copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  // Save edited caption back to backend database
  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const tagsArray = hashtags
        .split(/\s+/)
        .map((t) => (t.startsWith('#') ? t : `#${t}`))
        .filter((t) => t.length > 1);

      await updateGeneration(
        generation.id || generation.generationId,
        {
          caption,
          hashtags: tagsArray,
        },
        customerId
      );
      toast.success('Generated content updated in backend');
      setIsEditing(false);
    } catch (err) {
      toast.error('Failed to update generated content');
    } finally {
      setSaving(false);
    }
  };

  // Publish immediately or schedule post
  const handlePublish = async (isScheduled = false) => {
    if (!selectedAccountId) {
      toast.warning('Please select a connected social account before publishing.');
      return;
    }

    let targetSchedule = undefined;
    if (isScheduled) {
      if (!scheduleDate) {
        toast.warning('Please select a date for scheduled publishing.');
        return;
      }
      targetSchedule = `${scheduleDate}T${scheduleTime || '18:00'}:00.000Z`;
    }

    setPublishing(true);
    try {
      const fullContent = `${caption}\n\n${hashtags}`.trim();
      const mediaUrls = generation.mediaUrl ? [generation.mediaUrl] : [];

      const res = await publishSocialPost(
        {
          socialAccountId: Number(selectedAccountId),
          generationId: generation.id,
          content: fullContent,
          mediaUrls,
          scheduledFor: targetSchedule,
        },
        customerId
      );

      toast.success(
        isScheduled
          ? 'Post successfully scheduled for publishing'
          : 'Content published to social platform!'
      );
      setIsScheduleOpen(false);
      if (onPublishSuccess) onPublishSuccess(res);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Publishing failed. Please verify credentials.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className={`rounded-2xl border border-emerald-200 bg-gradient-to-r from-[#F0F7F4] via-white to-[#F0F7F4] p-4 sm:p-6 shadow-xs space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-100 pb-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-[#163A2E]">
            <Sparkles className="size-4" />
          </span>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Generated Content Preview
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              ID: {generation.generationId || generation.id} · Type: {generation.type} · Platform: {platform}
            </p>
          </div>
        </div>

        {/* Character Count & Copy */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span
            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
              isOverLimit
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-[#E8F1EC] text-[#163A2E] border-emerald-200'
            }`}
          >
            {currentLength} / {maxLimit} chars
          </span>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="size-3.5 text-slate-500" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Layout: Media + Copy */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* Media Preview (If generated/uploaded) */}
        {generation.mediaUrl && (
          <div className="md:col-span-5 rounded-xl border border-slate-200 bg-black/5 overflow-hidden shadow-2xs">
            {generation.type === 'VIDEO' ? (
              <video
                src={generation.mediaUrl}
                controls
                className="w-full max-h-72 object-contain bg-black"
              />
            ) : (
              <img
                src={generation.mediaUrl}
                alt="AI Generated Social Media Asset"
                className="w-full max-h-72 object-contain bg-slate-50"
              />
            )}
          </div>
        )}

        {/* Caption & Hashtags Area */}
        <div className={`${generation.mediaUrl ? 'md:col-span-7' : 'md:col-span-12'} space-y-3`}>
          {isEditing ? (
            <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Edit Caption:
                </label>
                <textarea
                  rows={4}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#163A2E]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Edit Hashtags:
                </label>
                <input
                  type="text"
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#163A2E]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={saving}
                  onClick={handleSaveEdit}
                  className="bg-[#163A2E] text-white text-xs"
                >
                  <Save className="size-3.5 mr-1.5" />
                  {saving ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200/90 bg-white p-4 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Caption & Copy
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1 text-xs text-[#163A2E] hover:underline font-semibold cursor-pointer"
                >
                  <Edit2 className="size-3" /> Edit Copy
                </button>
              </div>

              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                {caption || 'No caption generated.'}
              </p>

              {hashtags && (
                <p className="text-xs font-medium text-emerald-800 pt-1 border-t border-slate-100">
                  {hashtags}
                </p>
              )}
            </div>
          )}

          {/* Customer Side Synchronization Note */}
          <div className="flex items-center gap-2 text-xs text-[#204C3D] bg-[#E8F1EC] p-3 rounded-xl border border-emerald-200/70">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-700" />
            <span>
              <strong>Synced to Customer Side:</strong> The customer can view, edit, approve, and publish this content directly from their Social Media dashboard.
            </span>
          </div>

          {/* Action Buttons: Publish Now and Schedule */}
          <div className="pt-2 flex flex-wrap items-center gap-2.5">
            <Button
              type="button"
              disabled={publishing || !selectedAccountId}
              onClick={() => handlePublish(false)}
              className="bg-[#163A2E] hover:bg-[#204C3D] text-white text-xs sm:text-sm font-semibold h-9 rounded-xl shadow-xs"
            >
              <Send className="size-3.5 mr-1.5" />
              {publishing ? 'Publishing…' : 'Publish to Account Now'}
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={publishing || !selectedAccountId}
              onClick={() => setIsScheduleOpen(!isScheduleOpen)}
              className="text-xs sm:text-sm font-semibold h-9 rounded-xl border-slate-200 text-slate-700 hover:bg-[#E8F1EC]"
            >
              <Calendar className="size-3.5 mr-1.5" />
              Schedule Post
            </Button>

            {!selectedAccountId && (
              <span className="text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                Select a connected account in the form to publish directly
              </span>
            )}
          </div>

          {/* Inline Scheduling Picker */}
          {isScheduleOpen && (
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-3 shadow-xs">
              <span className="text-xs font-bold text-slate-800 block">
                Schedule Social Post Publishing
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Date:
                  </label>
                  <Input
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="h-9 text-xs rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Time:
                  </label>
                  <Input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="h-9 text-xs rounded-lg"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsScheduleOpen(false)}
                  className="text-xs h-8"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={publishing || !scheduleDate}
                  onClick={() => handlePublish(true)}
                  className="bg-[#163A2E] text-white text-xs h-8"
                >
                  <Clock className="size-3 mr-1" />
                  Confirm Schedule
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
