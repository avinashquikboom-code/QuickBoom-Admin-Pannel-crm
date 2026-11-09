 'use client';
import * as React from 'react';
import Link from 'next/link';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Button } from '@/components/common/Button';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { AdminSelectCheckbox } from '@/components/admin/bulk-selection';
import { toast } from '@/hooks/use-toast';
import { crmError, importGooglePlaces, loadCapturedPlace, resolveGoogleLocation, searchGooglePlaces, suggestGoogleLocations } from '@/modules/crm/crm-api';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faEnvelope, faGlobe, faLocationDot, faPhone, faXmark } from '@fortawesome/free-solid-svg-icons';
function placeKey(place) { return place.googlePlaceId || String(place.id); }
function unwrap(payload) { return payload?.data && !Array.isArray(payload.data) ? payload.data : payload || {}; }
function Field({ label, children }) { return <Label className="grid gap-1 text-xs">{label}{children}</Label>; }
const PLACE_CATEGORIES = ['Restaurant', 'Cafe', 'Hotel', 'Hospital', 'Pharmacy', 'Clinic', 'School', 'College', 'Gym', 'Salon', 'Grocery store', 'Supermarket', 'Clothing store', 'Electronics store', 'Bank', 'Real estate agency', 'Car repair', 'Dentist', 'Doctor', 'Lawyer', 'Accounting', 'Software company', 'Marketing agency', 'Construction company', 'Bakery', 'Pet store', 'Jewelry store', 'Furniture store', 'Travel agency', 'Insurance agency', 'Logistics', 'Manufacturing', 'IT services'];

