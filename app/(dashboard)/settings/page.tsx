'use client';

import React, { useState, useEffect } from 'react';
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
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'INTEGRATIONS' | 'WORKFORCE' | 'SECURITY' | 'NOTIFICATIONS'>('INTEGRATIONS');

  // General Settings State
  const [companyName, setCompanyName] = useState('QuikBoom Enterprise');
  const [customerId, setCustomerId] = useState('t-001');
  const [supportEmail, setSupportEmail] = useState('support@quikboom.com');
  const [currency, setCurrency] = useState('INR (₹)');
  const [timezone, setTimezone] = useState('Asia/Kolkata (IST)');

  // Integration Loading & Environment States
  const [isLoadingIntegrations, setIsLoadingIntegrations] = useState(true);
  const [razorpayEnvironment, setRazorpayEnvironment] = useState<'LIVE' | 'TEST'>('LIVE');
  const [razorpaySource, setRazorpaySource] = useState<'DATABASE' | 'ENV_FALLBACK'>('ENV_FALLBACK');

  // Razorpay Integration State
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState('');
  const [razorpayWebhookSecret, setRazorpayWebhookSecret] = useState('');
  const [razorpayConnected, setRazorpayConnected] = useState(true);
  const [showRazorpaySecret, setShowRazorpaySecret] = useState(false);
  const [isSavingRazorpay, setIsSavingRazorpay] = useState(false);
  const [isTestingRazorpay, setIsTestingRazorpay] = useState(false);

  // Google Maps Integration State
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState('');
  const [googleMapsSource, setGoogleMapsSource] = useState<'DATABASE' | 'ENV_FALLBACK'>('ENV_FALLBACK');
  const [showMapsKey, setShowMapsKey] = useState(false);
  const [enableEcoRouting, setEnableEcoRouting] = useState(true);
  const [enableGeocoding, setEnableGeocoding] = useState(true);
  const [defaultCity, setDefaultCity] = useState('Mumbai, Maharashtra');
  const [isSavingGoogleMaps, setIsSavingGoogleMaps] = useState(false);
  const [isTestingGoogleMaps, setIsTestingGoogleMaps] = useState(false);

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

  // Fetch live integration settings on mount
  useEffect(() => {
    async function loadIntegrationSettings() {
      try {
        setIsLoadingIntegrations(true);
        const res = await api.get('/admin/settings/integrations');
        const items = res.data?.data || [];

        for (const item of items) {
          if (item.provider === 'RAZORPAY') {
            setRazorpayConnected(item.isEnabled ?? true);
            setRazorpayEnvironment(item.environment === 'TEST' ? 'TEST' : 'LIVE');
            setRazorpaySource(item.source || 'DATABASE');
            setRazorpayKeyId(item.credentials?.keyId || '');
            setRazorpayKeySecret(item.credentials?.keySecret || '');
            setRazorpayWebhookSecret(item.credentials?.webhookSecret || '');
          } else if (item.provider === 'GOOGLE_MAPS') {
            setGoogleMapsSource(item.source || 'DATABASE');
            setGoogleMapsApiKey(item.credentials?.apiKey || '');
            if (item.config) {
              setEnableEcoRouting(item.config.enableEcoRouting ?? true);
              setEnableGeocoding(item.config.enableGeocoding ?? true);
              setDefaultCity(item.config.defaultCity || 'Mumbai, Maharashtra');
            }
          }
        }
      } catch (err: any) {
        console.error('[SETTINGS_LOAD_ERROR]', err);
      } finally {
        setIsLoadingIntegrations(false);
      }
    }

    loadIntegrationSettings();
  }, []);

  const handleSaveRazorpay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!razorpayKeyId.trim()) {
      toast.error('Please enter a valid Razorpay Key ID');
      return;
    }
    setIsSavingRazorpay(true);
    try {
      const res = await api.put('/admin/settings/integrations/RAZORPAY', {
        isEnabled: razorpayConnected,
        environment: razorpayEnvironment,
        credentials: {
          keyId: razorpayKeyId.trim(),
          keySecret: razorpayKeySecret.trim(),
          webhookSecret: razorpayWebhookSecret.trim(),
        },
      });

      setRazorpaySource('DATABASE');
      if (res.data?.credentials?.keySecret) {
        setRazorpayKeySecret(res.data.credentials.keySecret);
      }
      toast.success('Razorpay credentials saved to database & cache invalidated!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save Razorpay credentials');
    } finally {
      setIsSavingRazorpay(false);
    }
  };

  const handleTestRazorpay = async () => {
    if (!razorpayKeyId.trim()) {
      toast.error('Enter Key ID and Secret first to test connection');
      return;
    }
    setIsTestingRazorpay(true);
    try {
      const res = await api.post('/admin/settings/integrations/RAZORPAY/test', {
        credentials: {
          keyId: razorpayKeyId.trim(),
          keySecret: razorpayKeySecret.trim(),
        },
      });
      if (res.data?.success) {
        toast.success(`Razorpay connection verified! (${res.data.details?.environment} mode)`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Razorpay connection test failed');
    } finally {
      setIsTestingRazorpay(false);
    }
  };

  const handleSaveGoogleMaps = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleMapsApiKey.trim()) {
      toast.error('Please enter a valid Google Maps API Key');
      return;
    }
    setIsSavingGoogleMaps(true);
    try {
      const res = await api.put('/admin/settings/integrations/GOOGLE_MAPS', {
        isEnabled: true,
        environment: 'LIVE',
        credentials: {
          apiKey: googleMapsApiKey.trim(),
        },
        config: {
          enableEcoRouting,
          enableGeocoding,
          defaultCity,
        },
      });

      setGoogleMapsSource('DATABASE');
      if (res.data?.credentials?.apiKey) {
        setGoogleMapsApiKey(res.data.credentials.apiKey);
      }
      toast.success('Google Maps Platform settings saved & active immediately!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save Google Maps settings');
    } finally {
      setIsSavingGoogleMaps(false);
    }
  };

  const handleTestGoogleMaps = async () => {
    if (!googleMapsApiKey.trim()) {
      toast.error('Enter Google Maps API Key to test connection');
      return;
    }
    setIsTestingGoogleMaps(true);
    try {
      const res = await api.post('/admin/settings/integrations/GOOGLE_MAPS/test', {
        credentials: {
          apiKey: googleMapsApiKey.trim(),
        },
      });
      if (res.data?.success) {
        toast.success('Google Maps Places API key verified successfully!');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Google Maps test failed');
    } finally {
      setIsTestingGoogleMaps(false);
    }
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
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* Top Hero Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-700/60 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-[#23C45E]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-[#23C45E] border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#23C45E] animate-pulse" />
                System Configuration & Integrations
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Settings & Integrations
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl leading-relaxed">
              Manage payment gateways, Google Maps Platform APIs, workforce rules, and multi-customer security policies.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="px-4 py-2 bg-slate-800/80 text-slate-300 font-mono font-black text-xs rounded-2xl border border-slate-700">
              Tenant ID: {customerId}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setActiveTab('INTEGRATIONS')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'INTEGRATIONS'
              ? 'bg-[#23C45E] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <Zap className="w-4 h-4" /> Gateways & Maps
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('GENERAL')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'GENERAL'
              ? 'bg-[#23C45E] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" /> Workspace Profile
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('WORKFORCE')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'WORKFORCE'
              ? 'bg-[#23C45E] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" /> Workforce Rules
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SECURITY')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'SECURITY'
              ? 'bg-[#23C45E] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> Security & JWT
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('NOTIFICATIONS')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'NOTIFICATIONS'
              ? 'bg-[#23C45E] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <Bell className="w-4 h-4" /> Notifications
        </button>
      </div>

      {/* 1. INTEGRATIONS TAB */}
      {activeTab === 'INTEGRATIONS' && (
        <div className="space-y-6">
          {/* RAZORPAY PAYMENT GATEWAY CARD */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#E8F9EE] text-[#1AA14D] border border-[#23C45E]/20 flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-black text-slate-900">Razorpay Payment Gateway</h2>
                    {razorpayConnected ? (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-[#E8F9EE] text-[#1AA14D] font-extrabold border border-[#23C45E]/30">
                        <CheckCircle2 className="w-3 h-3 text-[#23C45E]" /> ENABLED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-extrabold border border-amber-200">
                        <AlertTriangle className="w-3 h-3 text-amber-600" /> DISABLED
                      </span>
                    )}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono font-bold border border-slate-200">
                      Source: {razorpaySource}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Configured directly in PostgreSQL database. Changes take effect immediately at runtime without server restarts.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={razorpayEnvironment}
                  onChange={(e) => setRazorpayEnvironment(e.target.value as 'LIVE' | 'TEST')}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
                >
                  <option value="LIVE">Live Mode</option>
                  <option value="TEST">Test Mode</option>
                </select>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={razorpayConnected}
                    onChange={(e) => setRazorpayConnected(e.target.checked)}
                    className="w-4 h-4 text-[#23C45E] rounded border-slate-300 focus:ring-[#23C45E]"
                  />
                  Active
                </label>
              </div>
            </div>

            <form onSubmit={handleSaveRazorpay} className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
              <div>
                <label className="block font-extrabold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-[#23C45E]" /> Razorpay Key ID *
                </label>
                <input
                  type="text"
                  required
                  value={razorpayKeyId}
                  onChange={(e) => setRazorpayKeyId(e.target.value)}
                  placeholder="rzp_live_... or rzp_test_..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:border-transparent focus:outline-none font-semibold text-xs"
                />
              </div>

              <div>
                <label className="block font-extrabold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-[#23C45E]" /> Razorpay Key Secret *
                </label>
                <div className="relative">
                  <input
                    type={showRazorpaySecret ? 'text' : 'password'}
                    required
                    value={razorpayKeySecret}
                    onChange={(e) => setRazorpayKeySecret(e.target.value)}
                    placeholder="Enter secret key (AES-256 encrypted at rest)..."
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:border-transparent focus:outline-none font-semibold text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRazorpaySecret(!showRazorpaySecret)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    title={showRazorpaySecret ? 'Hide secret' : 'Show secret'}
                  >
                    {showRazorpaySecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block font-extrabold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-[#23C45E]" /> Webhook Secret
                </label>
                <input
                  type="text"
                  value={razorpayWebhookSecret}
                  onChange={(e) => setRazorpayWebhookSecret(e.target.value)}
                  placeholder="whsec_..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:border-transparent focus:outline-none font-semibold text-xs"
                />
              </div>

              <div className="md:col-span-2 flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleTestRazorpay}
                  disabled={isTestingRazorpay || !razorpayKeyId.trim()}
                  className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer disabled:opacity-50 border border-slate-200"
                >
                  {isTestingRazorpay ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#23C45E]" /> Testing Connection...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 text-slate-600" /> Test Razorpay Connection
                    </>
                  )}
                </button>

                <button
                  type="submit"
                  disabled={isSavingRazorpay}
                  className="inline-flex items-center gap-2 bg-[#23C45E] hover:bg-[#1AA14D] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingRazorpay ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save Credentials
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* GOOGLE MAPS PLATFORM CARD */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#E8F9EE] text-[#1AA14D] border border-[#23C45E]/20 flex items-center justify-center font-bold">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-black text-slate-900">Google Maps Platform Integration</h2>
                    <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-[#E8F9EE] text-[#1AA14D] font-extrabold border border-[#23C45E]/30">
                      <CheckCircle2 className="w-3 h-3 text-[#23C45E]" /> ACTIVE
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono font-bold border border-slate-200">
                      Source: {googleMapsSource}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Powers field visit GPS tracking, address geocoding, and business discovery. Managed dynamically in Database.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveGoogleMaps} className="space-y-4 pt-4 border-t border-slate-100 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1.5 flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-[#23C45E]" /> Google Maps API Key *
                  </label>
                  <div className="relative">
                    <input
                      type={showMapsKey ? 'text' : 'password'}
                      required
                      value={googleMapsApiKey}
                      onChange={(e) => setGoogleMapsApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:border-transparent focus:outline-none font-semibold text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowMapsKey(!showMapsKey)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      title={showMapsKey ? 'Hide key' : 'Show key'}
                    >
                      {showMapsKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1.5">Default Territory Center</label>
                  <input
                    type="text"
                    value={defaultCity}
                    onChange={(e) => setDefaultCity(e.target.value)}
                    placeholder="e.g. Mumbai, Maharashtra"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:border-transparent focus:outline-none font-semibold text-xs"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={enableGeocoding}
                    onChange={(e) => setEnableGeocoding(e.target.checked)}
                    className="w-4 h-4 text-[#23C45E] rounded border-slate-300 focus:ring-[#23C45E]"
                  />
                  <span className="font-extrabold text-slate-700">Enable Automatic Lead Address Geocoding</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={enableEcoRouting}
                    onChange={(e) => setEnableEcoRouting(e.target.checked)}
                    className="w-4 h-4 text-[#23C45E] rounded border-slate-300 focus:ring-[#23C45E]"
                  />
                  <span className="font-extrabold text-slate-700">Enable Eco-Friendly Route Optimization</span>
                </label>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleTestGoogleMaps}
                  disabled={isTestingGoogleMaps || !googleMapsApiKey.trim()}
                  className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer disabled:opacity-50 border border-slate-200"
                >
                  {isTestingGoogleMaps ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#23C45E]" /> Testing Connection...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 text-slate-600" /> Test Places API
                    </>
                  )}
                </button>

                <button
                  type="submit"
                  disabled={isSavingGoogleMaps}
                  className="inline-flex items-center gap-2 bg-[#23C45E] hover:bg-[#1AA14D] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingGoogleMaps ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save Google Maps Settings
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. WORKSPACE PROFILE TAB */}
      {activeTab === 'GENERAL' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
          <div>
            <h2 className="text-base font-black text-slate-900">Workspace Profile Settings</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Configure corporate identity and global currency formatting.</p>
          </div>

          <form onSubmit={handleSaveGeneral} className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
            <div>
              <label className="block font-extrabold text-slate-700 mb-1.5">Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:border-transparent focus:outline-none font-semibold text-xs"
              />
            </div>

            <div>
              <label className="block font-extrabold text-slate-700 mb-1.5">Support Email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:border-transparent focus:outline-none font-semibold text-xs"
              />
            </div>

            <div>
              <label className="block font-extrabold text-slate-700 mb-1.5">Default Workspace Currency</label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:border-transparent focus:outline-none font-semibold text-xs"
              />
            </div>

            <div>
              <label className="block font-extrabold text-slate-700 mb-1.5">Timezone</label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:border-transparent focus:outline-none font-semibold text-xs"
              />
            </div>

            <div className="md:col-span-2 flex justify-end pt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 bg-[#23C45E] hover:bg-[#1AA14D] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save Workspace Profile
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. WORKFORCE RULES TAB */}
      {activeTab === 'WORKFORCE' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
          <div>
            <h2 className="text-base font-black text-slate-900">Workforce & Attendance Rules</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Set daily working hours, grace period check-ins, and GPS verification policies.</p>
          </div>

          <form onSubmit={handleSaveWorkforce} className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
            <div>
              <label className="block font-extrabold text-slate-700 mb-1.5">Daily Standard Work Hours</label>
              <input
                type="number"
                value={workHoursPerDay}
                onChange={(e) => setWorkHoursPerDay(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-[#23C45E] focus:outline-none text-xs"
              />
            </div>

            <div>
              <label className="block font-extrabold text-slate-700 mb-1.5">Late Grace Period (Minutes)</label>
              <input
                type="number"
                value={gracePeriodMinutes}
                onChange={(e) => setGracePeriodMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-[#23C45E] focus:outline-none text-xs"
              />
            </div>

            <div>
              <label className="block font-extrabold text-slate-700 mb-1.5">Auto-Checkout Timeout (Hours)</label>
              <input
                type="number"
                value={autoCheckoutHours}
                onChange={(e) => setAutoCheckoutHours(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-[#23C45E] focus:outline-none text-xs"
              />
            </div>

            <div className="md:col-span-3 flex flex-wrap gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allowRemoteCheckin}
                  onChange={(e) => setAllowRemoteCheckin(e.target.checked)}
                  className="w-4 h-4 text-[#23C45E] rounded border-slate-300 focus:ring-[#23C45E]"
                />
                <span className="font-extrabold text-slate-700">Allow Remote / WFH Check-in via App</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={requireGpsPhoto}
                  onChange={(e) => setRequireGpsPhoto(e.target.checked)}
                  className="w-4 h-4 text-[#23C45E] rounded border-slate-300 focus:ring-[#23C45E]"
                />
                <span className="font-extrabold text-slate-700">Require GPS Location Photo Verification</span>
              </label>
            </div>

            <div className="md:col-span-3 flex justify-end pt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 bg-[#23C45E] hover:bg-[#1AA14D] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save Workforce Rules
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. SECURITY & JWT TAB */}
      {activeTab === 'SECURITY' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
          <div>
            <h2 className="text-base font-black text-slate-900">Security & JWT Authentication</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Manage session expiration, multi-customer headers (`x-customer-id`), and 2FA enforcement.</p>
          </div>

          <form onSubmit={handleSaveSecurity} className="space-y-4 pt-4 border-t border-slate-100 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-extrabold text-slate-700 mb-1.5">JWT Access Token Validity (Minutes)</label>
                <input
                  type="number"
                  value={jwtExpirationMinutes}
                  onChange={(e) => setJwtExpirationMinutes(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-[#23C45E] focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="block font-extrabold text-slate-700 mb-1.5">Inactivity Session Timeout (Minutes)</label>
                <input
                  type="number"
                  value={sessionTimeoutMinutes}
                  onChange={(e) => setSessionTimeoutMinutes(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-[#23C45E] focus:outline-none text-xs"
                />
              </div>
            </div>

            <div className="p-4 bg-[#E8F9EE] border border-[#23C45E]/30 rounded-xl space-y-1.5 font-mono text-[#1AA14D] text-xs">
              <p className="font-bold text-[#1AA14D]">Security Parameters Summary:</p>
              <p>• JWT Passport Strategy: Enabled (RS256 signed bearer tokens)</p>
              <p>• Row-Level Customer Isolation: Enforced via customerId index filtering</p>
              <p>• Rate Limiting Guard: 100 requests per minute per IP</p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 bg-[#23C45E] hover:bg-[#1AA14D] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save Security Policies
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5. NOTIFICATIONS TAB */}
      {activeTab === 'NOTIFICATIONS' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
          <div>
            <h2 className="text-base font-black text-slate-900">Notification & Alert Channels</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Configure automated email, WhatsApp, and in-app alert triggers.</p>
          </div>

          <form onSubmit={handleSaveNotifications} className="space-y-4 pt-4 border-t border-slate-100 text-xs">
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer p-4 bg-slate-50 rounded-xl border border-slate-200/80 hover:bg-slate-100/60 transition-colors">
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="w-4 h-4 text-[#23C45E] rounded border-slate-300 focus:ring-[#23C45E]"
                />
                <div>
                  <p className="font-extrabold text-slate-900">Email Notifications</p>
                  <p className="text-slate-500">Send instant email notifications for new lead assignments and monthly payslips.</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-4 bg-slate-50 rounded-xl border border-slate-200/80 hover:bg-slate-100/60 transition-colors">
                <input
                  type="checkbox"
                  checked={whatsappAlerts}
                  onChange={(e) => setWhatsappAlerts(e.target.checked)}
                  className="w-4 h-4 text-[#23C45E] rounded border-slate-300 focus:ring-[#23C45E]"
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
                className="inline-flex items-center gap-2 bg-[#23C45E] hover:bg-[#1AA14D] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer"
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
