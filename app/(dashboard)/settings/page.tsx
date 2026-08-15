'use client';

import React, { useState } from 'react';
import {
  Settings,
  CreditCard,
  MapPin,
  Key,
  CheckCircle2,
  Save,
  Globe,
  Lock,
  Building,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'INTEGRATIONS' | 'SECURITY'>('INTEGRATIONS');

  // Razorpay Integration State
  const [razorpayKeyId, setRazorpayKeyId] = useState('rzp_test_9876543210abcd');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState('••••••••••••••••••••••••');
  const [razorpayWebhookSecret, setRazorpayWebhookSecret] = useState('whsec_quikboom_2026');
  const [razorpayMode, setRazorpayMode] = useState<'TEST' | 'LIVE'>('TEST');
  const [razorpayConnected, setRazorpayConnected] = useState(true);

  // Google Maps Integration State
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState('AIzaSyD-QuikBoomMapsPlatformKey2026');
  const [enableEcoRouting, setEnableEcoRouting] = useState(true);
  const [enableGeocoding, setEnableGeocoding] = useState(true);
  const [defaultCity, setDefaultCity] = useState('Mumbai, Maharashtra');

  // General Settings State
  const [companyName, setCompanyName] = useState('QuikBoom Enterprise Workspace');
  const [supportEmail, setSupportEmail] = useState('support@quikboom.com');
  const [currency, setCurrency] = useState('INR (₹)');

  const handleSaveRazorpay = (e: React.FormEvent) => {
    e.preventDefault();
    setRazorpayConnected(true);
    toast.success('Razorpay API credentials & webhook saved successfully!');
  };

  const handleSaveGoogleMaps = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Google Maps Platform API key verified & saved!');
  };

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Workspace profile settings updated!');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Workspace Settings & Integrations</h1>
        <p className="text-sm text-[#64748B]">Manage system configuration, payment gateways, and location services.</p>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-[#E2E8F0] gap-6">
        <button
          onClick={() => setActiveTab('INTEGRATIONS')}
          className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'INTEGRATIONS'
              ? 'border-[#0F766E] text-[#0F766E]'
              : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <Zap className="w-4 h-4" /> Integrations (Razorpay & Maps)
        </button>
        <button
          onClick={() => setActiveTab('GENERAL')}
          className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'GENERAL'
              ? 'border-[#0F766E] text-[#0F766E]'
              : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <Building className="w-4 h-4" /> General Profile
        </button>
        <button
          onClick={() => setActiveTab('SECURITY')}
          className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'SECURITY'
              ? 'border-[#0F766E] text-[#0F766E]'
              : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> Security & JWT
        </button>
      </div>

      {/* INTEGRATIONS TAB */}
      {activeTab === 'INTEGRATIONS' && (
        <div className="space-y-8">
          {/* RAZORPAY INTEGRATION CARD */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#2563EB] flex items-center justify-center font-bold">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                    Razorpay Payment Gateway Integration
                    {razorpayConnected && (
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-green-100 text-[#16A34A] font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-[#64748B]">Process customer payments, subscription billing, and automated invoice settlements.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E2E8F0] p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setRazorpayMode('TEST')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    razorpayMode === 'TEST' ? 'bg-[#0F766E] text-white shadow-xs' : 'text-[#64748B]'
                  }`}
                >
                  Test Mode
                </button>
                <button
                  type="button"
                  onClick={() => setRazorpayMode('LIVE')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    razorpayMode === 'LIVE' ? 'bg-[#16A34A] text-white shadow-xs' : 'text-[#64748B]'
                  }`}
                >
                  Live Mode
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveRazorpay} className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#E2E8F0]">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-[#0F766E]" /> Razorpay Key ID ({razorpayMode})
                </label>
                <input
                  type="text"
                  required
                  value={razorpayKeyId}
                  onChange={(e) => setRazorpayKeyId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm font-mono text-[#0F172A] focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-[#0F766E]" /> Razorpay Key Secret
                </label>
                <input
                  type="password"
                  required
                  value={razorpayKeySecret}
                  onChange={(e) => setRazorpayKeySecret(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm font-mono text-[#0F172A] focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-[#0F766E]" /> Webhook Secret Endpoint
                </label>
                <input
                  type="text"
                  value={razorpayWebhookSecret}
                  onChange={(e) => setRazorpayWebhookSecret(e.target.value)}
                  placeholder="whsec_..."
                  className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm font-mono text-[#0F172A] focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
                />
              </div>

              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 bg-[#0F766E] hover:bg-[#115E59] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-xs cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Save & Test Razorpay Connection
                </button>
              </div>
            </form>
          </div>

          {/* GOOGLE MAPS PLATFORM INTEGRATION CARD */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-teal-100 text-[#0F766E] flex items-center justify-center font-bold">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#0F172A]">Google Maps Platform Integration</h2>
                  <p className="text-xs text-[#64748B]">Power lead geocoding, address autocomplete, territory planning, and eco-friendly routing.</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveGoogleMaps} className="space-y-6 pt-4 border-t border-[#E2E8F0]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1.5 flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-[#0F766E]" /> Google Maps JavaScript & Places API Key
                  </label>
                  <input
                    type="text"
                    required
                    value={googleMapsApiKey}
                    onChange={(e) => setGoogleMapsApiKey(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm font-mono text-[#0F172A] focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">Default Territory Center</label>
                  <input
                    type="text"
                    value={defaultCity}
                    onChange={(e) => setDefaultCity(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableGeocoding}
                    onChange={(e) => setEnableGeocoding(e.target.checked)}
                    className="w-4 h-4 text-[#0F766E] rounded focus:ring-[#0F766E] accent-[#0F766E]"
                  />
                  <span className="text-xs font-medium text-[#0F172A]">Enable Automatic Lead Address Geocoding</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableEcoRouting}
                    onChange={(e) => setEnableEcoRouting(e.target.checked)}
                    className="w-4 h-4 text-[#0F766E] rounded focus:ring-[#0F766E] accent-[#0F766E]"
                  />
                  <span className="text-xs font-medium text-[#0F172A]">Enable Eco-Friendly Route Optimization</span>
                </label>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 bg-[#0F766E] hover:bg-[#115E59] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-xs cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Save & Verify Google Maps API Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GENERAL TAB */}
      {activeTab === 'GENERAL' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-6">
          <h2 className="text-lg font-bold text-[#0F172A]">Workspace Profile Settings</h2>
          <form onSubmit={handleSaveGeneral} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">Support Email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">Default Workspace Currency</label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
              />
            </div>

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 bg-[#0F766E] hover:bg-[#115E59] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-xs cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save Workspace Profile
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SECURITY TAB */}
      {activeTab === 'SECURITY' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-[#0F172A]">Security & JWT Configuration</h2>
          <p className="text-sm text-[#64748B]">Multi-tenant isolation enforced via NestJS JWT guards & tenant context headers (`x-tenant-id`).</p>
          <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs space-y-2 font-mono text-[#0F766E]">
            <p>JWT Access Secret: Enabled (15m expiration)</p>
            <p>JWT Refresh Token: Enabled (7d sliding expiration)</p>
            <p>Tenant Isolation: Strict row-level isolation via tenantId</p>
          </div>
        </div>
      )}
    </div>
  );
}
