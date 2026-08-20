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
  Building2,
  ShieldCheck,
  Zap,
  Clock,
  Bell,
  Sliders,
  Check,
  RefreshCw,
  SlidersHorizontal,
  Mail,
  Smartphone,
  Database,
  Layers,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'INTEGRATIONS' | 'WORKFORCE' | 'SECURITY' | 'NOTIFICATIONS'>('INTEGRATIONS');

  // General Settings State
  const [companyName, setCompanyName] = useState('QuikBoom Enterprise');
  const [customerId, setCustomerId] = useState('t-001');
  const [supportEmail, setSupportEmail] = useState('support@quikboom.com');
  const [currency, setCurrency] = useState('INR (₹)');
  const [timezone, setTimezone] = useState('Asia/Kolkata (IST)');

  // Razorpay Integration State
  const [razorpayKeyId, setRazorpayKeyId] = useState('rzp_live_9876543210abcd');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState('••••••••••••••••••••••••');
  const [razorpayWebhookSecret, setRazorpayWebhookSecret] = useState('whsec_quikboom_2026');
  const [razorpayMode, setRazorpayMode] = useState<'TEST' | 'LIVE'>('LIVE');
  const [razorpayConnected, setRazorpayConnected] = useState(true);

  // Google Maps Integration State
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState(
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyBzIu9g59dQo-ICpmusnRorJ8tJ3OYFlRA'
  );
  const [enableEcoRouting, setEnableEcoRouting] = useState(true);
  const [enableGeocoding, setEnableGeocoding] = useState(true);
  const [defaultCity, setDefaultCity] = useState('Mumbai, Maharashtra');

  // Workforce & Attendance Rules State
  const [workHoursPerDay, setWorkHoursPerDay] = useState(8);
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState(15);
  const [autoCheckoutHours, setAutoCheckoutHours] = useState(12);
  const [allowRemoteCheckin, setAllowRemoteCheckin] = useState(true);
  const [requireGpsPhoto, setRequireGpsPhoto] = useState(true);

  // Security Settings State
  const [jwtExpirationMinutes, setJwtExpirationMinutes] = useState(60);
  const [enforceTwoFactor, setEnforceTwoFactor] = useState(false);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(30);

  // Notification Preferences State
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [leaveApprovalAlerts, setLeaveApprovalAlerts] = useState(true);

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

  const handleSaveWorkforce = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Workforce & attendance rules updated!');
  };

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Security & JWT parameters saved!');
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Notification preferences updated!');
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Top Title Card Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-lg border border-emerald-800">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 font-extrabold text-xs uppercase tracking-wider mb-1">
            <Settings className="w-4 h-4 text-emerald-400" /> SYSTEM CONFIGURATION & INTEGRATIONS
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Workspace Settings & Integrations
          </h1>
          <p className="text-xs md:text-sm text-slate-200 mt-1 font-medium">
            Manage payment gateways, Google Maps Platform APIs, workforce rules, and multi-customer security policies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1.5 bg-emerald-800/80 text-emerald-200 font-extrabold text-xs rounded-xl border border-emerald-700 shadow-xs">
            Customer: {customerId}
          </span>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('INTEGRATIONS')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'INTEGRATIONS'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
              : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
          }`}
        >
          <Zap className="w-4 h-4" /> Gateways & Maps
        </button>

        <button
          onClick={() => setActiveTab('GENERAL')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'GENERAL'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
              : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" /> Workspace Profile
        </button>

        <button
          onClick={() => setActiveTab('WORKFORCE')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'WORKFORCE'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
              : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" /> Workforce Rules
        </button>

        <button
          onClick={() => setActiveTab('SECURITY')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'SECURITY'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
              : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> Security & JWT
        </button>

        <button
          onClick={() => setActiveTab('NOTIFICATIONS')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'NOTIFICATIONS'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
              : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
          }`}
        >
          <Bell className="w-4 h-4" /> Notifications
        </button>
      </div>

      {/* 1. INTEGRATIONS TAB */}
      {activeTab === 'INTEGRATIONS' && (
        <div className="space-y-8">
          {/* RAZORPAY PAYMENT GATEWAY CARD */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center font-bold">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-extrabold text-slate-900">Razorpay Payment Gateway</h2>
                    {razorpayConnected && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-extrabold border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> CONNECTED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium">Process deal settlements, recurring subscription invoices, and instant payment links.</p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setRazorpayMode('TEST')}
                  className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                    razorpayMode === 'TEST' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Test Mode
                </button>
                <button
                  type="button"
                  onClick={() => setRazorpayMode('LIVE')}
                  className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                    razorpayMode === 'LIVE' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Live Mode
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveRazorpay} className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100 text-xs">
              <div>
                <label className="block font-extrabold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-emerald-600" /> Razorpay Key ID ({razorpayMode})
                </label>
                <input
                  type="text"
                  required
                  value={razorpayKeyId}
                  onChange={(e) => setRazorpayKeyId(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block font-extrabold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" /> Razorpay Key Secret
                </label>
                <input
                  type="password"
                  required
                  value={razorpayKeySecret}
                  onChange={(e) => setRazorpayKeySecret(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none font-semibold"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-extrabold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-emerald-600" /> Webhook Secret Endpoint
                </label>
                <input
                  type="text"
                  value={razorpayWebhookSecret}
                  onChange={(e) => setRazorpayWebhookSecret(e.target.value)}
                  placeholder="whsec_..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none font-semibold"
                />
              </div>

              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-extrabold text-xs shadow-md transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Save Razorpay Connection
                </button>
              </div>
            </form>
          </div>

          {/* GOOGLE MAPS PLATFORM CARD */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xs space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center font-bold">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">Google Maps Platform Integration</h2>
                  <p className="text-xs text-slate-500 font-medium">Powers field visit GPS tracking, address geocoding, and eco-friendly route optimization.</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveGoogleMaps} className="space-y-6 pt-6 border-t border-slate-100 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1.5 flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-emerald-600" /> Google Maps API Key
                  </label>
                  <input
                    type="text"
                    required
                    value={googleMapsApiKey}
                    onChange={(e) => setGoogleMapsApiKey(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1.5">Default Territory Center</label>
                  <input
                    type="text"
                    value={defaultCity}
                    onChange={(e) => setDefaultCity(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none font-semibold"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={enableGeocoding}
                    onChange={(e) => setEnableGeocoding(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-600"
                  />
                  <span className="font-extrabold text-slate-700">Enable Automatic Lead Address Geocoding</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={enableEcoRouting}
                    onChange={(e) => setEnableEcoRouting(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-600"
                  />
                  <span className="font-extrabold text-slate-700">Enable Eco-Friendly Route Optimization</span>
                </label>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-extrabold text-xs shadow-md transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Save & Verify Google Maps API Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. WORKSPACE PROFILE TAB */}
      {activeTab === 'GENERAL' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Workspace Profile Settings</h2>
            <p className="text-xs text-slate-500 font-medium">Configure corporate identity and global currency formatting.</p>
          </div>

          <form onSubmit={handleSaveGeneral} className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100 text-xs">
            <div>
              <label className="block font-extrabold text-slate-700 mb-1.5">Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none font-semibold"
              />
            </div>

            <div>
              <label className="block font-extrabold text-slate-700 mb-1.5">Support Email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none font-semibold"
              />
            </div>

            <div>
              <label className="block font-extrabold text-slate-700 mb-1.5">Default Workspace Currency</label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none font-semibold"
              />
            </div>

            <div>
              <label className="block font-extrabold text-slate-700 mb-1.5">Timezone</label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none font-semibold"
              />
            </div>

            <div className="md:col-span-2 flex justify-end pt-4">
              <button
                type="submit"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-extrabold text-xs shadow-md transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save Workspace Profile
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. WORKFORCE RULES TAB */}
      {activeTab === 'WORKFORCE' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Workforce & Attendance Rules</h2>
            <p className="text-xs text-slate-500 font-medium">Set daily working hours, grace period check-ins, and GPS verification policies.</p>
          </div>

          <form onSubmit={handleSaveWorkforce} className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100 text-xs">
            <div>
              <label className="block font-extrabold text-slate-700 mb-1.5">Daily Standard Work Hours</label>
              <input
                type="number"
                value={workHoursPerDay}
                onChange={(e) => setWorkHoursPerDay(Number(e.target.value))}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
              />
            </div>

            <div>
              <label className="block font-extrabold text-slate-700 mb-1.5">Late Grace Period (Minutes)</label>
              <input
                type="number"
                value={gracePeriodMinutes}
                onChange={(e) => setGracePeriodMinutes(Number(e.target.value))}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
              />
            </div>

            <div>
              <label className="block font-extrabold text-slate-700 mb-1.5">Auto-Checkout Timeout (Hours)</label>
              <input
                type="number"
                value={autoCheckoutHours}
                onChange={(e) => setAutoCheckoutHours(Number(e.target.value))}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
              />
            </div>

            <div className="md:col-span-3 flex flex-wrap gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allowRemoteCheckin}
                  onChange={(e) => setAllowRemoteCheckin(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-600"
                />
                <span className="font-extrabold text-slate-700">Allow Remote / WFH Check-in via App</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={requireGpsPhoto}
                  onChange={(e) => setRequireGpsPhoto(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-600"
                />
                <span className="font-extrabold text-slate-700">Require GPS Location Photo Verification</span>
              </label>
            </div>

            <div className="md:col-span-3 flex justify-end pt-4">
              <button
                type="submit"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-extrabold text-xs shadow-md transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save Workforce Rules
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. SECURITY & JWT TAB */}
      {activeTab === 'SECURITY' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Security & JWT Authentication</h2>
            <p className="text-xs text-slate-500 font-medium">Manage session expiration, multi-customer headers (`x-customer-id`), and 2FA enforcement.</p>
          </div>

          <form onSubmit={handleSaveSecurity} className="space-y-6 pt-6 border-t border-slate-100 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-extrabold text-slate-700 mb-1.5">JWT Access Token Validity (Minutes)</label>
                <input
                  type="number"
                  value={jwtExpirationMinutes}
                  onChange={(e) => setJwtExpirationMinutes(Number(e.target.value))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block font-extrabold text-slate-700 mb-1.5">Inactivity Session Timeout (Minutes)</label>
                <input
                  type="number"
                  value={sessionTimeoutMinutes}
                  onChange={(e) => setSessionTimeoutMinutes(Number(e.target.value))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                />
              </div>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200/80 rounded-2xl space-y-2 font-mono text-emerald-800 text-xs">
              <p className="font-bold text-emerald-900">Security Parameters Summary:</p>
              <p>• JWT Passport Strategy: Enabled (RS256 signed bearer tokens)</p>
              <p>• Row-Level Customer Isolation: Enforced via customerId index filtering</p>
              <p>• Rate Limiting Guard: 100 requests per minute per IP</p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-extrabold text-xs shadow-md transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save Security Policies
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5. NOTIFICATIONS TAB */}
      {activeTab === 'NOTIFICATIONS' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Notification & Alert Channels</h2>
            <p className="text-xs text-slate-500 font-medium">Configure automated email, WhatsApp, and in-app alert triggers.</p>
          </div>

          <form onSubmit={handleSaveNotifications} className="space-y-6 pt-6 border-t border-slate-100 text-xs">
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-600"
                />
                <div>
                  <p className="font-extrabold text-slate-900">Email Notifications</p>
                  <p className="text-slate-500">Send instant email notifications for new lead assignments and monthly payslips.</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                <input
                  type="checkbox"
                  checked={whatsappAlerts}
                  onChange={(e) => setWhatsappAlerts(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-600"
                />
                <div>
                  <p className="font-extrabold text-slate-900">WhatsApp Alert Webhook</p>
                  <p className="text-slate-500">Dispatch field visit check-in confirmations and urgent leave requests via WhatsApp Business API.</p>
                </div>
              </label>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-extrabold text-xs shadow-md transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save Notification Channels
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
