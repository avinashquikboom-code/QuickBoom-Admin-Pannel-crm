'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Building,
  Mail,
  Phone,
  MapPin,
  Globe,
  Star,
  Users,
  Briefcase,
  Calendar,
  Eye,
  Trash2,
  Edit,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  DollarSign,
  Layers,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  AdminPageHero,
  AdminStatCard,
  AdminFormDrawer,
  AdminPagination,
  CompanyDetailsDrawer,
} from '@/components/admin';
import { getErrorMessage } from '@/lib/utils';

export default function CompaniesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [assignedFilter, setAssignedFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Modals & Drawers
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isGooglePlacesOpen, setIsGooglePlacesOpen] = useState(false);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isAddDealOpen, setIsAddDealOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [viewingCompanyId, setViewingCompanyId] = useState<number | string | null>(null);

  // Google Places Search State
  const [googleQuery, setGoogleQuery] = useState('');
  const [googleLocation, setGoogleLocation] = useState('Mumbai, Maharashtra');
  const [placeResults, setPlaceResults] = useState<any[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);

  // Form State for Company
  const [form, setForm] = useState({
    id: '',
    name: '',
    domain: '',
    website: '',
    industry: '',
    category: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    postalCode: '',
    latitude: 0,
    longitude: 0,
    googlePlaceId: '',
    rating: 0,
    reviewCount: 0,
    source: 'MANUAL',
    status: 'ACTIVE',
    notes: '',
  });

  // Add Contact Form State
  const [contactForm, setContactForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    designation: '',
  });

  // Add Deal Form State
  const [dealForm, setDealForm] = useState({
    title: '',
    amount: 150000,
    expectedClosing: '',
    notes: '',
  });

  // 1. Fetch Companies
  const { data: companiesResponse, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-companies-list', search, industryFilter, statusFilter, assignedFilter, page, pageSize],
    queryFn: async () => {
      try {
        const res: any = await api.get('/companies', {
          params: {
            search: search || undefined,
            industry: industryFilter !== 'ALL' ? industryFilter : undefined,
            status: statusFilter !== 'ALL' ? statusFilter : undefined,
            page,
            limit: pageSize,
          },
        });
        const items = res?.data?.data || res?.data?.items || res?.data || res?.items || (Array.isArray(res) ? res : []);
        const pagination = res?.pagination || res?.meta || res?.data?.pagination || res?.data?.meta || {
          page,
          pageSize,
          total: Array.isArray(items) ? items.length : 0,
          totalPages: 1,
        };
        return {
          items: Array.isArray(items) ? items : [],
          pagination: {
            page: Number(pagination.page) || page,
            pageSize: Number(pagination.pageSize || pagination.limit) || pageSize,
            total: Number(pagination.total) || (Array.isArray(items) ? items.length : 0),
            totalPages: Number(pagination.totalPages) || 1,
          },
        };
      } catch {
        return { items: [], pagination: { page: 1, pageSize, total: 0, totalPages: 1 } };
      }
    },
  });

  const companies: any[] = companiesResponse?.items || [];
  const pagination = companiesResponse?.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 1 };

  // 2. Fetch Metrics
  const { data: metricsData } = useQuery({
    queryKey: ['admin-companies-metrics'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/companies/metrics');
        return res?.data || res;
      } catch {
        return null;
      }
    },
  });

  // 3. Fetch Employees for assignment
  const { data: employeesData } = useQuery({
    queryKey: ['admin-employees-dropdown'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/employees');
        return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
  });

  const employees: any[] = Array.isArray(employeesData) ? employeesData : [];

  const metrics = {
    total: metricsData?.total ?? companies.length,
    active: metricsData?.active ?? companies.filter((c) => c.status === 'ACTIVE').length,
    new: metricsData?.new ?? companies.length,
    withOpenDeals: metricsData?.withOpenDeals ?? companies.filter((c) => c.deals?.length > 0).length,
  };

  // Google Places Search
  const handleSearchGooglePlaces = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleQuery.trim()) return;

    setIsSearchingPlaces(true);
    try {
      const res: any = await api.post('/data-capture/extract', {
        query: `${googleQuery} in ${googleLocation}`,
        source: 'GOOGLE_MAPS',
        limit: 10,
      });

      const records = res?.data?.records || res?.records || [];
      setPlaceResults(records);
      if (records.length === 0) {
        toast('No matching places found. Try another search query.');
      }
    } catch (err) {
      toast.error('Failed to query Google Places API');
    } finally {
      setIsSearchingPlaces(false);
    }
  };

  // Import from Google Place
  const handleImportPlace = (place: any) => {
    setForm({
      id: '',
      name: place.title || place.name || 'New Company',
      domain: place.website ? place.website.replace(/^https?:\/\//, '') : '',
      website: place.website || '',
      industry: place.category || 'Commercial Services',
      category: place.category || '',
      phone: place.phone || '',
      email: place.email || '',
      address: place.address || '',
      city: place.city || 'Mumbai',
      state: place.state || 'Maharashtra',
      country: place.country || 'India',
      postalCode: place.postalCode || '',
      latitude: place.latitude || 0,
      longitude: place.longitude || 0,
      googlePlaceId: place.googlePlaceId || place.placeId || '',
      rating: place.rating || 0,
      reviewCount: place.reviewCount || 0,
      source: 'GOOGLE_PLACES',
      status: 'ACTIVE',
      notes: `Imported from Google Places. Rating: ${place.rating || 'N/A'} (${place.reviewCount || 0} reviews).`,
    });
    setIsGooglePlacesOpen(false);
    setIsDrawerOpen(true);
  };

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim() || 'Company Name',
        domain: form.domain.trim() || undefined,
        website: form.website.trim() || undefined,
        industry: form.industry.trim() || undefined,
        category: form.category.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
        country: form.country.trim() || 'India',
        postalCode: form.postalCode.trim() || undefined,
        latitude: form.latitude ? Number(form.latitude) : undefined,
        longitude: form.longitude ? Number(form.longitude) : undefined,
        googlePlaceId: form.googlePlaceId.trim() || undefined,
        rating: form.rating ? Number(form.rating) : undefined,
        reviewCount: form.reviewCount ? Number(form.reviewCount) : undefined,
        source: form.source || 'MANUAL',
        status: form.status || 'ACTIVE',
        notes: form.notes.trim() || undefined,
      };

      if (form.id) {
        return api.patch(`/companies/${form.id}`, payload);
      } else {
        return api.post('/companies', payload);
      }
    },
    onSuccess: () => {
      toast.success(form.id ? 'Company updated' : 'Company created');
      setIsDrawerOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['admin-companies-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-companies-metrics'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number | string) => {
      return api.delete(`/companies/${id}`);
    },
    onSuccess: () => {
      toast.success('Company archived');
      queryClient.invalidateQueries({ queryKey: ['admin-companies-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-companies-metrics'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Add Contact to Company Mutation
  const addContactMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCompany) return;
      return api.post('/contacts', {
        firstName: contactForm.firstName.trim() || 'Stakeholder',
        lastName: contactForm.lastName.trim() || '',
        email: contactForm.email.trim() || undefined,
        phone: contactForm.phone.trim() || undefined,
        designation: contactForm.designation.trim() || 'Representative',
        companyId: String(selectedCompany.id),
      });
    },
    onSuccess: () => {
      toast.success('Contact added to company');
      setIsAddContactOpen(false);
      setContactForm({ firstName: '', lastName: '', email: '', phone: '', designation: '' });
      queryClient.invalidateQueries({ queryKey: ['admin-companies-list'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Add Deal to Company Mutation
  const addDealMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCompany) return;
      return api.post('/deals', {
        title: dealForm.title.trim() || `${selectedCompany.name} Deal`,
        amount: Number(dealForm.amount),
        companyId: String(selectedCompany.id),
        expectedClosing: dealForm.expectedClosing ? new Date(dealForm.expectedClosing).toISOString() : undefined,
        notes: dealForm.notes || undefined,
      });
    },
    onSuccess: () => {
      toast.success('Deal created for company');
      setIsAddDealOpen(false);
      setDealForm({ title: '', amount: 150000, expectedClosing: '', notes: '' });
      queryClient.invalidateQueries({ queryKey: ['admin-companies-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-companies-metrics'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const resetForm = () => {
    setForm({
      id: '',
      name: '',
      domain: '',
      website: '',
      industry: '',
      category: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: '',
      country: 'India',
      postalCode: '',
      latitude: 0,
      longitude: 0,
      googlePlaceId: '',
      rating: 0,
      reviewCount: 0,
      source: 'MANUAL',
      status: 'ACTIVE',
      notes: '',
    });
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (comp: any) => {
    setSelectedCompany(comp);
    setForm({
      id: String(comp.id),
      name: comp.name || '',
      domain: comp.domain || '',
      website: comp.website || '',
      industry: comp.industry || '',
      category: comp.category || '',
      phone: comp.phone || '',
      email: comp.email || '',
      address: comp.address || '',
      city: comp.city || '',
      state: comp.state || '',
      country: comp.country || 'India',
      postalCode: comp.postalCode || '',
      latitude: comp.latitude || 0,
      longitude: comp.longitude || 0,
      googlePlaceId: comp.googlePlaceId || '',
      rating: comp.rating || 0,
      reviewCount: comp.reviewCount || 0,
      source: comp.source || 'MANUAL',
      status: comp.status || 'ACTIVE',
      notes: comp.notes || '',
    });
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* 1. HERO CARD */}
      <AdminPageHero
        badge={{
          text: 'ACCOUNT MANAGEMENT',
          icon: Building,
          variant: 'emerald',
        }}
        title="Companies"
        description="Manage corporate accounts, client organizations, Google Places data and account deals."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-2.5 bg-white/10 hover:bg-white/15 text-white rounded-2xl border border-white/10 text-xs font-black transition-all cursor-pointer backdrop-blur-xs disabled:opacity-50 active:scale-95"
              title="Refresh companies"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-[#23C45E]' : ''}`} />
            </button>

            <button
              onClick={() => setIsGooglePlacesOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 font-bold rounded-2xl border border-blue-400/30 text-xs transition-all cursor-pointer active:scale-95"
            >
              <Globe className="w-4 h-4 text-blue-400" />
              <span>Search Google Places</span>
            </button>

            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-2xl text-xs shadow-md shadow-[#23C45E]/20 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Company</span>
            </button>
          </div>
        }
      />

      {/* 2. KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <AdminStatCard
          title="Total Accounts"
          value={isLoading ? '...' : metrics.total}
          description="In corporate database"
          icon={Building}
          iconBg="primary"
        />
        <AdminStatCard
          title="Active Accounts"
          value={isLoading ? '...' : metrics.active}
          description="Current client organizations"
          icon={CheckCircle2}
          iconBg="primary"
        />
        <AdminStatCard
          title="New Accounts"
          value={isLoading ? '...' : metrics.new}
          description="Added last 30 days"
          icon={Sparkles}
          iconBg="blue"
        />
        <AdminStatCard
          title="Accounts with Deals"
          value={isLoading ? '...' : metrics.withOpenDeals}
          description="Active revenue pipelines"
          icon={DollarSign}
          iconBg="purple"
        />
      </div>

      {/* 3. FILTER TOOLBAR */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search companies by name, city, phone..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
            />
          </div>

          <select
            value={industryFilter}
            onChange={(e) => {
              setIndustryFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
          >
            <option value="ALL">All Industries</option>
            <option value="Technology">Technology / IT</option>
            <option value="Manufacturing">Manufacturing</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Finance">Finance & Banking</option>
            <option value="Retail">Retail & E-commerce</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="PROSPECT">PROSPECT</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>

          <select
            value={assignedFilter}
            onChange={(e) => {
              setAssignedFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
          >
            <option value="ALL">All Account Owners</option>
            {employees.map((emp) => (
              <option key={emp.id} value={String(emp.id)}>
                {emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`} ({emp.employeeCode})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. MAIN COMPANIES TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-5">Company Account</th>
                <th className="py-4 px-4">Industry / Category</th>
                <th className="py-4 px-4">Location</th>
                <th className="py-4 px-4">Contacts</th>
                <th className="py-4 px-4">Open Deals</th>
                <th className="py-4 px-4">Account Owner</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400 font-bold animate-pulse">
                    Loading corporate accounts...
                  </td>
                </tr>
              ) : companies.length > 0 ? (
                companies.map((comp) => {
                  const contactCount = comp.contacts?.length || 0;
                  const dealsCount = comp.deals?.length || 0;

                  return (
                    <tr key={comp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200/60 flex items-center justify-center font-black shrink-0 shadow-2xs">
                            {comp.name?.[0] || 'C'}
                          </div>
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => setViewingCompanyId(comp.id)}
                              className="font-extrabold text-slate-900 hover:text-purple-600 text-sm truncate block transition-colors text-left cursor-pointer"
                            >
                              {comp.name}
                            </button>
                            <div className="flex items-center gap-2 mt-0.5">
                              {comp.rating ? (
                                <span className="flex items-center gap-0.5 text-[10px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded-md">
                                  <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> {comp.rating}
                                </span>
                              ) : null}
                              {comp.phone && <span className="text-slate-400 text-[11px] font-medium">{comp.phone}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <p className="font-bold text-slate-800">{comp.industry || 'General Industry'}</p>
                        {comp.category && <p className="text-slate-400 text-[11px]">{comp.category}</p>}
                      </td>

                      <td className="py-4 px-4">
                        <p className="font-bold text-slate-800 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" /> {comp.city || 'India'}
                        </p>
                        {comp.state && <p className="text-slate-400 text-[11px]">{comp.state}</p>}
                      </td>

                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-extrabold text-xs">
                          <Users className="w-3 h-3 text-slate-400" /> {contactCount}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 font-extrabold text-xs">
                          <DollarSign className="w-3 h-3 text-blue-500" /> {dealsCount} Deals
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        {comp.assignedTo ? (
                          <span className="font-bold text-slate-800 text-xs">
                            {comp.assignedTo.firstName} {comp.assignedTo.lastName}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold text-xs italic">Unassigned</span>
                        )}
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingCompanyId(comp.id)}
                            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-purple-600 transition-colors cursor-pointer"
                            title="View Company Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedCompany(comp);
                              setIsAddContactOpen(true);
                            }}
                            className="p-2 hover:bg-emerald-50 rounded-xl text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer"
                            title="Add Contact Person"
                          >
                            <Users className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedCompany(comp);
                              setDealForm({ title: `${comp.name} Enterprise Deal`, amount: 200000, expectedClosing: '', notes: '' });
                              setIsAddDealOpen(true);
                            }}
                            className="p-2 hover:bg-blue-50 rounded-xl text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                            title="Add Deal"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(comp)}
                            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                            title="Edit Company"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`Archive company "${comp.name}"?`)) {
                                deleteMutation.mutate(comp.id);
                              }
                            }}
                            className="p-2 hover:bg-rose-50 rounded-xl text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Archive Company"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <p className="font-bold text-sm text-slate-600">No companies found</p>
                    <p className="text-xs text-slate-400 mt-1">Add companies manually or import directly from Google Places</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination */}
        <AdminPagination
          page={page}
          pageSize={pageSize}
          total={pagination.total}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          disabled={isLoading}
        />
      </div>

      {/* 5. ADD / EDIT COMPANY DRAWER */}
      <AdminFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={form.id ? 'Edit Company Account' : 'Add New Company'}
        subtitle="Manage company profile, locations, contact points, and owner assignments"
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-5"
        >
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-purple-600" /> Organization Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Apex Tech Solutions Pvt Ltd"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Industry</label>
                <input
                  type="text"
                  value={form.industry}
                  onChange={(e) => setForm({ ...form, industry: e.target.value })}
                  placeholder="e.g. Information Technology"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Category / Domain</label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="e.g. Enterprise Cloud ERP"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Official Website</label>
                <input
                  type="text"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="e.g. https://apextech.com"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Official Phone</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="e.g. +91 22 6789 0123"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#23C45E]" /> Location & Address
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Street Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="e.g. Tower 3, Business Bay, BKC"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="e.g. Mumbai"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">State</label>
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  placeholder="e.g. Maharashtra"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-600" /> Status & Notes
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PROSPECT">PROSPECT</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Internal Account Notes</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Key corporate intelligence or requirements..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="px-5 py-2 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-xl text-xs cursor-pointer shadow-md shadow-[#23C45E]/20"
            >
              {saveMutation.isPending ? 'Saving...' : form.id ? 'Save Changes' : 'Create Company'}
            </button>
          </div>
        </form>
      </AdminFormDrawer>

      {/* 6. GOOGLE PLACES SEARCH DRAWER */}
      <AdminFormDrawer
        isOpen={isGooglePlacesOpen}
        onClose={() => setIsGooglePlacesOpen(false)}
        title="Search Google Places"
        subtitle="Extract corporate entities, contact details, and locations directly from Google Maps"
        size="lg"
      >
        <div className="space-y-4">
          <form onSubmit={handleSearchGooglePlaces} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Company / Keyword *</label>
                <input
                  type="text"
                  required
                  value={googleQuery}
                  onChange={(e) => setGoogleQuery(e.target.value)}
                  placeholder="e.g. Tech parks, Software companies"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Location / City *</label>
                <input
                  type="text"
                  required
                  value={googleLocation}
                  onChange={(e) => setGoogleLocation(e.target.value)}
                  placeholder="e.g. BKC, Mumbai"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSearchingPlaces}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>{isSearchingPlaces ? 'Extracting Places...' : 'Search Google Places API'}</span>
            </button>
          </form>

          {/* Place Results */}
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {placeResults.map((place, idx) => (
              <div
                key={idx}
                className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between text-xs hover:border-blue-400 transition-colors"
              >
                <div className="space-y-1 min-w-0 pr-4">
                  <p className="font-black text-slate-900 text-sm truncate">{place.title || place.name}</p>
                  <p className="text-slate-500 truncate flex items-center gap-1 font-medium">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" /> {place.address || 'Address available'}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 font-semibold">
                    {place.rating && (
                      <span className="text-amber-600 font-bold flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {place.rating} ({place.reviewCount || 0})
                      </span>
                    )}
                    {place.phone && <span>Phone: {place.phone}</span>}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleImportPlace(place)}
                  className="px-4 py-2 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-xl text-xs shrink-0 cursor-pointer shadow-xs"
                >
                  Import
                </button>
              </div>
            ))}
          </div>
        </div>
      </AdminFormDrawer>

      {/* 7. ADD CONTACT MODAL */}
      <AdminFormDrawer
        isOpen={isAddContactOpen}
        onClose={() => setIsAddContactOpen(false)}
        title="Add Contact Person"
        subtitle={selectedCompany ? `For Company: ${selectedCompany.name}` : ''}
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addContactMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">First Name *</label>
            <input
              type="text"
              required
              value={contactForm.firstName}
              onChange={(e) => setContactForm({ ...contactForm, firstName: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Last Name</label>
            <input
              type="text"
              value={contactForm.lastName}
              onChange={(e) => setContactForm({ ...contactForm, lastName: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Designation</label>
            <input
              type="text"
              value={contactForm.designation}
              onChange={(e) => setContactForm({ ...contactForm, designation: e.target.value })}
              placeholder="e.g. Procurement Lead, Director"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Phone</label>
            <input
              type="text"
              value={contactForm.phone}
              onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
              placeholder="+91 98200 12345"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Email</label>
            <input
              type="email"
              value={contactForm.email}
              onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
              placeholder="contact@company.com"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsAddContactOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addContactMutation.isPending}
              className="px-5 py-2 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-xl text-xs cursor-pointer shadow-md shadow-[#23C45E]/20"
            >
              {addContactMutation.isPending ? 'Adding...' : 'Add Contact'}
            </button>
          </div>
        </form>
      </AdminFormDrawer>

      {/* 8. ADD DEAL MODAL */}
      <AdminFormDrawer
        isOpen={isAddDealOpen}
        onClose={() => setIsAddDealOpen(false)}
        title="Add Deal"
        subtitle={selectedCompany ? `For Company: ${selectedCompany.name}` : ''}
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addDealMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Deal Title *</label>
            <input
              type="text"
              required
              value={dealForm.title}
              onChange={(e) => setDealForm({ ...dealForm, title: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Deal Value (₹) *</label>
            <input
              type="number"
              required
              value={dealForm.amount}
              onChange={(e) => setDealForm({ ...dealForm, amount: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Expected Closing Date</label>
            <input
              type="date"
              value={dealForm.expectedClosing}
              onChange={(e) => setDealForm({ ...dealForm, expectedClosing: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsAddDealOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addDealMutation.isPending}
              className="px-5 py-2 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-xl text-xs cursor-pointer shadow-md shadow-[#23C45E]/20"
            >
              {addDealMutation.isPending ? 'Creating...' : 'Create Deal'}
            </button>
          </div>
        </form>
      </AdminFormDrawer>

      {/* Company Details Right-Side Drawer */}
      <CompanyDetailsDrawer
        companyId={viewingCompanyId}
        isOpen={!!viewingCompanyId}
        onClose={() => setViewingCompanyId(null)}
        onAddContact={(c) => {
          setSelectedCompany(c);
          setIsAddContactOpen(true);
        }}
        onAddDeal={(c) => {
          setSelectedCompany(c);
          setIsAddDealOpen(true);
        }}
      />
    </div>
  );
}
