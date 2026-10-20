'use client';

import { useState } from 'react';
import { MapPin } from 'lucide-react';
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
  const search = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy || !keyword.trim() || !location.trim()) return;
    setBusy(true); setError(''); setPlaces([]); setSelected([]); setSearched(false);
    try {
      const response = await dataCaptureApi.extract({ keyword: keyword.trim(), location: location.trim(), maxResults: limit });
      const payload = response?.data ?? response;
      const records = payload?.records ?? payload?.places;
      if (!Array.isArray(records) || records.some(record => !Number.isInteger(record.id) || record.id < 1)) {
        throw new Error('Search returned an invalid capture response');
      }
      setPlaces(records); setSearched(true);
      await client.invalidateQueries({ queryKey: ['data-capture'] });
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setBusy(false); }
  };
  const processSelection = async (action: 'validate' | 'import') => {
    if (busy || !chosen.length) return;
    setBusy(true); setError('');
    let succeeded = 0;
    const failures: string[] = [];
    try {
      for (const place of chosen) {
        try {
          if (action === 'validate') {
            await dataCaptureApi.validate(place.id);
            setPlaces(current => current.map(item => item.id === place.id ? { ...item, status: 'VALIDATED' } : item));
          } else {
            const result = await dataCaptureApi.importLead(place.id);
            setPlaces(current => current.map(item => item.id === place.id ? { ...item, isImported: true, status: result.record.status } : item));
            setSelected(current => current.filter(id => id !== place.id));
          }
          succeeded++;
        } catch (err) { failures.push(`${place.businessName}: ${getErrorMessage(err)}`); }
      }
      if (succeeded) {
        toast.success(`${succeeded} businesses ${action === 'validate' ? 'validated' : 'imported or linked to existing Leads'}`);
        if (action === 'import') { onImported(); await client.invalidateQueries({ queryKey: ['leads'] }); }
        await client.invalidateQueries({ queryKey: ['data-capture'] });
      }
      setError(failures.join('\n'));
    } finally { setBusy(false); }
  };
  return <AdminFormDrawer isOpen onClose={onClose} title="Google Places Discovery" icon={MapPin} size="xl" isSubmitting={busy}
    description="Search, review and validate businesses before importing into Leads. Searches save results to Data Capture."
    footer={<div className="flex flex-wrap gap-2">
      <AdminButton variant="outline" disabled={busy || !chosen.length || chosen.some(p => ['REJECTED', 'DUPLICATE'].includes(p.status))} onClick={() => processSelection('validate')}>Validate selected</AdminButton>
      <AdminButton disabled={busy || !chosen.length || chosen.some(p => p.status !== 'VALIDATED')} onClick={() => processSelection('import')}>Import selected ({chosen.length})</AdminButton>
    </div>}>
    <form onSubmit={search} className="space-y-3 border-b border-slate-100 pb-5">
      <label className="block text-sm font-medium text-slate-700">Business or category
        <input required value={keyword} disabled={busy} onChange={e => setKeyword(e.target.value)} placeholder="e.g. Restaurants" className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm" />
      </label>
      <label className="block text-sm font-medium text-slate-700">Location
        <input required value={location} disabled={busy} onChange={e => setLocation(e.target.value)} placeholder="City or area" className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm" />
      </label>
      <label className="block text-sm font-medium text-slate-700">Results limit
        <select value={limit} disabled={busy} onChange={e => setLimit(Number(e.target.value))} className="ml-3 rounded-xl border border-slate-200 p-2">{[10, 20, 40, 60].map(value => <option key={value}>{value}</option>)}</select>
      </label>
      <AdminButton type="submit" disabled={busy || !keyword.trim() || !location.trim()}>{busy ? 'Processing...' : 'Search Google Places'}</AdminButton>
    </form>
    {error && <p role="alert" className="whitespace-pre-line py-3 text-sm text-rose-700">{error}</p>}
    {searched && !places.length && <p className="py-6 text-sm text-slate-500">No businesses found. Try another category or location.</p>}
    <div className="space-y-3 py-4">{places.map(place => <label key={place.id} className="flex gap-3 rounded-xl border border-slate-200 p-4">
      <input type="checkbox" aria-label={`Select ${place.businessName}`} disabled={busy || place.isImported || ['REJECTED', 'DUPLICATE'].includes(place.status)} checked={selected.includes(place.id)} onChange={e => setSelected(current => e.target.checked ? [...current, place.id] : current.filter(id => id !== place.id))} className="mt-1 h-4 w-4 accent-emerald-600" />
      <div className="min-w-0 space-y-1 break-words text-xs text-slate-500">
        <p className="text-sm font-semibold text-slate-900">{place.businessName}</p>
        <p>{place.category || 'Category unavailable'}</p><p>{place.address || 'Address unavailable'}</p>
        <p>Phone: {place.phone || 'Unavailable'}</p><p>Email: {place.email || 'Unavailable (may be enriched from the website later)'}</p>
        <p>Website: {place.website || 'Unavailable'}</p><p>Google Place ID: {place.googlePlaceId || 'Unavailable'}</p>
        <p className="font-medium text-emerald-700">{place.isImported ? 'Imported' : place.status}</p>
      </div>
    </label>)}</div>
  </AdminFormDrawer>;
}
