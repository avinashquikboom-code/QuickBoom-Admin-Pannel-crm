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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User,
  Upload,
  CheckCircle2,
  Calendar,
  DollarSign,
  TrendingUp,
  MapPin,
  Mail,
  Phone,
  Sparkles,
  Award,
  Star,
  ExternalLink,
  Package,
} from 'lucide-react';
import { Instagram, Youtube } from './SocialIcons';
import { toast } from '@/hooks/use-toast';
import {
  InfluencerAdminService,
  type InfluencerItem,
  type InfluencerCategoryItem,
} from '../../../lib/services/influencer.service';
import { cn } from '@/lib/utils';

interface InfluencerDrawerProps {
  id: number | null;
  mode: 'create' | 'edit' | 'view';
  categories: InfluencerCategoryItem[];
  onClose: () => void;
  onSaved: () => void;
}

export function InfluencerDrawer({
  id,
  mode,
  categories = [],
  onClose,
  onSaved,
}: InfluencerDrawerProps) {
  const readOnly = mode === 'view';
  const isCreate = mode === 'create';

  const [loading, setLoading] = React.useState(Boolean(id));
  const [saving, setSaving] = React.useState(false);
  const [uploadingImage, setUploadingImage] = React.useState(false);

  // Form State
  const [formData, setFormData] = React.useState<Partial<InfluencerItem>>({
    name: '',
    handle: '',
    profileImage: '',
    platform: 'INSTAGRAM',
    categoryId: undefined,
    categoryName: '',
    location: 'India',
    city: '',
    followers: 10000,
    followersCount: '10K',
    engagementRate: 3.5,
    startingPrice: 5000,
    bio: '',
    email: '',
    phone: '',
    instagramHandle: '',
    youtubeHandle: '',
    isVerified: true,
    isFeatured: true,
    status: 'ACTIVE',
  });

  const [fullRecord, setFullRecord] = React.useState<InfluencerItem | null>(null);

  // Load existing influencer data if edit or view
  React.useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);

    InfluencerAdminService.getInfluencerById(id)
      .then((data) => {
        if (!active) return;
        setFullRecord(data);
        setFormData({
          name: data.name || '',
          handle: data.handle || '',
          profileImage: data.profileImage || data.avatarUrl || '',
          platform: data.platform || 'INSTAGRAM',
          categoryId: data.categoryId ?? undefined,
          categoryName: data.categoryName || data.category?.name || '',
          location: data.location || 'India',
          city: data.city || '',
          followers: data.followers || 0,
          followersCount: data.followersCount || String(data.followers || 0),
          engagementRate: data.engagementRate || 0,
          startingPrice: data.startingPrice ?? 5000,
          bio: data.bio || '',
          email: data.email || '',
          phone: data.phone || '',
          instagramHandle: data.instagramHandle || '',
          youtubeHandle: data.youtubeHandle || '',
          isVerified: Boolean(data.isVerified),
          isFeatured: Boolean(data.isFeatured),
          status: data.status || 'ACTIVE',
        });
      })
      .catch((err) => {
        if (!active) return;
        toast.error('Failed to load influencer details');
        onClose();
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, onClose]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WebP)');
      return;
    }

    setUploadingImage(true);
    try {
      const res = await InfluencerAdminService.uploadImage(file);
      if (res?.imageUrl) {
        setFormData((prev) => ({ ...prev, profileImage: res.imageUrl }));
        toast.success('Image uploaded successfully');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Image upload failed. You can paste an image URL instead.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly || saving) return;

    if (!formData.name?.trim()) {
      toast.error('Influencer name is required');
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<InfluencerItem> = {
        ...formData,
        followers: Number(formData.followers || 0),
        engagementRate: Number(formData.engagementRate || 0),
        startingPrice: formData.startingPrice ? Number(formData.startingPrice) : undefined,
      };

      if (isCreate) {
        await InfluencerAdminService.createInfluencer(payload);
        toast.success('Influencer added successfully');
      } else if (id) {
        await InfluencerAdminService.updateInfluencer(id, payload);
        toast.success('Influencer updated successfully');
      }
      onSaved();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save influencer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="h-full gap-0 overflow-hidden bg-white p-0 data-[side=right]:!w-full data-[side=right]:!max-w-none data-[side=right]:sm:!w-[68vw] data-[side=right]:sm:!max-w-[68vw] data-[side=right]:lg:!w-[560px] data-[side=right]:lg:!max-w-[560px]"
      >
        {/* Header */}
        <SheetHeader className="border-b border-slate-100 bg-[#F7F9F8] px-5 py-5 pr-12 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-[#169F4D]">
              <User className="size-5" />
            </span>
            <div className="min-w-0">
              <SheetTitle className="text-lg font-bold text-slate-900 truncate">
                {isCreate
                  ? 'Add New Influencer'
                  : readOnly
                  ? fullRecord?.name || 'Influencer Profile'
                  : 'Edit Influencer'}
              </SheetTitle>
              <SheetDescription className="mt-0.5 text-xs text-slate-500">
                {isCreate
                  ? 'Register a verified creator in the QB Suite Influencer Hub.'
                  : readOnly
                  ? 'Complete verified creator performance metrics and profile.'
                  : 'Update influencer details, pricing, and status.'}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Content Area */}
        {loading ? (
          <div className="p-8 space-y-4 animate-pulse">
            <div className="size-16 rounded-2xl bg-slate-200 mx-auto" />
            <div className="h-5 bg-slate-200 rounded w-48 mx-auto" />
            <div className="h-4 bg-slate-100 rounded w-32 mx-auto" />
            <div className="grid grid-cols-2 gap-3 pt-4">
              <div className="h-16 bg-slate-100 rounded-xl" />
              <div className="h-16 bg-slate-100 rounded-xl" />
            </div>
          </div>
        ) : readOnly ? (
          /* =========================================================================
             VIEW MODE
             ========================================================================= */
          <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {/* Creator Profile Card */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-gradient-to-br from-[#F0F7F4] via-white to-white border border-emerald-100/80 shadow-2xs">
              <div className="relative size-16 sm:size-18 rounded-2xl overflow-hidden bg-emerald-50 border border-emerald-200/80 shrink-0 flex items-center justify-center">
                {formData.profileImage ? (
                  <img
                    src={formData.profileImage}
                    alt={formData.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <User className="size-8 text-[#163A2E]" />
                )}
                {formData.isVerified && (
                  <span
                    className="absolute -bottom-1 -right-1 size-5 rounded-full bg-[#20C466] text-white flex items-center justify-center border-2 border-white shadow-xs"
                    title="Verified Creator"
                  >
                    <CheckCircle2 className="size-3" />
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-slate-900 text-base sm:text-lg truncate">
                    {formData.name}
                  </h3>
                  {formData.isFeatured && (
                    <Badge className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border-0 shadow-none">
                      Featured
                    </Badge>
                  )}
                </div>

                <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                  {formData.handle ? `@${formData.handle.replace(/^@/, '')}` : 'No handle set'}
                </p>

                <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3 text-slate-400" />
                    {formData.city || formData.location || 'India'}
                  </span>
                  <span>•</span>
                  <span className="font-medium text-slate-700">{formData.categoryName || 'General'}</span>
                </div>
              </div>
            </div>

            {/* Performance KPIs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-slate-100 bg-[#F7F9F8] p-3 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Followers
                </span>
                <span className="text-base font-extrabold text-slate-900 mt-0.5 block">
                  {formData.followersCount || Number(formData.followers || 0).toLocaleString()}
                </span>
              </div>
              <div className="rounded-xl border border-slate-100 bg-[#F7F9F8] p-3 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Engagement
                </span>
                <span className="text-base font-extrabold text-emerald-700 mt-0.5 block">
                  {formData.engagementRate || 0}%
                </span>
              </div>
              <div className="rounded-xl border border-slate-100 bg-[#F7F9F8] p-3 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Rating
                </span>
                <span className="text-base font-extrabold text-amber-600 mt-0.5 inline-flex items-center justify-center gap-1">
                  <Star className="size-3.5 fill-amber-400 text-amber-400" />
                  {fullRecord?.rating || 4.9}
                </span>
              </div>
              <div className="rounded-xl border border-slate-100 bg-[#F7F9F8] p-3 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Bookings
                </span>
                <span className="text-base font-extrabold text-[#163A2E] mt-0.5 block">
                  {fullRecord?._count?.bookings ?? 0}
                </span>
              </div>
            </div>

            {/* Bio Section */}
            {formData.bio && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bio & Overview</h4>
                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed whitespace-pre-line">
                  {formData.bio}
                </p>
              </div>
            )}

            {/* Contact & Social Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contact & Socials</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {formData.email && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700">
                    <Mail className="size-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{formData.email}</span>
                  </div>
                )}
                {formData.phone && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700">
                    <Phone className="size-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{formData.phone}</span>
                  </div>
                )}
                {formData.instagramHandle && (
                  <a
                    href={`https://instagram.com/${formData.instagramHandle.replace(/^@/, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 hover:text-pink-600 transition-colors"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Instagram className="size-3.5 text-pink-500 shrink-0" />
                      <span>{formData.instagramHandle}</span>
                    </span>
                    <ExternalLink className="size-3 opacity-50" />
                  </a>
                )}
                {formData.youtubeHandle && (
                  <a
                    href={`https://youtube.com/${formData.youtubeHandle.replace(/^@/, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 hover:text-red-600 transition-colors"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Youtube className="size-3.5 text-red-500 shrink-0" />
                      <span>{formData.youtubeHandle}</span>
                    </span>
                    <ExternalLink className="size-3 opacity-50" />
                  </a>
                )}
              </div>
            </div>

            {/* Packages */}
            {fullRecord?.packages && fullRecord.packages.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Packages & Pricing</h4>
                  <span className="text-[11px] font-bold text-[#163A2E]">
                    Starting at ₹{Number(formData.startingPrice || 0).toLocaleString()}
                  </span>
                </div>
                <div className="space-y-2">
                  {fullRecord.packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 shadow-2xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{pkg.name}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase">
                            {pkg.type}
                          </span>
                        </div>
                        {pkg.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-1">{pkg.description}</p>
                        )}
                      </div>
                      <span className="text-xs font-extrabold text-[#163A2E]">
                        ₹{Number(pkg.price || 0).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* =========================================================================
             CREATE / EDIT FORM MODE
             ========================================================================= */
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {/* Profile Image & Upload */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="size-16 rounded-2xl overflow-hidden bg-slate-200 border border-slate-300 shrink-0 flex items-center justify-center">
                  {formData.profileImage ? (
                    <img
                      src={formData.profileImage}
                      alt="Preview"
                      className="size-full object-cover"
                    />
                  ) : (
                    <User className="size-8 text-slate-400" />
                  )}
                </div>
                <div className="space-y-1.5 min-w-0 flex-1">
                  <span className="text-xs font-bold text-slate-800 block">Creator Photo</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer shadow-2xs transition-colors">
                      <Upload className="size-3.5 text-slate-500" />
                      <span>{uploadingImage ? 'Uploading…' : 'Upload Image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <Input
                    type="url"
                    placeholder="Or paste an image URL..."
                    value={formData.profileImage || ''}
                    onChange={(e) => setFormData({ ...formData, profileImage: e.target.value })}
                    className="h-8 text-xs bg-white border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Name & Handle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Priya Sharma"
                    className="h-9.5 text-xs bg-slate-50 border-slate-200 focus-visible:bg-white rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Handle / Username</label>
                  <Input
                    value={formData.handle || ''}
                    onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
                    placeholder="e.g. priyastyle"
                    className="h-9.5 text-xs bg-slate-50 border-slate-200 focus-visible:bg-white rounded-xl"
                  />
                </div>
              </div>

              {/* Platform & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Primary Platform</label>
                  <Select
                    value={formData.platform || 'INSTAGRAM'}
                    onValueChange={(val) => setFormData({ ...formData, platform: val || 'INSTAGRAM' })}
                  >
                    <SelectTrigger className="h-9.5 text-xs bg-slate-50 border-slate-200 focus-visible:bg-white rounded-xl">
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="INSTAGRAM">Instagram</SelectItem>
                      <SelectItem value="YOUTUBE">YouTube</SelectItem>
                      <SelectItem value="SNAPCHAT">Snapchat</SelectItem>
                      <SelectItem value="TIKTOK">TikTok</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Category</label>
                  <Select
                    value={formData.categoryId ? String(formData.categoryId) : 'none'}
                    onValueChange={(val) => {
                      if (!val || val === 'none') {
                        setFormData({ ...formData, categoryId: undefined, categoryName: '' });
                      } else {
                        const found = categories.find((c) => String(c.id) === val);
                        setFormData({
                          ...formData,
                          categoryId: Number(val),
                          categoryName: found?.name || '',
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="h-9.5 text-xs bg-slate-50 border-slate-200 focus-visible:bg-white rounded-xl">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="none">None / General</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Metrics: Followers, Engagement & Starting Price */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Followers Count</label>
                  <Input
                    type="number"
                    value={formData.followers ?? ''}
                    onChange={(e) => {
                      const num = Number(e.target.value);
                      const display =
                        num >= 1000000
                          ? `${(num / 1000000).toFixed(1)}M`
                          : num >= 1000
                          ? `${(num / 1000).toFixed(0)}K`
                          : String(num);
                      setFormData({
                        ...formData,
                        followers: num,
                        followersCount: display,
                      });
                    }}
                    placeholder="50000"
                    className="h-9.5 text-xs bg-slate-50 border-slate-200 focus-visible:bg-white rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Engagement Rate (%)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.engagementRate ?? ''}
                    onChange={(e) =>
                      setFormData({ ...formData, engagementRate: Number(e.target.value) })
                    }
                    placeholder="4.5"
                    className="h-9.5 text-xs bg-slate-50 border-slate-200 focus-visible:bg-white rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Starting Price (₹)</label>
                  <Input
                    type="number"
                    value={formData.startingPrice ?? ''}
                    onChange={(e) =>
                      setFormData({ ...formData, startingPrice: Number(e.target.value) })
                    }
                    placeholder="5000"
                    className="h-9.5 text-xs bg-slate-50 border-slate-200 focus-visible:bg-white rounded-xl"
                  />
                </div>
              </div>

              {/* Location & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">City / State</label>
                  <Input
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Mumbai, Maharashtra"
                    className="h-9.5 text-xs bg-slate-50 border-slate-200 focus-visible:bg-white rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Country</label>
                  <Input
                    value={formData.location || 'India'}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="India"
                    className="h-9.5 text-xs bg-slate-50 border-slate-200 focus-visible:bg-white rounded-xl"
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Contact Email</label>
                  <Input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="creator@example.com"
                    className="h-9.5 text-xs bg-slate-50 border-slate-200 focus-visible:bg-white rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Phone Number</label>
                  <Input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 9876543210"
                    className="h-9.5 text-xs bg-slate-50 border-slate-200 focus-visible:bg-white rounded-xl"
                  />
                </div>
              </div>

              {/* Social Handles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Instagram Handle</label>
                  <Input
                    value={formData.instagramHandle || ''}
                    onChange={(e) => setFormData({ ...formData, instagramHandle: e.target.value })}
                    placeholder="@priyastyle"
                    className="h-9.5 text-xs bg-slate-50 border-slate-200 focus-visible:bg-white rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">YouTube Handle</label>
                  <Input
                    value={formData.youtubeHandle || ''}
                    onChange={(e) => setFormData({ ...formData, youtubeHandle: e.target.value })}
                    placeholder="@PriyaVlogs"
                    className="h-9.5 text-xs bg-slate-50 border-slate-200 focus-visible:bg-white rounded-xl"
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Bio & Specialty</label>
                <Textarea
                  rows={3}
                  value={formData.bio || ''}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Short description of content style, audience demographics, and previous brand collaborations..."
                  className="text-xs bg-slate-50 border-slate-200 focus-visible:bg-white rounded-xl resize-none"
                />
              </div>

              {/* Status & Options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Listing Status</label>
                  <Select
                    value={formData.status || 'ACTIVE'}
                    onValueChange={(val) => setFormData({ ...formData, status: val || 'ACTIVE' })}
                  >
                    <SelectTrigger className="h-9.5 text-xs bg-slate-50 border-slate-200 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="SUSPENDED">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isVerified"
                    checked={Boolean(formData.isVerified)}
                    onChange={(e) => setFormData({ ...formData, isVerified: e.target.checked })}
                    className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="isVerified" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Verified Creator
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={Boolean(formData.isFeatured)}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="isFeatured" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Featured in Hub
                  </label>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-[#F7F9F8] px-5 py-4 sm:px-6">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={onClose}
                className="rounded-xl border-slate-200 text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#20C466] hover:bg-[#1bb05b] text-white text-xs font-bold"
              >
                {saving ? 'Saving…' : isCreate ? 'Add Influencer' : 'Save Changes'}
              </Button>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
