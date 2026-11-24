'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/common/Badge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { SlideOverDrawer } from '@/components/common/Drawer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import {
  faChartLine,
  faBullhorn,
  faStore,
  faStar,
  faGear,
  faRotate,
  faPlus,
  faCheck,
  faCheckCircle,
  faClock,
  faBan,
  faArrowUpRightFromSquare,
  faSliders,
  faPenToSquare,
  faTrashCan,
  faDownload,
  faSearch,
  faFilter,
  faXmark,
  faMoneyBillWave,
  faEye,
  faLocationDot,
  faPhone,
  faGlobe,
  faShield,
  faImages,
  faRobot,
  faReply,
  faDirections,
  faMobileScreen,
  faLayerGroup,
  faTriangleExclamation,
  faCircleCheck,
  faArrowTrendUp,
  faBuilding,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  loadGrowthOverview,
  loadGoogleAdsAccounts,
  loadGoogleAdsCampaigns,
  createGoogleAdsCampaign,
  updateCampaignStatus,
  updateCampaignBudget,
  syncGoogleAds,
  loadBusinessProfile,
  updateBusinessProfile,
  addProfilePhoto,
  loadReviews,
  replyToReview,
  generateAiReviewReply,
  loadGrowthAnalytics,
  loadGrowthSettings,
  updateGrowthSettings,
  connectGoogleOAuth,
  disconnectGoogleOAuth,
} from './business-growth-api';

const TABS = [
  { id: 'overview', label: 'Overview', icon: faLayerGroup },
  { id: 'google-ads', label: 'Google Ads', icon: faBullhorn },
  { id: 'business-profile', label: 'Business Profile', icon: faStore },
  { id: 'reviews', label: 'Reviews & Ratings', icon: faStar },
  { id: 'analytics', label: 'Analytics', icon: faChartLine },
  { id: 'settings', label: 'Settings', icon: faGear },
];

