'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building,
  Mail,
  Phone,
  MapPin,
  Globe,
  Star,
  Users,
  DollarSign,
  Calendar,
  Trash2,
  Edit,
  ExternalLink,
  Plus,
  AlertCircle,
} from 'lucide-react';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { AdminFormDrawer, AdminPageHeader, AdminButton } from '@/components/admin';
import { SendEmailModal } from '@/components/admin/dialogs/SendEmailModal';
import { getErrorMessage } from '@/lib/utils';

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = (params?.id as string) || '';

  const [activeTab, setActiveTab] = useState<'CONTACTS' | 'DEALS' | 'VISITS'>('CONTACTS');
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isAddDealOpen, setIsAddDealOpen] = useState(false);
  const [isVisitDrawerOpen, setIsVisitDrawerOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  // Forms
  const [contactForm, setContactForm] = useState({ firstName: '', lastName: '', email: '', phone: '', designation: '' });
  const [dealForm, setDealForm] = useState({ title: '', amount: 150000, expectedClosing: '', notes: '' });
  const [visitForm, setVisitForm] = useState({
    purpose: 'Executive Meeting & Strategy Review',
    visitType: 'CLIENT_MEETING',
    date: new Date().toISOString().split('T')[0],
    time: '11:00 AM',
    location: '',
    notes: '',
  });

  const { data: company, isLoading, isError } = useQuery({
    queryKey: ['company-detail', id],
    queryFn: async () => {
      const res: any = await api.get(`/companies/${id}`);
      return res?.data || res;
    },
    enabled: Boolean(id),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return api.delete(`/companies/${id}`);
    },
    onSuccess: () => {
      toast.success('Company archived');
      router.push('/companies');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const addContactMutation = useMutation({
    mutationFn: async () => {
      return api.post('/contacts', {
        firstName: contactForm.firstName.trim() || 'Stakeholder',
        lastName: contactForm.lastName.trim() || '',
        email: contactForm.email.trim() || undefined,
        phone: contactForm.phone.trim() || undefined,
        designation: contactForm.designation.trim() || 'Representative',
        companyId: String(id),
      });
    },
    onSuccess: () => {
      toast.success('Contact added');
      setIsAddContactOpen(false);
      setContactForm({ firstName: '', lastName: '', email: '', phone: '', designation: '' });
      queryClient.invalidateQueries({ queryKey: ['company-detail', id] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const addDealMutation = useMutation({
    mutationFn: async () => {
      return api.post('/deals', {
        title: dealForm.title.trim() || `${company?.name} Deal`,
        amount: Number(dealForm.amount),
        companyId: String(id),
        expectedClosing: dealForm.expectedClosing ? new Date(dealForm.expectedClosing).toISOString() : undefined,
        notes: dealForm.notes || undefined,
      });
    },
    onSuccess: () => {
      toast.success('Deal created');
      setIsAddDealOpen(false);
      setDealForm({ title: '', amount: 150000, expectedClosing: '', notes: '' });
      queryClient.invalidateQueries({ queryKey: ['company-detail', id] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const scheduleVisitMutation = useMutation({
    mutationFn: async () => {
      return api.post('/visits', {
        customerName: company?.name || 'Company',
        purpose: visitForm.purpose,
        visitType: visitForm.visitType,
        date: new Date(visitForm.date).toISOString(),
        time: visitForm.time,
        location: visitForm.location || company?.address || company?.city || 'Company HQ',
        companyId: String(id),
        notes: visitForm.notes || undefined,
      });
    },
    onSuccess: () => {
      toast.success('Visit scheduled');
      setIsVisitDrawerOpen(false);
      queryClient.invalidateQueries({ queryKey: ['company-detail', id] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto py-24 text-center">
        <div className="w-10 h-10 border-4 border-[#23C45E] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 font-bold text-sm">Loading company profile...</p>
      </div>
    );
  }

  if (isError || !company) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-black text-slate-900">Company Not Found</h2>
        <p className="text-xs text-slate-500">This account does not exist or has been deleted.</p>
        <Link
          href="/companies"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-2xl text-xs font-black"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Companies
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* Top Header */}
      <AdminPageHeader
        title={company.name}
        description={`${company.industry || 'Commercial Enterprise'}${company.city ? ` • ${company.city}, ${company.state || 'India'}` : ''}`}
        icon={Building}
        iconColor="text-emerald-600"
        badge={{
          text: `Account #${company.id} • ${company.status || 'ACTIVE'}${company.rating ? ` • ★ ${company.rating}` : ''}`,
          icon: Building,
          variant: company.status === 'ACTIVE' ? 'emerald' : 'slate',
        }}
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Companies', href: '/companies' },
          { label: company.name },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            {company.email && (
              <AdminButton
                variant="outline"
                size="md"
                icon={Mail}
                onClick={() => setIsEmailModalOpen(true)}
              >
                Send Email
              </AdminButton>
            )}

            <AdminButton
              variant="outline"
              size="md"
              icon={Users}
              onClick={() => {
                setContactForm({ firstName: '', lastName: '', email: '', phone: '', designation: '' });
                setIsAddContactOpen(true);
              }}
            >
              Add Contact
            </AdminButton>

            <AdminButton
              variant="outline"
              size="md"
              icon={DollarSign}
              onClick={() => {
                setDealForm({ title: `${company.name} Enterprise Solution`, amount: 250000, expectedClosing: '', notes: '' });
                setIsAddDealOpen(true);
              }}
            >
              Add Deal
            </AdminButton>

            <AdminButton
              variant="primary"
              size="md"
              icon={Calendar}
              onClick={() => {
                setVisitForm({
                  purpose: 'Executive Consultation & Presentation',
                  visitType: 'CLIENT_MEETING',
                  date: new Date().toISOString().split('T')[0],
                  time: '11:00 AM',
                  location: company.address || company.city || 'Company HQ',
                  notes: '',
                });
                setIsVisitDrawerOpen(true);
              }}
            >
              Schedule Visit
            </AdminButton>

            <AdminButton
              variant="danger"
              size="md"
              icon={Trash2}
              onClick={() => {
                if (confirm(`Archive company "${company.name}"?`)) {
                  deleteMutation.mutate();
                }
              }}
            >
              Archive
            </AdminButton>
          </div>
        }
      />

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Organization Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Building className="w-4 h-4 text-purple-600" /> Corporate Profile
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Industry & Category</span>
                <p className="font-extrabold text-slate-900 mt-0.5">{company.industry || 'N/A'}</p>
                {company.category && <p className="text-slate-500 font-bold">{company.category}</p>}
              </div>

              {company.phone && (
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase block">Official Phone</span>
                  <a href={`tel:${company.phone}`} className="font-bold text-slate-800 hover:text-[#1AA14D] flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-[#23C45E]" /> {company.phone}
                  </a>
                </div>
              )}

              {company.email && (
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase block">Official Email</span>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {company.email}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEmailModalOpen(true)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      <Mail className="w-3 h-3" /> Send Email
                    </button>
                  </div>
                </div>
              )}

              {company.website && (
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase block">Website</span>
                  <a
                    href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-blue-600 hover:underline flex items-center gap-1.5 mt-0.5"
                  >
                    <Globe className="w-3.5 h-3.5 text-blue-500" /> {company.website}
                  </a>
                </div>
              )}

              {company.address && (
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase block">HQ Address</span>
                  <p className="font-bold text-slate-800 flex items-start gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{company.address}, {company.city} {company.postalCode}</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Account Owner Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2 text-xs">
            <span className="text-slate-400 text-[10px] font-bold uppercase block">CRM Account Owner</span>
            <p className="font-extrabold text-slate-900 text-sm">
              {company.assignedTo ? `${company.assignedTo.firstName} ${company.assignedTo.lastName}` : 'Unassigned'}
            </p>
          </div>
        </div>

        {/* Right Column: Tabbed Relations */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-2 flex items-center gap-2">
            {(
              [
                { key: 'CONTACTS', label: 'Key Contacts', count: company.contacts?.length || 0 },
                { key: 'DEALS', label: 'Deals & Revenue', count: company.deals?.length || 0 },
                { key: 'VISITS', label: 'Field Visits', count: company.visits?.length || 0 },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === tab.key
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* TAB 1: CONTACTS */}
          {activeTab === 'CONTACTS' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Affiliated Contacts & Stakeholders
                </h3>
                <button
                  onClick={() => setIsAddContactOpen(true)}
                  className="text-xs font-black text-[#1AA14D] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Contact
                </button>
              </div>

              {company.contacts && company.contacts.length > 0 ? (
                <div className="space-y-3">
                  {company.contacts.map((contact: any) => (
                    <div
                      key={contact.id}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs hover:border-slate-300 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <Link
                          href={`/contacts/${contact.id}`}
                          className="font-extrabold text-slate-900 hover:text-[#1AA14D] text-sm"
                        >
                          {contact.firstName} {contact.lastName}
                        </Link>
                        <p className="text-slate-500 font-bold">{contact.designation || 'Stakeholder'}</p>
                      </div>
                      <div className="text-right space-y-0.5">
                        {contact.phone && <p className="font-bold text-slate-800">{contact.phone}</p>}
                        {contact.email && <p className="text-slate-400 text-[11px]">{contact.email}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-8 text-center font-bold">No contacts added for this company yet.</p>
              )}
            </div>
          )}

          {/* TAB 2: DEALS */}
          {activeTab === 'DEALS' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Pipeline Deals & Opportunities
                </h3>
                <button
                  onClick={() => setIsAddDealOpen(true)}
                  className="text-xs font-black text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Deal
                </button>
              </div>

              {company.deals && company.deals.length > 0 ? (
                <div className="space-y-3">
                  {company.deals.map((deal: any) => (
                    <div
                      key={deal.id}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <Link
                          href={`/deals/${deal.id}`}
                          className="font-extrabold text-slate-900 hover:text-blue-600 text-sm"
                        >
                          {deal.title}
                        </Link>
                        <p className="text-slate-500 font-bold">
                          Stage: {deal.stage?.name || 'Pipeline'} • Prob: {deal.probability}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-900 text-sm">
                          ₹{Number(deal.amount || 0).toLocaleString('en-IN')}
                        </p>
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            deal.isWon ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {deal.isWon ? 'WON' : 'OPEN'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-8 text-center font-bold">No active deals for this company.</p>
              )}
            </div>
          )}

          {/* TAB 3: VISITS */}
          {activeTab === 'VISITS' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Field Visits & Meetings
                </h3>
                <button
                  onClick={() => setIsVisitDrawerOpen(true)}
                  className="text-xs font-black text-[#1AA14D] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Schedule Visit
                </button>
              </div>

              {company.visits && company.visits.length > 0 ? (
                <div className="space-y-3">
                  {company.visits.map((visit: any) => (
                    <div
                      key={visit.id}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-1">
                        <p className="font-black text-slate-900 text-sm">{visit.purpose || 'Client Visit'}</p>
                        <p className="text-slate-500 flex items-center gap-1 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" /> {visit.location}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-700">
                          {visit.date ? new Date(visit.date).toLocaleDateString() : 'Scheduled'}
                        </p>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                          {visit.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-8 text-center font-bold">No visits recorded for this company.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: ADD CONTACT */}
      <AdminFormDrawer
        isOpen={isAddContactOpen}
        onClose={() => setIsAddContactOpen(false)}
        title="Add Contact Person"
        subtitle={`For: ${company.name}`}
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
              placeholder="e.g. Director of Operations"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Phone</label>
            <input
              type="text"
              value={contactForm.phone}
              onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Email</label>
            <input
              type="email"
              value={contactForm.email}
              onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
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

      {/* MODAL 2: ADD DEAL */}
      <AdminFormDrawer
        isOpen={isAddDealOpen}
        onClose={() => setIsAddDealOpen(false)}
        title="Add Deal"
        subtitle={`For: ${company.name}`}
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

      {/* MODAL 3: SCHEDULE VISIT */}
      <AdminFormDrawer
        isOpen={isVisitDrawerOpen}
        onClose={() => setIsVisitDrawerOpen(false)}
        title="Schedule Client Visit"
        subtitle={`For: ${company.name}`}
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

      <SendEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        recipientEmail={company.email || ''}
        recipientName={company.name}
        recordType="customer"
        recordId={company.id}
        defaultSubject={`Inquiry regarding ${company.name}`}
      />
    </div>
  );
}
