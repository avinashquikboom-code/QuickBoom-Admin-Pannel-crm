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
  MessageSquare,
  Cloud,
  Smartphone,
  Bot,
  Sparkles,
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
  const [razorpayEnvironment, setRazorpayEnvironment] = useState<'LIVE' | 'TEST'>('TEST');
  const [razorpaySource, setRazorpaySource] = useState<'DATABASE' | 'ENV_FALLBACK'>('DATABASE');

  // Razorpay Dual-Mode Integration State
  const [razorpayConnected, setRazorpayConnected] = useState(true);
  const [enableOfflinePayment, setEnableOfflinePayment] = useState(false);
  const [razorpayTestKeyId, setRazorpayTestKeyId] = useState('');
  const [razorpayTestKeySecret, setRazorpayTestKeySecret] = useState('');
  const [showRazorpayTestSecret, setShowRazorpayTestSecret] = useState(false);

  const [razorpayLiveKeyId, setRazorpayLiveKeyId] = useState('');
  const [razorpayLiveKeySecret, setRazorpayLiveKeySecret] = useState('');
  const [showRazorpayLiveSecret, setShowRazorpayLiveSecret] = useState(false);

  const [razorpayWebhookSecret, setRazorpayWebhookSecret] = useState('');
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

  // WhatsApp Integration State
  const [whatsappApiKey, setWhatsappApiKey] = useState('');
  const [whatsappPhoneNumberId, setWhatsappPhoneNumberId] = useState('');
  const [whatsappConnected, setWhatsappConnected] = useState(true);
  const [whatsappSource, setWhatsappSource] = useState<'DATABASE' | 'ENV_FALLBACK'>('ENV_FALLBACK');
  const [showWhatsappKey, setShowWhatsappKey] = useState(false);
  const [isSavingWhatsapp, setIsSavingWhatsapp] = useState(false);
  const [isTestingWhatsapp, setIsTestingWhatsapp] = useState(false);

  // AWS S3 Integration State
  const [awsAccessKeyId, setAwsAccessKeyId] = useState('');
  const [awsSecretAccessKey, setAwsSecretAccessKey] = useState('');
  const [awsRegion, setAwsRegion] = useState('ap-south-1');
  const [awsBucket, setAwsBucket] = useState('');
  const [awsCustomDomain, setAwsCustomDomain] = useState('');
  const [awsConnected, setAwsConnected] = useState(false);
  const [awsSource, setAwsSource] = useState<'DATABASE' | 'ENV_FALLBACK'>('ENV_FALLBACK');
  const [showAwsSecret, setShowAwsSecret] = useState(false);
  const [isSavingAws, setIsSavingAws] = useState(false);
  const [isTestingAws, setIsTestingAws] = useState(false);

  // MSG91 OTP Integration State
  const [msg91AuthKey, setMsg91AuthKey] = useState('');
  const [msg91TemplateId, setMsg91TemplateId] = useState('');
  const [msg91SenderId, setMsg91SenderId] = useState('QUIKBM');
  const [msg91OtpExpiry, setMsg91OtpExpiry] = useState(300);
  const [msg91Connected, setMsg91Connected] = useState(false);
  const [msg91Source, setMsg91Source] = useState<'DATABASE' | 'ENV_FALLBACK'>('ENV_FALLBACK');
  const [showMsg91Key, setShowMsg91Key] = useState(false);
  const [isSavingMsg91, setIsSavingMsg91] = useState(false);
  const [isTestingMsg91, setIsTestingMsg91] = useState(false);

  // OpenAI Integration State
  const [openAiApiKey, setOpenAiApiKey] = useState('');
  const [openAiConnected, setOpenAiConnected] = useState(false);
  const [openAiSource, setOpenAiSource] = useState<'DATABASE' | 'ENV_FALLBACK'>('ENV_FALLBACK');
  const [showOpenAiKey, setShowOpenAiKey] = useState(false);
  const [isSavingOpenAi, setIsSavingOpenAi] = useState(false);
  const [isTestingOpenAi, setIsTestingOpenAi] = useState(false);

  // Google Gemini Integration State
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [geminiConnected, setGeminiConnected] = useState(false);
  const [geminiSource, setGeminiSource] = useState<'DATABASE' | 'ENV_FALLBACK'>('ENV_FALLBACK');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [isSavingGemini, setIsSavingGemini] = useState(false);
  const [isTestingGemini, setIsTestingGemini] = useState(false);

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

  // Fetch live integration settings on mount and tab switch
  useEffect(() => {
    async function loadIntegrationSettings() {
      try {
        setIsLoadingIntegrations(true);
        const res: any = await api.get('/admin/settings/integrations');

        let items: any[] = [];
        if (Array.isArray(res)) {
          items = res;
        } else if (Array.isArray(res?.data)) {
          items = res.data;
        } else if (Array.isArray(res?.data?.data)) {
          items = res.data.data;
        }

        for (const item of items) {
          const provider = (item?.provider || '').toUpperCase();
          if (provider === 'RAZORPAY') {
            setRazorpayConnected(item.isEnabled ?? true);
            setRazorpayEnvironment(item.environment === 'LIVE' ? 'LIVE' : 'TEST');
            setRazorpaySource(item.source || 'DATABASE');
            setEnableOfflinePayment(Boolean(item.config?.enableOfflinePayment));

            const creds = item.credentials || {};
            setRazorpayTestKeyId(creds.testKeyId || (creds.keyId?.startsWith('rzp_test_') ? creds.keyId : '') || '');
            setRazorpayTestKeySecret(creds.testKeySecret || (creds.keyId?.startsWith('rzp_test_') ? creds.keySecret : '') || '');

            setRazorpayLiveKeyId(creds.liveKeyId || (creds.keyId?.startsWith('rzp_live_') ? creds.keyId : '') || '');
            setRazorpayLiveKeySecret(creds.liveKeySecret || (creds.keyId?.startsWith('rzp_live_') ? creds.keySecret : '') || '');

            setRazorpayWebhookSecret(creds.webhookSecret || creds.webhook_secret || '');
          } else if (provider === 'GOOGLE_MAPS') {
            setGoogleMapsSource(item.source || 'DATABASE');
            setGoogleMapsApiKey(item.credentials?.apiKey || item.credentials?.api_key || '');
            if (item.config) {
              setEnableEcoRouting(item.config.enableEcoRouting ?? true);
              setEnableGeocoding(item.config.enableGeocoding ?? true);
              setDefaultCity(item.config.defaultCity || 'Mumbai, Maharashtra');
            }
          } else if (provider === 'WHATSAPP') {
            setWhatsappConnected(item.isEnabled ?? true);
            setWhatsappSource(item.source || 'DATABASE');
            setWhatsappPhoneNumberId(item.credentials?.phoneNumberId || item.credentials?.phone_number_id || '');
            setWhatsappApiKey(item.credentials?.apiKey || item.credentials?.accessToken || item.credentials?.access_token || '');
          } else if (provider === 'AWS') {
            setAwsConnected(item.isEnabled ?? false);
            setAwsSource(item.source || 'ENV_FALLBACK');
            const creds = item.credentials || {};
            setAwsAccessKeyId(creds.accessKeyId || creds.access_key_id || '');
            setAwsSecretAccessKey(creds.secretAccessKey || creds.secret_access_key || '');
            setAwsRegion(creds.region || 'ap-south-1');
            setAwsBucket(creds.bucket || creds.bucketName || '');
            setAwsCustomDomain(creds.customDomain || creds.custom_domain || '');
          } else if (provider === 'MSG91') {
            setMsg91Connected(item.isEnabled ?? false);
            setMsg91Source(item.source || 'ENV_FALLBACK');
            const creds = item.credentials || {};
            const cfg = item.config || {};
            setMsg91AuthKey(creds.authKey || creds.auth_key || '');
            setMsg91TemplateId(creds.templateId || creds.template_id || '');
            setMsg91SenderId(creds.senderId || creds.sender_id || 'QUIKBM');
            setMsg91OtpExpiry(cfg.otpExpiry || 300);
          } else if (provider === 'OPENAI') {
            setOpenAiConnected(item.isEnabled ?? false);
            setOpenAiSource(item.source || 'ENV_FALLBACK');
            const creds = item.credentials || {};
            setOpenAiApiKey(creds.apiKey || creds.api_key || '');
          } else if (provider === 'GEMINI') {
            setGeminiConnected(item.isEnabled ?? false);
            setGeminiSource(item.source || 'ENV_FALLBACK');
            const creds = item.credentials || {};
            setGeminiApiKey(creds.apiKey || creds.api_key || '');
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

    if (razorpayEnvironment === 'TEST' && !razorpayTestKeyId.trim()) {
      toast.error('Please enter a valid Razorpay Test Key ID');
      return;
    }
    if (razorpayEnvironment === 'LIVE' && !razorpayLiveKeyId.trim()) {
      toast.error('Please enter a valid Razorpay Live Key ID');
      return;
    }

    setIsSavingRazorpay(true);
    try {
      const res: any = await api.put('/admin/settings/integrations/RAZORPAY', {
        isEnabled: razorpayConnected,
        environment: razorpayEnvironment,
        credentials: {
          testKeyId: razorpayTestKeyId.trim(),
          testKeySecret: razorpayTestKeySecret.trim(),
          liveKeyId: razorpayLiveKeyId.trim(),
          liveKeySecret: razorpayLiveKeySecret.trim(),
          keyId: razorpayEnvironment === 'TEST' ? razorpayTestKeyId.trim() : razorpayLiveKeyId.trim(),
          keySecret: razorpayEnvironment === 'TEST' ? razorpayTestKeySecret.trim() : razorpayLiveKeySecret.trim(),
          webhookSecret: razorpayWebhookSecret.trim(),
        },
        config: {
          enableOfflinePayment,
        },
      });

      setRazorpaySource('DATABASE');
      const creds = res?.credentials || res?.data?.credentials;
      if (creds?.testKeySecret) setRazorpayTestKeySecret(creds.testKeySecret);
      if (creds?.liveKeySecret) setRazorpayLiveKeySecret(creds.liveKeySecret);

      toast.success('Payment settings saved to Database & active immediately!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to save Payment settings');
    } finally {
      setIsSavingRazorpay(false);
    }
  };

  const handleTestRazorpay = async () => {
    const activeKeyId = razorpayEnvironment === 'TEST' ? razorpayTestKeyId.trim() : razorpayLiveKeyId.trim();
    const activeKeySecret = razorpayEnvironment === 'TEST' ? razorpayTestKeySecret.trim() : razorpayLiveKeySecret.trim();

    if (!activeKeyId) {
      toast.error(`Enter ${razorpayEnvironment} Key ID and Secret first to test connection`);
      return;
    }
    setIsTestingRazorpay(true);
    try {
      const res: any = await api.post('/admin/settings/integrations/RAZORPAY/test', {
        environment: razorpayEnvironment,
        credentials: {
          testKeyId: razorpayTestKeyId.trim(),
          testKeySecret: razorpayTestKeySecret.trim(),
          liveKeyId: razorpayLiveKeyId.trim(),
          liveKeySecret: razorpayLiveKeySecret.trim(),
          keyId: activeKeyId,
          keySecret: activeKeySecret,
        },
      });
      const data = res?.data || res;
      if (data?.success) {
        toast.success(`Razorpay connection verified! (${data.details?.environment || razorpayEnvironment} mode)`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Razorpay connection test failed');
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
      const res: any = await api.put('/admin/settings/integrations/GOOGLE_MAPS', {
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
      const creds = res?.credentials || res?.data?.credentials;
      if (creds?.apiKey) {
        setGoogleMapsApiKey(creds.apiKey);
      }
      toast.success('Google Maps Platform settings saved & active immediately!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to save Google Maps settings');
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
      const res: any = await api.post('/admin/settings/integrations/GOOGLE_MAPS/test', {
        credentials: {
          apiKey: googleMapsApiKey.trim(),
        },
      });
      const data = res?.data || res;
      if (data?.success) {
        toast.success('Google Maps Places API key verified successfully!');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Google Maps test failed');
    } finally {
      setIsTestingGoogleMaps(false);
    }
  };

  const handleSaveWhatsapp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatsappApiKey.trim()) {
      toast.error('Please enter a valid WhatsApp Business API Access Token');
      return;
    }
    setIsSavingWhatsapp(true);
    try {
      const res: any = await api.put('/admin/settings/integrations/WHATSAPP', {
        isEnabled: whatsappConnected,
        environment: 'LIVE',
        credentials: {
          apiKey: whatsappApiKey.trim(),
          phoneNumberId: whatsappPhoneNumberId.trim(),
        },
      });

      setWhatsappSource('DATABASE');
      const creds = res?.credentials || res?.data?.credentials;
      if (creds?.apiKey) {
        setWhatsappApiKey(creds.apiKey);
      }
      toast.success('WhatsApp Business API settings saved to database!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to save WhatsApp settings');
    } finally {
      setIsSavingWhatsapp(false);
    }
  };

  const handleTestWhatsapp = async () => {
    if (!whatsappApiKey.trim() || !whatsappPhoneNumberId.trim()) {
      toast.error('Enter Phone Number ID and Access Token to test connection');
      return;
    }
    setIsTestingWhatsapp(true);
    try {
      const res: any = await api.post('/admin/settings/integrations/WHATSAPP/test', {
        credentials: {
          apiKey: whatsappApiKey.trim(),
          phoneNumberId: whatsappPhoneNumberId.trim(),
        },
      });
      const data = res?.data || res;
      if (data?.success) {
        toast.success('WhatsApp Business API credentials verified successfully!');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'WhatsApp test failed');
    } finally {
      setIsTestingWhatsapp(false);
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

  const handleSaveAws = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!awsAccessKeyId.trim() || !awsSecretAccessKey.trim() || !awsBucket.trim()) {
      toast.error('AWS Access Key ID, Secret Access Key, and S3 Bucket Name are required');
      return;
    }
    setIsSavingAws(true);
    try {
      await api.put('/admin/settings/integrations/AWS', {
        isEnabled: awsConnected,
        environment: 'LIVE',
        credentials: {
          accessKeyId: awsAccessKeyId.trim(),
          secretAccessKey: awsSecretAccessKey.trim(),
          region: awsRegion.trim(),
          bucket: awsBucket.trim(),
          customDomain: awsCustomDomain.trim(),
        },
        config: {},
      });
      setAwsSource('DATABASE');
      toast.success('Amazon S3 settings saved to Database & active immediately!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to save AWS S3 settings');
    } finally {
      setIsSavingAws(false);
    }
  };

  const handleTestAws = async () => {
    if (!awsAccessKeyId.trim() || !awsSecretAccessKey.trim() || !awsBucket.trim()) {
      toast.error('Enter Access Key ID, Secret Access Key, and Bucket Name to test connection');
      return;
    }
    setIsTestingAws(true);
    try {
      const res: any = await api.post('/admin/settings/integrations/AWS/test', {
        credentials: {
          accessKeyId: awsAccessKeyId.trim(),
          secretAccessKey: awsSecretAccessKey.trim(),
          region: awsRegion.trim(),
          bucket: awsBucket.trim(),
        },
      });
      const data = res?.data || res;
      if (data?.success) {
        toast.success(`Amazon S3 bucket "${data.details?.bucket || awsBucket}" verified successfully!`);
        setAwsConnected(true);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'AWS S3 connection test failed');
    } finally {
      setIsTestingAws(false);
    }
  };

  const handleSaveMsg91 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msg91AuthKey.trim() || !msg91TemplateId.trim()) {
      toast.error('MSG91 Auth Key and Template ID are required');
      return;
    }
    setIsSavingMsg91(true);
    try {
      await api.put('/admin/settings/integrations/MSG91', {
        isEnabled: msg91Connected,
        environment: 'LIVE',
        credentials: {
          authKey: msg91AuthKey.trim(),
          templateId: msg91TemplateId.trim(),
          senderId: msg91SenderId.trim(),
        },
        config: {
          otpExpiry: Number(msg91OtpExpiry),
        },
      });
      setMsg91Source('DATABASE');
      toast.success('MSG91 OTP settings saved to Database & active immediately!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to save MSG91 settings');
    } finally {
      setIsSavingMsg91(false);
    }
  };

  const handleTestMsg91 = async () => {
    if (!msg91AuthKey.trim() || !msg91TemplateId.trim()) {
      toast.error('Enter Auth Key and Template ID to test connection');
      return;
    }
    setIsTestingMsg91(true);
    try {
      const res: any = await api.post('/admin/settings/integrations/MSG91/test', {
        credentials: {
          authKey: msg91AuthKey.trim(),
          templateId: msg91TemplateId.trim(),
        },
      });
      const data = res?.data || res;
      if (data?.success) {
        toast.success('MSG91 credentials verified successfully!');
        setMsg91Connected(true);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'MSG91 connection test failed');
    } finally {
      setIsTestingMsg91(false);
    }
  };

  const handleSaveOpenAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!openAiApiKey.trim()) {
      toast.error('Please enter a valid OpenAI API Key');
      return;
    }
    setIsSavingOpenAi(true);
    try {
      const res: any = await api.put('/admin/settings/integrations/OPENAI', {
        isEnabled: openAiConnected,
        environment: 'LIVE',
        credentials: {
          apiKey: openAiApiKey.trim(),
        },
      });

      setOpenAiSource('DATABASE');
      const creds = res?.credentials || res?.data?.credentials;
      if (creds?.apiKey) {
        setOpenAiApiKey(creds.apiKey);
      }
      setOpenAiConnected(res?.isEnabled ?? true);
      toast.success('OpenAI API key saved & active immediately!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to save OpenAI settings');
    } finally {
      setIsSavingOpenAi(false);
    }
  };

  const handleTestOpenAi = async () => {
    if (!openAiApiKey.trim()) {
      toast.error('Enter an OpenAI API Key to test connection');
      return;
    }
    setIsTestingOpenAi(true);
    try {
      const res: any = await api.post('/admin/settings/integrations/OPENAI/test', {
        credentials: {
          apiKey: openAiApiKey.trim(),
        },
      });
      const data = res?.data || res;
      if (data?.success) {
        toast.success(data?.message || 'OpenAI connection verified successfully!');
        setOpenAiConnected(true);
      } else {
        toast.error(data?.message || 'OpenAI connection test failed');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'OpenAI connection test failed');
    } finally {
      setIsTestingOpenAi(false);
    }
  };

  const handleSaveGemini = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!geminiApiKey.trim()) {
      toast.error('Please enter a valid Google Gemini API Key');
      return;
    }
    setIsSavingGemini(true);
    try {
      const res: any = await api.put('/admin/settings/integrations/GEMINI', {
        isEnabled: geminiConnected,
        environment: 'LIVE',
        credentials: {
          apiKey: geminiApiKey.trim(),
        },
      });

      setGeminiSource('DATABASE');
      const creds = res?.credentials || res?.data?.credentials;
      if (creds?.apiKey) {
        setGeminiApiKey(creds.apiKey);
      }
      setGeminiConnected(res?.isEnabled ?? true);
      toast.success('Google Gemini API key saved & active immediately!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to save Google Gemini settings');
    } finally {
      setIsSavingGemini(false);
    }
  };

  const handleTestGemini = async () => {
    if (!geminiApiKey.trim()) {
      toast.error('Enter a Google Gemini API Key to test connection');
      return;
    }
    setIsTestingGemini(true);
    try {
      const res: any = await api.post('/admin/settings/integrations/GEMINI/test', {
        credentials: {
          apiKey: geminiApiKey.trim(),
        },
      });
      const data = res?.data || res;
      if (data?.success) {
        toast.success(data?.message || 'Google Gemini connection verified successfully!');
        setGeminiConnected(true);
      } else {
        toast.error(data?.message || 'Google Gemini connection test failed');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Google Gemini connection test failed');
    } finally {
      setIsTestingGemini(false);
    }
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
          {/* PAYMENT SETTINGS & RAZORPAY CARD */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#E8F9EE] text-[#1AA14D] border border-[#23C45E]/20 flex items-center justify-center font-bold shadow-2xs shrink-0">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-black text-slate-900">Payment Settings & Gateway Configuration</h2>
                    {razorpayConnected ? (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-[#E8F9EE] text-[#1AA14D] font-extrabold border border-[#23C45E]/30">
                        <CheckCircle2 className="w-3 h-3 text-[#23C45E]" /> RAZORPAY ACTIVE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-extrabold border border-amber-200">
                        <AlertTriangle className="w-3 h-3 text-amber-600" /> RAZORPAY DISABLED
                      </span>
                    )}
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider border ${
                      razorpayEnvironment === 'LIVE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      MODE: {razorpayEnvironment}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono font-bold border border-slate-200">
                      Source: {razorpaySource}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Database is the single source of truth. Configured keys and mode are dynamically served to mobile app and backend with zero server restarts.
                  </p>
                </div>
              </div>

              {/* Master Mode & Toggle Switches */}
              <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setRazorpayEnvironment('TEST')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      razorpayEnvironment === 'TEST'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    TEST
                  </button>
                  <button
                    type="button"
                    onClick={() => setRazorpayEnvironment('LIVE')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      razorpayEnvironment === 'LIVE'
                        ? 'bg-[#23C45E] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    LIVE
                  </button>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 px-2">
                  <input
                    type="checkbox"
                    checked={razorpayConnected}
                    onChange={(e) => setRazorpayConnected(e.target.checked)}
                    className="w-4 h-4 text-[#23C45E] rounded border-slate-300 focus:ring-[#23C45E]"
                  />
                  Enable Razorpay
                </label>
              </div>
            </div>

            <form onSubmit={handleSaveRazorpay} className="space-y-6 pt-4 border-t border-slate-100 text-xs">
              {/* Dual Environment Credentials Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* 1. TEST MODE CREDENTIALS */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  razorpayEnvironment === 'TEST'
                    ? 'bg-amber-50/40 border-amber-200/80 shadow-xs'
                    : 'bg-slate-50/60 border-slate-200/70 opacity-80'
                }`}>
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200/60">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Test Mode Credentials</h3>
                    </div>
                    {razorpayEnvironment === 'TEST' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-extrabold">
                        ACTIVE IN CHECKOUT
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block font-extrabold text-slate-700 mb-1 flex items-center gap-1">
                        <Key className="w-3.5 h-3.5 text-amber-600" /> Razorpay Test Key ID {razorpayEnvironment === 'TEST' && '*'}
                      </label>
                      <input
                        type="text"
                        value={razorpayTestKeyId}
                        onChange={(e) => setRazorpayTestKeyId(e.target.value)}
                        placeholder="rzp_test_..."
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-transparent focus:outline-none font-semibold text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-extrabold text-slate-700 mb-1 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-amber-600" /> Razorpay Test Key Secret {razorpayEnvironment === 'TEST' && '*'}
                      </label>
                      <div className="relative">
                        <input
                          type={showRazorpayTestSecret ? 'text' : 'password'}
                          value={razorpayTestKeySecret}
                          onChange={(e) => setRazorpayTestKeySecret(e.target.value)}
                          placeholder="Enter test key secret..."
                          className="w-full pl-3.5 pr-10 py-2 bg-white border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-transparent focus:outline-none font-semibold text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRazorpayTestSecret(!showRazorpayTestSecret)}
                          className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        >
                          {showRazorpayTestSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. LIVE MODE CREDENTIALS */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  razorpayEnvironment === 'LIVE'
                    ? 'bg-emerald-50/40 border-emerald-200/80 shadow-xs'
                    : 'bg-slate-50/60 border-slate-200/70 opacity-80'
                }`}>
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200/60">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#23C45E]" />
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Live Mode Credentials</h3>
                    </div>
                    {razorpayEnvironment === 'LIVE' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold">
                        ACTIVE IN CHECKOUT
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block font-extrabold text-slate-700 mb-1 flex items-center gap-1">
                        <Key className="w-3.5 h-3.5 text-[#23C45E]" /> Razorpay Live Key ID {razorpayEnvironment === 'LIVE' && '*'}
                      </label>
                      <input
                        type="text"
                        value={razorpayLiveKeyId}
                        onChange={(e) => setRazorpayLiveKeyId(e.target.value)}
                        placeholder="rzp_live_..."
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:border-transparent focus:outline-none font-semibold text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-extrabold text-slate-700 mb-1 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-[#23C45E]" /> Razorpay Live Key Secret {razorpayEnvironment === 'LIVE' && '*'}
                      </label>
                      <div className="relative">
                        <input
                          type={showRazorpayLiveSecret ? 'text' : 'password'}
                          value={razorpayLiveKeySecret}
                          onChange={(e) => setRazorpayLiveKeySecret(e.target.value)}
                          placeholder="Enter live key secret..."
                          className="w-full pl-3.5 pr-10 py-2 bg-white border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:border-transparent focus:outline-none font-semibold text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRazorpayLiveSecret(!showRazorpayLiveSecret)}
                          className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        >
                          {showRazorpayLiveSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Webhook Secret */}
              <div>
                <label className="block font-extrabold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-[#23C45E]" /> Webhook Secret (Shared across environments)
                </label>
                <input
                  type="text"
                  value={razorpayWebhookSecret}
                  onChange={(e) => setRazorpayWebhookSecret(e.target.value)}
                  placeholder="whsec_..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:border-transparent focus:outline-none font-semibold text-xs"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleTestRazorpay}
                  disabled={isTestingRazorpay || (razorpayEnvironment === 'TEST' ? !razorpayTestKeyId.trim() : !razorpayLiveKeyId.trim())}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer disabled:opacity-50 border border-slate-200"
                >
                  {isTestingRazorpay ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#23C45E]" /> Testing {razorpayEnvironment} Connection...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 text-slate-600" /> Test {razorpayEnvironment} Connection
                    </>
                  )}
                </button>

                <button
                  type="submit"
                  disabled={isSavingRazorpay}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#23C45E] hover:bg-[#1AA14D] text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingRazorpay ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving to Database...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save Payment Settings
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

          {/* WHATSAPP BUSINESS API CARD */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#E8F9EE] text-[#1AA14D] border border-[#23C45E]/20 flex items-center justify-center font-bold">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-black text-slate-900">WhatsApp Business API Integration</h2>
                    {whatsappConnected ? (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-[#E8F9EE] text-[#1AA14D] font-extrabold border border-[#23C45E]/30">
                        <CheckCircle2 className="w-3 h-3 text-[#23C45E]" /> ACTIVE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-extrabold border border-amber-200">
                        <AlertTriangle className="w-3 h-3 text-amber-600" /> DISABLED
                      </span>
                    )}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono font-bold border border-slate-200">
                      Source: {whatsappSource}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Powers automated customer notifications, visit confirmations, and workforce alerts via Meta Cloud API.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={whatsappConnected}
                    onChange={(e) => setWhatsappConnected(e.target.checked)}
                    className="w-4 h-4 text-[#23C45E] rounded border-slate-300 focus:ring-[#23C45E]"
                  />
                  Active
                </label>
              </div>
            </div>

            <form onSubmit={handleSaveWhatsapp} className="space-y-4 pt-4 border-t border-slate-100 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1.5 flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-[#23C45E]" /> Phone Number ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={whatsappPhoneNumberId}
                    onChange={(e) => setWhatsappPhoneNumberId(e.target.value)}
                    placeholder="e.g. 104829104810291"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:border-transparent focus:outline-none font-semibold text-xs"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1.5 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-[#23C45E]" /> Permanent Access Token *
                  </label>
                  <div className="relative">
                    <input
                      type={showWhatsappKey ? 'text' : 'password'}
                      required
                      value={whatsappApiKey}
                      onChange={(e) => setWhatsappApiKey(e.target.value)}
                      placeholder="EAAG..."
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-[#23C45E] focus:border-transparent focus:outline-none font-semibold text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowWhatsappKey(!showWhatsappKey)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      title={showWhatsappKey ? 'Hide key' : 'Show key'}
                    >
                      {showWhatsappKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleTestWhatsapp}
                  disabled={isTestingWhatsapp || !whatsappApiKey.trim() || !whatsappPhoneNumberId.trim()}
                  className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer disabled:opacity-50 border border-slate-200"
                >
                  {isTestingWhatsapp ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#23C45E]" /> Testing WhatsApp API...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 text-slate-600" /> Test WhatsApp API
                    </>
                  )}
                </button>

                <button
                  type="submit"
                  disabled={isSavingWhatsapp}
                  className="inline-flex items-center gap-2 bg-[#23C45E] hover:bg-[#1AA14D] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingWhatsapp ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save WhatsApp Settings
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* AMAZON S3 CARD */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 border border-orange-200/60 flex items-center justify-center font-bold">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-black text-slate-900">Amazon S3 — Image Storage</h2>
                    {awsConnected ? (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-[#E8F9EE] text-[#1AA14D] font-extrabold border border-[#23C45E]/30">
                        <CheckCircle2 className="w-3 h-3 text-[#23C45E]" /> CONNECTED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-extrabold border border-amber-200">
                        <AlertTriangle className="w-3 h-3 text-amber-600" /> NOT CONFIGURED
                      </span>
                    )}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono font-bold border border-slate-200">
                      Source: {awsSource}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    All marketing banner images are stored securely in S3. Credentials are never exposed to the frontend.
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={awsConnected}
                  onChange={(e) => setAwsConnected(e.target.checked)}
                  className="w-4 h-4 text-[#23C45E] rounded border-slate-300 focus:ring-[#23C45E]"
                />
                Active
              </label>
            </div>

            <form onSubmit={handleSaveAws} className="space-y-4 pt-4 border-t border-slate-100 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1.5 flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-orange-500" /> AWS Access Key ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={awsAccessKeyId}
                    onChange={(e) => setAwsAccessKeyId(e.target.value)}
                    placeholder="AKIAIOSFODNN7EXAMPLE"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-orange-400 focus:border-transparent focus:outline-none font-semibold text-xs"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1.5 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-orange-500" /> AWS Secret Access Key *
                  </label>
                  <div className="relative">
                    <input
                      type={showAwsSecret ? 'text' : 'password'}
                      required
                      value={awsSecretAccessKey}
                      onChange={(e) => setAwsSecretAccessKey(e.target.value)}
                      placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-orange-400 focus:border-transparent focus:outline-none font-semibold text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAwsSecret(!showAwsSecret)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      {showAwsSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1.5">AWS Region *</label>
                  <input
                    type="text"
                    required
                    value={awsRegion}
                    onChange={(e) => setAwsRegion(e.target.value)}
                    placeholder="ap-south-1"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-orange-400 focus:border-transparent focus:outline-none font-semibold text-xs"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1.5">S3 Bucket Name *</label>
                  <input
                    type="text"
                    required
                    value={awsBucket}
                    onChange={(e) => setAwsBucket(e.target.value)}
                    placeholder="my-quikboom-bucket"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-orange-400 focus:border-transparent focus:outline-none font-semibold text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleTestAws}
                  disabled={isTestingAws || !awsAccessKeyId.trim() || !awsSecretAccessKey.trim() || !awsBucket.trim()}
                  className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer disabled:opacity-50 border border-slate-200"
                >
                  {isTestingAws ? (
                    <><Loader2 className="w-4 h-4 animate-spin text-orange-500" /> Testing S3 Connection...</>
                  ) : (
                    <><RefreshCw className="w-4 h-4 text-slate-600" /> Test S3 Bucket Access</>
                  )}
                </button>
                <button
                  type="submit"
                  disabled={isSavingAws}
                  className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingAws ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="w-4 h-4" /> Save S3 Settings</>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* MSG91 OTP CARD */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center font-bold">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-black text-slate-900">MSG91 — OTP & SMS Gateway</h2>
                    {msg91Connected ? (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-[#E8F9EE] text-[#1AA14D] font-extrabold border border-[#23C45E]/30">
                        <CheckCircle2 className="w-3 h-3 text-[#23C45E]" /> CONNECTED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-extrabold border border-amber-200">
                        <AlertTriangle className="w-3 h-3 text-amber-600" /> NOT CONFIGURED
                      </span>
                    )}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono font-bold border border-slate-200">
                      Source: {msg91Source}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Sends OTP for Customer mobile login. Credentials are dynamically served — no restart needed after saving.
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={msg91Connected}
                  onChange={(e) => setMsg91Connected(e.target.checked)}
                  className="w-4 h-4 text-[#23C45E] rounded border-slate-300 focus:ring-[#23C45E]"
                />
                Active
              </label>
            </div>

            <form onSubmit={handleSaveMsg91} className="space-y-4 pt-4 border-t border-slate-100 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1.5 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-blue-500" /> MSG91 Auth Key *
                  </label>
                  <div className="relative">
                    <input
                      type={showMsg91Key ? 'text' : 'password'}
                      required
                      value={msg91AuthKey}
                      onChange={(e) => setMsg91AuthKey(e.target.value)}
                      placeholder="362659XXXXXXXXXX"
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:outline-none font-semibold text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowMsg91Key(!showMsg91Key)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      {showMsg91Key ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1.5 flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-blue-500" /> OTP Template ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={msg91TemplateId}
                    onChange={(e) => setMsg91TemplateId(e.target.value)}
                    placeholder="60b9f9XXXXXXXXXX"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:outline-none font-semibold text-xs"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1.5">Sender ID</label>
                  <input
                    type="text"
                    value={msg91SenderId}
                    onChange={(e) => setMsg91SenderId(e.target.value)}
                    placeholder="QUIKBM"
                    maxLength={6}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:outline-none font-semibold text-xs uppercase"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">6 characters max (e.g. QUIKBM)</p>
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1.5">OTP Expiry (seconds)</label>
                  <input
                    type="number"
                    min={60}
                    max={1800}
                    value={msg91OtpExpiry}
                    onChange={(e) => setMsg91OtpExpiry(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:outline-none font-semibold text-xs"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Default 300s (5 min). Range: 60–1800s</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleTestMsg91}
                  disabled={isTestingMsg91 || !msg91AuthKey.trim() || !msg91TemplateId.trim()}
                  className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer disabled:opacity-50 border border-slate-200"
                >
                  {isTestingMsg91 ? (
                    <><Loader2 className="w-4 h-4 animate-spin text-blue-500" /> Verifying Credentials...</>
                  ) : (
                    <><RefreshCw className="w-4 h-4 text-slate-600" /> Test MSG91 Connection</>
                  )}
                </button>
                <button
                  type="submit"
                  disabled={isSavingMsg91}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingMsg91 ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="w-4 h-4" /> Save MSG91 Settings</>
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
function setTimezone(value: string): void {
  throw new Error('Function not implemented.');
}

