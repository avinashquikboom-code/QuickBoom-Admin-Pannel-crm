'use client';

import React, { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Search,
  Users,
  Calendar,
  Eye,
  CheckCircle,
  XCircle,
  X,
  Power,
  Layers,
  MapPin,
  Compass,
  Navigation,
  Copy,
  ExternalLink,
  ShieldCheck,
  Radio,
  Sliders,
  Check,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { AdminPageHeader, AdminButton, AdminFormDrawer } from '@/components/admin';
import { MapLocationPicker } from '@/components/admin/maps/MapLocationPicker';

interface Office {
  id: number;
  customerId: number;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  isActive: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  employeesCount: number;
  attendancesCount: number;
  employees?: Array<{
    id: number;
    employeeCode: string;
    name: string;
    email: string;
    designation: string;
    department: string;
    status: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function OfficeManagementPage() {
  const queryClient = useQueryClient();

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Drawer & Modal States
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
  const [selectedOffice, setSelectedOffice] = useState<Office | null>(null);
  const [deleteConfirmOffice, setDeleteConfirmOffice] = useState<Office | null>(null);

  // Form State for Add / Edit
  const [formState, setFormState] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    postalCode: '',
    latitude: 19.076,
    longitude: 72.8777,
    radiusMeters: 200,
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  // Fetch offices list from backend API
  const {
    data: officesResponse,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['admin-offices', searchTerm, statusFilter],
    queryFn: async () => {
      const params: any = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res: any = await api.get('/offices', { params });
      return res?.data || res || [];
    },
  });

  // Fetch full details for viewed office (including assigned employees)
  const { data: viewedOfficeDetails, isLoading: isViewLoading } = useQuery({
    queryKey: ['admin-office-details', selectedOffice?.id],
    queryFn: async () => {
      if (!selectedOffice?.id) return null;
      const res: any = await api.get(`/offices/${selectedOffice.id}`);
      return res?.data || res || null;
    },
    enabled: Boolean(selectedOffice?.id && isViewDrawerOpen),
  });

  const offices: Office[] = useMemo(() => {
    return Array.isArray(officesResponse)
      ? officesResponse
      : officesResponse?.data || [];
  }, [officesResponse]);

  // Summary Metrics
  const stats = useMemo(() => {
    const total = offices.length;
    const active = offices.filter((o) => o.isActive).length;
    const inactive = total - active;
    const totalStaff = offices.reduce((sum, o) => sum + (o.employeesCount || 0), 0);
    return { total, active, inactive, totalStaff };
  }, [offices]);

  // Create / Update Office Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const trimmedName = formState.name.trim();
      if (!trimmedName) {
        throw new Error('Office name is required');
      }

      if (isNaN(formState.latitude) || formState.latitude < -90 || formState.latitude > 90) {
        throw new Error('Please provide a valid latitude between -90 and 90');
      }

      if (isNaN(formState.longitude) || formState.longitude < -180 || formState.longitude > 180) {
        throw new Error('Please provide a valid longitude between -180 and 180');
      }

      if (isNaN(formState.radiusMeters) || formState.radiusMeters <= 0) {
        throw new Error('Attendance radius must be greater than 0 meters');
      }

      const payload = {
        name: trimmedName,
        code: formState.code.trim().toUpperCase() || undefined,
        address: formState.address.trim() || undefined,
        city: formState.city.trim() || undefined,
        state: formState.state.trim() || undefined,
        country: formState.country.trim() || 'India',
        postalCode: formState.postalCode.trim() || undefined,
        latitude: Number(formState.latitude),
        longitude: Number(formState.longitude),
        radiusMeters: Number(formState.radiusMeters),
        isActive: formState.status === 'ACTIVE',
      };

      if (selectedOffice && isFormDrawerOpen) {
        return api.patch(`/offices/${selectedOffice.id}`, payload);
      } else {
        return api.post('/offices', payload);
      }
    },
    onSuccess: () => {
      toast.success(
        selectedOffice && isFormDrawerOpen
          ? 'Office location updated successfully!'
          : 'Office location created successfully!'
      );
      queryClient.invalidateQueries({ queryKey: ['admin-offices'] });
      setIsFormDrawerOpen(false);
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message || err?.message || 'Failed to save office';
      toast.error(typeof msg === 'string' ? msg : 'Validation error');
    },
  });

  // Toggle Active / Inactive Status Mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ office, newStatus }: { office: Office; newStatus: boolean }) => {
      return api.patch(`/offices/${office.id}/status`, { isActive: newStatus });
    },
    onSuccess: (_, variables) => {
      toast.success(
        `Office "${variables.office.name}" is now ${variables.newStatus ? 'ACTIVE' : 'INACTIVE'}`
      );
      queryClient.invalidateQueries({ queryKey: ['admin-offices'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to update status';
      toast.error(typeof msg === 'string' ? msg : 'Error updating status');
    },
  });

  // Delete Office Mutation
  const deleteMutation = useMutation({
    mutationFn: async (officeId: number) => {
      return api.delete(`/offices/${officeId}`);
    },
    onSuccess: () => {
      toast.success('Office deleted / deactivated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-offices'] });
      setDeleteConfirmOffice(null);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to delete office';
      toast.error(typeof msg === 'string' ? msg : 'Error deleting office');
    },
  });

  // Open Form Drawer for New Office
  const handleOpenAdd = () => {
    setSelectedOffice(null);
    setFormState({
      name: '',
      code: '',
      address: '',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      postalCode: '',
      latitude: 19.076,
      longitude: 72.8777,
      radiusMeters: 200,
      status: 'ACTIVE',
    });
    setIsFormDrawerOpen(true);
  };

  // Open Form Drawer for Editing
  const handleOpenEdit = (office: Office) => {
    setSelectedOffice(office);
    setFormState({
      name: office.name,
      code: office.code || '',
      address: office.address || '',
      city: office.city || '',
      state: office.state || '',
      country: office.country || 'India',
      postalCode: office.postalCode || '',
      latitude: office.latitude || 19.076,
      longitude: office.longitude || 72.8777,
      radiusMeters: office.radiusMeters || 200,
      status: office.isActive ? 'ACTIVE' : 'INACTIVE',
    });
    setIsFormDrawerOpen(true);
  };

  // Open View Details Drawer
  const handleOpenView = (office: Office) => {
    setSelectedOffice(office);
    setIsViewDrawerOpen(true);
  };

  // Quick preset radius setter
  const handleSetPresetRadius = (meters: number) => {
    setFormState((prev) => ({ ...prev, radiusMeters: meters }));
  };

  const copyCoordinates = (lat: number, lng: number) => {
    navigator.clipboard.writeText(`${lat}, ${lng}`);
    toast.success('Coordinates copied to clipboard!');
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* 1. STANDARD PAGE HEADER */}
      <AdminPageHeader
        title="Office & Geofence Management"
        description="Configure office branches, exact GPS coordinates, and allowed punch radius in meters for authoritative mobile attendance validation."
        icon={Building2}
        iconColor="text-[#1AA14D]"
        badge={{
          text: 'HRMS • GEO-FENCING & BRANCHES',
          icon: Building2,
          variant: 'emerald',
        }}
        breadcrumbs={[
          { label: 'Workforce', href: '/employees' },
          { label: 'Offices' },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <AdminButton
              variant="outline"
              size="md"
              icon={RefreshCw}
              loading={isFetching}
              onClick={() => refetch()}
              title="Refresh"
            >
              Refresh
            </AdminButton>

            <AdminButton
              variant="primary"
              size="md"
              icon={Plus}
              onClick={handleOpenAdd}
            >
              Add New Office
            </AdminButton>
          </div>
        }
      />

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Total Offices</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.total}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black text-emerald-600 uppercase tracking-wider">Active Geofences</p>
            <h3 className="text-2xl font-black text-emerald-700 mt-1">{stats.active}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Inactive Offices</p>
            <h3 className="text-2xl font-black text-slate-500 mt-1">{stats.inactive}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center">
            <Power className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black text-blue-600 uppercase tracking-wider">Assigned Staff</p>
            <h3 className="text-2xl font-black text-blue-700 mt-1">{stats.totalStaff}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search office by name, code, city, address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#23C45E] focus:outline-none text-slate-900 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ACTIVE')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'ACTIVE'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('INACTIVE')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'INACTIVE'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Inactive
            </button>
          </div>
        </div>
      </div>

      {/* Offices Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4 sm:px-6">Office / Branch</th>
                <th className="py-3.5 px-4">Code</th>
                <th className="py-3.5 px-4">Address / City</th>
                <th className="py-3.5 px-4">GPS Coordinates</th>
                <th className="py-3.5 px-4">Allowed Radius</th>
                <th className="py-3.5 px-4">Staff</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-7 h-7 border-3 border-[#23C45E] border-t-transparent rounded-full animate-spin" />
                      <span className="font-bold text-xs">Loading office configurations...</span>
                    </div>
                  </td>
                </tr>
              ) : offices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2 max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-1">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <p className="font-black text-slate-800 text-base">No Offices Found</p>
                      <p className="text-xs text-slate-500">
                        {searchTerm
                          ? `No office records matching "${searchTerm}".`
                          : 'Get started by creating your first company office branch.'}
                      </p>
                      <button
                        type="button"
                        onClick={handleOpenAdd}
                        className="mt-3 px-4 py-2 rounded-xl bg-[#23C45E] text-white text-xs font-bold hover:bg-[#1fa951] transition-all cursor-pointer shadow-sm"
                      >
                        + Add First Office
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                offices.map((office) => (
                  <tr
                    key={office.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Name */}
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold shrink-0 group-hover:border-[#23C45E]/40 transition-colors">
                          <Building2 className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 flex items-center gap-2">
                            <span>{office.name}</span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-medium">
                            Added on {new Date(office.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Code */}
                    <td className="py-4 px-4">
                      {office.code ? (
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-mono text-[11px] font-extrabold border border-slate-200">
                          {office.code}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs italic">--</span>
                      )}
                    </td>

                    {/* Address / City */}
                    <td className="py-4 px-4">
                      <div className="max-w-[200px]">
                        <p className="font-semibold text-slate-800 text-xs truncate">
                          {office.city || office.address || 'India'}
                        </p>
                        {office.address && office.city && (
                          <p className="text-[11px] text-slate-400 truncate">
                            {office.address}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* GPS Coordinates */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-700 font-semibold bg-slate-50 px-2 py-1 rounded border border-slate-200">
                          {office.latitude.toFixed(4)}, {office.longitude.toFixed(4)}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyCoordinates(office.latitude, office.longitude)}
                          className="p-1 text-slate-400 hover:text-slate-800 rounded hover:bg-slate-100 transition-colors"
                          title="Copy Coordinates"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Radius */}
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                        <Radio className="w-3 h-3 text-emerald-500" />
                        {office.radiusMeters} m
                      </span>
                    </td>

                    {/* Staff */}
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        {office.employeesCount ?? 0} Staff
                      </span>
                    </td>

                    {/* Status Toggle */}
                    <td className="py-4 px-4">
                      <button
                        type="button"
                        onClick={() =>
                          toggleStatusMutation.mutate({
                            office,
                            newStatus: !office.isActive,
                          })
                        }
                        disabled={toggleStatusMutation.isPending}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
                          office.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                        }`}
                        title="Click to toggle Active / Inactive"
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            office.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        <span>{office.isActive ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenView(office)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          title="View Details & Map"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(office)}
                          className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors"
                          title="Edit Office & Coordinates"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteConfirmOffice(office)}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                          title="Delete / Deactivate Office"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── ADD / EDIT OFFICE FORM DRAWER ─────────────────────────────────── */}
      <AdminFormDrawer
        isOpen={isFormDrawerOpen}
        onClose={() => setIsFormDrawerOpen(false)}
        title={selectedOffice ? 'Edit Office Location' : 'Add New Office Branch'}
        subtitle={
          selectedOffice
            ? `Update details and coordinates for "${selectedOffice.name}".`
            : 'Configure name, address, GPS location, and attendance geofencing radius.'
        }
        maxWidth="max-w-2xl"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-6"
        >
          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
              <Building2 className="w-4 h-4 text-[#23C45E]" />
              <span>Office Identification</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Office Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mumbai Head Office"
                  value={formState.name}
                  onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#23C45E] focus:outline-none font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Office Code (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. MUM-HQ"
                  value={formState.code}
                  onChange={(e) =>
                    setFormState({ ...formState, code: e.target.value.toUpperCase() })
                  }
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#23C45E] focus:outline-none font-mono font-bold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Street Address (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Plot 4, G-Block, Bandra Kurla Complex"
                value={formState.address}
                onChange={(e) => setFormState({ ...formState, address: e.target.value })}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#23C45E] focus:outline-none font-medium"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">City</label>
                <input
                  type="text"
                  placeholder="Mumbai"
                  value={formState.city}
                  onChange={(e) => setFormState({ ...formState, city: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#23C45E] focus:outline-none font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">State</label>
                <input
                  type="text"
                  placeholder="Maharashtra"
                  value={formState.state}
                  onChange={(e) => setFormState({ ...formState, state: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#23C45E] focus:outline-none font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Country</label>
                <input
                  type="text"
                  placeholder="India"
                  value={formState.country}
                  onChange={(e) => setFormState({ ...formState, country: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#23C45E] focus:outline-none font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Postal Code</label>
                <input
                  type="text"
                  placeholder="400051"
                  value={formState.postalCode}
                  onChange={(e) => setFormState({ ...formState, postalCode: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#23C45E] focus:outline-none font-medium"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Interactive Google Map Location Picker */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#23C45E]" />
                <span>GPS Location & Geofence Picker</span>
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">
                Live Google Maps SDK
              </span>
            </div>

            <MapLocationPicker
              latitude={formState.latitude}
              longitude={formState.longitude}
              radiusMeters={formState.radiusMeters}
              interactive={true}
              height="300px"
              showRadius={true}
              onChange={({ latitude, longitude, address }) => {
                setFormState((prev) => ({
                  ...prev,
                  latitude,
                  longitude,
                  ...(address && !prev.address ? { address } : {}),
                }));
              }}
            />

            {/* Latitude & Longitude Manual Numeric Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Latitude (-90 to 90) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={formState.latitude}
                  onChange={(e) =>
                    setFormState({ ...formState, latitude: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#23C45E] focus:outline-none font-mono font-bold text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Longitude (-180 to 180) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={formState.longitude}
                  onChange={(e) =>
                    setFormState({ ...formState, longitude: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#23C45E] focus:outline-none font-mono font-bold text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Attendance Radius Configuration */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
              <Radio className="w-4 h-4 text-[#23C45E]" />
              <span>Attendance Geofence Radius</span>
            </h4>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Allowed Punch Radius (Meters) <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {formState.radiusMeters} meters
                </span>
              </div>

              <input
                type="number"
                min={1}
                max={50000}
                required
                value={formState.radiusMeters}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    radiusMeters: parseInt(e.target.value, 10) || 200,
                  })
                }
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#23C45E] focus:outline-none font-bold"
              />

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <span className="text-[11px] font-bold text-slate-400 mr-1">Presets:</span>
                {[50, 100, 200, 500, 1000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleSetPresetRadius(preset)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      formState.radiusMeters === preset
                        ? 'bg-[#23C45E] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {preset}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: Office Status */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <p className="text-xs font-black text-slate-900">Office Operational Status</p>
              <p className="text-[11px] text-slate-500 font-medium">
                Active offices are visible to employees for attendance validation.
              </p>
            </div>

            <div className="flex items-center p-1 bg-white rounded-xl border border-slate-200 text-xs font-bold shadow-2xs">
              <button
                type="button"
                onClick={() => setFormState({ ...formState, status: 'ACTIVE' })}
                className={`px-3 py-1 rounded-lg transition-all ${
                  formState.status === 'ACTIVE'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setFormState({ ...formState, status: 'INACTIVE' })}
                className={`px-3 py-1 rounded-lg transition-all ${
                  formState.status === 'INACTIVE'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                Inactive
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsFormDrawerOpen(false)}
              className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="px-6 py-2.5 bg-[#23C45E] hover:bg-[#1fa951] text-white text-xs sm:text-sm font-black rounded-xl shadow-lg shadow-[#23C45E]/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              {saveMutation.isPending && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>{selectedOffice ? 'Save Changes' : 'Create Office'}</span>
            </button>
          </div>
        </form>
      </AdminFormDrawer>

      {/* ── VIEW OFFICE DETAILS DRAWER ────────────────────────────────────── */}
      <AdminFormDrawer
        isOpen={isViewDrawerOpen}
        onClose={() => setIsViewDrawerOpen(false)}
        title={selectedOffice?.name || 'Office Details'}
        subtitle={`Branch Geofence details and assigned staff.`}
        maxWidth="max-w-2xl"
      >
        {selectedOffice && (
          <div className="space-y-6">
            {/* Header info badge card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">{selectedOffice.name}</h3>
                  <p className="text-xs text-slate-500">
                    {selectedOffice.address || selectedOffice.city || 'No street address specified'}
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-black ${
                    selectedOffice.isActive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {selectedOffice.isActive ? 'Active Geofence' : 'Inactive'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/60 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Code</span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedOffice.code || '--'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Radius</span>
                  <span className="font-extrabold text-emerald-700">
                    {selectedOffice.radiusMeters} m
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Latitude</span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedOffice.latitude.toFixed(4)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Longitude</span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedOffice.longitude.toFixed(4)}
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive Map Preview */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#23C45E]" />
                <span>Geofence Map Preview</span>
              </h4>

              <MapLocationPicker
                latitude={selectedOffice.latitude}
                longitude={selectedOffice.longitude}
                radiusMeters={selectedOffice.radiusMeters}
                interactive={false}
                height="240px"
                showRadius={true}
                onChange={() => {}}
              />
            </div>

            {/* Assigned Staff List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#23C45E]" />
                  <span>Assigned Employees ({viewedOfficeDetails?.employees?.length ?? selectedOffice.employeesCount ?? 0})</span>
                </h4>
              </div>

              {isViewLoading ? (
                <div className="p-8 text-center text-slate-400">
                  <div className="w-6 h-6 border-2 border-[#23C45E] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <span className="text-xs">Loading assigned employees...</span>
                </div>
              ) : viewedOfficeDetails?.employees && viewedOfficeDetails.employees.length > 0 ? (
                <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 overflow-hidden bg-white max-h-60 overflow-y-auto">
                  {viewedOfficeDetails.employees.map((emp: any) => (
                    <div
                      key={emp.id}
                      className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center text-[11px]">
                          {emp.name?.charAt(0) || 'E'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{emp.name}</p>
                          <p className="text-[11px] text-slate-400">
                            {emp.employeeCode} • {emp.designation} ({emp.department})
                          </p>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase">
                        {emp.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                  No employees are currently assigned to this office.
                </div>
              )}
            </div>

            {/* Footer Action */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsViewDrawerOpen(false);
                  handleOpenEdit(selectedOffice);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all"
              >
                Edit Location
              </button>
            </div>
          </div>
        )}
      </AdminFormDrawer>

      {/* ── DELETE / DEACTIVATE CONFIRMATION DIALOG ───────────────────────── */}
      {deleteConfirmOffice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in-50">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-black text-slate-900">
                Delete / Deactivate Office?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to remove <strong>{deleteConfirmOffice.name}</strong>?
                {deleteConfirmOffice.employeesCount > 0 && (
                  <span className="block mt-2 text-amber-700 font-bold bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-[11px]">
                    ⚠️ This office has {deleteConfirmOffice.employeesCount} assigned employees. To preserve attendance history, it will be safely deactivated rather than permanently removed.
                  </span>
                )}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmOffice(null)}
                className="w-full py-2.5 text-xs sm:text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteConfirmOffice.id)}
                className="w-full py-2.5 text-xs sm:text-sm font-black text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {deleteMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Confirm</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
