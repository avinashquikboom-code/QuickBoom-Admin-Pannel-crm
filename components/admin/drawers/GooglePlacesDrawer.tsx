'use client';

import React, { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  ExternalLink,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UserPlus,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { AdminButton, AdminFormDrawer } from '@/components/admin';
import { dataCaptureApi } from '@/lib/data-capture-api';
import { getErrorMessage } from '@/lib/utils';

interface Place {
  id: number;
  businessName: string;
  googlePlaceId?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  category?: string;
  status: string;
  isImported?: boolean;
  rating?: number;
  reviewCount?: number;
  photos?: any;
  googlePhotos?: any;
  googleMapsUrl?: string;
}

export function GooglePlacesDrawer({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const client = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [limit, setLimit] = useState(10);
  const [places, setPlaces] = useState<Place[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const chosen = places.filter(place => selected.includes(place.id) && !place.isImported);
  const selectablePlaces = places.filter(place => !place.isImported && !['REJECTED', 'DUPLICATE'].includes(place.status));
  const isAllSelected = selectablePlaces.length > 0 && selectablePlaces.every(place => selected.includes(place.id));
  const isIndeterminate = selected.length > 0 && !isAllSelected;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelected([]);
    } else {
      setSelected(selectablePlaces.map(place => place.id));
    }
  };

  const search = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy || !keyword.trim() || !location.trim()) return;
    setBusy(true);
    setError('');
    setPlaces([]);
    setSelected([]);
    setSearched(false);

    try {
      const response = await dataCaptureApi.extract({
        keyword: keyword.trim(),
        location: location.trim(),
        maxResults: limit,
      });
      const payload = response?.data ?? response;
      const records = payload?.records ?? payload?.places;
      if (!Array.isArray(records) || records.some((record: any) => !Number.isInteger(record.id) || record.id < 1)) {
        throw new Error('Search returned an invalid capture response');
      }
      setPlaces(records);
      setSearched(true);
      await client.invalidateQueries({ queryKey: ['data-capture'] });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const processSelection = async (action: 'validate' | 'import') => {
    if (busy || !chosen.length) return;
    setBusy(true);
    setError('');
    let succeeded = 0;
    const failures: string[] = [];

    try {
      for (const place of chosen) {
        try {
          if (action === 'validate') {
            await dataCaptureApi.validate(place.id);
            setPlaces(current =>
              current.map(item => (item.id === place.id ? { ...item, status: 'VALIDATED' } : item))
            );
          } else {
            const result = await dataCaptureApi.importLead(place.id);
            setPlaces(current =>
              current.map(item =>
                item.id === place.id ? { ...item, isImported: true, status: result.record.status } : item
              )
            );
            setSelected(current => current.filter(id => id !== place.id));
          }
          succeeded++;
        } catch (err) {
          failures.push(`${place.businessName}: ${getErrorMessage(err)}`);
        }
      }

      if (succeeded) {
        toast.success(
          `${succeeded} businesses ${action === 'validate' ? 'validated' : 'imported or linked to existing Leads'}`
        );
        if (action === 'import') {
          onImported();
          await client.invalidateQueries({ queryKey: ['leads'] });
        }
        await client.invalidateQueries({ queryKey: ['data-capture'] });
      }
      if (failures.length) {
        setError(failures.join('\n'));
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSingleAction = async (place: Place, action: 'validate' | 'import') => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      if (action === 'validate') {
        await dataCaptureApi.validate(place.id);
        setPlaces(current =>
          current.map(item => (item.id === place.id ? { ...item, status: 'VALIDATED' } : item))
        );
        toast.success(`${place.businessName} validated`);
      } else {
        const result = await dataCaptureApi.importLead(place.id);
        setPlaces(current =>
          current.map(item =>
            item.id === place.id ? { ...item, isImported: true, status: result.record.status } : item
          )
        );
        setSelected(current => current.filter(id => id !== place.id));
        toast.success(`${place.businessName} imported to Leads`);
        onImported();
        await client.invalidateQueries({ queryKey: ['leads'] });
      }
      await client.invalidateQueries({ queryKey: ['data-capture'] });
    } catch (err) {
      setError(getErrorMessage(err));
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  // Helper to get image URL safely
  const getPlaceImageUrl = (place: Place): string | null => {
    if (Array.isArray(place.photos) && place.photos.length > 0 && typeof place.photos[0] === 'string') {
      return place.photos[0];
    }
    if (typeof place.photos === 'string' && place.photos.startsWith('http')) {
      return place.photos;
    }
    if (Array.isArray(place.googlePhotos) && place.googlePhotos.length > 0 && typeof place.googlePhotos[0] === 'string') {
      return place.googlePhotos[0];
    }
    return null;
  };

  return (
    <AdminFormDrawer
      isOpen
      onClose={onClose}
      title="Google Places Discovery"
      icon={MapPin}
      size="xl"
      maxWidth="w-full sm:max-w-[720px]"
      isSubmitting={busy}
      description="Discover, review and import verified local businesses directly into your CRM leads."
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            {chosen.length > 0 ? (
              <>
                <span className="font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  {chosen.length} selected
                </span>
                <button
                  type="button"
                  onClick={() => setSelected([])}
                  className="text-slate-500 hover:text-slate-800 font-medium underline transition-colors"
                >
                  Clear
                </button>
              </>
            ) : (
              <span className="text-slate-400">
                {places.length > 0 ? `${places.length} businesses found` : 'No businesses selected'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <AdminButton
              variant="outline"
              size="sm"
              icon={ShieldCheck}
              disabled={busy || !chosen.length || chosen.some(p => ['REJECTED', 'DUPLICATE'].includes(p.status))}
              onClick={() => processSelection('validate')}
              title={
                !chosen.length
                  ? 'Select businesses to validate'
                  : chosen.some(p => ['REJECTED', 'DUPLICATE'].includes(p.status))
                  ? 'Selected contains rejected or duplicate items'
                  : 'Validate selected businesses'
              }
            >
              Validate Selected
            </AdminButton>
            <AdminButton
              variant="primary"
              size="sm"
              icon={UserPlus}
              disabled={busy || !chosen.length || chosen.some(p => p.status !== 'VALIDATED')}
              onClick={() => processSelection('import')}
              title={
                !chosen.length
                  ? 'Select businesses to import'
                  : chosen.some(p => p.status !== 'VALIDATED')
                  ? 'All selected businesses must be validated first'
                  : 'Import selected businesses to Leads'
              }
            >
              Import Selected ({chosen.length})
            </AdminButton>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Search Form Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/80 to-white p-4 sm:p-5 shadow-xs transition-all">
          <form onSubmit={search} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Business or Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Business or Category <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    required
                    type="text"
                    value={keyword}
                    disabled={busy}
                    onChange={e => setKeyword(e.target.value)}
                    placeholder="e.g. Restaurants, Dental clinic..."
                    className="w-full rounded-xl border border-slate-200/90 bg-white pl-10 pr-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Location / City <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    required
                    type="text"
                    value={location}
                    disabled={busy}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="City, area, or postal code"
                    className="w-full rounded-xl border border-slate-200/90 bg-white pl-10 pr-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all disabled:opacity-60"
                  />
                </div>
              </div>
            </div>

            {/* Controls Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">Results limit:</span>
                <div className="flex items-center gap-1">
                  {[10, 20, 40, 60].map(val => (
                    <button
                      key={val}
                      type="button"
                      disabled={busy}
                      onClick={() => setLimit(val)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                        limit === val
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <AdminButton
                type="submit"
                variant="primary"
                icon={busy ? Loader2 : Sparkles}
                disabled={busy || !keyword.trim() || !location.trim()}
                className="w-full sm:w-auto !rounded-xl !px-5 !py-2.5 font-bold shadow-sm"
              >
                {busy ? 'Searching Places...' : 'Search Google Places'}
              </AdminButton>
            </div>
          </form>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs text-rose-800 shadow-2xs space-y-1"
          >
            <p className="font-bold flex items-center gap-1.5">
              <span>Attention:</span>
            </p>
            <p className="whitespace-pre-line leading-relaxed">{error}</p>
          </div>
        )}

        {/* Results Header Toolbar (Select All & Counter) */}
        {places.length > 0 && (
          <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/70 px-4 py-2.5 text-xs">
            <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                aria-label="Select all available places"
                checked={isAllSelected}
                ref={input => {
                  if (input) input.indeterminate = isIndeterminate;
                }}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded accent-emerald-600 cursor-pointer"
              />
              <span>
                Select all available ({selectablePlaces.length})
              </span>
            </label>

            <span className="text-[11px] text-slate-500 font-medium">
              Showing {places.length} results
            </span>
          </div>
        )}

        {/* Empty State Before Search */}
        {!searched && !places.length && !busy && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100/60 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200/60">
              <MapPin className="w-6 h-6 text-[#23C45E]" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h4 className="text-sm font-bold text-slate-800">Discover Local Businesses</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Type a business category and target location above to find leads with verified Google Places data.
              </p>
            </div>
          </div>
        )}

        {/* Empty State After Search */}
        {searched && !places.length && !busy && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h4 className="text-sm font-bold text-slate-800">No Businesses Found</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                We couldn&apos;t find any businesses matching &ldquo;{keyword}&rdquo; in &ldquo;{location}&rdquo;. Try broadening your keyword or searching an adjacent area.
              </p>
            </div>
          </div>
        )}

        {/* Results List Cards */}
        {places.length > 0 && (
          <div className="space-y-3">
            {places.map(place => {
              const isSelected = selected.includes(place.id);
              const isDisabled = busy || place.isImported || ['REJECTED', 'DUPLICATE'].includes(place.status);
              const imageUrl = getPlaceImageUrl(place);

              return (
                <div
                  key={place.id}
                  className={`rounded-2xl border transition-all duration-200 p-4 ${
                    isSelected
                      ? 'border-emerald-400 bg-emerald-50/30 shadow-xs ring-1 ring-emerald-400/40'
                      : place.isImported
                      ? 'border-slate-200/60 bg-slate-50/40 opacity-80'
                      : 'border-slate-200/90 bg-white hover:border-emerald-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Checkbox */}
                    <div className="pt-1 shrink-0">
                      <input
                        type="checkbox"
                        aria-label={`Select ${place.businessName}`}
                        disabled={isDisabled}
                        checked={isSelected}
                        onChange={e =>
                          setSelected(current =>
                            e.target.checked ? [...current, place.id] : current.filter(id => id !== place.id)
                          )
                        }
                        className="h-4 w-4 rounded accent-emerald-600 cursor-pointer disabled:cursor-not-allowed"
                      />
                    </div>

                    {/* Image or Avatar */}
                    <div className="shrink-0">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={place.businessName}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200/80 shadow-2xs"
                          onError={e => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-100 text-emerald-800 border border-emerald-200/60 flex items-center justify-center font-black text-sm shadow-2xs">
                          {place.businessName.slice(0, 2).toUpperCase() || <Building2 className="w-5 h-5 text-emerald-600" />}
                        </div>
                      )}
                    </div>

                    {/* Details Column */}
                    <div className="min-w-0 flex-1 space-y-2">
                      {/* Name and Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-slate-900 tracking-tight leading-snug line-clamp-1">
                            {place.businessName}
                          </h4>
                          {place.category && (
                            <span className="inline-block mt-0.5 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                              {place.category}
                            </span>
                          )}
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0">
                          {place.isImported ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-300/60">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Imported
                            </span>
                          ) : place.status === 'VALIDATED' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-teal-100/70 px-2.5 py-0.5 text-[10px] font-bold text-teal-800 border border-teal-300/60">
                              <ShieldCheck className="w-3 h-3 text-teal-600" /> Validated
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">
                              {place.status}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Rating and Reviews if available */}
                      {typeof place.rating === 'number' && place.rating > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200/60 text-amber-800 px-2 py-0.5 rounded-md text-[11px] font-bold">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                            <span>{place.rating.toFixed(1)}</span>
                          </div>
                          {typeof place.reviewCount === 'number' && place.reviewCount > 0 && (
                            <span className="text-[11px] font-medium text-slate-400">
                              ({place.reviewCount} reviews)
                            </span>
                          )}
                        </div>
                      )}

                      {/* Contact and Location Grid */}
                      <div className="space-y-1 text-xs text-slate-600 font-normal pt-0.5">
                        {place.address && (
                          <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-500">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{place.address}</span>
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600">
                          {place.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span className="font-medium text-slate-700">{place.phone}</span>
                            </span>
                          )}

                          {place.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span className="text-slate-600">{place.email}</span>
                            </span>
                          )}

                          {place.website && (
                            <a
                              href={place.website.startsWith('http') ? place.website : `https://${place.website}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 hover:underline font-medium"
                            >
                              <Globe className="w-3 h-3 text-emerald-600" />
                              <span className="max-w-[180px] truncate">{place.website.replace(/^https?:\/\//, '')}</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Card Action Bar */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-400 font-mono truncate">
                          {place.googlePlaceId ? `ID: ${place.googlePlaceId}` : `Ref #${place.id}`}
                        </span>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {!place.isImported && place.status !== 'VALIDATED' && (
                            <AdminButton
                              variant="outline"
                              size="sm"
                              icon={ShieldCheck}
                              disabled={busy || ['REJECTED', 'DUPLICATE'].includes(place.status)}
                              className="!text-[11px] !py-1 !px-2.5 !h-7"
                              onClick={() => handleSingleAction(place, 'validate')}
                            >
                              Validate
                            </AdminButton>
                          )}

                          {!place.isImported && (
                            <AdminButton
                              variant="primary"
                              size="sm"
                              icon={UserPlus}
                              disabled={busy || place.status !== 'VALIDATED'}
                              className="!text-[11px] !py-1 !px-2.5 !h-7"
                              onClick={() => handleSingleAction(place, 'import')}
                            >
                              Import Lead
                            </AdminButton>
                          )}

                          {place.isImported && (
                            <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Added to CRM
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminFormDrawer>
  );
}

