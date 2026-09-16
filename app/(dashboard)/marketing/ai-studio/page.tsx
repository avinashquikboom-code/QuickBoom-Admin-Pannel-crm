'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  CreditCard,
  History,
  Share2,
  CheckCircle2,
  XCircle,
  Clock,
  Edit2,
  ExternalLink,
  Layers,
  Image as ImageIcon,
  Video,
  FileText,
  Hash,
  Instagram,
  Facebook,
  Youtube,
  Linkedin,
  Coins,
  ArrowRight,
  TrendingUp,
  Cpu,
  Zap,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import {
  AiSocialAdminService,
  AiServiceConfigItem,
  AiGenerationItem,
  AiCreditTransactionItem,
  SocialPublishItem,
} from '@/lib/services/ai-social.service';
import { AdminFormDrawer } from '@/components/admin';

export default function AiStudioAdminPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'services' | 'generations' | 'transactions' | 'social'>('services');

  // Edit Service State
  const [editingService, setEditingService] = useState<AiServiceConfigItem | null>(null);
  const [editCreditCost, setEditCreditCost] = useState(1);
  const [editPricePerCredit, setEditPricePerCredit] = useState(10);
  const [editIsActive, setEditIsActive] = useState(true);

  // Queries
  const { data: services = [], isLoading: loadingServices, refetch: refetchServices, isRefetching: isRefetchingServices } = useQuery<AiServiceConfigItem[]>({
    queryKey: ['admin-ai-services'],
    queryFn: () => AiSocialAdminService.getAiServices(),
  });

  const { data: generationsData, isLoading: loadingGenerations } = useQuery<{ items: AiGenerationItem[]; total: number }>({
    queryKey: ['admin-ai-generations'],
    queryFn: () => AiSocialAdminService.getGenerations({ limit: 50 }),
    enabled: activeTab === 'generations',
  });

  const { data: transactionsData, isLoading: loadingTransactions } = useQuery<{ items: AiCreditTransactionItem[]; total: number }>({
    queryKey: ['admin-ai-transactions'],
    queryFn: () => AiSocialAdminService.getCreditTransactions({ limit: 50 }),
    enabled: activeTab === 'transactions',
  });

  const { data: publishesData, isLoading: loadingPublishes } = useQuery<{ items: SocialPublishItem[]; total: number }>({
    queryKey: ['admin-social-publishes'],
    queryFn: () => AiSocialAdminService.getSocialPublishes({ limit: 50 }),
    enabled: activeTab === 'social',
  });

  // Dynamic KPI calculations
  const activeServicesCount = useMemo(() => {
    return services.filter((s) => s.isActive).length;
  }, [services]);

  const avgCreditPrice = useMemo(() => {
    if (!services.length) return 10;
    const total = services.reduce((acc, s) => acc + (s.pricePerCredit || 0), 0);
    return Math.round(total / services.length);
  }, [services]);

  // Service Edit Mutation
  const updateServiceMutation = useMutation({
    mutationFn: async () => {
      if (!editingService) return;
      return AiSocialAdminService.updateAiService(editingService.code, {
        creditCost: Number(editCreditCost),
        pricePerCredit: Number(editPricePerCredit),
        isActive: editIsActive,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ai-services'] });
      toast.success('AI Service configuration saved successfully');
      setEditingService(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update service');
    },
  });

  const openEditService = (service: AiServiceConfigItem) => {
    setEditingService(service);
    setEditCreditCost(service.creditCost);
    setEditPricePerCredit(service.pricePerCredit);
    setEditIsActive(service.isActive);
  };

  const getTypeIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'POSTER':
      case 'AI_POSTER':
        return <ImageIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'VIDEO':
      case 'AI_VIDEO':
        return <Video className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'CAPTION':
      case 'AI_CAPTION':
        return <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
      case 'HASHTAGS':
      case 'AI_HASHTAGS':
        return <Hash className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'REGENERATE':
      case 'AI_REGENERATE':
        return <RefreshCw className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    }
  };

  const getServiceGradients = (code: string) => {
    switch (code?.toUpperCase()) {
      case 'AI_POST':
        return 'from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'AI_POSTER':
        return 'from-purple-500/10 to-indigo-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'AI_VIDEO':
        return 'from-rose-500/10 to-orange-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'AI_CAPTION':
        return 'from-sky-500/10 to-blue-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
      case 'AI_HASHTAGS':
        return 'from-amber-500/10 to-yellow-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      default:
        return 'from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ── Breadcrumbs ────────────────────────────────────────── */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Link href="/dashboard" className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="text-slate-500 dark:text-slate-400">Marketing</span>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="text-slate-900 dark:text-white font-semibold">AI Studio &amp; Social</span>
      </nav>

      {/* ── Hero Page Header Card ──────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl border border-slate-700/60 shadow-xl p-6 sm:p-8">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl min-w-0">
            {/* Top Pill */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <Sparkles className="w-3 h-3" />
                QuikBoom AI Engine • Live
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">•</span>
              <span className="text-xs text-slate-300 font-medium hidden sm:inline">
                Omnichannel Creator &amp; Publishing
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight break-words">
              AI Content Creation &amp; Social Publishing
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              Manage QB Marketplace AI studio services, credit wallet pricing, generation logs, and automated social publishing.
            </p>
          </div>

          {/* Action Button */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/marketing/ai-credits"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-emerald-900/30 hover:shadow-emerald-900/40 hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
            >
              <Coins className="w-4 h-4" />
              <span>Manage Customer Credits</span>
              <ArrowRight className="w-4 h-4 opacity-75" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── KPI Stat Metric Cards ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active AI Services */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all duration-200">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
              Active AI Services
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {loadingServices ? '...' : `${activeServicesCount} / ${services.length}`}
            </p>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{services.length} Tools Configured</span>
            </div>
          </div>
        </div>

        {/* Card 2: Average Credit Price */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all duration-200">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
              Average Credit Price
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {loadingServices ? '...' : `₹${avgCreditPrice} / credit`}
            </p>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              <span>Standard Pack Pricing</span>
            </div>
          </div>
        </div>

        {/* Card 3: Social Channels */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all duration-200">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
              Social Channels
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
              <Share2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              5 Platforms
            </p>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              <span>IG, FB, LinkedIn, YT, X</span>
            </div>
          </div>
        </div>

        {/* Card 4: Publishing Engine */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all duration-200">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
              Publishing Engine
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Auto-Cron Active
            </p>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Queue Status: Healthy</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modern Navigation Tabs ──────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-1.5 shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('services')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
              activeTab === 'services'
                ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${activeTab === 'services' ? 'text-white' : 'text-slate-400'}`} />
            <span>AI Services &amp; Pricing</span>
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] font-semibold ${
                activeTab === 'services'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
            >
              {services.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('generations')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
              activeTab === 'generations'
                ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <History className={`w-3.5 h-3.5 ${activeTab === 'generations' ? 'text-white' : 'text-slate-400'}`} />
            <span>Generation History</span>
            {generationsData?.total !== undefined && (
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-semibold ${
                  activeTab === 'generations'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                {generationsData.total}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('transactions')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
              activeTab === 'transactions'
                ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <CreditCard className={`w-3.5 h-3.5 ${activeTab === 'transactions' ? 'text-white' : 'text-slate-400'}`} />
            <span>Credit Wallet Ledger</span>
            {transactionsData?.total !== undefined && (
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-semibold ${
                  activeTab === 'transactions'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                {transactionsData.total}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('social')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
              activeTab === 'social'
                ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Share2 className={`w-3.5 h-3.5 ${activeTab === 'social' ? 'text-white' : 'text-slate-400'}`} />
            <span>Social Publishing Queue</span>
            {publishesData?.total !== undefined && (
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-semibold ${
                  activeTab === 'social'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                {publishesData.total}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── TAB 1: AI SERVICES & PRICING ───────────────────────── */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Marketplace AI Services ({services.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Configure credit consumption, individual unit pricing, and customer visibility for QuikBoom AI Studio.
              </p>
            </div>

            <button
              type="button"
              onClick={() => refetchServices()}
              disabled={isRefetchingServices}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 self-start sm:self-center transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefetchingServices ? 'animate-spin text-emerald-500' : ''}`} />
              <span>Refresh Services</span>
            </button>
          </div>

          {loadingServices ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 animate-pulse space-y-4">
                  <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded w-full" />
                  <div className="h-8 bg-slate-100 dark:bg-slate-800/40 rounded-xl" />
                </div>
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-400">
              <Sparkles className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No AI Services configured</p>
              <p className="text-xs text-slate-400 mt-1">AI service configurations will appear here once seeded or created.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {services.map((svc) => {
                const totalCost = (svc.creditCost || 0) * (svc.pricePerCredit || 0);

                return (
                  <div
                    key={svc.code}
                    className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 rounded-3xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-200 relative overflow-hidden"
                  >
                    {/* Top gradient accent line on hover */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div>
                      {/* Header with Icon and Status */}
                      <div className="flex items-center justify-between gap-2 mb-3.5">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border bg-gradient-to-br ${getServiceGradients(svc.code)}`}>
                          {getTypeIcon(svc.code)}
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            svc.isActive
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${svc.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {svc.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {svc.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 min-h-[36px] line-clamp-2 leading-relaxed">
                        {svc.description || 'AI content generation engine.'}
                      </p>

                      {/* Pricing Details Box */}
                      <div className="mt-4 p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Credit Usage:</span>
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/50 px-2 py-0.5 rounded-lg text-xs">
                            <Coins className="w-3 h-3" />
                            {svc.creditCost} {svc.creditCost === 1 ? 'Credit' : 'Credits'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Unit Price:</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            ₹{svc.pricePerCredit} / cr
                          </span>
                        </div>

                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-900 dark:text-white">Cost per Output:</span>
                          <span className="font-black text-slate-900 dark:text-white text-xs">
                            ₹{totalCost.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => openEditService(svc)}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-800 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 border border-transparent hover:border-emerald-300 dark:hover:border-emerald-800 transition-all duration-150 active:scale-98"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit Pricing &amp; Status</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Bottom Section: Empower Your Customers with AI ──── */}
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl border border-slate-700/60 p-6 sm:p-8 shadow-lg">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Cpu className="w-3 h-3" />
                  Marketplace Capability
                </div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Empower Your Customers with AI
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                  Give customers high-converting social copy, auto-branded visual posters, and dynamic reels in seconds. Credit wallets provide strict usage guardrails while keeping you in complete monetary control.
                </p>

                {/* Micro Feature Badges */}
                <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    Instant Image &amp; Copy Generation
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    One-Click Multi-Platform Publishing
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    Live Immutable Credit Ledger
                  </span>
                </div>
              </div>

              <div className="shrink-0">
                <Link
                  href="/marketing/ai-credits"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  <Coins className="w-4 h-4 text-emerald-600" />
                  <span>Inspect Customer Wallets</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: GENERATION HISTORY ──────────────────────────── */}
      {activeTab === 'generations' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Customer AI Generation History
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Audit trail of social posts, posters, videos, and captions created by customer workspaces.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-3.5">Generation ID</th>
                  <th className="py-3 px-3.5">Customer</th>
                  <th className="py-3 px-3.5">Tool</th>
                  <th className="py-3 px-3.5">Product / Objective</th>
                  <th className="py-3 px-3.5">Credits</th>
                  <th className="py-3 px-3.5">Status</th>
                  <th className="py-3 px-3.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loadingGenerations ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-500 mb-2" />
                      Loading generation records...
                    </td>
                  </tr>
                ) : (generationsData?.items || []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <History className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                      No AI generations logged yet.
                    </td>
                  </tr>
                ) : (
                  (generationsData?.items || []).map((gen) => (
                    <tr key={gen.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3.5 font-mono text-emerald-600 dark:text-emerald-400 font-bold whitespace-nowrap">
                        {gen.generationId}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="font-semibold text-slate-900 dark:text-white block">
                          {gen.customer?.name || 'Customer'}
                        </span>
                        <span className="text-[10px] text-slate-400 block">{gen.customer?.email}</span>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                          {getTypeIcon(gen.type)} {gen.type}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 max-w-xs truncate">
                        <span className="text-slate-900 dark:text-white font-medium block truncate">
                          {gen.product}
                        </span>
                        {gen.objective && (
                          <span className="text-[10px] text-slate-400 block truncate">{gen.objective}</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {gen.creditsSpent} cr
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            gen.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : gen.status === 'PROCESSING'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              gen.status === 'COMPLETED'
                                ? 'bg-emerald-500'
                                : gen.status === 'PROCESSING'
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                          />
                          {gen.status}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-slate-400 whitespace-nowrap">
                        {new Date(gen.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: CREDIT WALLET LEDGER ────────────────────────── */}
      {activeTab === 'transactions' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Global Credit Ledger &amp; Audit Trail
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Immutable ledger of customer credit top-ups, administrator adjustments, and tool deductions.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-3.5">Transaction Date</th>
                  <th className="py-3 px-3.5">Customer</th>
                  <th className="py-3 px-3.5">Type</th>
                  <th className="py-3 px-3.5">Credits</th>
                  <th className="py-3 px-3.5">Balance After</th>
                  <th className="py-3 px-3.5">Notes / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loadingTransactions ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-500 mb-2" />
                      Loading transactions...
                    </td>
                  </tr>
                ) : (transactionsData?.items || []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <CreditCard className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                      No credit transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  (transactionsData?.items || []).map((tx) => {
                    const isPositive = tx.amount > 0;

                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-3.5 text-slate-500 whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-3.5 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                          {tx.customer?.name || 'Customer'}
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              tx.type === 'PURCHASE' || tx.type === 'CREDIT_GRANT' || tx.type === 'GRANT' || tx.type === 'BONUS'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : tx.type === 'USAGE'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            }`}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 font-bold whitespace-nowrap">
                          <span className={isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}>
                            {isPositive ? `+${tx.amount}` : tx.amount} cr
                          </span>
                        </td>
                        <td className="py-3 px-3.5 font-mono font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                          {tx.balanceAfter} cr
                        </td>
                        <td className="py-3 px-3.5 max-w-sm truncate text-slate-500 dark:text-slate-400" title={tx.notes || tx.serviceCode || ''}>
                          {tx.notes || tx.serviceCode || '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 4: SOCIAL PUBLISHING QUEUE ─────────────────────── */}
      {activeTab === 'social' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Social Media Auto-Publishing Queue
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Scheduled and live broadcast status across linked customer Instagram, Facebook, LinkedIn, YouTube, and X accounts.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-3.5">Publish ID</th>
                  <th className="py-3 px-3.5">Customer</th>
                  <th className="py-3 px-3.5">Platform</th>
                  <th className="py-3 px-3.5">Content Preview</th>
                  <th className="py-3 px-3.5">Status</th>
                  <th className="py-3 px-3.5">Schedule / Published Date</th>
                  <th className="py-3 px-3.5 text-right">External Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loadingPublishes ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-500 mb-2" />
                      Loading publishing queue...
                    </td>
                  </tr>
                ) : (publishesData?.items || []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Share2 className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                      No items currently in social publishing queue.
                    </td>
                  </tr>
                ) : (
                  (publishesData?.items || []).map((pub) => (
                    <tr key={pub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3.5 font-mono text-emerald-600 dark:text-emerald-400 font-bold whitespace-nowrap">
                        {pub.publishId}
                      </td>
                      <td className="py-3 px-3.5 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        {pub.customer?.name || 'Customer'}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-200">
                          {pub.platform}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 max-w-xs truncate text-slate-600 dark:text-slate-300">
                        {pub.content || '(Visual Media Only)'}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            pub.status === 'PUBLISHED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : pub.status === 'SCHEDULED'
                              ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              pub.status === 'PUBLISHED'
                                ? 'bg-emerald-500'
                                : pub.status === 'SCHEDULED'
                                ? 'bg-sky-500'
                                : 'bg-rose-500'
                            }`}
                          />
                          {pub.status}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-slate-500 whitespace-nowrap">
                        {pub.publishedAt
                          ? new Date(pub.publishedAt).toLocaleString()
                          : pub.scheduledFor
                          ? `Scheduled: ${new Date(pub.scheduledFor).toLocaleString()}`
                          : '—'}
                      </td>
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        {pub.externalPostUrl ? (
                          <a
                            href={pub.externalPostUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-semibold"
                          >
                            <span>View</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Edit Service Drawer ────────────────────────────────── */}
      <AdminFormDrawer
        isOpen={!!editingService}
        onClose={() => setEditingService(null)}
        title={`Edit ${editingService?.name || 'Service'}`}
        subtitle="Configure credit usage, price, and marketplace visibility"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateServiceMutation.mutate();
          }}
          className="space-y-5"
        >
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/70 dark:border-slate-800 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Service Code:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{editingService?.code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Current Cost:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {editingService?.creditCost} Credits (₹{((editingService?.creditCost || 0) * (editingService?.pricePerCredit || 0)).toLocaleString()})
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Credits Deducted Per Generation <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="100"
              required
              value={editCreditCost}
              onChange={(e) => setEditCreditCost(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Number of customer wallet credits charged atomically each time this AI action is triggered.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Price Per Credit (₹) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              step="0.5"
              required
              value={editPricePerCredit}
              onChange={(e) => setEditPricePerCredit(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Base unit price applied when customers purchase credit top-ups in the application.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between text-xs">
            <span className="font-semibold text-emerald-900 dark:text-emerald-200">Total Generation Cost:</span>
            <span className="font-black text-emerald-700 dark:text-emerald-300 text-sm">
              ₹{(editCreditCost * editPricePerCredit).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="serviceIsActive"
              checked={editIsActive}
              onChange={(e) => setEditIsActive(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 cursor-pointer"
            />
            <label htmlFor="serviceIsActive" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              Enable this AI tool for customers in QB Marketplace
            </label>
          </div>

          <div className="pt-5 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setEditingService(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateServiceMutation.isPending}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition-all disabled:opacity-50"
            >
              {updateServiceMutation.isPending ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Configuration'
              )}
            </button>
          </div>
        </form>
      </AdminFormDrawer>
    </div>
  );
}