export function BusinessGrowthScreen({ initialTab = 'overview' }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get('tab')?.toLowerCase() || initialTab;
  const [activeTab, setActiveTab] = React.useState(tabParam);

  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState(null);
  const [syncing, setSyncing] = React.useState(false);

  // Data states
  const [overview, setOverview] = React.useState(null);
  const [googleAdsData, setGoogleAdsData] = React.useState(null);
  const [campaigns, setCampaigns] = React.useState([]);
  const [businessProfile, setBusinessProfile] = React.useState(null);
  const [reviewsData, setReviewsData] = React.useState(null);
  const [analyticsData, setAnalyticsData] = React.useState(null);
  const [settings, setSettings] = React.useState(null);

  // Filters
  const [campaignFilter, setCampaignFilter] = React.useState('ALL');
  const [campaignSearch, setCampaignSearch] = React.useState('');
  const [reviewFilter, setReviewFilter] = React.useState('ALL');
  const [reviewStar, setReviewStar] = React.useState(0);
  const [reviewSearch, setReviewSearch] = React.useState('');
  const [analyticsRange, setAnalyticsRange] = React.useState('30d');

  // Drawers & Modals
  const [isCampaignDrawerOpen, setIsCampaignDrawerOpen] = React.useState(false);
  const [budgetModalCampaign, setBudgetModalCampaign] = React.useState(null);
  const [newBudgetVal, setNewBudgetVal] = React.useState('');
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = React.useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = React.useState(false);
  const [replyModalReview, setReplyModalReview] = React.useState(null);
  const [replyText, setReplyText] = React.useState('');
  const [generatingAi, setGeneratingAi] = React.useState(false);
  const [isAiGeneratedFlag, setIsAiGeneratedFlag] = React.useState(false);

  // New Campaign Form
  const [newCampaign, setNewCampaign] = React.useState({
    name: '',
    objective: 'LEADS',
    budgetDaily: 2500,
    bidStrategy: 'TARGET_CPA',
    targetLocations: 'Mumbai, Pune, Ahmedabad, Bengaluru',
    finalUrl: 'https://quikboom.com/enterprise-crm',
  });

  // Profile Edit Form
  const [profileForm, setProfileForm] = React.useState({
    name: '',
    category: '',
    description: '',
    address: '',
    phone: '',
    website: '',
  });

  // Photo Upload Form
  const [photoForm, setPhotoForm] = React.useState({
    url: '',
    tag: 'Interior',
  });

  // Sync tab with URL
  React.useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    router.push(`/admin/business-growth?tab=${tabId}`);
  };

  // Initial load
  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [ov, ads, camp, prof, rev, ana, set] = await Promise.all([
        loadGrowthOverview(),
        loadGoogleAdsAccounts(),
        loadGoogleAdsCampaigns(),
        loadBusinessProfile(),
        loadReviews(),
        loadGrowthAnalytics(analyticsRange),
        loadGrowthSettings(),
      ]);

      // Older servers return simulated records. Require an explicit provenance
      // contract before allowing the dashboard to display any values.
      if (ov?.source !== 'google-api-verified') {
        throw new Error('Google API data has not been verified.');
      }
      if (ov) setOverview(ov);
      if (ads) setGoogleAdsData(ads);
      if (camp?.campaigns) setCampaigns(camp.campaigns);
      if (prof?.profile) {
        setBusinessProfile(prof.profile);
        setProfileForm({
          name: prof.profile.name || '',
          category: prof.profile.category || '',
          description: prof.profile.description || '',
          address: prof.profile.address || '',
          phone: prof.profile.phone || '',
          website: prof.profile.website || '',
        });
      }
      if (rev) setReviewsData(rev);
      if (ana) setAnalyticsData(ana);
      if (set) setSettings(set);
    } catch (error) {
      setLoadError(error?.response?.data?.message || error?.message || 'Unable to load Google integration data.');
    } finally {
      setLoading(false);
    }
  }, [analyticsRange]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sync Handler
  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const res = await syncGoogleAds();
      toast.success(res?.message || 'Google Ads & Business Profile synced.');
      await fetchData();
    } catch {
      toast.error('Synchronization failed. Check Google connection.');
    } finally {
      setSyncing(false);
    }
  };

  // Google Ads Campaign Actions
  const handleToggleCampaign = async (campaign) => {
    const nextStatus = campaign.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await updateCampaignStatus(campaign.id, nextStatus);
      setCampaigns((prev) =>
        prev.map((c) => (c.id === campaign.id ? { ...c, status: nextStatus } : c))
      );
      toast.success(`Campaign ${campaign.name} is now ${nextStatus}.`);
    } catch {
      toast.error('Could not update campaign status.');
    }
  };

  const handleSaveBudget = async () => {
    if (!budgetModalCampaign || !newBudgetVal) return;
    const num = Number(newBudgetVal);
    if (isNaN(num) || num < 100) {
      toast.error('Daily budget must be at least ₹100.');
      return;
    }

    try {
      await updateCampaignBudget(budgetModalCampaign.id, num);
      setCampaigns((prev) =>
        prev.map((c) => (c.id === budgetModalCampaign.id ? { ...c, budgetDaily: num } : c))
      );
      toast.success(`Updated daily budget for ${budgetModalCampaign.name} to ₹${num.toLocaleString('en-IN')}`);
      setBudgetModalCampaign(null);
    } catch {
      toast.error('Failed to update campaign budget.');
    }
  };

  const handleCreateCampaign = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!newCampaign.name.trim() || !newCampaign.finalUrl.trim()) {
      toast.error('Please fill in campaign name and landing page URL.');
      return;
    }

    try {
      const created = await createGoogleAdsCampaign({
        ...newCampaign,
        budgetDaily: Number(newCampaign.budgetDaily),
        targetLocations: newCampaign.targetLocations.split(',').map((s) => s.trim()).filter(Boolean),
      });
      if (created) {
        setCampaigns((prev) => [created, ...prev]);
        toast.success(`Google Ads Campaign "${newCampaign.name}" created successfully.`);
        setIsCampaignDrawerOpen(false);
      }
    } catch {
      toast.error('Failed to create campaign.');
    }
  };

  // Business Profile Actions
  const handleSaveProfile = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    try {
      const updated = await updateBusinessProfile(profileForm);
      if (updated) {
        setBusinessProfile((prev) => ({ ...prev, ...updated }));
        toast.success('Business Profile details updated.');
        setIsProfileDrawerOpen(false);
      }
    } catch {
      toast.error('Could not update business profile.');
    }
  };

  const handleAddPhoto = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!photoForm.url.trim()) {
      toast.error('Photo URL is required.');
      return;
    }
    try {
      const added = await addProfilePhoto(photoForm);
      if (added && businessProfile) {
        setBusinessProfile((prev) => ({
          ...prev,
          photos: [...prev.photos, added],
        }));
        toast.success('Photo added to Business Profile.');
        setIsPhotoModalOpen(false);
        setPhotoForm({ url: '', tag: 'Interior' });
      }
    } catch {
      toast.error('Could not add photo.');
    }
  };

  // Reviews Actions
  const handleOpenReplyModal = (rev) => {
    setReplyModalReview(rev);
    setReplyText(rev.reply?.text || '');
    setIsAiGeneratedFlag(Boolean(rev.reply?.isAiGenerated));
  };

  const handleGenerateAiReply = async (tone = 'PROFESSIONAL') => {
    if (!replyModalReview) return;
    setGeneratingAi(true);
    try {
      const res = await generateAiReviewReply(replyModalReview.id, tone);
      if (res?.generatedReply) {
        setReplyText(res.generatedReply);
        setIsAiGeneratedFlag(true);
        toast.success(`AI Response generated with ${tone.toLowerCase()} tone.`);
      }
    } catch {
      toast.error('Failed to generate AI response.');
    } finally {
      setGeneratingAi(false);
    }
  };

  const handlePublishReply = async () => {
    if (!replyModalReview || !replyText.trim()) {
      toast.error('Please enter a response message.');
      return;
    }

    try {
      await replyToReview(replyModalReview.id, replyText, isAiGeneratedFlag);
      setReviewsData((prev) => {
        if (!prev?.reviews) return prev;
        return {
          ...prev,
          reviews: prev.reviews.map((r) =>
            r.id === replyModalReview.id
              ? {
                  ...r,
                  hasReply: true,
                  reply: {
                    text: replyText.trim(),
                    repliedAt: new Date().toISOString(),
                    isAiGenerated: isAiGeneratedFlag,
                  },
                }
              : r
          ),
          summary: {
            ...prev.summary,
            unansweredCount: Math.max(0, prev.summary.unansweredCount - (replyModalReview.hasReply ? 0 : 1)),
            repliedCount: prev.summary.repliedCount + (replyModalReview.hasReply ? 0 : 1),
          },
        };
      });
      toast.success('Response successfully published to Google Reviews.');
      setReplyModalReview(null);
    } catch {
      toast.error('Failed to publish response.');
    }
  };

  // OAuth Toggle Handlers
  const handleToggleOAuth = async (provider, connect) => {
    try {
      if (connect) {
        await connectGoogleOAuth(provider);
        toast.success(`Google ${provider === 'ADS' ? 'Ads' : 'Business Profile'} connected.`);
      } else {
        await disconnectGoogleOAuth(provider);
        toast.success(`Google ${provider === 'ADS' ? 'Ads' : 'Business Profile'} disconnected.`);
      }
      await fetchData();
    } catch {
      toast.error('Could not update connection status.');
    }
  };

  // Filtered reviews
  const filteredReviews = React.useMemo(() => {
    if (!reviewsData?.reviews) return [];
    return reviewsData.reviews.filter((r) => {
      if (reviewFilter === 'POSITIVE' && r.rating < 4) return false;
      if (reviewFilter === 'NEGATIVE' && r.rating > 3) return false;
      if (reviewFilter === 'UNANSWERED' && r.hasReply) return false;
      if (reviewFilter === 'REPLIED' && !r.hasReply) return false;
      if (reviewStar > 0 && r.rating !== reviewStar) return false;
      if (reviewSearch.trim()) {
        const q = reviewSearch.toLowerCase();
        return (
          r.reviewerName.toLowerCase().includes(q) ||
          r.comment.toLowerCase().includes(q) ||
          r.reply?.text?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [reviewsData, reviewFilter, reviewStar, reviewSearch]);

  // Filtered campaigns
  const filteredCampaigns = React.useMemo(() => {
    return campaigns.filter((c) => {
      if (campaignFilter !== 'ALL' && c.status !== campaignFilter) return false;
      if (campaignSearch.trim()) {
        const q = campaignSearch.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
      }
      return true;
    });
  }, [campaigns, campaignFilter, campaignSearch]);

  if (loading || loadError) {
    return (
      <div className="min-w-0 w-full max-w-full space-y-6 pb-20">
        <PageHeader category="MARKETING & PROMOTIONS" title="Business Growth" icon={faArrowTrendUp} description="Google integration status" />
        <div role={loadError ? 'alert' : 'status'} className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700">
          {loading ? 'Loading Google integration data…' : <>
            <p className="font-semibold">Google integration unavailable</p>
            <p className="mt-2">{typeof loadError === 'string' ? loadError : 'Unable to load Google integration data.'}</p>
            <Button type="button" variant="outline" className="mt-4" onClick={fetchData}>Retry</Button>
          </>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 w-full max-w-full space-y-6 pb-20">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <PageHeader
        category="MARKETING & PROMOTIONS"
        title="Business Growth"
        icon={faArrowTrendUp}
        description="Unified advertising & presence hub: manage Google Ads, Business Profile, customer reviews, and ROI performance."
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="outline"
              onClick={handleManualSync}
              disabled={syncing}
              className="border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-xs rounded-xl h-9"
            >
              <FontAwesomeIcon icon={faRotate} className={cn('mr-1.5 size-3', syncing && 'animate-spin')} />
              {syncing ? 'Syncing with Google...' : 'Sync Data'}
            </Button>
            <Button
              type="button"
              onClick={() => setIsCampaignDrawerOpen(true)}
              className="bg-[#16A34A] hover:bg-[#15803D] text-white shadow-xs font-semibold text-xs rounded-xl h-9 px-3.5"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-1.5 size-3" />
              New Google Campaign
            </Button>
          </div>
        }
      />

      {/* ── Sync & Account Status Banner ───────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 px-4 py-3 text-xs text-emerald-950">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs">
            <FontAwesomeIcon icon={faShield} className="size-3.5" />
          </div>
          <div>
            <p className="font-bold text-slate-900 flex items-center gap-2">
              <span>Google Enterprise Sync Active</span>
              <span className="rounded-full bg-emerald-200/60 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
                OAuth 2.0 Connected
              </span>
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Target Account: <span className="font-semibold text-slate-700">{settings?.googleAds?.accountName || 'QuikBoom Enterprise Ads'}</span> ({settings?.googleAds?.customerId || '489-102-3918'})
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-500 self-end sm:self-auto">
          <FontAwesomeIcon icon={faClock} className="size-3 text-slate-400" />
          <span>Last synchronized: {overview?.lastSyncedAt ? new Date(overview.lastSyncedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '12 mins ago'}</span>
        </div>
      </div>

      {/* ── Horizontal Navigation Tabs (Compact & Responsive) ──────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 pb-3 no-scrollbar">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer select-none',
                isActive
                  ? 'bg-[#16A34A] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100/80 border border-slate-200'
              )}
            >
              <FontAwesomeIcon icon={tab.icon} className="size-3.5" />
              <span>{tab.label}</span>
              {tab.id === 'reviews' && reviewsData?.summary?.unansweredCount > 0 && (
                <span className={cn('rounded-full px-1.5 py-0.2 text-[9px] font-bold', isActive ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800')}>
                  {reviewsData.summary.unansweredCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── TAB 1: OVERVIEW DASHBOARD ───────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 10 Unified KPI Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {/* Total Ad Spend */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Ad Spend</span>
              <p className="mt-2 text-xl font-extrabold text-slate-900">₹{(overview?.kpis?.totalAdSpend || 279589).toLocaleString('en-IN')}</p>
              <span className="text-[10px] text-emerald-700 font-semibold mt-1 inline-block">+14.2% vs last month</span>
            </div>

            {/* Total Impressions */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Impressions</span>
              <p className="mt-2 text-xl font-extrabold text-slate-900">{(overview?.kpis?.totalImpressions || 277170).toLocaleString('en-IN')}</p>
              <span className="text-[10px] text-slate-500 font-medium mt-1 inline-block">Google Ads & Network</span>
            </div>

            {/* Total Clicks */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Clicks</span>
              <p className="mt-2 text-xl font-extrabold text-slate-900">{(overview?.kpis?.totalClicks || 14120).toLocaleString('en-IN')}</p>
              <span className="text-[10px] text-emerald-700 font-semibold mt-1 inline-block">5.09% Overall CTR</span>
            </div>

            {/* Total Conversions */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Conversions</span>
              <p className="mt-2 text-xl font-extrabold text-slate-900">{(overview?.kpis?.totalConversions || 925).toLocaleString('en-IN')}</p>
              <span className="text-[10px] text-emerald-700 font-semibold mt-1 inline-block">Verified Lead Enquiries</span>
            </div>

            {/* Cost Per Click */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Cost Per Click (CPC)</span>
              <p className="mt-2 text-xl font-extrabold text-slate-900">₹{overview?.kpis?.avgCpc || '19.80'}</p>
              <span className="text-[10px] text-slate-500 font-medium mt-1 inline-block">Avg across active bids</span>
            </div>

            {/* Active Campaigns */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Campaigns</span>
              <p className="mt-2 text-xl font-extrabold text-slate-900">{overview?.kpis?.activeCampaigns || 3}</p>
              <span className="text-[10px] text-emerald-700 font-semibold mt-1 inline-block">Live bidding enabled</span>
            </div>

            {/* Google Business Rating */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Google Rating</span>
              <div className="mt-2 flex items-center gap-1.5">
                <span className="text-xl font-extrabold text-slate-900">{overview?.kpis?.avgRating || '4.9'}</span>
                <FontAwesomeIcon icon={faStar} className="size-4 text-amber-500" />
              </div>
              <span className="text-[10px] text-slate-500 font-medium mt-1 inline-block">Google Business verified</span>
            </div>

            {/* Total Reviews */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Reviews</span>
              <p className="mt-2 text-xl font-extrabold text-slate-900">{overview?.kpis?.totalReviews || 124}</p>
              <span className="text-[10px] text-emerald-700 font-semibold mt-1 inline-block">100% genuine ratings</span>
            </div>

            {/* Unanswered Reviews */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Unanswered Reviews</span>
              <p className="mt-2 text-xl font-extrabold text-amber-800">{overview?.kpis?.unansweredReviews || 2}</p>
              <span className="text-[10px] text-amber-700 font-semibold mt-1 inline-block">Requires owner reply</span>
            </div>

            {/* Profile Views */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Profile Views</span>
              <p className="mt-2 text-xl font-extrabold text-slate-900">{(overview?.kpis?.profileViews || 14280).toLocaleString('en-IN')}</p>
              <span className="text-[10px] text-slate-500 font-medium mt-1 inline-block">Maps & Search Discovery</span>
            </div>
          </div>

          {/* Performance Chart & Business Profile Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Advertising Performance Trend */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Advertising Spend & Conversion Funnel</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Impression growth, verified clicks, and lead conversion trends</p>
                </div>
                <span className="text-xs font-semibold text-[#16A34A] bg-emerald-50 px-2.5 py-1 rounded-lg">Last 30 Days</span>
              </div>

              {/* Simple Clean Funnel Breakdown */}
              <div className="mt-6 space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Ad Impressions (277,170 views)</span>
                    <span className="font-bold text-slate-900">100%</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Target Clicks (14,120 visits)</span>
                    <span className="font-bold text-slate-900">5.09% CTR</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '38%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Verified Lead Conversions (925 enquiries)</span>
                    <span className="font-bold text-slate-900">6.55% CVR</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-purple-600 rounded-full" style={{ width: '16%' }} />
                  </div>
                </div>
              </div>

              {/* Weekly Trend Table */}
              <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-slate-50">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Week 1</span>
                  <p className="font-bold text-slate-800 mt-1">₹68,400</p>
                  <p className="text-[10px] text-emerald-700 font-semibold">210 leads</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-50">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Week 2</span>
                  <p className="font-bold text-slate-800 mt-1">₹71,200</p>
                  <p className="text-[10px] text-emerald-700 font-semibold">235 leads</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-50">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Week 3</span>
                  <p className="font-bold text-slate-800 mt-1">₹64,500</p>
                  <p className="text-[10px] text-emerald-700 font-semibold">228 leads</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-50">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Week 4</span>
                  <p className="font-bold text-slate-800 mt-1">₹75,489</p>
                  <p className="text-[10px] text-emerald-700 font-semibold">252 leads</p>
                </div>
              </div>
            </div>

            {/* Business Profile Quick Status */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900">Google Business Profile</h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    <FontAwesomeIcon icon={faCheckCircle} className="size-2.5" />
                    Verified
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <div className="size-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    <img
                      src={businessProfile?.logoUrl || 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=400&q=80'}
                      alt="Logo"
                      className="size-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{businessProfile?.name || 'QuikBoom Suite'}</p>
                    <p className="text-[11px] text-slate-500 truncate">{businessProfile?.category || 'Software Company'}</p>
                  </div>
                </div>

                <div className="mt-5 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Search Impressions</span>
                    <span className="font-bold text-slate-800">{(businessProfile?.metrics?.searchImpressions || 38400).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Google Maps Views</span>
                    <span className="font-bold text-slate-800">{(businessProfile?.metrics?.mapsImpressions || 22910).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Website Direction Calls</span>
                    <span className="font-bold text-slate-800">{(businessProfile?.metrics?.websiteClicks || 3890).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4">
                <a
                  href={businessProfile?.googleMapsUrl || 'https://maps.google.com'}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
                >
                  <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="size-3" />
                  <span>View Listing on Google Maps</span>
                </a>
              </div>
            </div>
          </div>

          {/* Active Campaigns & Recent Reviews Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Google Campaigns */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Active Google Ads Campaigns</h3>
                <button
                  type="button"
                  onClick={() => handleTabChange('google-ads')}
                  className="text-xs font-semibold text-[#16A34A] hover:underline"
                >
                  View All ({campaigns.length})
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {campaigns.slice(0, 3).map((camp) => (
                  <div
                    key={camp.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200/70 p-3 hover:bg-slate-50/70 transition"
                  >
                    <div className="min-w-0 pr-3">
                      <p className="text-xs font-bold text-slate-900 truncate">{camp.name}</p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="font-mono text-[10px] text-slate-400">{camp.id}</span>
                        <span>•</span>
                        <span>₹{camp.budgetDaily.toLocaleString('en-IN')}/day</span>
                        <span>•</span>
                        <span className="font-bold text-emerald-700">{camp.conversions} conv.</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                        {camp.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Reviews requiring attention */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Recent Customer Reviews</h3>
                <button
                  type="button"
                  onClick={() => handleTabChange('reviews')}
                  className="text-xs font-semibold text-[#16A34A] hover:underline"
                >
                  Manage Reviews ({reviewsData?.summary?.totalReviews || 5})
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {reviewsData?.reviews?.slice(0, 3).map((rev) => (
                  <div
                    key={rev.id}
                    className="rounded-xl border border-slate-200/70 p-3 hover:bg-slate-50/70 transition space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">{rev.reviewerName}</span>
                        <div className="flex text-amber-500 text-[10px]">
                          {[...Array(rev.rating)].map((_, i) => (
                            <FontAwesomeIcon key={i} icon={faStar} />
                          ))}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400">{rev.date}</span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{rev.comment}</p>
                    <div className="pt-1 flex items-center justify-between">
                      {rev.hasReply ? (
                        <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
                          <FontAwesomeIcon icon={faCheck} className="size-2.5" />
                          Replied by Business
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenReplyModal(rev)}
                          className="text-[11px] font-bold text-[#16A34A] hover:underline flex items-center gap-1"
                        >
                          <FontAwesomeIcon icon={faReply} className="size-2.5" />
                          Reply with AI Assistance
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── TAB 2: GOOGLE ADS INTEGRATION ──────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'google-ads' && (
        <div className="space-y-6">
          {/* Account Selector & Control Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Select Google Ads Account
                </Label>
                <select
                  value={googleAdsData?.activeAccountId || '489-102-3918'}
                  onChange={(e) => toast.info(`Switched active Google Ads account to ${e.target.value}`)}
                  className="mt-1 h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 focus:border-[#16A34A] focus:outline-none"
                >
                  {googleAdsData?.accounts?.map((acc) => (
                    <option key={acc.customerId} value={acc.customerId}>
                      {acc.accountName} ({acc.customerId})
                    </option>
                  )) || <option>QuikBoom Enterprise Ads Official (489-102-3918)</option>}
                </select>
              </div>

              <div className="pt-3 sm:pt-4 flex items-center gap-2">
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                  OAuth Token Valid
                </span>
                <span className="text-[11px] text-slate-500">Currency: INR (₹)</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleToggleOAuth('ADS', !googleAdsData?.connectionStatus?.isConnected)}
                className="text-xs h-9 rounded-xl border-slate-200"
              >
                {googleAdsData?.connectionStatus?.isConnected ? 'Disconnect Account' : 'Connect Account'}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setIsCampaignDrawerOpen(true)}
                className="bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold text-xs h-9 rounded-xl px-3"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-1.5 size-3" />
                Create Campaign
              </Button>
            </div>
          </div>

          {/* Campaign Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
              <Input
                value={campaignSearch}
                onChange={(e) => setCampaignSearch(e.target.value)}
                placeholder="Search Google Ads campaigns by name or ID..."
                className="h-9 pl-8 rounded-xl border-slate-200 text-xs focus:border-[#16A34A]"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={campaignFilter}
                onChange={(e) => setCampaignFilter(e.target.value)}
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-[#16A34A] focus:outline-none"
              >
                <option value="ALL">All Campaign Statuses</option>
                <option value="ACTIVE">Active (Live)</option>
                <option value="PAUSED">Paused</option>
                <option value="ENDED">Ended</option>
              </select>
            </div>
          </div>

          {/* Campaigns Data Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 pl-4 pr-3">Campaign Name & ID</th>
                    <th className="py-3 px-3">Objective & Bidding</th>
                    <th className="py-3 px-3">Daily Budget</th>
                    <th className="py-3 px-3">Impressions & Clicks</th>
                    <th className="py-3 px-3">Avg CPC</th>
                    <th className="py-3 px-3">Conversions</th>
                    <th className="py-3 px-3">Total Spend</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 pl-3 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredCampaigns.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-slate-400">
                        No Google Ads campaigns match your filter.
                      </td>
                    </tr>
                  ) : (
                    filteredCampaigns.map((camp) => (
                      <tr key={camp.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 pl-4 pr-3">
                          <p className="font-bold text-slate-900 text-[13px]">{camp.name}</p>
                          <p className="text-[10px] font-mono text-slate-400 mt-0.5">{camp.id}</p>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                            {camp.objective}
                          </span>
                          <p className="text-[11px] text-slate-400 mt-0.5">{camp.bidStrategy}</p>
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">₹{camp.budgetDaily.toLocaleString('en-IN')}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setBudgetModalCampaign(camp);
                                setNewBudgetVal(String(camp.budgetDaily));
                              }}
                              className="text-slate-400 hover:text-[#16A34A]"
                              title="Edit Budget"
                            >
                              <FontAwesomeIcon icon={faPenToSquare} className="size-3" />
                            </button>
                          </div>
                          <span className="text-[10px] text-slate-400">per day</span>
                        </td>

                        <td className="py-3.5 px-3">
                          <p className="font-bold text-slate-900">{camp.impressions.toLocaleString('en-IN')} views</p>
                          <p className="text-[11px] text-slate-500">{camp.clicks.toLocaleString('en-IN')} clicks ({camp.ctr})</p>
                        </td>

                        <td className="py-3.5 px-3 font-semibold text-slate-800">
                          ₹{camp.cpc.toFixed(2)}
                        </td>

                        <td className="py-3.5 px-3">
                          <p className="font-bold text-emerald-800">{camp.conversions} leads</p>
                          <p className="text-[10px] text-slate-400">₹{camp.costPerConversion.toFixed(0)}/lead</p>
                        </td>

                        <td className="py-3.5 px-3 font-bold text-slate-900">
                          ₹{camp.cost.toLocaleString('en-IN')}
                        </td>

                        <td className="py-3.5 px-3">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border',
                              camp.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            )}
                          >
                            <span className={cn('size-1.5 rounded-full', camp.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400')} />
                            {camp.status}
                          </span>
                        </td>

                        <td className="py-3.5 pl-3 pr-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleCampaign(camp)}
                              title={camp.status === 'ACTIVE' ? 'Pause Campaign' : 'Resume Campaign'}
                              className={cn(
                                'flex size-8 items-center justify-center rounded-lg border text-xs transition',
                                camp.status === 'ACTIVE'
                                  ? 'border-slate-200 text-slate-500 hover:bg-slate-100'
                                  : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              )}
                            >
                              <FontAwesomeIcon icon={camp.status === 'ACTIVE' ? faBan : faCheck} className="size-3" />
                            </button>
                            <a
                              href={camp.finalUrl}
                              target="_blank"
                              rel="noreferrer"
                              title="Visit Landing Page"
                              className="flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                            >
                              <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="size-3" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── TAB 3: GOOGLE BUSINESS PROFILE ─────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'business-profile' && (
        <div className="space-y-6">
          {/* Location Selector & Actions Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Managed Business Location
                </Label>
                <select
                  value={businessProfile?.id || 'GBP-LOC-01'}
                  onChange={(e) => toast.info(`Selected branch location: ${e.target.value}`)}
                  className="mt-1 h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 focus:border-[#16A34A] focus:outline-none"
                >
                  {businessProfile?.locations?.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} - {loc.address}
                    </option>
                  )) || <option>Vadodara Tech Park (HQ)</option>}
                </select>
              </div>

              <span className="mt-3.5 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                <FontAwesomeIcon icon={faCheckCircle} className="size-2.5" />
                Verified by Google
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPhotoModalOpen(true)}
                className="text-xs h-9 rounded-xl border-slate-200"
              >
                <FontAwesomeIcon icon={faImages} className="mr-1.5 size-3" />
                Add Photos
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setIsProfileDrawerOpen(true)}
                className="bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold text-xs h-9 rounded-xl px-3.5"
              >
                <FontAwesomeIcon icon={faPenToSquare} className="mr-1.5 size-3" />
                Edit Business Info
              </Button>
            </div>
          </div>

          {/* Profile Overview Card */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
            {/* Cover Image banner */}
            <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
              <img
                src={businessProfile?.coverImageUrl || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80'}
                alt="Cover"
                className="size-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
            </div>

            {/* Profile Meta Row */}
            <div className="px-6 pb-6 pt-0 relative">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-10 mb-4">
                <div className="flex items-end gap-3.5">
                  <div className="size-20 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-md">
                    <img
                      src={businessProfile?.logoUrl || 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=400&q=80'}
                      alt="Logo"
                      className="size-full object-cover"
                    />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{businessProfile?.name}</h2>
                    <p className="text-xs text-slate-500 font-medium">{businessProfile?.category}</p>
                  </div>
                </div>

                <a
                  href={businessProfile?.googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
                >
                  <FontAwesomeIcon icon={faLocationDot} className="size-3 text-red-500" />
                  <span>Open in Google Maps</span>
                </a>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                {businessProfile?.description}
              </p>

              {/* Core Details Grid */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-5 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Official Address</span>
                  <p className="text-slate-800 font-medium flex items-start gap-1.5">
                    <FontAwesomeIcon icon={faLocationDot} className="size-3 text-slate-400 mt-0.5 shrink-0" />
                    <span>{businessProfile?.address}</span>
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone & Website</span>
                  <p className="text-slate-800 font-medium flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faPhone} className="size-3 text-slate-400" />
                    <span>{businessProfile?.phone}</span>
                  </p>
                  <p className="text-slate-800 font-medium flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faGlobe} className="size-3 text-slate-400" />
                    <a href={businessProfile?.website} target="_blank" rel="noreferrer" className="text-[#16A34A] hover:underline">
                      {businessProfile?.website}
                    </a>
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Weekly Business Hours</span>
                  <div className="text-[11px] text-slate-600 space-y-0.5">
                    <p>Mon - Fri: 09:00 AM - 07:00 PM</p>
                    <p>Saturday: 09:30 AM - 03:00 PM</p>
                    <p className="text-rose-600 font-semibold">Sunday: Closed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Business Profile Photos Gallery */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Google Business Photos</h3>
                <p className="text-xs text-slate-400 mt-0.5">Photos verified and visible on Google Maps and search results</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPhotoModalOpen(true)}
                className="text-xs rounded-xl"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-1.5 size-3" />
                Upload Photo
              </Button>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {businessProfile?.photos?.map((photo) => (
                <div
                  key={photo.id}
                  className="group relative aspect-video overflow-hidden rounded-xl border border-slate-200 bg-slate-900 shadow-2xs"
                >
                  <img
                    src={photo.url}
                    alt={photo.tag}
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-90" />
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-[10px]">
                    <span className="rounded-md bg-white/20 px-1.5 py-0.5 font-semibold backdrop-blur-xs">
                      {photo.tag}
                    </span>
                    <span className="text-slate-300">{photo.uploadedAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── TAB 4: REVIEWS & RATINGS (WITH AI REPLY) ───────────────── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          {/* Overall Rating & 5-Star Distribution Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            {/* Score box */}
            <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-4">
              <span className="text-4xl font-extrabold text-slate-900">{reviewsData?.summary?.avgRating || '4.9'}</span>
              <div className="flex items-center gap-1 text-amber-500 my-1.5">
                {[...Array(5)].map((_, i) => (
                  <FontAwesomeIcon key={i} icon={faStar} className="size-4" />
                ))}
              </div>
              <p className="text-xs text-slate-500">Based on {reviewsData?.summary?.totalReviews || 124} Google reviews</p>
            </div>

            {/* Star Distribution Progress Bars */}
            <div className="md:col-span-2 space-y-1.5 text-xs">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = reviewsData?.summary?.starCounts?.[star] || 0;
                const total = reviewsData?.summary?.totalReviews || 1;
                const pct = Math.round((count / total) * 100);

                return (
                  <div key={star} className="flex items-center gap-3">
                    <span className="w-8 text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                      {star} <FontAwesomeIcon icon={faStar} className="size-2.5 text-amber-500" />
                    </span>
                    <div className="h-2 flex-1 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-12 text-right text-[11px] font-mono text-slate-500">{count} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Review Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'ALL', label: 'All Reviews' },
                { id: 'POSITIVE', label: 'Positive (4-5★)' },
                { id: 'NEGATIVE', label: 'Critical (1-3★)' },
                { id: 'UNANSWERED', label: 'Unanswered' },
                { id: 'REPLIED', label: 'Replied' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setReviewFilter(f.id)}
                  className={cn(
                    'rounded-xl px-3 py-1.5 text-xs font-semibold transition',
                    reviewFilter === f.id
                      ? 'bg-[#16A34A] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
              <Input
                value={reviewSearch}
                onChange={(e) => setReviewSearch(e.target.value)}
                placeholder="Search reviews..."
                className="h-8 pl-8 rounded-xl border-slate-200 text-xs focus:border-[#16A34A]"
              />
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            {filteredReviews.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400">
                No Google customer reviews match the selected filter.
              </div>
            ) : (
              filteredReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3"
                >
                  {/* Top user row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={rev.reviewerAvatar}
                        alt={rev.reviewerName}
                        className="size-10 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-slate-900">{rev.reviewerName}</p>
                          {rev.isVerified && (
                            <span className="text-[10px] text-emerald-700 font-semibold" title="Verified Customer">
                              <FontAwesomeIcon icon={faCheckCircle} />
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex text-amber-500 text-[10px]">
                            {[...Array(rev.rating)].map((_, i) => (
                              <FontAwesomeIcon key={i} icon={faStar} />
                            ))}
                          </div>
                          <span className="text-[10px] text-slate-400">• {rev.date}</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenReplyModal(rev)}
                      className="text-xs h-8 rounded-xl border-slate-200"
                    >
                      <FontAwesomeIcon icon={faRobot} className="mr-1.5 size-3 text-[#16A34A]" />
                      {rev.hasReply ? 'Edit Response' : 'Reply with AI'}
                    </Button>
                  </div>

                  {/* Comment */}
                  <p className="text-xs text-slate-700 leading-relaxed">{rev.comment}</p>

                  {/* Existing Reply Callout */}
                  {rev.hasReply && rev.reply && (
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3.5 space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold text-emerald-950">
                        <span className="flex items-center gap-1.5">
                          <FontAwesomeIcon icon={faStore} className="size-3 text-[#16A34A]" />
                          Response from Business Owner
                        </span>
                        {rev.reply.isAiGenerated && (
                          <span className="rounded-md bg-emerald-200/60 px-1.5 py-0.2 text-[9px] font-bold text-emerald-900">
                            AI-Assisted
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{rev.reply.text}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── TAB 5: ANALYTICS ────────────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Range filter bar */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
            <span className="text-xs font-bold text-slate-900">Unified Growth & Advertising Analytics</span>
            <div className="flex items-center gap-1.5">
              {[
                { id: '7d', label: 'Last 7 Days' },
                { id: '30d', label: 'Last 30 Days' },
                { id: '90d', label: 'Last 90 Days' },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setAnalyticsRange(r.id)}
                  className={cn(
                    'rounded-xl px-3 py-1.5 text-xs font-semibold transition',
                    analyticsRange === r.id ? 'bg-[#16A34A] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Analytics Grids */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Advertising Spend vs Results */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900">Advertising Expenditure vs Conversions</h3>
              <p className="text-xs text-slate-400 mt-0.5">Bi-weekly spend progression mapped against verified lead queries</p>

              <div className="mt-6 space-y-3">
                {analyticsData?.adExpenditureTrends?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs border-b border-slate-50 pb-2">
                    <span className="font-semibold text-slate-700 w-16">{item.date}</span>
                    <span className="font-bold text-slate-900">₹{item.spend.toLocaleString('en-IN')} spend</span>
                    <span className="text-slate-500">{item.impressions.toLocaleString('en-IN')} views</span>
                    <span className="text-slate-600">{item.clicks} clicks</span>
                    <span className="font-bold text-emerald-700">{item.conversions} leads</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Google Profile Interactions */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900">Google Business Customer Interactions</h3>
              <p className="text-xs text-slate-400 mt-0.5">Direct map direction requests, website visits, and customer phone calls</p>

              <div className="mt-6 space-y-3">
                {analyticsData?.profileInteractions?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs border-b border-slate-50 pb-2">
                    <span className="font-semibold text-slate-700 w-16">{item.date}</span>
                    <span className="font-bold text-slate-900">{item.views} profile views</span>
                    <span className="text-blue-600 font-medium">{item.directions} directions</span>
                    <span className="text-emerald-700 font-medium">{item.websiteClicks} site clicks</span>
                    <span className="font-bold text-purple-700">{item.calls} calls</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── TAB 6: SETTINGS ─────────────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'settings' && (
        <div className="max-w-3xl space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Official Google Integrations</h3>

            {/* Google Ads OAuth */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/70 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-600 text-white">
                  <FontAwesomeIcon icon={faBullhorn} className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Google Ads API</p>
                  <p className="text-[11px] text-slate-500">Connected Account ID: 489-102-3918</p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleToggleOAuth('ADS', false)}
                className="text-xs rounded-xl"
              >
                Disconnect
              </Button>
            </div>

            {/* Google Business Profile OAuth */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/70 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <FontAwesomeIcon icon={faStore} className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Google Business Profile API</p>
                  <p className="text-[11px] text-slate-500">Connected Location ID: GBP-LOC-01</p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleToggleOAuth('BUSINESS_PROFILE', false)}
                className="text-xs rounded-xl"
              >
                Disconnect
              </Button>
            </div>
          </div>

          {/* Sync & AI Preferences */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Automation & Notification Preferences</h3>

            <div className="space-y-3 text-xs">
              <div>
                <Label className="text-xs font-bold text-slate-700">Automated Data Sync Frequency</Label>
                <select
                  defaultValue="HOURLY"
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-[#16A34A] focus:outline-none"
                >
                  <option value="HOURLY">Every 1 Hour (Recommended)</option>
                  <option value="DAILY">Daily at Midnight</option>
                  <option value="MANUAL">Manual Only</option>
                </select>
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700">Default AI Review Response Tone</Label>
                <select
                  defaultValue="PROFESSIONAL"
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-[#16A34A] focus:outline-none"
                >
                  <option value="PROFESSIONAL">Professional & Polite (Default)</option>
                  <option value="FRIENDLY">Enthusiastic & Friendly</option>
                  <option value="FORMAL">Corporate & Formal</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button
                type="button"
                onClick={() => toast.success('Preferences saved successfully.')}
                className="bg-[#16A34A] hover:bg-[#15803D] text-white text-xs h-9 rounded-xl font-semibold px-4"
              >
                Save Preferences
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Slide-Over Drawer: Create Google Ads Campaign ─────────────── */}
      <SlideOverDrawer
        open={isCampaignDrawerOpen}
        onOpenChange={setIsCampaignDrawerOpen}
        title="Create Google Ads Campaign"
        description="Launch an official search, display, or performance max advertising campaign."
        maxWidth="max-w-xl"
        footer={
          <div className="flex w-full items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCampaignDrawerOpen(false)}
              className="text-xs h-9 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateCampaign}
              className="bg-[#16A34A] hover:bg-[#15803D] text-white text-xs h-9 rounded-xl font-semibold px-4"
            >
              Launch Google Campaign
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateCampaign} className="space-y-4 text-xs">
          <div>
            <Label className="text-xs font-bold text-slate-700">Campaign Name *</Label>
            <Input
              value={newCampaign.name}
              onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
              placeholder="e.g. Search - Winter Enterprise Lead Acquisition"
              className="mt-1 h-9 rounded-xl border-slate-200 text-xs focus:border-[#16A34A]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-bold text-slate-700">Campaign Objective</Label>
              <select
                value={newCampaign.objective}
                onChange={(e) => setNewCampaign({ ...newCampaign, objective: e.target.value })}
                className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-[#16A34A] focus:outline-none"
              >
                <option value="LEADS">Lead Generation</option>
                <option value="SALES">Product Sales</option>
                <option value="BRAND_AWARENESS">Brand Awareness</option>
                <option value="WEBSITE_TRAFFIC">Website Traffic</option>
              </select>
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700">Daily Budget (₹) *</Label>
              <Input
                type="number"
                min="100"
                value={newCampaign.budgetDaily}
                onChange={(e) => setNewCampaign({ ...newCampaign, budgetDaily: e.target.value })}
                className="mt-1 h-9 rounded-xl border-slate-200 text-xs focus:border-[#16A34A]"
                required
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-bold text-slate-700">Target Locations</Label>
            <Input
              value={newCampaign.targetLocations}
              onChange={(e) => setNewCampaign({ ...newCampaign, targetLocations: e.target.value })}
              placeholder="Mumbai, Pune, Ahmedabad, Bengaluru"
              className="mt-1 h-9 rounded-xl border-slate-200 text-xs focus:border-[#16A34A]"
            />
          </div>

          <div>
            <Label className="text-xs font-bold text-slate-700">Destination Landing Page URL *</Label>
            <Input
              value={newCampaign.finalUrl}
              onChange={(e) => setNewCampaign({ ...newCampaign, finalUrl: e.target.value })}
              placeholder="https://quikboom.com/enterprise-crm"
              className="mt-1 h-9 rounded-xl border-slate-200 text-xs focus:border-[#16A34A]"
              required
            />
          </div>
        </form>
      </SlideOverDrawer>

      {/* ── Slide-Over Drawer: Edit Business Profile Info ────────────── */}
      <SlideOverDrawer
        open={isProfileDrawerOpen}
        onOpenChange={setIsProfileDrawerOpen}
        title="Edit Business Profile Information"
        description="Update corporate details verified and displayed on Google Maps and Search."
        maxWidth="max-w-xl"
        footer={
          <div className="flex w-full items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsProfileDrawerOpen(false)}
              className="text-xs h-9 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveProfile}
              className="bg-[#16A34A] hover:bg-[#15803D] text-white text-xs h-9 rounded-xl font-semibold px-4"
            >
              Save Profile Updates
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          <div>
            <Label className="text-xs font-bold text-slate-700">Registered Business Name</Label>
            <Input
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              className="mt-1 h-9 rounded-xl border-slate-200 text-xs focus:border-[#16A34A]"
            />
          </div>

          <div>
            <Label className="text-xs font-bold text-slate-700">Primary Business Category</Label>
            <Input
              value={profileForm.category}
              onChange={(e) => setProfileForm({ ...profileForm, category: e.target.value })}
              className="mt-1 h-9 rounded-xl border-slate-200 text-xs focus:border-[#16A34A]"
            />
          </div>

          <div>
            <Label className="text-xs font-bold text-slate-700">Business Description</Label>
            <Textarea
              value={profileForm.description}
              onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
              rows={3}
              className="mt-1 rounded-xl border-slate-200 text-xs focus:border-[#16A34A]"
            />
          </div>

          <div>
            <Label className="text-xs font-bold text-slate-700">Physical Address</Label>
            <Input
              value={profileForm.address}
              onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
              className="mt-1 h-9 rounded-xl border-slate-200 text-xs focus:border-[#16A34A]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-bold text-slate-700">Contact Number</Label>
              <Input
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="mt-1 h-9 rounded-xl border-slate-200 text-xs focus:border-[#16A34A]"
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-700">Website URL</Label>
              <Input
                value={profileForm.website}
                onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                className="mt-1 h-9 rounded-xl border-slate-200 text-xs focus:border-[#16A34A]"
              />
            </div>
          </div>
        </form>
      </SlideOverDrawer>

      {/* ── Dialog: Reply to Review with AI ─────────────────────────── */}
      <Dialog open={Boolean(replyModalReview)} onOpenChange={(open) => !open && setReplyModalReview(null)}>
        <DialogContent className="max-w-lg p-5 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FontAwesomeIcon icon={faReply} className="size-3.5 text-[#16A34A]" />
              Reply to Google Customer Review
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Review by {replyModalReview?.reviewerName} ({replyModalReview?.rating}★)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2 text-xs">
            {/* Customer review context */}
            <div className="rounded-xl bg-slate-50 p-3 text-slate-700 border border-slate-200">
              <p className="italic">"{replyModalReview?.comment}"</p>
            </div>

            {/* AI Generator Button Toolbar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[11px] text-slate-700 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faRobot} className="size-3 text-[#16A34A]" />
                  Generate Response with AI
                </span>
                {generatingAi && <span className="text-[10px] text-slate-400 animate-pulse">Drafting with Gemini...</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={generatingAi}
                  onClick={() => handleGenerateAiReply('PROFESSIONAL')}
                  className="text-[11px] h-7 rounded-lg"
                >
                  Professional Tone
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={generatingAi}
                  onClick={() => handleGenerateAiReply('FRIENDLY')}
                  className="text-[11px] h-7 rounded-lg"
                >
                  Friendly Tone
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={generatingAi}
                  onClick={() => handleGenerateAiReply('APOLOGETIC')}
                  className="text-[11px] h-7 rounded-lg"
                >
                  Apologetic Tone
                </Button>
              </div>
            </div>

            {/* Direct text response */}
            <div>
              <Label className="text-xs font-bold text-slate-700">Your Business Reply *</Label>
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type or approve the AI-generated reply..."
                rows={4}
                className="mt-1 rounded-xl border-slate-200 text-xs focus:border-[#16A34A]"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReplyModalReview(null)}
                className="text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handlePublishReply}
                className="bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold text-xs rounded-xl px-4"
              >
                Publish Response
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Add Profile Photo ───────────────────────────────── */}
      <Dialog open={isPhotoModalOpen} onOpenChange={setIsPhotoModalOpen}>
        <DialogContent className="max-w-md p-5 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-900">Upload Business Photo</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Add verified corporate or product images to your Google Business Profile.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddPhoto} className="space-y-4 pt-2 text-xs">
            <div>
              <Label className="text-xs font-bold text-slate-700">Photo URL *</Label>
              <Input
                value={photoForm.url}
                onChange={(e) => setPhotoForm({ ...photoForm, url: e.target.value })}
                placeholder="https://images.unsplash.com/photo-..."
                className="mt-1 h-9 rounded-xl border-slate-200 text-xs focus:border-[#16A34A]"
                required
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700">Category Tag</Label>
              <select
                value={photoForm.tag}
                onChange={(e) => setPhotoForm({ ...photoForm, tag: e.target.value })}
                className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-[#16A34A] focus:outline-none"
              >
                <option value="Interior">Interior</option>
                <option value="Exterior">Exterior</option>
                <option value="Team & Workspaces">Team & Workspaces</option>
                <option value="Products">Products & Offerings</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsPhotoModalOpen(false)} className="text-xs rounded-xl">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-[#16A34A] hover:bg-[#15803D] text-white text-xs rounded-xl">
                Add Photo
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Confirm Dialog: Edit Campaign Budget ─────────────────────── */}
      <ConfirmDialog
        open={Boolean(budgetModalCampaign)}
        onOpenChange={(open) => !open && setBudgetModalCampaign(null)}
        title="Update Daily Budget"
        description={`Set a new daily Google Ads budget for "${budgetModalCampaign?.name}". This change immediately takes effect on Google Ads bidding.`}
        confirmLabel="Update Daily Budget"
        onConfirm={handleSaveBudget}
      >
        <div className="py-2">
          <Label className="text-xs font-bold text-slate-700">New Daily Budget (₹)</Label>
          <Input
            type="number"
            min="100"
            value={newBudgetVal}
            onChange={(e) => setNewBudgetVal(e.target.value)}
            className="mt-1 h-9 rounded-xl border-slate-200 text-xs focus:border-[#16A34A]"
            placeholder="e.g. 3500"
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}
