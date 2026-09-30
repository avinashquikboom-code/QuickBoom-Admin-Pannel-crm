'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Megaphone,
  Image as ImageIcon,
  Link as LinkIcon,
  ExternalLink,
  Users,
  User,
  Calendar,
  Send,
  Eye,
  Check,
  AlertCircle,
  Clock,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { AdminButton } from '../buttons/AdminButton';

export interface CreateOfferNotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateOfferNotificationDrawer({
  isOpen,
  onClose,
  onSuccess,
}: CreateOfferNotificationDrawerProps) {
  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // CTA State
  const [showCta, setShowCta] = useState(false);
  const [ctaText, setCtaText] = useState('Claim Offer');
  const [ctaActionType, setCtaActionType] = useState<'DEEP_LINK' | 'WEB_URL'>('DEEP_LINK');
  const [ctaActionValue, setCtaActionValue] = useState('/customer/plans');

  // Targeting State
  const [targetType, setTargetType] = useState<'CUSTOMERS' | 'EMPLOYEES'>('CUSTOMERS');
  const [audience, setAudience] = useState<'ALL' | 'SPECIFIC'>('ALL');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchTarget, setSearchTarget] = useState('');

  // Audience Data
  const [customersList, setCustomersList] = useState<{ id: number; name: string; companyName?: string }[]>([]);
  const [employeesList, setEmployeesList] = useState<{ id: number; firstName: string; lastName: string; employeeCode?: string }[]>([]);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);

  // Scheduling State
  const [scheduleMode, setScheduleMode] = useState<'NOW' | 'SCHEDULE'>('NOW');
  const [scheduledAt, setScheduledAt] = useState('');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setValidationErrors({});
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Fetch recipients list when specific targeting is selected
  useEffect(() => {
    if (!isOpen || audience !== 'SPECIFIC') return;

    let isMounted = true;
    const fetchAudienceData = async () => {
      setIsLoadingRecipients(true);
      try {
        if (targetType === 'CUSTOMERS') {
          const res: any = await api.get('/customers', { params: { limit: 100 } });
          const items = res?.data?.items || res?.data || res?.items || (Array.isArray(res) ? res : []);
          if (isMounted) {
            setCustomersList(
              items.map((c: any) => ({
                id: Number(c.id),
                name: c.name || c.companyName || `Customer #${c.id}`,
                companyName: c.companyName,
              })),
            );
          }
        } else {
          const res: any = await api.get('/employees', { params: { limit: 100 } });
          const items = res?.data?.items || res?.data || res?.items || (Array.isArray(res) ? res : []);
          if (isMounted) {
            setEmployeesList(
              items.map((e: any) => ({
                id: Number(e.id),
                firstName: e.firstName || 'Employee',
                lastName: e.lastName || '',
                employeeCode: e.employeeCode,
              })),
            );
          }
        }
      } catch (err: any) {
        console.error('Failed to load audience targets:', err);
      } finally {
        if (isMounted) setIsLoadingRecipients(false);
      }
    };

    fetchAudienceData();
    return () => {
      isMounted = false;
    };
  }, [isOpen, targetType, audience]);

  // Filtered recipient list for specific picker
  const filteredRecipients = useMemo(() => {
    const query = searchTarget.toLowerCase().trim();
    if (targetType === 'CUSTOMERS') {
      return customersList.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          (c.companyName && c.companyName.toLowerCase().includes(query)) ||
          String(c.id).includes(query),
      );
    } else {
      return employeesList.filter(
        (e) =>
          e.firstName.toLowerCase().includes(query) ||
          e.lastName.toLowerCase().includes(query) ||
          (e.employeeCode && e.employeeCode.toLowerCase().includes(query)) ||
          String(e.id).includes(query),
      );
    }
  }, [targetType, customersList, employeesList, searchTarget]);

  const toggleSelectId = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSelectAllFiltered = () => {
    const ids = filteredRecipients.map((r) => r.id);
    setSelectedIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  // Validation
  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!title.trim()) {
      errors.title = 'Title is required.';
    }

    if (!message.trim()) {
      errors.message = 'Message is required.';
    }

    if (showCta) {
      if (!ctaText.trim()) {
        errors.ctaText = 'Button text is required when CTA is enabled.';
      }

      if (ctaActionType === 'WEB_URL') {
        if (!ctaActionValue.trim()) {
          errors.ctaActionValue = 'Web URL is required.';
        } else {
          try {
            const parsed = new URL(ctaActionValue.trim());
            if (!['http:', 'https:'].includes(parsed.protocol)) {
              errors.ctaActionValue = 'URL must start with http:// or https://';
            }
          } catch (_) {
            errors.ctaActionValue = 'Please enter a valid URL (e.g. https://example.com)';
          }
        }
      } else {
        if (!ctaActionValue.trim()) {
          errors.ctaActionValue = 'Deep link destination is required.';
        }
      }
    }

    if (audience === 'SPECIFIC' && selectedIds.length === 0) {
      errors.audience = `Please select at least one specific ${targetType === 'CUSTOMERS' ? 'Customer' : 'Employee'}.`;
    }

    if (scheduleMode === 'SCHEDULE') {
      if (!scheduledAt) {
        errors.scheduledAt = 'Please select a scheduled date and time.';
      } else if (new Date(scheduledAt).getTime() <= Date.now()) {
        errors.scheduledAt = 'Scheduled time must be in the future.';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload: any = {
        title: title.trim(),
        message: message.trim(),
        targetType,
        audience,
        targetIds: audience === 'SPECIFIC' ? selectedIds : undefined,
        imageUrl: imageUrl.trim() || undefined,
        showCta,
        ctaText: showCta ? ctaText.trim() : undefined,
        ctaActionType: showCta ? ctaActionType : undefined,
        ctaActionValue: showCta ? ctaActionValue.trim() : undefined,
        scheduledAt: scheduleMode === 'SCHEDULE' ? new Date(scheduledAt).toISOString() : undefined,
      };

      const res: any = await api.post('/notifications/admin/offer', payload);
      const isSched = scheduleMode === 'SCHEDULE';
      toast.success(
        isSched
          ? 'Offer notification successfully scheduled!'
          : res?.message || 'Offer notification successfully sent to audience!',
      );

      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to send offer notification.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={() => !isSubmitting && onClose()}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-4 sm:pl-10 pointer-events-none">
        <div className="pointer-events-auto w-screen max-w-2xl bg-white shadow-2xl flex flex-col justify-between transform transition-transform duration-300 animate-in slide-in-from-right">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#1AA14D] border border-emerald-200/60 flex items-center justify-center shrink-0">
                <Megaphone className="w-5 h-5 text-[#23C45E]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    Create Offer Notification
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wide">
                    PROMOTIONAL
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Dispatch rich push notification with customizable CTA & image
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Form Body */}
          <form
            id="offer-notification-form"
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto px-6 py-6 space-y-6 text-slate-800"
          >
            {/* 1. Title & Message */}
            <div className="space-y-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Offer Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Special Festive Offer 🎉"
                  className={`w-full px-3.5 py-2.5 bg-white border ${
                    validationErrors.title ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:border-[#1AA14D]'
                  } rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1AA14D]/20 transition-all`}
                />
                {validationErrors.title && (
                  <p className="text-xs text-rose-500 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {validationErrors.title}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Promotional Message <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g. Get 20% off all marketing plans today! Limited period discount."
                  className={`w-full px-3.5 py-2.5 bg-white border ${
                    validationErrors.message ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:border-[#1AA14D]'
                  } rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1AA14D]/20 transition-all resize-none`}
                />
                {validationErrors.message && (
                  <p className="text-xs text-rose-500 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {validationErrors.message}
                  </p>
                )}
              </div>
            </div>

            {/* 2. Promotional Image */}
            <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  Promotional Image (Optional)
                </label>
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                )}
              </div>

              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/banner.jpg"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#1AA14D] transition-all"
              />

              {imageUrl && (
                <div className="relative mt-2 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 max-h-48 flex items-center justify-center">
                  <img
                    src={imageUrl}
                    alt="Promotional Banner Preview"
                    className="w-full h-44 object-cover"
                    onError={(e) => {
                      (e.target as any).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40" viewBox="0 0 100 40"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23aaa">Invalid Image</text></svg>';
                    }}
                  />
                </div>
              )}
            </div>

            {/* 3. CTA BUTTON (ADMIN CONTROL & CUSTOMIZATION) */}
            <div className="space-y-4 bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100/80">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    CTA Button
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Add interactive action button to mobile notification
                  </p>
                </div>

                {/* SHOW CTA BUTTON TOGGLE */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-slate-600">
                    {showCta ? 'ON' : 'OFF'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCta(!showCta)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      showCta ? 'bg-[#1AA14D]' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        showCta ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {showCta && (
                <div className="space-y-4 pt-3 border-t border-emerald-100 animate-in fade-in duration-150">
                  {/* Custom Button Text */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Button Text <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value)}
                      placeholder="e.g. Claim Offer, View Plan, Buy Now"
                      className={`w-full px-3.5 py-2.5 bg-white border ${
                        validationErrors.ctaText ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:border-[#1AA14D]'
                      } rounded-xl text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1AA14D]/20 transition-all`}
                    />
                    {validationErrors.ctaText && (
                      <p className="text-xs text-rose-500 font-semibold mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {validationErrors.ctaText}
                      </p>
                    )}

                    {/* Quick suggestion chips */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {[
                        'Claim Offer',
                        'View Plan',
                        'Buy Now',
                        'Get Offer',
                        'Book Now',
                        'Explore Now',
                        'Learn More',
                        'Shop Now',
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setCtaText(preset)}
                          className={`text-[11px] px-2.5 py-1 rounded-lg border font-semibold transition-all cursor-pointer ${
                            ctaText === preset
                              ? 'bg-[#1AA14D] text-white border-[#1AA14D]'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Action Type: Deep Link or Web URL */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Button Action Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCtaActionType('DEEP_LINK');
                          if (ctaActionValue.startsWith('http')) {
                            setCtaActionValue('/customer/plans');
                          }
                        }}
                        className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          ctaActionType === 'DEEP_LINK'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                        Deep Link (App Screen)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCtaActionType('WEB_URL');
                          if (!ctaActionValue.startsWith('http')) {
                            setCtaActionValue('https://quikboom.com');
                          }
                        }}
                        className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          ctaActionType === 'WEB_URL'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Web URL
                      </button>
                    </div>
                  </div>

                  {/* Action Destination */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      {ctaActionType === 'WEB_URL' ? 'Target Website URL' : 'Deep Link Destination'}
                    </label>
                    <input
                      type="text"
                      value={ctaActionValue}
                      onChange={(e) => setCtaActionValue(e.target.value)}
                      placeholder={
                        ctaActionType === 'WEB_URL'
                          ? 'https://example.com/special-offer'
                          : '/customer/plans'
                      }
                      className={`w-full px-3.5 py-2.5 bg-white border ${
                        validationErrors.ctaActionValue
                          ? 'border-rose-400 focus:ring-rose-200'
                          : 'border-slate-200 focus:border-[#1AA14D]'
                      } rounded-xl text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1AA14D]/20 transition-all`}
                    />
                    {validationErrors.ctaActionValue && (
                      <p className="text-xs text-rose-500 font-semibold mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {validationErrors.ctaActionValue}
                      </p>
                    )}

                    {/* Common deep-link presets */}
                    {ctaActionType === 'DEEP_LINK' && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {[
                          { label: 'Plans Screen', route: '/customer/plans' },
                          { label: 'Orders Screen', route: '/customer/orders' },
                          { label: 'Marketplace', route: '/customer/marketplace' },
                          { label: 'Influencers', route: '/customer/influencers' },
                          { label: 'Employee Leads', route: '/employee/leads' },
                        ].map((preset) => (
                          <button
                            key={preset.route}
                            type="button"
                            onClick={() => setCtaActionValue(preset.route)}
                            className={`text-[10px] px-2 py-0.5 rounded-lg border font-mono transition-all cursor-pointer ${
                              ctaActionValue === preset.route
                                ? 'bg-slate-800 text-white border-slate-800'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Target Audience */}
            <div className="space-y-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
              <div className="grid grid-cols-2 gap-4">
                {/* User Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Target Audience
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTargetType('CUSTOMERS');
                        setSelectedIds([]);
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        targetType === 'CUSTOMERS'
                          ? 'bg-[#1AA14D] text-white border-[#1AA14D]'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      Customers
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTargetType('EMPLOYEES');
                        setSelectedIds([]);
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        targetType === 'EMPLOYEES'
                          ? 'bg-[#1AA14D] text-white border-[#1AA14D]'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      Employees
                    </button>
                  </div>
                </div>

                {/* Scope */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Audience Scope
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAudience('ALL')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        audience === 'ALL'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      All {targetType === 'CUSTOMERS' ? 'Customers' : 'Employees'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAudience('SPECIFIC')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        audience === 'SPECIFIC'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Specific IDs
                    </button>
                  </div>
                </div>
              </div>

              {/* Specific Picker */}
              {audience === 'SPECIFIC' && (
                <div className="space-y-2 pt-2 border-t border-slate-200 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>
                      Select Specific {targetType === 'CUSTOMERS' ? 'Customers' : 'Employees'} ({selectedIds.length} selected)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAllFiltered}
                        className="text-emerald-700 hover:underline text-[11px] font-bold cursor-pointer"
                      >
                        Select Visible
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={handleClearSelection}
                        className="text-slate-500 hover:underline text-[11px] font-medium cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={searchTarget}
                    onChange={(e) => setSearchTarget(e.target.value)}
                    placeholder={`Search by name, company, code, or ID...`}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1AA14D]"
                  />

                  {validationErrors.audience && (
                    <p className="text-xs text-rose-500 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {validationErrors.audience}
                    </p>
                  )}

                  <div className="max-h-44 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white">
                    {isLoadingRecipients ? (
                      <div className="p-4 text-center text-xs text-slate-400 font-bold animate-pulse">
                        Loading {targetType.toLowerCase()} list...
                      </div>
                    ) : filteredRecipients.length > 0 ? (
                      filteredRecipients.map((item: any) => {
                        const isSelected = selectedIds.includes(item.id);
                        const label =
                          targetType === 'CUSTOMERS'
                            ? `${item.name} ${item.companyName ? `(${item.companyName})` : ''}`
                            : `${item.firstName} ${item.lastName} ${item.employeeCode ? `[${item.employeeCode}]` : ''}`;
                        return (
                          <div
                            key={item.id}
                            onClick={() => toggleSelectId(item.id)}
                            className={`p-2.5 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50 transition-colors ${
                              isSelected ? 'bg-emerald-50/60 font-bold' : 'text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-[10px]">
                                ID #{item.id}
                              </span>
                              <span className="truncate">{label}</span>
                            </div>
                            <div
                              className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all ${
                                isSelected
                                  ? 'bg-[#1AA14D] border-[#1AA14D] text-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-400">
                        No matches found.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 5. Schedule vs Send Now */}
            <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Delivery Schedule
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setScheduleMode('NOW')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    scheduleMode === 'NOW'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  Send Now
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleMode('SCHEDULE')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    scheduleMode === 'SCHEDULE'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  Schedule Later
                </button>
              </div>

              {scheduleMode === 'SCHEDULE' && (
                <div className="pt-2 animate-in fade-in">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Select Date & Time (IST / Local Time)
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#1AA14D]"
                  />
                  {validationErrors.scheduledAt && (
                    <p className="text-xs text-rose-500 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {validationErrors.scheduledAt}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* 6. REAL-TIME ANDROID NOTIFICATION PREVIEW */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                <span className="flex items-center gap-1.5 text-slate-900">
                  <Eye className="w-4 h-4 text-emerald-600" />
                  Live Notification Preview
                </span>
                <span className="text-[10px] text-slate-400 font-medium lowercase">
                  android system tray mockup
                </span>
              </div>

              {/* Mockup Card */}
              <div className="bg-[#1E293B] text-white rounded-3xl p-4 shadow-xl border border-slate-700/60 transition-all">
                {/* Status Bar / App Identity */}
                <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#23C45E] flex items-center justify-center text-white text-[11px] font-black shadow-xs">
                      QB
                    </div>
                    <span className="font-extrabold text-slate-200 text-xs tracking-tight">
                      QB Suite
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-[11px] text-slate-400">now</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                    rich alert
                  </span>
                </div>

                {/* Title */}
                <h4 className="font-black text-sm text-white tracking-tight leading-snug">
                  {title.trim() || 'Special Offer 🎉'}
                </h4>

                {/* Body Message */}
                <p className="text-xs text-slate-300 font-normal mt-1 leading-relaxed whitespace-pre-wrap">
                  {message.trim() || 'Get 20% off all marketing plans today! Limited period discount.'}
                </p>

                {/* Promotional Image Preview */}
                {imageUrl && (
                  <div className="mt-3 rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 max-h-48 flex items-center justify-center">
                    <img
                      src={imageUrl}
                      alt="Notification Banner"
                      className="w-full h-40 object-cover"
                      onError={(e) => {
                        (e.target as any).style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* CTA BUTTON PREVIEW: ONLY WHEN SHOW CTA IS ON */}
                {showCta && ctaText.trim() && (
                  <div className="mt-3.5 pt-2 border-t border-slate-700/60">
                    <div className="w-full py-2.5 px-4 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black text-xs rounded-xl text-center shadow-md flex items-center justify-center gap-2 transition-all">
                      <span>{ctaText.trim()}</span>
                      {ctaActionType === 'WEB_URL' ? (
                        <ExternalLink className="w-3.5 h-3.5 text-slate-900" />
                      ) : (
                        <LinkIcon className="w-3.5 h-3.5 text-slate-900" />
                      )}
                    </div>
                  </div>
                )}
                {/* Note: When CTA is OFF, absolutely NO empty button area is reserved */}
              </div>
            </div>
          </form>

          {/* Fixed Footer */}
          <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3 shrink-0">
            <AdminButton
              type="button"
              variant="outline"
              size="md"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </AdminButton>

            <AdminButton
              type="submit"
              form="offer-notification-form"
              variant="primary"
              size="md"
              icon={scheduleMode === 'SCHEDULE' ? Calendar : Send}
              loading={isSubmitting}
            >
              {scheduleMode === 'SCHEDULE' ? 'Schedule Notification' : 'Send Notification'}
            </AdminButton>
          </div>
        </div>
      </div>
    </div>
  );
}
