'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building,
  User,
  MapPin,
  Calendar,
  Globe,
  DollarSign,
  Clock,
  CheckCircle2,
  Trash2,
  Edit,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  Plus,
} from 'lucide-react';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { AdminFormDrawer, AdminPageHeader, AdminButton } from '@/components/admin';
import { SendEmailModal } from '@/components/admin/dialogs/SendEmailModal';
import { getErrorMessage } from '@/lib/utils';

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = (params?.id as string) || '';

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'DEALS' | 'VISITS' | 'TIMELINE'>('OVERVIEW');
  const [isVisitDrawerOpen, setIsVisitDrawerOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const [visitForm, setVisitForm] = useState({
    purpose: 'Client Consultation & Review',
    visitType: 'CLIENT_MEETING',
    date: new Date().toISOString().split('T')[0],
    time: '11:00 AM',
    location: '',
    notes: '',
  });

  const { data: contact, isLoading, isError } = useQuery({
    queryKey: ['contact-detail', id],
    queryFn: async () => {
      const res: any = await api.get(`/contacts/${id}`);
      return res?.data || res;
    },
    enabled: Boolean(id),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return api.delete(`/contacts/${id}`);
    },
    onSuccess: () => {
      toast.success('Contact archived');
      router.push('/contacts');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const scheduleVisitMutation = useMutation({
    mutationFn: async () => {
      return api.post('/visits', {
        customerName: `${contact?.firstName} ${contact?.lastName}`,
        purpose: visitForm.purpose,
        visitType: visitForm.visitType,
        date: new Date(visitForm.date).toISOString(),
        time: visitForm.time,
        location: visitForm.location || contact?.company?.address || 'Client Office',
        companyId: contact?.companyId ? String(contact?.companyId) : undefined,
        contactId: String(id),
        notes: visitForm.notes || undefined,
      });
    },
    onSuccess: () => {
      toast.success('Visit scheduled successfully');
      setIsVisitDrawerOpen(false);
      queryClient.invalidateQueries({ queryKey: ['contact-detail', id] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto py-24 text-center">
        <div className="w-10 h-10 border-4 border-[#23C45E] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 font-bold text-sm">Loading contact profile...</p>
      </div>
    );
  }

  if (isError || !contact) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-black text-slate-900">Contact Not Found</h2>
        <p className="text-xs text-slate-500">This contact does not exist or has been deleted.</p>
        <Link
          href="/contacts"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-2xl text-xs font-black"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Contacts
        </Link>
      </div>
    );
  }

  const name = `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Contact';

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* Top Header */}
      <AdminPageHeader
        title={name}
        description={`${contact.designation || 'Key Stakeholder'}${contact.company ? ` • ${contact.company.name}` : ''}`}
        icon={User}
        iconColor="text-emerald-600"
        badge={{
          text: `Contact #${contact.id} • ${contact.status || 'ACTIVE'}`,
          icon: User,
          variant: contact.status === 'ACTIVE' ? 'emerald' : 'slate',
        }}
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Contacts', href: '/contacts' },
          { label: name },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            {contact.email && (
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
              icon={Calendar}
              onClick={() => {
                setVisitForm({
                  purpose: 'Client Consultation & Review',
                  visitType: 'CLIENT_MEETING',
                  date: new Date().toISOString().split('T')[0],
                  time: '11:00 AM',
                  location: contact.company?.address || contact.company?.city || 'Client HQ',
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
                if (confirm(`Archive contact "${name}"?`)) {
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
        {/* Left Column: Contact & Associated Company */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <User className="w-4 h-4 text-[#23C45E]" /> Contact Information
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Designation</span>
                <p className="font-extrabold text-slate-900 mt-0.5">{contact.designation || 'N/A'}</p>
              </div>

              {(contact.phone || contact.mobile) && (
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase block">Primary Mobile</span>
                  <a
                    href={`tel:${contact.phone || contact.mobile}`}
                    className="font-bold text-slate-800 hover:text-[#1AA14D] flex items-center gap-1.5 mt-0.5"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#23C45E]" /> {contact.phone || contact.mobile}
                  </a>
                </div>
              )}

              {contact.alternateMobile && (
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase block">Alternate Phone</span>
                  <p className="font-bold text-slate-800 mt-0.5">{contact.alternateMobile}</p>
                </div>
              )}

              {contact.email && (
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase block">Email Address</span>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {contact.email}
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

              {contact.website && (
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase block">Website</span>
                  <a
                    href={contact.website.startsWith('http') ? contact.website : `https://${contact.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-blue-600 hover:underline flex items-center gap-1.5 mt-0.5"
                  >
                    <Globe className="w-3.5 h-3.5 text-blue-500" /> {contact.website}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Associated Company Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Building className="w-4 h-4 text-purple-600" /> Associated Organization
            </h3>

            {contact.company ? (
              <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-2 text-xs">
                <Link
                  href={`/companies/${contact.company.id}`}
                  className="font-extrabold text-purple-950 text-sm hover:underline flex items-center justify-between"
                >
                  <span>{contact.company.name}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
                {contact.company.city && <p className="text-purple-800/80">{contact.company.city}, {contact.company.country || 'India'}</p>}
                {contact.company.phone && <p className="text-purple-800/80">Phone: {contact.company.phone}</p>}
              </div>
            ) : (
              <p className="text-xs text-slate-400 font-bold italic">No company linked to this contact.</p>
            )}
          </div>

          {/* Assigned Owner Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2 text-xs">
            <span className="text-slate-400 text-[10px] font-bold uppercase block">CRM Owner</span>
            <p className="font-extrabold text-slate-900 text-sm">
              {contact.assignedTo ? `${contact.assignedTo.firstName} ${contact.assignedTo.lastName}` : 'Unassigned'}
            </p>
          </div>
        </div>

        {/* Right Column: Tabbed Relations (Deals, Visits, Timeline) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-2 flex items-center gap-2">
            {(
              [
                { key: 'DEALS', label: 'Associated Deals', count: contact.deals?.length || 0 },
                { key: 'VISITS', label: 'Field Visits', count: contact.visits?.length || 0 },
                { key: 'TIMELINE', label: 'Communication History', count: contact.communications?.length || 0 },
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

          {/* TAB 1: DEALS */}
          {activeTab === 'DEALS' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Pipeline Deals Tied to Contact
              </h3>

              {contact.deals && contact.deals.length > 0 ? (
                <div className="space-y-3">
                  {contact.deals.map((deal: any) => (
                    <div
                      key={deal.id}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <Link
                          href={`/deals/${deal.id}`}
                          className="font-extrabold text-slate-900 hover:text-[#1AA14D] text-sm"
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
                <p className="text-xs text-slate-400 py-8 text-center font-bold">No active deals with this contact.</p>
              )}
            </div>
          )}

          {/* TAB 2: VISITS */}
          {activeTab === 'VISITS' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Field Visits & Meetings
              </h3>

              {contact.visits && contact.visits.length > 0 ? (
                <div className="space-y-3">
                  {contact.visits.map((visit: any) => (
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
                <p className="text-xs text-slate-400 py-8 text-center font-bold">No scheduled field visits.</p>
              )}
            </div>
          )}

          {/* TAB 3: TIMELINE */}
          {activeTab === 'TIMELINE' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Communication History & Logs
              </h3>

              {contact.communications && contact.communications.length > 0 ? (
                <div className="space-y-3">
                  {contact.communications.map((comm: any) => (
                    <div key={comm.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-slate-900">{comm.type}: {comm.summary}</span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {comm.timestamp && !isNaN(new Date(comm.timestamp).getTime()) ? new Date(comm.timestamp).toLocaleString() : 'Recent'}
                        </span>
                      </div>
                      {comm.details && <p className="text-slate-600 font-medium">{comm.details}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-8 text-center font-bold">No communication history logged.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SCHEDULE VISIT DRAWER */}
      <AdminFormDrawer
        isOpen={isVisitDrawerOpen}
        onClose={() => setIsVisitDrawerOpen(false)}
        title="Schedule Client Visit"
        subtitle={`Contact: ${name}`}
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
        recipientEmail={contact.email || ''}
        recipientName={name}
        recordType="contact"
        recordId={contact.id}
        defaultSubject={`Connecting with ${name}`}
      />
    </div>
  );
}
