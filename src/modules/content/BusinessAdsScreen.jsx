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
  faRectangleAd,
  faImage,
  faVideo,
  faPlus,
  faRotate,
  faDownload,
  faSearch,
  faEye,
  faPenToSquare,
  faTrashCan,
  faBuilding,
  faChartLine,
  faCheckCircle,
  faBan,
  faClock,
  faArrowUpRightFromSquare,
  faMobileScreen,
  faSliders,
  faLink,
  faMoneyBillWave,
  faBullhorn,
  faFilter,
  faExternalLinkAlt,
  faCheck,
  faXmark,
  faStore,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from '@/hooks/use-toast';
import { loadCustomers } from '@/modules/crm/crm-api';
import { cn } from '@/lib/utils';

// Standard Initial Sample Data for Business Ad Campaigns
const INITIAL_BUSINESS_ADS = [
  {
    id: 'BAD-1001',
    title: 'Festival Mega Bonanza 2026',
    businessName: 'Apex Electronics & Appliances',
    customerId: 1,
    category: 'Retail & E-commerce',
    adType: 'BANNER',
    placement: 'HOME_HERO',
    headline: 'Up to 50% Off on Smart TVs & Kitchen Tech',
    description: 'Celebrate the festive season with verified warranty and free express doorstep delivery across Gujarat and Maharashtra.',
    mediaUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=900&q=80',
    ctaText: 'Shop Fest Deals',
    ctaUrl: 'https://apexelectronics.example/festive',
    budget: 45000,
    impressions: 18450,
    clicks: 1240,
    startDate: '2026-11-01',
    endDate: '2026-12-15',
    priority: 95,
    status: 'ACTIVE',
    createdAt: '2026-11-01T10:00:00Z',
  },
  {
    id: 'BAD-1002',
    title: 'Commercial Luxury Office Suites',
    businessName: 'Skyline Realty & Infrastructure',
    customerId: 2,
    category: 'Real Estate',
    adType: 'VIDEO',
    placement: 'EXPLORE_FEED',
    headline: 'Prime Corporate Spaces in Bandra-Kurla Complex',
    description: 'World-class LEED platinum corporate offices with high-speed fiber, conference amenities, and zero brokerage booking.',
    mediaUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    ctaText: 'Schedule Site Visit',
    ctaUrl: 'https://skylinerealty.example/bkc-suites',
    budget: 90000,
    impressions: 42100,
    clicks: 3180,
    startDate: '2026-11-05',
    endDate: '2026-12-31',
    priority: 90,
    status: 'ACTIVE',
    createdAt: '2026-11-05T14:30:00Z',
  },
  {
    id: 'BAD-1003',
    title: 'Cold-Pressed Nutrition & Organic Snacks',
    businessName: 'GreenRoot Organics Private Limited',
    customerId: 3,
    category: 'Food & FMCG',
    adType: 'BANNER',
    placement: 'CATEGORY_SPONSORED',
    headline: 'Pure 100% Certified Organic Cooking Essentials',
    description: 'Farm-to-kitchen cold pressed virgin oils, raw honeys, and preservative-free healthy millet snacks.',
    mediaUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80',
    ctaText: 'Order Fresh Now',
    ctaUrl: 'https://greenroot.example/shop',
    budget: 25000,
    impressions: 9800,
    clicks: 745,
    startDate: '2026-11-10',
    endDate: '2026-11-30',
    priority: 75,
    status: 'ACTIVE',
    createdAt: '2026-11-10T09:15:00Z',
  },
  {
    id: 'BAD-1004',
    title: 'Winter Fitness Membership Drive',
    businessName: 'Titan Fitness & Crossfit Arena',
    customerId: 4,
    category: 'Health & Fitness',
    adType: 'VIDEO',
    placement: 'EXPLORE_FEED',
    headline: 'Annual Pass with Personal Trainer Consultation',
    description: 'State-of-the-art strength training, steam sauna, and certified nutrition coaches in 6 major metro locations.',
    mediaUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    ctaText: 'Get 3 Days Free Trial',
    ctaUrl: 'https://titanfitness.example/freetrial',
    budget: 35000,
    impressions: 12900,
    clicks: 980,
    startDate: '2026-11-12',
    endDate: '2026-12-25',
    priority: 80,
    status: 'PENDING_REVIEW',
    createdAt: '2026-11-12T11:45:00Z',
  },
  {
    id: 'BAD-1005',
    title: 'Cloud Accounting & GST Suite',
    businessName: 'FinPulse Software Solutions',
    customerId: 5,
    category: 'Technology & SaaS',
    adType: 'BANNER',
    placement: 'POPUP_INTERSTITIAL',
    headline: 'Automate E-Way Bills & Tax Invoicing in Seconds',
    description: 'Compliant cloud GST filing, automated customer ledger tracking, and multi-branch inventory control.',
    mediaUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80',
    ctaText: 'Start 14-Day Free Demo',
    ctaUrl: 'https://finpulse.example/demo',
    budget: 60000,
    impressions: 26500,
    clicks: 1890,
    startDate: '2026-11-15',
    endDate: '2026-12-15',
    priority: 85,
    status: 'PAUSED',
    createdAt: '2026-11-15T16:20:00Z',
  },
  {
    id: 'BAD-1006',
    title: 'Holiday Travel Packages - Dubai & Maldives',
    businessName: 'Wanderlust International Tours',
    customerId: 6,
    category: 'Travel & Hospitality',
    adType: 'BANNER',
    placement: 'HOME_HERO',
    headline: 'All-Inclusive Luxury Holidays with Flight Bookings',
    description: 'Curated 5-star resort packages, desert safaris, and visa assistance with 24/7 dedicated trip concierge.',
    mediaUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=900&q=80',
    ctaText: 'Explore Packages',
    ctaUrl: 'https://wanderlust.example/packages',
    budget: 50000,
    impressions: 0,
    clicks: 0,
    startDate: '2026-12-01',
    endDate: '2027-01-15',
    priority: 70,
    status: 'PENDING_REVIEW',
    createdAt: '2026-11-20T08:00:00Z',
  },
];

