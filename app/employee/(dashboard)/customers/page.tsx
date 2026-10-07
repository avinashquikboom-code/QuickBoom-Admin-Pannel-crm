'use client';

import { useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { LoaderCircle, MapPin, Phone, RefreshCw, Search, Users } from 'lucide-react';
import api from '@/lib/api';
import { useEmployeeAuthStore } from '@/lib/employee-store';
import { hasPermission } from '@/lib/access-control';

type CustomerTab = 'All' | 'Active' | 'Upcoming' | 'Inactive';
type CustomerStatus = 'Active' | 'Upcoming' | 'Inactive';

const TABS: CustomerTab[] = ['All', 'Active', 'Upcoming', 'Inactive'];

interface CustomerView {
  key: string;
  name: string;
  subtitle: string;
  status: CustomerStatus;
  convertedFromLead: boolean;
  plan: string | null;
  startDate: string | null;
  endDate: string | null;
  commission: number | null;
  phone: string;
  location: string;
}

interface CustomersResult {
  customers: CustomerView[];
  counts: Partial<Record<'all' | 'active' | 'upcoming' | 'inactive', number>>;
}

const text = (value: unknown) => (value === null || value === undefined ? '' : String(value).trim());

// Mirrors the mobile CustomerModel status rules: Active > Upcoming > Inactive.
function mapCustomer(raw: any, index: number): CustomerView {
  const rawStatus = text(raw.customerStatus || raw.status || 'ACTIVE').toUpperCase();
  const custStatus = ['ACTIVE', 'UPCOMING', 'COMPLETED', 'INACTIVE'].includes(rawStatus)
    ? rawStatus
    : raw.isActive === false
      ? 'INACTIVE'
      : 'ACTIVE';
  const subStatus = text(raw.subscriptionStatus).toUpperCase();
  const leadStatus = text(raw.leadStatus).toUpperCase();
  const stage = text(raw.leadStageName).toLowerCase();
  const isFinalCall = leadStatus === 'FINAL_CALL' || stage.includes('final');
  const isSubActive = subStatus === 'ACTIVE' || (custStatus === 'ACTIVE' && raw.hasUpcomingCall === false);
  const hasUpcoming =
    !isSubActive &&
    (custStatus === 'UPCOMING' || isFinalCall || raw.hasUpcomingCall === true || !!raw.upcomingCall);
  const status: CustomerStatus = isSubActive ? 'Active' : hasUpcoming ? 'Upcoming' : 'Inactive';

  const contact = text(raw.contactFullName || raw.contactPerson);
  const customerName = text(raw.customerName || contact);
  const company = text(raw.companyName || raw.company || raw.workspaceName);
  const baseName = text(raw.name || raw.businessName);
  const person =
    customerName && customerName.toLowerCase() !== 'primary contact' ? customerName : baseName || 'Customer';
  const title = company || baseName || person;

  let commission: number | null = null;
  if (raw.upcomingCommission !== null && raw.upcomingCommission !== undefined) {
    const value = Number(raw.upcomingCommission);
    if (value > 0) commission = value;
  } else if (raw.commission && typeof raw.commission === 'object') {
    const commStatus = text(raw.commission.status).toUpperCase();
    const value = Number(raw.commission.amount);
    if (['UPCOMING', 'PENDING', 'APPROVED'].includes(commStatus) && value > 0) commission = value;
  }

  const leadId = text(raw.leadId || raw.originLeadId);
  const plan = text(raw.plan || raw.planName);
  const location = [text(raw.city), text(raw.state)].filter(Boolean).join(', ');

  return {
    key: text(raw.id || raw.customerId) || `customer-${index}`,
    name: title,
    subtitle: title.toLowerCase() === person.toLowerCase() ? '' : person,
    status,
    convertedFromLead: !!leadId && leadId !== '0' && leadId !== 'null',
    plan: plan && plan !== 'No Active Plan' ? plan : null,
    startDate: text(raw.subscriptionStartDate) || null,
    endDate: text(raw.subscriptionEndDate) || null,
    commission,
    phone: text(raw.phone),
    location,
  };
}

const formatDate = (value: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;

const STATUS_STYLES: Record<CustomerStatus, { badge: string; dot: string }> = {
  Active: { badge: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' },
  Upcoming: { badge: 'bg-blue-50 text-blue-800 border-blue-200', dot: 'bg-blue-600' },
  Inactive: { badge: 'bg-red-50 text-red-800 border-red-200', dot: 'bg-red-500' },
};

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.9L2 22l5.25-1.38A9.9 9.9 0 1 0 12.04 2Zm0 18.1a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 1 1 6.97 3.85Zm4.5-6.1c-.25-.12-1.46-.72-1.69-.8-.23-.09-.39-.12-.56.12-.16.25-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-2-1.24-.74-.66-1.24-1.47-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.41-.56-.42h-.47c-.16 0-.43.06-.66.31-.23.25-.86.84-.86 2.05s.88 2.38 1 2.55c.12.16 1.73 2.64 4.2 3.7.59.26 1.05.41 1.4.52.59.19 1.13.16 1.55.1.47-.07 1.46-.6 1.66-1.17.2-.58.2-1.07.14-1.17-.06-.1-.23-.16-.48-.29Z" />
    </svg>
  );
}

export default function EmployeeCustomersPage() {
  const user = useEmployeeAuthStore((state) => state.user);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<CustomerTab>('All');

  const canView = hasPermission(user, ['customers', 'employee.customers.view', 'CUSTOMERS']);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const query = useQuery<CustomersResult>({
    queryKey: ['employee-customers', search],
    enabled: canView,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const response: any = await api.get('/customers', {
        params: { page: 1, limit: 100, search: search || undefined },
      });
      const items = Array.isArray(response?.items)
        ? response.items
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.items)
            ? response.data.items
            : Array.isArray(response)
              ? response
              : null;
      if (!items) throw new Error('The customers response was invalid.');
      const counts = response?.meta?.counts ?? response?.data?.meta?.counts ?? {};
      return { customers: items.map(mapCustomer), counts };
    },
  });

  const customers = useMemo(() => query.data?.customers ?? [], [query.data]);

  const tabCounts = useMemo(() => {
    const derived = { Active: 0, Upcoming: 0, Inactive: 0 };
    customers.forEach((customer) => {
      derived[customer.status] += 1;
    });
    const backend = query.data?.counts ?? {};
    const pick = (value: number | undefined, fallback: number) =>
      backend.all && value ? Number(value) : fallback;
    return {
      All: backend.all ?? customers.length,
      Active: pick(backend.active, derived.Active),
      Upcoming: pick(backend.upcoming, derived.Upcoming),
      Inactive: pick(backend.inactive, derived.Inactive),
    } as Record<CustomerTab, number>;
  }, [customers, query.data]);

  const visible = useMemo(
    () => (tab === 'All' ? customers : customers.filter((customer) => customer.status === tab)),
    [customers, tab],
  );

  if (!canView) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-10 text-center">
        <h1 className="text-xl font-bold text-slate-900">Access denied</h1>
        <p className="mt-2 text-sm text-slate-500">You do not have permission to view customers.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-1 pb-10 sm:px-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Customers</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Manage your active and upcoming customers</p>
        </div>
        <button
          type="button"
          onClick={() => query.refetch()}
          disabled={query.isFetching}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${query.isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search by client name, business, account..."
          className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-14 pr-5 text-base text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-[#23C45E] focus:ring-4 focus:ring-[#23C45E]/15"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => {
          const selected = tab === item;
          return (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`rounded-full border px-5 py-2 text-sm font-bold transition-colors ${
                selected
                  ? 'border-[#23C45E] bg-[#23C45E] text-white'
                  : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
              }`}
            >
              {item} ({tabCounts[item]})
            </button>
          );
        })}
      </div>

      {query.isLoading ? (
        <div className="flex items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-white py-20 text-slate-500">
          <LoaderCircle className="h-5 w-5 animate-spin" /> Loading customers...
        </div>
      ) : query.isError ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="font-semibold text-red-800">Unable to load customers.</p>
          <button
            type="button"
            onClick={() => query.refetch()}
            className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Try again
          </button>
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-slate-300 bg-white py-20 text-center">
          <Users className="h-10 w-10 text-slate-300" />
          <p className="font-semibold text-slate-700">No customers found</p>
          <p className="text-sm text-slate-500">
            {search ? 'Try a different search term.' : 'There are no customers in this category.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((customer) => {
            const style = STATUS_STYLES[customer.status];
            const digits = customer.phone.replace(/[^\d]/g, '');
            const dial = customer.phone.replace(/[^\d+]/g, '');
            const showPlanBlock =
              customer.plan || customer.startDate || customer.endDate || customer.commission !== null;
            return (
              <article
                key={customer.key}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#23C45E]/10 text-lg font-black text-[#1AA14D]">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-lg font-bold text-slate-900">{customer.name}</h2>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                      {customer.subtitle && <span className="truncate">{customer.subtitle}</span>}
                      {customer.convertedFromLead && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                          Converted from Lead
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${style.badge}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                    {customer.status}
                  </span>
                </div>

                {showPlanBlock && (
                  <div className="mt-4 grid gap-4 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
                    {customer.plan && <Detail label="Plan" value={customer.plan} />}
                    {customer.startDate && <Detail label="Started" value={formatDate(customer.startDate)} />}
                    {customer.endDate && <Detail label="Expires" value={formatDate(customer.endDate)} />}
                    {customer.commission !== null && (
                      <Detail
                        label="Upcoming Commission"
                        value={formatCurrency(customer.commission)}
                        valueClass="text-[#1AA14D]"
                      />
                    )}
                  </div>
                )}

                <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 md:flex-row md:items-center md:justify-between">
                  <div className="grid min-w-0 flex-1 gap-2 text-sm text-slate-700 sm:grid-cols-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="truncate">{customer.phone || 'N/A'}</span>
                    </span>
                    <span className="flex min-w-0 items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="truncate">{customer.location || 'N/A'}</span>
                    </span>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <a
                      href={digits ? `https://wa.me/${digits}` : undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-disabled={!digits}
                      className={`inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 ${
                        digits ? 'hover:bg-emerald-100' : 'pointer-events-none opacity-50'
                      }`}
                    >
                      <WhatsAppIcon className="h-4 w-4" /> WhatsApp
                    </a>
                    <a
                      href={dial ? `tel:${dial}` : undefined}
                      aria-disabled={!dial}
                      className={`inline-flex items-center gap-2 rounded-xl bg-[#23C45E] px-4 py-2 text-sm font-semibold text-white ${
                        dial ? 'hover:bg-[#1AA14D]' : 'pointer-events-none opacity-50'
                      }`}
                    >
                      <Phone className="h-4 w-4" /> Call
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Detail({ label, value, valueClass = 'text-slate-900' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-0.5 truncate text-sm font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}
