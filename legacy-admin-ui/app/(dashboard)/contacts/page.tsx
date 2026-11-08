'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Mail,
  Phone,
  Building,
  UserCheck,
  Calendar,
  Eye,
  Trash2,
  Edit,
  Globe,
  RefreshCw,
  Clock,
  CheckCircle2,
  Users,
  Briefcase,
  Layers,
  Sparkles,
  Award,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  AdminPageHeader,
  AdminButton,
  AdminStatCard,
  AdminFormDrawer,
  AdminPagination,
  ContactDetailsDrawer,
  CompanyDetailsDrawer,
} from '@/components/admin';
import { getErrorMessage } from '@/lib/utils';

export default function ContactsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [assignedFilter, setAssignedFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Modals / Drawers
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isVisitDrawerOpen, setIsVisitDrawerOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [viewingContactId, setViewingContactId] = useState<number | string | null>(null);
  const [viewingCompanyId, setViewingCompanyId] = useState<number | string | null>(null);

  // Form State
  const [form, setForm] = useState({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    mobile: '',
    alternateMobile: '',
    designation: '',
    website: '',
    companyId: '',
    source: 'DIRECT',
    status: 'ACTIVE',
    assignedToId: '',
    notes: '',
  });

  // Schedule Visit form
  const [visitForm, setVisitForm] = useState({
    purpose: 'On-site Client Meeting',
    visitType: 'CLIENT_MEETING',
    date: new Date().toISOString().split('T')[0],
    time: '11:00 AM',
    location: '',
    employeeId: '',
    notes: '',
  });

  // 1. Fetch Contacts
  const { data: contactsResponse, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-contacts-list', search, companyFilter, statusFilter, assignedFilter, page, pageSize],
    queryFn: async () => {
      try {
        const res: any = await api.get('/contacts', {
          params: {
            search: search || undefined,
            companyId: companyFilter !== 'ALL' ? companyFilter : undefined,
            status: statusFilter !== 'ALL' ? statusFilter : undefined,
            assignedToId: assignedFilter !== 'ALL' ? assignedFilter : undefined,
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

  const contacts: any[] = contactsResponse?.items || [];
  const pagination = contactsResponse?.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 1 };

  // 2. Fetch Metrics
  const { data: metricsData } = useQuery({
    queryKey: ['admin-contacts-metrics'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/contacts/metrics');
        return res?.data || res;
      } catch {
        return null;
      }
    },
  });

  // 3. Fetch Companies for dropdown
  const { data: companiesData } = useQuery({
    queryKey: ['admin-companies-dropdown'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/companies', { params: { limit: 100 } });
        const items = res?.data?.data || res?.data?.items || res?.data || res;
        return Array.isArray(items) ? items : [];
      } catch {
        return [];
      }
    },
  });

  // 4. Fetch Employees
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

  const companies: any[] = Array.isArray(companiesData) ? companiesData : [];
  const employees: any[] = Array.isArray(employeesData) ? employeesData : [];

  const metrics = {
    total: metricsData?.total ?? contacts.length,
    active: metricsData?.active ?? contacts.filter((c) => c.status === 'ACTIVE').length,
    new: metricsData?.new ?? contacts.length,
    withFollowUps: metricsData?.withFollowUps ?? contacts.filter((c) => c.visits?.length > 0).length,
  };

  // Save Contact Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        firstName: form.firstName.trim() || 'Contact',
        lastName: form.lastName.trim() || '',
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || form.mobile.trim() || undefined,
        mobile: form.mobile.trim() || form.phone.trim() || undefined,
        alternateMobile: form.alternateMobile.trim() || undefined,
        designation: form.designation.trim() || undefined,
        website: form.website.trim() || undefined,
        companyId: form.companyId || undefined,
        source: form.source || 'DIRECT',
        status: form.status || 'ACTIVE',
        assignedToId: form.assignedToId || undefined,
        notes: form.notes.trim() || undefined,
      };

      if (form.id) {
        return api.patch(`/contacts/${form.id}`, payload);
      } else {
        return api.post('/contacts', payload);
      }
    },
    onSuccess: () => {
      toast.success(form.id ? 'Contact updated successfully' : 'Contact created successfully');
      setIsDrawerOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['admin-contacts-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-contacts-metrics'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number | string) => {
      return api.delete(`/contacts/${id}`);
    },
    onSuccess: () => {
      toast.success('Contact archived successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-contacts-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-contacts-metrics'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Schedule Visit Mutation
  const scheduleVisitMutation = useMutation({
    mutationFn: async () => {
      if (!selectedContact) return;
      return api.post('/visits', {
        customerName: `${selectedContact.firstName} ${selectedContact.lastName}`,
        purpose: visitForm.purpose,
        visitType: visitForm.visitType,
        date: new Date(visitForm.date).toISOString(),
        time: visitForm.time,
        location: visitForm.location || selectedContact.company?.address || 'Client Office',
        companyId: selectedContact.companyId ? String(selectedContact.companyId) : undefined,
        contactId: String(selectedContact.id),
        employeeId: visitForm.employeeId || undefined,
        notes: visitForm.notes || undefined,
      });
    },
    onSuccess: () => {
      toast.success('Visit scheduled successfully for contact');
      setIsVisitDrawerOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-contacts-list'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const resetForm = () => {
    setForm({
      id: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      mobile: '',
      alternateMobile: '',
      designation: '',
      website: '',
      companyId: '',
      source: 'DIRECT',
      status: 'ACTIVE',
      assignedToId: '',
      notes: '',
    });
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (contact: any) => {
    setSelectedContact(contact);
    setForm({
      id: String(contact.id),
      firstName: contact.firstName || '',
      lastName: contact.lastName || '',
      email: contact.email || '',
      phone: contact.phone || '',
      mobile: contact.mobile || contact.phone || '',
      alternateMobile: contact.alternateMobile || '',
      designation: contact.designation || '',
      website: contact.website || '',
      companyId: contact.companyId ? String(contact.companyId) : '',
      source: contact.source || 'DIRECT',
      status: contact.status || 'ACTIVE',
      assignedToId: contact.assignedToId ? String(contact.assignedToId) : '',
      notes: contact.notes || '',
    });
    setIsDrawerOpen(true);
  };

  const handleOpenScheduleVisit = (contact: any) => {
    setSelectedContact(contact);
    setVisitForm({
      purpose: 'Client Consultation & Review',
      visitType: 'CLIENT_MEETING',
      date: new Date().toISOString().split('T')[0],
      time: '11:00 AM',
      location: contact.company?.address || contact.company?.city || 'Client HQ',
      employeeId: contact.assignedToId ? String(contact.assignedToId) : '',
      notes: '',
    });
    setIsVisitDrawerOpen(true);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* 1. STANDARD PAGE HEADER */}
      <AdminPageHeader
        title="Contacts"
        description="Manage customer contacts, communication details, relationships and CRM activities."
        icon={Users}
        iconColor="text-[#1AA14D]"
        badge={{
          text: 'CONTACT MANAGEMENT',
          icon: Users,
          variant: 'emerald',
        }}
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Contacts' },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <AdminButton
              variant="outline"
              size="md"
              icon={RefreshCw}
              loading={isFetching}
              onClick={() => refetch()}
              title="Refresh contacts"
            >
              Refresh
            </AdminButton>

            <AdminButton
              variant="primary"
              size="md"
              icon={Plus}
              onClick={handleOpenCreate}
            >
              Add Contact
            </AdminButton>
          </div>
        }
      />

      {/* 2. KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <AdminStatCard
          title="Total Contacts"
          value={isLoading ? '...' : metrics.total}
          description="In CRM address book"
          icon={Users}
          iconBg="primary"
        />
        <AdminStatCard
          title="Active Contacts"
          value={isLoading ? '...' : metrics.active}
          description="Verified stakeholders"
          icon={CheckCircle2}
          iconBg="primary"
        />
        <AdminStatCard
          title="New Contacts"
          value={isLoading ? '...' : metrics.new}
          description="Added last 30 days"
          icon={Sparkles}
          iconBg="blue"
        />
        <AdminStatCard
          title="Contacts with Visits"
          value={isLoading ? '...' : metrics.withFollowUps}
          description="Scheduled CRM touchpoints"
          icon={Clock}
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
              placeholder="Search by name, email, phone..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
            />
          </div>

          <select
            value={companyFilter}
            onChange={(e) => {
              setCompanyFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
          >
            <option value="ALL">All Companies</option>
            {companies.map((comp) => (
              <option key={comp.id} value={String(comp.id)}>
                {comp.name}
              </option>
            ))}
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
            <option value="INACTIVE">INACTIVE</option>
            <option value="LEAD">LEAD</option>
          </select>

          <select
            value={assignedFilter}
            onChange={(e) => {
              setAssignedFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
          >
            <option value="ALL">All Owners</option>
            {employees.map((emp) => (
              <option key={emp.id} value={String(emp.id)}>
                {emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`} ({emp.employeeCode})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. MAIN CONTACTS TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-5">Contact Name</th>
                <th className="py-4 px-4">Company</th>
                <th className="py-4 px-4">Phone & Email</th>
                <th className="py-4 px-4">Designation</th>
                <th className="py-4 px-4">Owner</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400 font-bold animate-pulse">
                    Loading CRM contacts...
                  </td>
                </tr>
              ) : contacts.length > 0 ? (
                contacts.map((contact) => {
                  const fullName = `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Contact Person';
                  const compName = contact.company?.name || 'Independent';

                  return (
                    <tr key={contact.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#1AA14D] border border-emerald-200/60 flex items-center justify-center font-black shrink-0 shadow-2xs">
                            {contact.firstName?.[0] || 'C'}
                          </div>
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => setViewingContactId(contact.id)}
                              className="font-extrabold text-slate-900 hover:text-[#1AA14D] text-sm truncate block transition-colors text-left cursor-pointer"
                            >
                              {fullName}
                            </button>
                            <p className="text-slate-400 font-medium text-[11px]">#{contact.id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        {contact.company ? (
                          <button
                            type="button"
                            onClick={() => setViewingCompanyId(contact.company.id)}
                            className="font-bold text-slate-800 hover:text-blue-600 flex items-center gap-1.5 text-left cursor-pointer"
                          >
                            <Building className="w-3.5 h-3.5 text-slate-400" />
                            <span>{contact.company.name}</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 font-bold text-xs italic">No Company</span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          {(contact.phone || contact.mobile) && (
                            <p className="font-bold text-slate-800 flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-[#23C45E]" />
                              <span>{contact.phone || contact.mobile}</span>
                            </p>
                          )}
                          {contact.email && (
                            <p className="text-slate-500 font-medium text-[11px] truncate max-w-[180px] flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{contact.email}</span>
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4 font-bold text-slate-700">
                        {contact.designation || '-'}
                      </td>

                      <td className="py-4 px-4">
                        {contact.assignedTo ? (
                          <span className="font-bold text-slate-800 text-xs">
                            {contact.assignedTo.firstName} {contact.assignedTo.lastName}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold text-xs italic">Unassigned</span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-[#1AA14D] border border-emerald-200">
                          {contact.status || 'ACTIVE'}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingContactId(contact.id)}
                            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-[#1AA14D] transition-colors cursor-pointer"
                            title="View Contact Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenScheduleVisit(contact)}
                            className="p-2 hover:bg-blue-50 rounded-xl text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                            title="Schedule Visit"
                          >
                            <Calendar className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(contact)}
                            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                            title="Edit Contact"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`Archive contact "${fullName}"?`)) {
                                deleteMutation.mutate(contact.id);
                              }
                            }}
                            className="p-2 hover:bg-rose-50 rounded-xl text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Archive Contact"
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
                    <p className="font-bold text-sm text-slate-600">No contacts found</p>
                    <p className="text-xs text-slate-400 mt-1">Add contacts directly or link from Companies/Leads</p>
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

      {/* 5. ADD / EDIT CONTACT DRAWER */}
      <AdminFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={form.id ? 'Edit Contact' : 'Add New Contact'}
        subtitle="Manage personal, communication, company affiliation, and CRM owner details"
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
              <UserCheck className="w-3.5 h-3.5 text-[#23C45E]" /> Personal Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  placeholder="e.g. Anand"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Last Name</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  placeholder="e.g. Mahindra"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Designation / Title</label>
                <input
                  type="text"
                  value={form.designation}
                  onChange={(e) => setForm({ ...form, designation: e.target.value })}
                  placeholder="e.g. Managing Director, Procurement Head"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-blue-600" /> Contact Numbers & Email
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Mobile Number</label>
                <input
                  type="text"
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  placeholder="e.g. +91 98200 12345"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Alternate Phone</label>
                <input
                  type="text"
                  value={form.alternateMobile}
                  onChange={(e) => setForm({ ...form, alternateMobile: e.target.value })}
                  placeholder="e.g. +91 22 2345 6789"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="e.g. anand@company.com"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Website URL</label>
                <input
                  type="text"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="e.g. https://company.com"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-purple-600" /> Company & Assignment
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Associated Company</label>
                <select
                  value={form.companyId}
                  onChange={(e) => setForm({ ...form, companyId: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  <option value="">-- Independent Contact --</option>
                  {companies.map((comp) => (
                    <option key={comp.id} value={String(comp.id)}>
                      {comp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Assigned CRM Owner</label>
                <select
                  value={form.assignedToId}
                  onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  <option value="">-- Unassigned --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={String(emp.id)}>
                      {emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Notes & History</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Special instructions or background details..."
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
              {saveMutation.isPending ? 'Saving...' : form.id ? 'Save Changes' : 'Create Contact'}
            </button>
          </div>
        </form>
      </AdminFormDrawer>

      {/* 6. SCHEDULE VISIT DRAWER */}
      <AdminFormDrawer
        isOpen={isVisitDrawerOpen}
        onClose={() => setIsVisitDrawerOpen(false)}
        title="Schedule Client Visit"
        subtitle={selectedContact ? `Contact: ${selectedContact.firstName} ${selectedContact.lastName}` : ''}
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            scheduleVisitMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Visit Purpose *</label>
            <input
              type="text"
              required
              value={visitForm.purpose}
              onChange={(e) => setVisitForm({ ...visitForm, purpose: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Date *</label>
              <input
                type="date"
                required
                value={visitForm.date}
                onChange={(e) => setVisitForm({ ...visitForm, date: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Time *</label>
              <input
                type="text"
                required
                value={visitForm.time}
                onChange={(e) => setVisitForm({ ...visitForm, time: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Location *</label>
            <input
              type="text"
              required
              value={visitForm.location}
              onChange={(e) => setVisitForm({ ...visitForm, location: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Assigned Field Representative</label>
            <select
              value={visitForm.employeeId}
              onChange={(e) => setVisitForm({ ...visitForm, employeeId: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
            >
              <option value="">-- Select Field Rep --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={String(emp.id)}>
                  {emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`} ({emp.employeeCode})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsVisitDrawerOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={scheduleVisitMutation.isPending}
              className="px-5 py-2 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-xl text-xs cursor-pointer shadow-md shadow-[#23C45E]/20"
            >
              {scheduleVisitMutation.isPending ? 'Scheduling...' : 'Schedule Visit'}
            </button>
          </div>
        </form>
      </AdminFormDrawer>

      {/* Contact Details Right-Side Drawer */}
      <ContactDetailsDrawer
        contactId={viewingContactId}
        isOpen={!!viewingContactId}
        onClose={() => setViewingContactId(null)}
      />

      {/* Company Details Right-Side Drawer */}
      <CompanyDetailsDrawer
        companyId={viewingCompanyId}
        isOpen={!!viewingCompanyId}
        onClose={() => setViewingCompanyId(null)}
      />
    </div>
  );
}