const AD_TYPES = [
  { value: 'ALL', label: 'All Ad Formats' },
  { value: 'BANNER', label: 'Business Banners' },
  { value: 'VIDEO', label: 'Sponsored Videos' },
  { value: 'STORY', label: 'Story Ads' },
  { value: 'POPUP_INTERSTITIAL', label: 'Pop-up Interstitials' },
];

const AD_PLACEMENTS = [
  { value: 'ALL', label: 'All Placements' },
  { value: 'HOME_HERO', label: 'Home Screen Hero' },
  { value: 'EXPLORE_FEED', label: 'Explore & Feed' },
  { value: 'CATEGORY_SPONSORED', label: 'Category Top Listing' },
  { value: 'POPUP_INTERSTITIAL', label: 'App Launch Interstitial' },
];

const AD_STATUSES = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active / Running' },
  { value: 'PENDING_REVIEW', label: 'Pending Review' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'REJECTED', label: 'Rejected' },
];

const CATEGORIES = [
  'Retail & E-commerce',
  'Real Estate',
  'Health & Fitness',
  'Food & FMCG',
  'Technology & SaaS',
  'Travel & Hospitality',
  'Automobile',
  'Education & Training',
  'Financial Services',
  'General Services',
];

export function BusinessAdsScreen({ initialTab = 'ALL' }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Active Tab state: 'ALL' | 'BANNER' | 'VIDEO' | 'PENDING'
  const tabFromQuery = searchParams.get('tab')?.toUpperCase() || initialTab;
  const [activeTab, setActiveTab] = React.useState(tabFromQuery);

  // Search & Filter state
  const [search, setSearch] = React.useState('');
  const [selectedFormat, setSelectedFormat] = React.useState('ALL');
  const [selectedPlacement, setSelectedPlacement] = React.useState('ALL');
  const [selectedStatus, setSelectedStatus] = React.useState('ALL');

  // Ad records list
  const [ads, setAds] = React.useState(INITIAL_BUSINESS_ADS);
  const [customers, setCustomers] = React.useState([]);

  // Drawer / Form state
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingAd, setEditingAd] = React.useState(null);
  const [formBusy, setFormBusy] = React.useState(false);

  // Form Fields
  const [form, setForm] = React.useState({
    title: '',
    businessName: '',
    customerId: '',
    category: 'Retail & E-commerce',
    adType: 'BANNER',
    placement: 'HOME_HERO',
    headline: '',
    description: '',
    mediaUrl: '',
    videoUrl: '',
    ctaText: 'Visit Business',
    ctaUrl: '',
    budget: '',
    startDate: '',
    endDate: '',
    priority: 50,
    status: 'ACTIVE',
  });

  // Preview Modal state
  const [previewAd, setPreviewAd] = React.useState(null);

  // Delete confirmation state
  const [deletingAd, setDeletingAd] = React.useState(null);

  // Multi-select state
  const [selectedIds, setSelectedIds] = React.useState([]);

  // Fetch customers from API
  React.useEffect(() => {
    async function fetchCustomersList() {
      try {
        const res = await loadCustomers({ limit: 50 });
        if (res?.rows && Array.isArray(res.rows)) {
          setCustomers(res.rows);
        }
      } catch {
        // Fallback gracefully to default
      }
    }
    fetchCustomersList();
  }, []);

  // Sync tab with URL
  React.useEffect(() => {
    if (tabFromQuery && tabFromQuery !== activeTab) {
      setActiveTab(tabFromQuery);
    }
  }, [tabFromQuery]);

  // Compute KPI Statistics
  const stats = React.useMemo(() => {
    const total = ads.length;
    const active = ads.filter((a) => a.status === 'ACTIVE').length;
    const pending = ads.filter((a) => a.status === 'PENDING_REVIEW').length;
    const totalImpressions = ads.reduce((sum, a) => sum + (Number(a.impressions) || 0), 0);
    const totalClicks = ads.reduce((sum, a) => sum + (Number(a.clicks) || 0), 0);
    const totalBudget = ads.reduce((sum, a) => sum + (Number(a.budget) || 0), 0);
    const overallCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';

    return {
      total,
      active,
      pending,
      totalImpressions,
      totalClicks,
      totalBudget,
      overallCtr,
    };
  }, [ads]);

  // Filtered Ads list
  const filteredAds = React.useMemo(() => {
    return ads.filter((ad) => {
      // Tab filter
      if (activeTab === 'BANNER' && ad.adType !== 'BANNER') return false;
      if (activeTab === 'VIDEO' && ad.adType !== 'VIDEO') return false;
      if (activeTab === 'PENDING' && ad.status !== 'PENDING_REVIEW') return false;

      // Dropdown filters
      if (selectedFormat !== 'ALL' && ad.adType !== selectedFormat) return false;
      if (selectedPlacement !== 'ALL' && ad.placement !== selectedPlacement) return false;
      if (selectedStatus !== 'ALL' && ad.status !== selectedStatus) return false;

      // Text search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = ad.title?.toLowerCase().includes(q);
        const matchBiz = ad.businessName?.toLowerCase().includes(q);
        const matchCat = ad.category?.toLowerCase().includes(q);
        const matchHeadline = ad.headline?.toLowerCase().includes(q);
        const matchId = ad.id?.toLowerCase().includes(q);
        if (!matchTitle && !matchBiz && !matchCat && !matchHeadline && !matchId) {
          return false;
        }
      }

      return true;
    });
  }, [ads, activeTab, selectedFormat, selectedPlacement, selectedStatus, search]);

  // Handle open create form
  const handleOpenCreate = () => {
    setEditingAd(null);
    setForm({
      title: '',
      businessName: customers[0]?.companyName || customers[0]?.name || '',
      customerId: customers[0]?.id || '',
      category: 'Retail & E-commerce',
      adType: activeTab === 'VIDEO' ? 'VIDEO' : 'BANNER',
      placement: 'HOME_HERO',
      headline: '',
      description: '',
      mediaUrl: '',
      videoUrl: '',
      ctaText: 'Visit Business',
      ctaUrl: '',
      budget: '25000',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: 50,
      status: 'ACTIVE',
    });
    setIsFormOpen(true);
  };

  // Handle open edit form
  const handleOpenEdit = (ad) => {
    setEditingAd(ad);
    setForm({
      title: ad.title || '',
      businessName: ad.businessName || '',
      customerId: ad.customerId || '',
      category: ad.category || 'Retail & E-commerce',
      adType: ad.adType || 'BANNER',
      placement: ad.placement || 'HOME_HERO',
      headline: ad.headline || '',
      description: ad.description || '',
      mediaUrl: ad.mediaUrl || '',
      videoUrl: ad.videoUrl || '',
      ctaText: ad.ctaText || 'Visit Business',
      ctaUrl: ad.ctaUrl || '',
      budget: ad.budget ? String(ad.budget) : '',
      startDate: ad.startDate || '',
      endDate: ad.endDate || '',
      priority: ad.priority || 50,
      status: ad.status || 'ACTIVE',
    });
    setIsFormOpen(true);
  };

  // Save Ad (Create / Update)
  const handleSaveAd = (e) => {
    if (e?.preventDefault) e.preventDefault();

    if (!form.title.trim()) {
      toast.error('Please enter a campaign / ad title.');
      return;
    }
    if (!form.businessName.trim()) {
      toast.error('Please select or specify the business / client name.');
      return;
    }
    if (!form.mediaUrl.trim()) {
      toast.error('Please provide a banner image URL or poster URL.');
      return;
    }

    setFormBusy(true);
    setTimeout(() => {
      if (editingAd) {
        setAds((prev) =>
          prev.map((item) =>
            item.id === editingAd.id
              ? {
                  ...item,
                  ...form,
                  budget: Number(form.budget) || 0,
                  priority: Number(form.priority) || 50,
                }
              : item
          )
        );
        toast.success(`Business Ad "${form.title}" updated successfully.`);
      } else {
        const newId = `BAD-${1000 + ads.length + 1}`;
        const newAd = {
          ...form,
          id: newId,
          budget: Number(form.budget) || 0,
          priority: Number(form.priority) || 50,
          impressions: 0,
          clicks: 0,
          createdAt: new Date().toISOString(),
        };
        setAds((prev) => [newAd, ...prev]);
        toast.success(`Business Ad "${form.title}" created successfully.`);
      }

      setFormBusy(false);
      setIsFormOpen(false);
    }, 400);
  };

  // Delete Ad
  const handleDeleteAd = () => {
    if (!deletingAd) return;
    setAds((prev) => prev.filter((item) => item.id !== deletingAd.id));
    toast.success(`Business Ad "${deletingAd.title}" was removed.`);
    setDeletingAd(null);
  };

  // Quick Approve / Reject action
  const handleUpdateStatus = (adId, newStatus) => {
    setAds((prev) =>
      prev.map((item) => (item.id === adId ? { ...item, status: newStatus } : item))
    );
    toast.success(
      newStatus === 'ACTIVE'
        ? 'Business Ad approved and published live.'
        : `Business Ad status updated to ${newStatus}.`
    );
  };

  // Export CSV
  const handleExportCsv = () => {
    const listToExport = filteredAds;
    if (!listToExport.length) {
      toast.error('No business ads to export.');
      return;
    }

    const headers = [
      'Ad ID',
      'Title',
      'Business Name',
      'Category',
      'Format',
      'Placement',
      'Budget (INR)',
      'Impressions',
      'Clicks',
      'CTR %',
      'Start Date',
      'End Date',
      'Status',
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        headers.join(','),
        ...listToExport.map((a) => {
          const ctr = a.impressions > 0 ? ((a.clicks / a.impressions) * 100).toFixed(2) : '0.00';
          return [
            `"${a.id}"`,
            `"${(a.title || '').replace(/"/g, '""')}"`,
            `"${(a.businessName || '').replace(/"/g, '""')}"`,
            `"${a.category || ''}"`,
            `"${a.adType || ''}"`,
            `"${a.placement || ''}"`,
            a.budget || 0,
            a.impressions || 0,
            a.clicks || 0,
            `"${ctr}%"`,
            `"${a.startDate || ''}"`,
            `"${a.endDate || ''}"`,
            `"${a.status || ''}"`,
          ].join(',');
        }),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `business_ads_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${listToExport.length} business ad(s) to CSV.`);
  };

  return (
    <div className="min-w-0 w-full max-w-full space-y-6 pb-16">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <PageHeader
        category="MARKETING & PROMOTIONS"
        title="Business Ad's"
        icon={faRectangleAd}
        description="Manage sponsored merchant campaigns, brand banners, video promotions, and customer ad placements."
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="outline"
              onClick={handleExportCsv}
              disabled={!filteredAds.length}
              className="border-slate-200 text-slate-700 hover:bg-slate-50 transition-all font-medium text-sm rounded-xl h-10"
            >
              <FontAwesomeIcon icon={faDownload} className="mr-2 text-xs" />
              Export CSV
            </Button>
            <Button
              type="button"
              onClick={handleOpenCreate}
              className="bg-[#16A34A] hover:bg-[#15803D] text-white shadow-sm transition-all font-semibold text-sm rounded-xl h-10 px-4"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2 text-xs" />
              Create Business Ad
            </Button>
          </div>
        }
      />

      {/* ── KPI Statistics Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Campaigns */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Campaigns
            </span>
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <FontAwesomeIcon icon={faBullhorn} className="text-sm" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900">
              {stats.active}
            </span>
            <span className="text-xs font-semibold text-slate-400">/ {stats.total} total</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700">
            <FontAwesomeIcon icon={faCheckCircle} className="size-3" />
            <span className="font-semibold">Live in app feeds & search</span>
          </div>
        </div>

        {/* Pending Review */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pending Review
            </span>
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <FontAwesomeIcon icon={faClock} className="text-sm" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900">
              {stats.pending}
            </span>
            <span className="text-xs font-semibold text-slate-400">awaiting moderation</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-700">
            <FontAwesomeIcon icon={faSliders} className="size-3" />
            <span className="font-semibold">Merchant submissions</span>
          </div>
        </div>

        {/* Total Impressions */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Impressions
            </span>
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <FontAwesomeIcon icon={faChartLine} className="text-sm" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900">
              {stats.totalImpressions.toLocaleString('en-IN')}
            </span>
            <span className="text-xs font-semibold text-blue-700">
              ({stats.overallCtr}% CTR)
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-medium">{stats.totalClicks.toLocaleString('en-IN')} verified clicks</span>
          </div>
        </div>

        {/* Total Ad Spend / Budget */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Ad Budget
            </span>
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <FontAwesomeIcon icon={faMoneyBillWave} className="text-sm" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900">
              ₹{stats.totalBudget.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700">
            <span className="font-semibold">Committed merchant revenue</span>
          </div>
        </div>
      </div>

      {/* ── Segmented Navigation Tabs ──────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'ALL', label: 'All Business Ads', icon: faRectangleAd, count: ads.length },
          {
            id: 'BANNER',
            label: 'Business Banners',
            icon: faImage,
            count: ads.filter((a) => a.adType === 'BANNER').length,
          },
          {
            id: 'VIDEO',
            label: 'Sponsored Videos',
            icon: faVideo,
            count: ads.filter((a) => a.adType === 'VIDEO').length,
          },
          {
            id: 'PENDING',
            label: 'Pending Approvals',
            icon: faClock,
            count: stats.pending,
            highlight: stats.pending > 0,
          },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer select-none',
                isActive
                  ? 'bg-[#16A34A] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100/80 border border-slate-200'
              )}
            >
              <FontAwesomeIcon icon={tab.icon} className="size-3.5" />
              <span>{tab.label}</span>
              <span
                className={cn(
                  'ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-bold',
                  isActive
                    ? 'bg-white/20 text-white'
                    : tab.highlight
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-600'
                )}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Search & Filter Controls ───────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ad title, business name, or category..."
            className="h-10 pl-9 rounded-xl border-slate-200 text-xs focus:border-[#16A34A]"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Format Filter */}
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-[#16A34A] focus:outline-none"
          >
            {AD_TYPES.map((fmt) => (
              <option key={fmt.value} value={fmt.value}>
                {fmt.label}
              </option>
            ))}
          </select>

          {/* Placement Filter */}
          <select
            value={selectedPlacement}
            onChange={(e) => setSelectedPlacement(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-[#16A34A] focus:outline-none"
          >
            {AD_PLACEMENTS.map((plc) => (
              <option key={plc.value} value={plc.value}>
                {plc.label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-[#16A34A] focus:outline-none"
          >
            {AD_STATUSES.map((st) => (
              <option key={st.value} value={st.value}>
                {st.label}
              </option>
            ))}
          </select>

          {/* Reset Filters */}
          {(search || selectedFormat !== 'ALL' || selectedPlacement !== 'ALL' || selectedStatus !== 'ALL') && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setSelectedFormat('ALL');
                setSelectedPlacement('ALL');
                setSelectedStatus('ALL');
              }}
              className="text-xs text-rose-600 hover:bg-rose-50"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* ── Table Card ─────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 pl-4 pr-3">Ad & Business</th>
                <th className="py-3.5 px-3">Format & Placement</th>
                <th className="py-3.5 px-3">Category</th>
                <th className="py-3.5 px-3">Performance</th>
                <th className="py-3.5 px-3">Budget & Schedule</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 pl-3 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredAds.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex size-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
                        <FontAwesomeIcon icon={faRectangleAd} className="size-6" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">No Business Ads Found</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm">
                        {search || selectedFormat !== 'ALL' || selectedStatus !== 'ALL'
                          ? 'No campaigns match your active search and filter criteria.'
                          : 'No business advertising campaigns have been created yet.'}
                      </p>
                      <Button
                        type="button"
                        onClick={handleOpenCreate}
                        className="mt-4 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs rounded-xl"
                      >
                        <FontAwesomeIcon icon={faPlus} className="mr-1.5 text-xs" />
                        Create First Business Ad
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAds.map((ad) => {
                  const ctr =
                    ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : '0.0';

                  return (
                    <tr
                      key={ad.id}
                      className="transition-colors hover:bg-slate-50/70"
                    >
                      {/* Ad Details & Business */}
                      <td className="py-3.5 pl-4 pr-3">
                        <div className="flex items-start gap-3">
                          {/* Media Thumbnail */}
                          <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                            {ad.mediaUrl ? (
                              <img
                                src={ad.mediaUrl}
                                alt={ad.title}
                                className="size-full object-cover"
                              />
                            ) : (
                              <div className="flex size-full items-center justify-center text-slate-400">
                                <FontAwesomeIcon icon={faImage} className="size-4" />
                              </div>
                            )}
                            {ad.adType === 'VIDEO' && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white text-[10px]">
                                <FontAwesomeIcon icon={faVideo} />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate text-[13px] hover:text-[#16A34A] transition-colors cursor-pointer" onClick={() => setPreviewAd(ad)}>
                              {ad.title}
                            </p>
                            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 mt-0.5">
                              <FontAwesomeIcon icon={faStore} className="size-3 text-[#16A34A]" />
                              <span className="truncate">{ad.businessName}</span>
                            </p>
                            <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                              {ad.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Format & Placement */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-1">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase',
                              ad.adType === 'VIDEO'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            )}
                          >
                            <FontAwesomeIcon
                              icon={ad.adType === 'VIDEO' ? faVideo : faImage}
                              className="size-2.5"
                            />
                            {ad.adType}
                          </span>
                          <p className="text-[11px] font-medium text-slate-500">
                            {ad.placement.replace('_', ' ')}
                          </p>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3">
                        <span className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
                          {ad.category}
                        </span>
                      </td>

                      {/* Performance */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs">
                              {ad.impressions.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] text-slate-400">views</span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-600">
                            <span>{ad.clicks.toLocaleString('en-IN')} clicks</span>
                            <span className="font-bold text-emerald-700">({ctr}% CTR)</span>
                          </div>
                        </div>
                      </td>

                      {/* Budget & Schedule */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 text-xs">
                            ₹{ad.budget.toLocaleString('en-IN')}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {ad.startDate} to {ad.endDate}
                          </p>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border',
                            ad.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : ad.status === 'PENDING_REVIEW'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : ad.status === 'PAUSED'
                              ? 'bg-slate-100 text-slate-700 border-slate-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          )}
                        >
                          <span
                            className={cn(
                              'size-1.5 rounded-full',
                              ad.status === 'ACTIVE'
                                ? 'bg-emerald-500'
                                : ad.status === 'PENDING_REVIEW'
                                ? 'bg-amber-500'
                                : ad.status === 'PAUSED'
                                ? 'bg-slate-400'
                                : 'bg-rose-500'
                            )}
                          />
                          {ad.status.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 pl-3 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Live Preview Button */}
                          <button
                            type="button"
                            onClick={() => setPreviewAd(ad)}
                            title="Preview Mobile Ad"
                            className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-[#16A34A]"
                          >
                            <FontAwesomeIcon icon={faMobileScreen} className="size-3.5" />
                          </button>

                          {/* Quick Approve / Pause action */}
                          {ad.status === 'PENDING_REVIEW' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(ad.id, 'ACTIVE')}
                              title="Approve & Publish Ad"
                              className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100"
                            >
                              <FontAwesomeIcon icon={faCheck} className="size-3.5" />
                            </button>
                          )}

                          {ad.status === 'ACTIVE' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(ad.id, 'PAUSED')}
                              title="Pause Ad"
                              className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100"
                            >
                              <FontAwesomeIcon icon={faBan} className="size-3" />
                            </button>
                          )}

                          {ad.status === 'PAUSED' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(ad.id, 'ACTIVE')}
                              title="Resume Ad"
                              className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100"
                            >
                              <FontAwesomeIcon icon={faCheck} className="size-3.5" />
                            </button>
                          )}

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(ad)}
                            title="Edit Ad"
                            className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                          >
                            <FontAwesomeIcon icon={faPenToSquare} className="size-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => setDeletingAd(ad)}
                            title="Delete Ad"
                            className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
                          >
                            <FontAwesomeIcon icon={faTrashCan} className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer status bar */}
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 bg-slate-50/50 text-xs text-slate-500">
          <span>Showing {filteredAds.length} of {ads.length} business ad campaigns</span>
          <span className="font-medium text-emerald-800">
            {stats.active} campaigns actively running in production
          </span>
        </div>
      </div>

      {/* ── Slide-Over Drawer for Create / Edit ─────────────────────── */}
      <SlideOverDrawer
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        title={editingAd ? 'Edit Business Ad' : 'Create Business Ad'}
        description="Configure the sponsored merchant ad details, media assets, CTA link, and campaign budget."
        maxWidth="max-w-2xl"
        footer={
          <div className="flex w-full items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFormOpen(false)}
              disabled={formBusy}
              className="text-xs h-9 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveAd}
              disabled={formBusy}
              className="bg-[#16A34A] hover:bg-[#15803D] text-white text-xs h-9 rounded-xl font-semibold px-4"
            >
              {formBusy ? 'Saving...' : editingAd ? 'Update Business Ad' : 'Publish Business Ad'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveAd} className="space-y-4 text-xs">
          {/* Campaign Title */}
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Campaign / Ad Title <span className="text-rose-500">*</span>
            </Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Festival Mega Bonanza 2026"
              className="mt-1 h-9 rounded-xl border-slate-200 text-xs focus:border-[#16A34A]"
              required
            />
          </div>

          {/* Business / Client Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Business / Client <span className="text-rose-500">*</span>
              </Label>
              <select
                value={form.customerId}
                onChange={(e) => {
                  const custId = e.target.value;
                  const found = customers.find((c) => String(c.id) === String(custId));
                  setForm({
                    ...form,
                    customerId: custId,
                    businessName: found ? found.companyName || found.name : form.businessName,
                  });
                }}
                className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-[#16A34A] focus:outline-none"
              >
                <option value="">Select registered client...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName || c.name} (ID: {c.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Display Business Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                placeholder="e.g. Apex Electronics & Appliances"
                className="mt-1 h-9 rounded-xl border-slate-200 text-xs focus:border-[#16A34A]"
                required
              />
            </div>
          </div>

          {/* Ad Format & Placement */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Ad Format
              </Label>
              <select
                value={form.adType}
                onChange={(e) => setForm({ ...form, adType: e.target.value })}
                className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-[#16A34A] focus:outline-none"
              >
                <option value="BANNER">Banner Ad (Image)</option>
                <option value="VIDEO">Sponsored Video / Reel</option>
                <option value="STORY">Story Promotion</option>
                <option value="POPUP_INTERSTITIAL">Pop-up Interstitial</option>
              </select>
            </div>

            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Placement Screen
              </Label>
              <select
                value={form.placement}
                onChange={(e) => setForm({ ...form, placement: e.target.value })}
                className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-[#16A34A] focus:outline-none"
              >
                <option value="HOME_HERO">Home Screen Top Hero</option>
                <option value="EXPLORE_FEED">Explore & Discovery Feed</option>
                <option value="CATEGORY_SPONSORED">Category Top Listing</option>
                <option value="POPUP_INTERSTITIAL">App Launch Interstitial</option>
              </select>
            </div>
          </div>

          {/* Category */}
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Industry Category
            </Label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-[#16A34A] focus:outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Headline & Description */}
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Headline
            </Label>
            <Input
              value={form.headline}
              onChange={(e) => setForm({ ...form, headline: e.target.value })}
              placeholder="e.g. Up to 50% Off on Smart TVs & Kitchen Tech"
              className="mt-1 h-9 rounded-xl border-slate-200 text-xs focus:border-[#16A34A]"
            />
          </div>

          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Description / Offer Details
            </Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Detailed promotional description, terms, warranty or offer highlights..."
              rows={2}
              className="mt-1 rounded-xl border-slate-200 text-xs focus:border-[#16A34A]"
            />
          </div>

          {/* Media URL */}
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Creative Banner / Poster Image URL <span className="text-rose-500">*</span>
            </Label>
            <Input
              value={form.mediaUrl}
              onChange={(e) => setForm({ ...form, mediaUrl: e.target.value })}
              placeholder="https://images.unsplash.com/... or uploaded asset URL"
              className="mt-1 h-9 rounded-xl border-slate-200 text-xs focus:border-[#16A34A]"
              required
            />
            {form.mediaUrl && (
              <div className="mt-2 relative h-32 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
                <img
                  src={form.mediaUrl}
                  alt="Creative Preview"
                  className="size-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* Video URL if format is VIDEO */}
          {form.adType === 'VIDEO' && (
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Sponsored Video Stream URL (.mp4 / HLS)
              </Label>
              <Input
                value={form.videoUrl}
                onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                placeholder="https://.../video.mp4"
                className="mt-1 h-9 rounded-xl border-slate-200 text-xs focus:border-[#16A34A]"
              />
            </div>
          )}

          {/* Call To Action Button */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                CTA Button Text
              </Label>
              <Input
                value={form.ctaText}
                onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                placeholder="e.g. Shop Now, Book Demo"
                className="mt-1 h-9 rounded-xl border-slate-200 text-xs focus:border-[#16A34A]"
              />
            </div>

            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                CTA Destination URL / Link
              </Label>
              <Input
                value={form.ctaUrl}
                onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })}
                placeholder="https://..."
                className="mt-1 h-9 rounded-xl border-slate-200 text-xs focus:border-[#16A34A]"
              />
            </div>
          </div>

          {/* Budget & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Campaign Budget (₹)
              </Label>
              <Input
                type="number"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
                placeholder="e.g. 50000"
                className="mt-1 h-9 rounded-xl border-slate-200 text-xs focus:border-[#16A34A]"
              />
            </div>

            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Display Priority (1 - 100)
              </Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="mt-1 h-9 rounded-xl border-slate-200 text-xs focus:border-[#16A34A]"
              />
            </div>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Start Date
              </Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="mt-1 h-9 rounded-xl border-slate-200 text-xs focus:border-[#16A34A]"
              />
            </div>

            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                End Date
              </Label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="mt-1 h-9 rounded-xl border-slate-200 text-xs focus:border-[#16A34A]"
              />
            </div>
          </div>

          {/* Initial Status */}
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Campaign Status
            </Label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-[#16A34A] focus:outline-none"
            >
              <option value="ACTIVE">ACTIVE (Published Live)</option>
              <option value="PENDING_REVIEW">PENDING REVIEW</option>
              <option value="PAUSED">PAUSED</option>
            </select>
          </div>
        </form>
      </SlideOverDrawer>

      {/* ── Mobile Live Mockup Preview Dialog ──────────────────────── */}
      <Dialog open={Boolean(previewAd)} onOpenChange={(open) => !open && setPreviewAd(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl bg-slate-900 border-slate-800 text-white">
          <div className="p-4 bg-slate-950 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faMobileScreen} className="text-[#16A34A]" />
              <span className="text-xs font-bold text-white tracking-wide">
                Live App Preview Mockup
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {previewAd?.placement}
            </span>
          </div>

          <div className="p-5 space-y-4">
            {/* Merchant Identity Card */}
            <div className="flex items-center justify-between rounded-xl bg-slate-800/80 p-3 border border-slate-700/60">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-lg bg-[#16A34A] text-white font-bold text-xs">
                  {previewAd?.businessName?.charAt(0) || 'B'}
                </div>
                <div>
                  <p className="font-bold text-xs text-white">{previewAd?.businessName}</p>
                  <p className="text-[10px] text-slate-400">Sponsored Business Partner</p>
                </div>
              </div>
              <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                PROMOTED
              </span>
            </div>

            {/* Creative Banner Image */}
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-slate-700 bg-black">
              {previewAd?.mediaUrl && (
                <img
                  src={previewAd.mediaUrl}
                  alt={previewAd.title}
                  className="size-full object-cover"
                />
              )}
              {previewAd?.adType === 'VIDEO' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="flex size-12 items-center justify-center rounded-full bg-white/90 text-slate-950 shadow-lg">
                    <FontAwesomeIcon icon={faVideo} className="size-5" />
                  </div>
                </div>
              )}
            </div>

            {/* Headline & Description */}
            <div className="space-y-1.5">
              <h3 className="font-extrabold text-sm text-white leading-snug">
                {previewAd?.headline || previewAd?.title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {previewAd?.description || 'Discover verified products and services with special customer pricing.'}
              </p>
            </div>

            {/* Call to action Button */}
            <a
              href={previewAd?.ctaUrl || '#'}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#16A34A] py-3 text-xs font-bold text-white transition hover:bg-[#15803D]"
            >
              <span>{previewAd?.ctaText || 'Learn More'}</span>
              <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="size-3" />
            </a>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Confirm Delete Dialog ──────────────────────────────────── */}
      <ConfirmDialog
        open={Boolean(deletingAd)}
        onOpenChange={(open) => !open && setDeletingAd(null)}
        title="Delete Business Ad"
        description={`Are you sure you want to delete "${deletingAd?.title}" from ${deletingAd?.businessName}? This campaign and its statistics will be permanently removed.`}
        confirmLabel="Delete Campaign"
        variant="destructive"
        onConfirm={handleDeleteAd}
      />
    </div>
  );
}
