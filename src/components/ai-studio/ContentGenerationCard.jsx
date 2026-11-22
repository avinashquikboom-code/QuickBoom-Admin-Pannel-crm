'use client';

import * as React from 'react';
import {
  Sparkles,
  Upload,
  X,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';

const PLATFORMS = [
  { id: 'INSTAGRAM', name: 'Instagram', maxChars: 2200, color: 'text-pink-600 border-pink-200 bg-pink-50' },
  { id: 'FACEBOOK', name: 'Facebook', maxChars: 63206, color: 'text-blue-600 border-blue-200 bg-blue-50' },
  { id: 'LINKEDIN', name: 'LinkedIn', maxChars: 3000, color: 'text-sky-700 border-sky-200 bg-sky-50' },
  { id: 'YOUTUBE', name: 'YouTube', maxChars: 5000, color: 'text-red-600 border-red-200 bg-red-50' },
  { id: 'TIKTOK', name: 'TikTok', maxChars: 2200, color: 'text-slate-900 border-slate-300 bg-slate-100' },
];

const CONTENT_TYPES = [
  { id: 'POST', label: 'Social Post (Image + Caption)' },
  { id: 'POSTER', label: 'Marketing Poster' },
  { id: 'VIDEO', label: 'Video Script / Short' },
  { id: 'CAPTION', label: 'Caption Only' },
  { id: 'HASHTAGS', label: 'Viral Hashtags' },
];

const CONTENT_TONES = [
  'Premium & Luxury',
  'Professional & Corporate',
  'Casual & Friendly',
  'Urgent & Promotional',
  'Inspirational & Motivational',
  'Humorous & Engaging',
];

export function ContentGenerationCard({
  customers = [],
  socialAccounts = [],
  selectedCustomer,
  onCustomerChange,
  platform,
  onPlatformChange,
  selectedAccountId,
  onAccountChange,
  type,
  onTypeChange,
  tone,
  onToneChange,
  prompt,
  onPromptChange,
  objective,
  onObjectiveChange,
  mediaFile,
  onMediaFileChange,
  onGenerate,
  generating = false,
  className = '',
}) {
  const [dragActive, setDragActive] = React.useState(false);
  const fileInputRef = React.useRef(null);

  // Filter connected accounts by selected customer and platform
  const filteredAccounts = React.useMemo(() => {
    if (!selectedCustomer) return [];
    return socialAccounts.filter((acc) => {
      const matchCustomer = Number(acc.customerId) === Number(selectedCustomer);
      const matchPlatform = !platform || String(acc.platform).toUpperCase() === String(platform).toUpperCase();
      const isConnected = acc.isConnected !== false;
      return matchCustomer && matchPlatform && isConnected;
    });
  }, [socialAccounts, selectedCustomer, platform]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onMediaFileChange(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className={`rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-xs space-y-5 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F1EC] text-[#163A2E] border border-emerald-100/90 shadow-2xs">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Generate AI Content
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Create platform-optimized captions, copy, and media for authorized customer accounts.
            </p>
          </div>
        </div>
      </div>

      {/* Form Fields Grid */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onGenerate();
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Customer Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">
              Customer / Tenant <span className="text-rose-500">*</span>
            </Label>
            <select
              required
              value={selectedCustomer || ''}
              onChange={(e) => onCustomerChange(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#163A2E]/20 focus:border-[#163A2E] transition-all cursor-pointer"
            >
              <option value="">Select customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName ? `${c.companyName} (${c.name})` : c.name || `Customer #${c.id}`}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Platform Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">
              Social Media Platform <span className="text-rose-500">*</span>
            </Label>
            <select
              required
              value={platform}
              onChange={(e) => onPlatformChange(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#163A2E]/20 focus:border-[#163A2E] transition-all cursor-pointer"
            >
              {PLATFORMS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Connected Social Account Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-slate-700">
                Connected Social Account
              </Label>
              {selectedCustomer && (
                <span className="text-[11px] text-slate-400">
                  {filteredAccounts.length} connected
                </span>
              )}
            </div>
            <select
              value={selectedAccountId || ''}
              onChange={(e) => onAccountChange(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#163A2E]/20 focus:border-[#163A2E] transition-all cursor-pointer"
            >
              <option value="">
                {filteredAccounts.length > 0
                  ? 'Select customer account (Optional for draft)...'
                  : selectedCustomer
                  ? 'No connected account for this platform'
                  : 'Select customer first...'}
              </option>
              {filteredAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.accountName} {acc.username ? `(@${acc.username})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Content Type Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">
              Content Type <span className="text-rose-500">*</span>
            </Label>
            <select
              value={type}
              onChange={(e) => onTypeChange(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#163A2E]/20 focus:border-[#163A2E] transition-all cursor-pointer"
            >
              {CONTENT_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Tone of Voice */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Content Tone</Label>
            <select
              value={tone}
              onChange={(e) => onToneChange(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#163A2E]/20 focus:border-[#163A2E] transition-all cursor-pointer"
            >
              {CONTENT_TONES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* 6. Campaign Objective */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Campaign Objective</Label>
            <Input
              value={objective}
              onChange={(e) => onObjectiveChange(e.target.value)}
              placeholder="e.g. Weekend Flash Sale, Product Launch"
              className="h-10 rounded-xl text-xs sm:text-sm"
            />
          </div>
        </div>

        {/* 7. Topic / AI Prompt Textarea */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-slate-700">
              Topic / Product Description / AI Prompt <span className="text-rose-500">*</span>
            </Label>
            <span className="text-[11px] text-slate-400">{prompt.length} characters</span>
          </div>
          <textarea
            required
            rows={3}
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="Describe the product, offer, key selling points, or creative direction for the AI generator..."
            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#163A2E]/20 focus:border-[#163A2E] transition-all"
          />
        </div>

        {/* 8. Optional Image or Video Upload */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-700">
            Optional Image or Video Asset
          </Label>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${
              dragActive
                ? 'border-[#163A2E] bg-emerald-50/50'
                : 'border-slate-200 hover:border-slate-300 bg-[#F7F9F8]/60'
            }`}
          >
            {mediaFile ? (
              <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-2.5 max-w-md mx-auto text-xs">
                <div className="flex items-center gap-2 truncate">
                  <ImageIcon className="size-4 text-emerald-600 shrink-0" />
                  <span className="font-medium text-slate-800 truncate">{mediaFile.name}</span>
                  <span className="text-slate-400">
                    ({(mediaFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onMediaFileChange(null)}
                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      onMediaFileChange(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs border-slate-200 text-slate-700 hover:bg-white"
                >
                  <Upload className="size-3.5 mr-1.5 text-slate-500" />
                  Choose File or Drag Here
                </Button>
                <p className="text-[11px] text-slate-400">
                  Supports PNG, JPG, WEBP, or MP4 (Max 15MB)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 9. Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
          <p className="text-[11px] text-slate-500">
            Content is generated via OpenAI / Gemini and saved directly in the customer’s backend social queue.
          </p>
          <Button
            type="submit"
            disabled={generating || !prompt.trim() || !selectedCustomer}
            className="w-full sm:w-auto px-6 h-10 bg-[#163A2E] hover:bg-[#204C3D] text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className={`size-4 ${generating ? 'animate-spin' : ''}`} />
            <span>{generating ? 'Generating with AI…' : 'Generate Content'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