function distanceKm(origin, place) {
  const lat1 = Number(origin?.latitude);
  const lon1 = Number(origin?.longitude);
  const lat2 = Number(place?.latitude);
  const lon2 = Number(place?.longitude);
  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return null;
  const toRad = (value) => value * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

export function GooglePlacesPanel({ open, onOpenChange, onImported, initialPlaces = null, initialJobId = null }) {
  const [categories, setCategories] = React.useState([]);
  const [categoryQuery, setCategoryQuery] = React.useState('');
  const [categoryOpen, setCategoryOpen] = React.useState(false);
  const [locationQuery, setLocationQuery] = React.useState('');
  const [location, setLocation] = React.useState(null);
  const [suggestions, setSuggestions] = React.useState([]);
  const [places, setPlaces] = React.useState([]);
  const [jobId, setJobId] = React.useState('');
  const [selected, setSelected] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [searched, setSearched] = React.useState(false);
  const [detail, setDetail] = React.useState(null);
  const [outcomes, setOutcomes] = React.useState({});
  const [independentFields, setIndependentFields] = React.useState({});
  const [searchLocation, setSearchLocation] = React.useState('');
  React.useEffect(() => {
    if (!open || !initialPlaces) return;
    setPlaces(initialPlaces); setJobId(initialJobId || ''); setSearched(true);
    setSelected([]); setOutcomes({}); setIndependentFields({}); setDetail(null);
  }, [open, initialPlaces, initialJobId]);
  const [limit, setLimit] = React.useState(20);
  const categorySuggestions = PLACE_CATEGORIES.filter((item) => item.toLowerCase().includes(categoryQuery.trim().toLowerCase()) && !categories.includes(item)).slice(0, 8);
  React.useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [open]);
  React.useEffect(() => {
    if (location || locationQuery.trim().length < 2) { setSuggestions([]); return undefined; }
    const timer = setTimeout(async () => {
      try {
        const result = unwrap(await suggestGoogleLocations(locationQuery.trim()));
        setSuggestions(result.suggestions || []);
      } catch (err) {
        setSuggestions([]);
        setError(crmError(err));
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [location, locationQuery]);
  const search = async () => {
    if (!categories.length) { setError('Select at least one business category.'); return; }
    if (!location?.address || location.latitude == null || location.longitude == null) { setError('Select a location from the suggestions.'); return; }
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const result = unwrap(await searchGooglePlaces({ categories, searchLocation, location: location.address, latitude: location.latitude, longitude: location.longitude, maxResults: limit }));
      const rows = result.places || result.records || [];
      const unique = [];
      const seen = new Set();
      rows.forEach((place) => {
        const id = placeKey(place) || place.id;
        if (!id || seen.has(id)) return;
        seen.add(id);
        unique.push(place);
      });
      setPlaces(unique.slice(0, limit));
      setJobId(result.jobId || '');
      setSelected([]);
      setOutcomes({});
      setIndependentFields({});
      setDetail(null);
    } catch (err) {
      setPlaces([]);
      setError(crmError(err));
    } finally {
      setLoading(false);
    }
  };
  const toggle = (place) => {
    const id = placeKey(place);
    if (!id) return;
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };
  const selectable = places.filter((place) => placeKey(place) && !['imported', 'duplicate'].includes(outcomes[placeKey(place)]?.status)).map((place) => placeKey(place));
  const allSelected = selectable.length > 0 && selectable.every((id) => selected.includes(id));
  const importSelected = async (ids) => {
    const pending = [...new Set(ids)].filter((id) => outcomes[id]?.status !== 'imported' && outcomes[id]?.status !== 'duplicate');
    if (!pending.length) return;
    setImporting(true);
    try {
      const result = unwrap(await importGooglePlaces(pending, jobId, pending.map((id) => ({ googlePlaceId: places.find((place) => placeKey(place) === id)?.googlePlaceId, id: places.find((place) => placeKey(place) === id)?.id, independentFields: independentFields[id] }))));
      const records = result.records || [];
      const next = { ...outcomes };
      records.forEach((record) => {
        const id = record.googlePlaceId || String(record.sourceRecordId);
        if (!id) return;
        next[id] = record.imported ? { status: 'imported', leadId: record.leadId } : record.duplicate ? { status: 'duplicate', leadId: record.existingLeadId || record.leadId, message: 'Already in CRM' } : { status: 'failed', message: record.error || record.message || 'Import failed' };
      });
      pending.forEach((id) => {
        if (!next[id] || next[id] === outcomes[id]) next[id] = { status: 'failed', message: 'Import failed' };
      });
      setOutcomes(next);
      const imported = Object.values(next).filter((item) => item.status === 'imported').length;
      const duplicates = Object.values(next).filter((item) => item.status === 'duplicate').length;
      const failed = pending.filter((id) => next[id]?.status === 'failed').length;
      toast.success(`Imported ${result.imported ?? imported}. Already existing ${result.skippedDuplicates ?? duplicates}. Failed ${result.failed ?? failed}.`);
      onImported?.();
    } catch (err) {
      const next = { ...outcomes };
      pending.forEach((id) => { next[id] = { status: 'failed', message: crmError(err) }; });
      setOutcomes(next);
      toast.error(crmError(err));
    } finally {
      setImporting(false);
    }
  };
  const failedIds = selected.filter((id) => outcomes[id]?.status === 'failed');
  return <FormDrawer open={open} onOpenChange={(value) => { if (!importing) onOpenChange(value); }} title="Find Leads from Google" description="Google Maps results are live references. Enter business fields from your own records before importing a CRM lead; do not copy Google content." size="xl" showFooter={false} bodyClassName="!flex !min-h-0 !flex-1 !flex-col !overflow-hidden !space-y-0 !p-0" contentClassName="w-full sm:max-w-[760px]">
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
        <div className="relative">
          <Label className="mb-1 block text-xs">Category</Label>
          <div className="flex min-h-10 flex-wrap items-center gap-1 rounded-lg border border-[#E2E8E5] bg-white px-2 py-1">
            {categories.map((item) => <button key={item} type="button" className="inline-flex items-center gap-1 rounded-full bg-[#E8F1EC] px-2 py-1 text-xs text-[#163A2E]" onClick={() => setCategories(categories.filter((value) => value !== item))}>{item} <FontAwesomeIcon icon={faXmark} className="size-3" /></button>)}
            <input aria-label="Search business categories" className="h-8 min-w-40 flex-1 bg-transparent text-sm outline-none" placeholder="Search business categories..." value={categoryQuery} onFocus={() => setCategoryOpen(true)} onChange={(event) => { setCategoryQuery(event.target.value); setCategoryOpen(true); }} />
            {categories.length > 0 && <button type="button" className="text-xs text-[#718078]" onClick={() => setCategories([])}>Clear</button>}
          </div>
          {categoryOpen && <div className="absolute z-30 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-[#E2E8E5] bg-white shadow-lg">{categorySuggestions.map((item) => <button key={item} type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-[#E8F1EC]" onClick={() => { setCategories([...categories, item]); setCategoryQuery(''); setCategoryOpen(false); }}>{item}</button>)}{!categorySuggestions.length && <p className="px-3 py-2 text-sm text-[#718078]">No matching categories</p>}</div>}
        </div>
        <div className="relative">
          <Label className="mb-1 block text-xs">Location</Label>
          <div className="flex items-center gap-2 rounded-lg border border-[#E2E8E5] bg-white px-3">
            <FontAwesomeIcon icon={faLocationDot} className="text-[#163A2E]" />
            <input aria-label="Search area, locality or address" className="h-10 w-full bg-transparent text-sm outline-none" placeholder="Search area, locality or address" value={location ? location.address : locationQuery} onChange={(event) => { setLocation(null); setLocationQuery(event.target.value); setSearchLocation(event.target.value); }} />
            {(location || locationQuery) && <button type="button" aria-label="Clear location" onClick={() => { setLocation(null); setLocationQuery(''); setSearchLocation(''); setSuggestions([]); }}><FontAwesomeIcon icon={faXmark} className="text-[#718078]" /></button>}
          </div>
          {suggestions.length > 0 && <div className="absolute z-30 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-[#E2E8E5] bg-white shadow-lg">{suggestions.map((item) => <button key={item.placeId} type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-[#E8F1EC]" onClick={async () => { try { const resolved = unwrap(await resolveGoogleLocation(item.placeId)); setLocation(resolved); setLocationQuery(''); setSuggestions([]); setError(''); } catch (err) { setError(crmError(err)); } }}>{item.label}</button>)}</div>}
        </div>
        <section className="rounded-xl border border-[#163A2E]/20 bg-[#E8F1EC] p-3">
          <h3 className="text-sm font-semibold text-[#172B24]">Capture Leads</h3>
          <p className="text-xs text-[#718078]">Fetch and capture top results from Google Maps.</p>
          <div className="mt-2 flex gap-2">{[10, 20, 50].map((count) => <button key={count} type="button" className={`h-9 min-w-14 rounded-lg border text-sm font-medium ${limit === count ? 'border-[#163A2E] bg-[#163A2E] text-white' : 'border-[#E2E8E5] bg-white text-[#172B24]'}`} onClick={() => setLimit(count)}>{count}</button>)}</div>
        </section>
        <Button className="bg-[#163A2E] hover:bg-[#204C3D]" onClick={search} disabled={loading || importing}>{loading ? 'Searching…' : 'Search'}</Button>
        {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {searched && !loading && <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-[#172B24]">Found Leads ({places.length})</p>
          <p className="text-xs text-[#718078]">{places.length} Found Leads | {selected.length} Selected</p>
        </div>}
        {searched && !loading && places.length > 0 && <label className="flex items-center gap-2 text-xs"><AdminSelectCheckbox checked={allSelected} onChange={() => setSelected(allSelected ? [] : selectable)} label="Select all businesses" /> {allSelected ? 'Deselect all' : 'Select all'}</label>}
        {loading && <p className="text-sm text-[#718078]">Searching Google Maps…</p>}
        {searched && !loading && !places.length && !error && <p className="rounded-xl border border-dashed border-[#E2E8E5] p-6 text-center text-sm text-[#718078]">No businesses found for this category and location.</p>}
        <div className="grid gap-3">
          {places.map((place) => {
            const outcome = outcomes[placeKey(place)];
            const km = distanceKm(location, place);
            return <article key={placeKey(place) || place.id} className={`rounded-xl border bg-white p-3 text-sm shadow-sm ${selected.includes(placeKey(place)) ? 'border-[#163A2E]' : 'border-[#E2E8E5]'}`}>
              <div className="flex items-start gap-3">
                <AdminSelectCheckbox checked={selected.includes(placeKey(place))} disabled={!placeKey(place) || ['imported', 'duplicate'].includes(outcome?.status)} onChange={() => toggle(place)} label={`Select ${place.businessName}`} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[#172B24]">{place.businessName || 'Google Maps reference'}</p>
                  <p className="text-[#718078]">{place.category || 'Not available'}{km != null ? ` · ${km} km` : ''}</p>
                  <p className="mt-1 flex items-start gap-2"><FontAwesomeIcon icon={faLocationDot} className="mt-0.5 text-[#163A2E]" /> {place.address && place.address !== 'N/A' ? place.address : 'Not available'}</p>
                  <p className="flex items-center gap-2"><FontAwesomeIcon icon={faPhone} className="text-[#163A2E]" /> {place.phone || 'Not available'}</p>
                  {place.email && <p className="flex items-center gap-2"><FontAwesomeIcon icon={faEnvelope} className="text-[#163A2E]" /> {place.email}</p>}
                  <p className="flex items-center gap-2"><FontAwesomeIcon icon={faGlobe} className="text-[#163A2E]" /> {place.website ? <a className="truncate text-[#163A2E] underline" href={place.website} target="_blank" rel="noreferrer">{place.website}</a> : 'Not available'}</p>
                  {place.googleMapsUrl && <a className="text-xs text-[#163A2E] underline" href={place.googleMapsUrl} target="_blank" rel="noreferrer">Google Maps profile</a>}
                  {outcome && <p className={`mt-1 text-xs ${outcome.status === 'failed' ? 'text-red-700' : 'text-[#163A2E]'}`}>{outcome.status === 'imported' ? 'Imported' : outcome.status === 'duplicate' ? 'Already in CRM' : outcome.message}</p>}
                  {(place.rawData?.attributions || []).map((item, index) => <p key={index} className="text-xs">{item.provider ? <a href={item.providerUri} target="_blank" rel="noreferrer">{item.provider}</a> : null}</p>)}
                  {outcome?.leadId && <Link className="ml-2 text-xs underline" href={`/admin/crm/leads?leadId=${outcome.leadId}`}>CRM lead #{outcome.leadId}</Link>}
                  {selected.includes(placeKey(place)) && !['imported', 'duplicate'].includes(outcome?.status) && <fieldset className="mt-3 grid gap-2 rounded-lg border p-3 sm:grid-cols-2">
                    <legend className="px-1 text-xs font-medium">Independently supplied CRM fields</legend>
                    {['businessName', 'phone', 'email', 'website', 'address', 'city', 'state', 'country', 'pincode', 'category'].map((key) => <Field key={key} label={key === 'businessName' ? 'Business name (required)' : key}><Input value={independentFields[placeKey(place)]?.[key] || ''} onChange={(event) => setIndependentFields((current) => ({ ...current, [placeKey(place)]: { ...current[placeKey(place)], [key]: event.target.value } }))} /></Field>)}
                  </fieldset>}
                  <Button className="mt-2" size="sm" variant="outline" onClick={async () => { try { setDetail(unwrap(await loadCapturedPlace(place.id))); } catch (err) { toast.error(crmError(err)); } }}>View Details</Button>
                </div>
              </div>
            </article>;
          })}
        </div>
        {detail && <div className="rounded-xl border bg-white p-3 text-sm"><p className="font-medium">Google Maps · {detail.businessName}</p><p>{detail.address || 'Not available'}</p><p>{detail.phone || 'Not available'}</p><p>{detail.email || 'Email not available'}</p><p>{detail.website || 'Not available'}</p>{(detail.rawData?.attributions || []).map((item, index) => <p key={index}><a href={item.providerUri}>{item.provider}</a></p>)}</div>}
      </div>
      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[#E2E8E5] bg-white px-6 py-4">
        <p className="text-sm text-[#172B24]">Selected {selected.length} · Imported {Object.values(outcomes).filter((item) => item.status === 'imported').length} · Already Exists {Object.values(outcomes).filter((item) => item.status === 'duplicate').length} · Failed {Object.values(outcomes).filter((item) => item.status === 'failed').length}</p>
        <div className="flex gap-2">
          <Link className="text-sm underline" href={`/admin/crm/leads?captureJobId=${encodeURIComponent(jobId)}`}>View Imported Leads</Link><Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          {failedIds.length > 0 && <Button variant="outline" disabled={importing} onClick={() => importSelected(failedIds)}>{importing ? 'Importing…' : `Retry failed (${failedIds.length})`}</Button>}
          <Button className="bg-[#163A2E] hover:bg-[#204C3D]" disabled={!selected.length || importing} onClick={() => importSelected(selected)}>{importing ? 'Importing…' : `Import Selected (${selected.length})`}</Button>
        </div>
      </div>
    </div>
  </FormDrawer>;
}

