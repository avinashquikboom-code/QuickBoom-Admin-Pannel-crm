'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Hash,
  Loader2,
  RefreshCw,
  AlertTriangle,
  MessageSquare,
  Cloud,
  Smartphone,
  Bot,
  Sparkles,
  Mail,
  Server,
  Flame,
  Send,
  Unlink,
  Database,
  X,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';

function WhatsAppIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

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
  const [hasExistingWhatsappToken, setHasExistingWhatsappToken] = useState(false);
  const [whatsappPhoneNumberId, setWhatsappPhoneNumberId] = useState('');
  const [whatsappBusinessAccountId, setWhatsappBusinessAccountId] = useState('');
  const [whatsappApiVersion, setWhatsappApiVersion] = useState('v25.0');
  const [whatsappTestPhone, setWhatsappTestPhone] = useState('');
  const [whatsappVerifyToken, setWhatsappVerifyToken] = useState('3f4e429cbf154b82ca819b5af5bc046110d18f336db6627a');
  const [whatsappAppId, setWhatsappAppId] = useState('');
  const [whatsappAppSecret, setWhatsappAppSecret] = useState('');
  const [hasExistingWhatsappAppSecret, setHasExistingWhatsappAppSecret] = useState(false);
  const [whatsappConnected, setWhatsappConnected] = useState(true);
  const [whatsappSource, setWhatsappSource] = useState<'DATABASE' | 'ENV_FALLBACK'>('DATABASE');
  const [showWhatsappKey, setShowWhatsappKey] = useState(false);
  const [showWhatsappAppSecret, setShowWhatsappAppSecret] = useState(false);
  const [isSavingWhatsapp, setIsSavingWhatsapp] = useState(false);
  const [isTestingWhatsapp, setIsTestingWhatsapp] = useState(false);
  const [isSubscribingWhatsapp, setIsSubscribingWhatsapp] = useState(false);
  const [copiedWebhookUrl, setCopiedWebhookUrl] = useState(false);

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

  // Firebase Push Notifications (FCM) Integration State
  const [firebaseConnected, setFirebaseConnected] = useState(false);
  const [firebaseStatus, setFirebaseStatus] = useState<'CONNECTED' | 'PARTIALLY CONFIGURED' | 'NOT CONFIGURED' | 'CONNECTION ERROR'>('NOT CONFIGURED');
  const [firebaseSource, setFirebaseSource] = useState<'DATABASE' | 'ENV_FALLBACK' | 'NONE'>('NONE');
  const [firebaseProjectId, setFirebaseProjectId] = useState('');
  const [firebaseClientEmail, setFirebaseClientEmail] = useState('');
  const [firebasePrivateKey, setFirebasePrivateKey] = useState('');
  const [firebaseSenderId, setFirebaseSenderId] = useState('');
  const [firebaseWebApiKey, setFirebaseWebApiKey] = useState('');
  const [firebaseWebAppId, setFirebaseWebAppId] = useState('');
  const [firebaseAuthDomain, setFirebaseAuthDomain] = useState('');
  const [firebaseStorageBucket, setFirebaseStorageBucket] = useState('');
  const [firebaseVapidKey, setFirebaseVapidKey] = useState('');
  const [showFirebaseKey, setShowFirebaseKey] = useState(false);
  const [isSavingFirebase, setIsSavingFirebase] = useState(false);
  const [isTestingFirebase, setIsTestingFirebase] = useState(false);
  const [isDisconnectingFirebase, setIsDisconnectingFirebase] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [firebaseLastTestedAt, setFirebaseLastTestedAt] = useState<string | null>(null);
  const [firebaseLastTestResult, setFirebaseLastTestResult] = useState<string | null>(null);
  const [firebaseLastTestMessage, setFirebaseLastTestMessage] = useState<string | null>(null);

  // FCM Test Notification State
  const [testRecipientType, setTestRecipientType] = useState<'CURRENT_ADMIN' | 'ALL_ADMINS' | 'CUSTOMER' | 'EMPLOYEE' | 'ALL_ACTIVE_DEVICES'>('CURRENT_ADMIN');
  const [testRecipientId, setTestRecipientId] = useState('');
  const [testTitle, setTestTitle] = useState('QuikBoom Test Notification');
  const [testMessage, setTestMessage] = useState('Firebase Cloud Messaging is working correctly.');
  const [isSendingTestNotification, setIsSendingTestNotification] = useState(false);

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
  // SMTP Email Integration States
  const [smtpConnected, setSmtpConnected] = useState(true);
  const [smtpSource, setSmtpSource] = useState('DATABASE');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState<number | string>(587);
  const [smtpSecurity, setSmtpSecurity] = useState<'TLS' | 'SSL' | 'NONE'>('TLS');
  const [smtpUsername, setSmtpUsername] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [smtpFromEmail, setSmtpFromEmail] = useState('');
  const [smtpFromName, setSmtpFromName] = useState('');
  const [isSavingSmtp, setIsSavingSmtp] = useState(false);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);

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
            const creds = item.credentials || {};
            setWhatsappPhoneNumberId(creds.phoneNumberId || creds.phone_number_id || '');
            setWhatsappBusinessAccountId(creds.businessAccountId || creds.business_account_id || creds.wabaId || '');
            setWhatsappApiVersion(creds.apiVersion || 'v25.0');
            setWhatsappVerifyToken(creds.verifyToken || creds.webhookVerifyToken || '3f4e429cbf154b82ca819b5af5bc046110d18f336db6627a');
            setWhatsappAppId(creds.appId || '');
            setHasExistingWhatsappToken(Boolean(creds.hasAccessToken || creds.isTokenSaved || creds.apiKey || creds.accessToken));
            setHasExistingWhatsappAppSecret(Boolean(creds.hasAppSecret || creds.isAppSecretSaved || creds.appSecret));
            setWhatsappApiKey('');
            setWhatsappAppSecret('');
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
          } else if (provider === 'SMTP') {
            setSmtpConnected(item.isEnabled ?? true);
            setSmtpSource(item.source || 'DATABASE');
            const creds = item.credentials || {};
            const cfg = item.config || {};
            setSmtpHost(cfg.host || creds.host || creds.smtpHost || '');
            setSmtpPort(cfg.port || creds.port || creds.smtpPort || 587);
            const loadedSec = cfg.security || creds.security || (cfg.port === 465 ? 'SSL' : 'TLS');
            setSmtpSecurity(loadedSec === 'SSL' || loadedSec === 'NONE' ? loadedSec : 'TLS');
            setSmtpUsername(creds.username || creds.smtpUsername || '');
            setSmtpPassword(creds.password || creds.smtpPassword || '');
            setSmtpFromEmail(cfg.fromEmail || creds.fromEmail || '');
            setSmtpFromName(cfg.fromName || creds.fromName || 'QuickBoom CRM');
          } else if (provider === 'FIREBASE') {
            const creds = item.credentials || {};
            const cfg = item.config || {};
            const hasProj = Boolean(creds.projectId || creds.project_id || cfg.projectId);
            const hasEmail = Boolean(creds.clientEmail || creds.client_email);
            const hasKey = Boolean(creds.privateKey || creds.private_key);
            const hasSender = Boolean(creds.messagingSenderId || creds.messaging_sender_id || cfg.messagingSenderId);
            const hasAny = hasProj || hasEmail || hasKey || hasSender || Boolean(creds.apiKey || creds.api_key) || Boolean(creds.vapidKey || creds.vapid_key);
            const isFully = hasProj && hasEmail && hasKey;

            const isEnabled = Boolean(item.isEnabled);
            setFirebaseConnected(isEnabled);
            setFirebaseSource(hasAny ? (item.source || 'DATABASE') : 'NONE');

            if (!hasAny) {
              setFirebaseStatus('NOT CONFIGURED');
            } else if (cfg.lastTestResult === 'FAILED') {
              setFirebaseStatus('CONNECTION ERROR');
            } else if (isFully) {
              setFirebaseStatus('CONNECTED');
            } else {
              setFirebaseStatus('PARTIALLY CONFIGURED');
            }

            setFirebaseProjectId(creds.projectId || creds.project_id || cfg.projectId || '');
            setFirebaseClientEmail(creds.clientEmail || creds.client_email || '');
            setFirebasePrivateKey(creds.privateKey || creds.private_key || '');
            setFirebaseSenderId(creds.messagingSenderId || creds.messaging_sender_id || cfg.messagingSenderId || '');
            setFirebaseWebApiKey(creds.apiKey || creds.api_key || cfg.apiKey || '');
            setFirebaseWebAppId(creds.appId || creds.app_id || cfg.appId || '');
            setFirebaseAuthDomain(creds.authDomain || creds.auth_domain || cfg.authDomain || '');
            setFirebaseStorageBucket(creds.storageBucket || creds.storage_bucket || cfg.storageBucket || '');
            setFirebaseVapidKey(creds.vapidKey || creds.vapid_key || cfg.vapidKey || '');
            setFirebaseLastTestedAt(cfg.lastTestedAt || null);
            setFirebaseLastTestResult(cfg.lastTestResult || null);
            setFirebaseLastTestMessage(cfg.lastTestResult === 'SUCCESS' ? 'Connection check successful' : cfg.lastTestError || null);
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
    if (!whatsappPhoneNumberId.trim()) {
      toast.error('WhatsApp Business Phone Number ID is required');
      return;
    }
    setIsSavingWhatsapp(true);
    try {
      const credentialsPayload: Record<string, any> = {
        phoneNumberId: whatsappPhoneNumberId.trim(),
        businessAccountId: whatsappBusinessAccountId.trim(),
        apiVersion: whatsappApiVersion.trim() || 'v25.0',
        verifyToken: whatsappVerifyToken.trim(),
        appId: whatsappAppId.trim(),
      };
      if (whatsappApiKey.trim()) {
        credentialsPayload.apiKey = whatsappApiKey.trim();
        credentialsPayload.accessToken = whatsappApiKey.trim();
      }
      if (whatsappAppSecret.trim()) {
        credentialsPayload.appSecret = whatsappAppSecret.trim();
      }

      const res: any = await api.put('/admin/settings/integrations/WHATSAPP', {
        isEnabled: whatsappConnected,
        environment: 'LIVE',
        credentials: credentialsPayload,
      });

      setWhatsappSource('DATABASE');
      const creds = res?.credentials || res?.data?.credentials;
      if (creds?.apiKey || credentialsPayload.apiKey) {
        setHasExistingWhatsappToken(true);
        setWhatsappApiKey('');
      }
      if (creds?.appSecret || credentialsPayload.appSecret) {
        setHasExistingWhatsappAppSecret(true);
        setWhatsappAppSecret('');
      }
      toast.success('WhatsApp API settings saved successfully!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to save WhatsApp settings');
    } finally {
      setIsSavingWhatsapp(false);
    }
  };

    const handleTestWhatsapp = async () => {
    if (!whatsappPhoneNumberId.trim()) {
      toast.error('Enter Phone Number ID to test connection');
      return;
    }
    setIsTestingWhatsapp(true);
    try {
      const credentialsPayload: Record<string, any> = {
        phoneNumberId: whatsappPhoneNumberId.trim(),
        apiVersion: whatsappApiVersion.trim() || 'v25.0',
      };
      if (whatsappApiKey.trim()) {
        credentialsPayload.apiKey = whatsappApiKey.trim();
      }
      if (whatsappTestPhone.trim()) {
        credentialsPayload.testPhone = whatsappTestPhone.trim();
      }
      const res: any = await api.post('/admin/settings/integrations/WHATSAPP/test', {
        credentials: credentialsPayload,
      });
      const data = res?.data || res;
      if (data?.success) {
        toast.success(data?.message || 'WhatsApp Business API connection verified successfully!');
      } else {
        toast.error(data?.message || data?.details || 'WhatsApp test failed');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'WhatsApp test failed');
    } finally {
      setIsTestingWhatsapp(false);
    }
  };

  const handleSubscribeWhatsapp = async () => {
    if (!whatsappBusinessAccountId.trim()) {
      toast.error('WhatsApp Business Account ID is required');
      return;
    }
    setIsSubscribingWhatsapp(true);
    try {
      const credentialsPayload: Record<string, any> = {
        businessAccountId: whatsappBusinessAccountId.trim(),
        apiVersion: whatsappApiVersion.trim() || 'v25.0',
      };
      if (whatsappApiKey.trim()) {
        credentialsPayload.accessToken = whatsappApiKey.trim();
      }
      const res: any = await api.post('/admin/settings/integrations/WHATSAPP/subscribe', {
        credentials: credentialsPayload,
      });
      toast.success(res?.message || 'Subscribed to WhatsApp webhook events with Meta!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to subscribe webhook');
    } finally {
      setIsSubscribingWhatsapp(false);
    }
  };

  const handleCopyWebhookUrl = (url: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    setCopiedWebhookUrl(true);
    toast.success('Webhook URL copied to clipboard!');
    setTimeout(() => setCopiedWebhookUrl(false), 2500);
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

  const handleSaveFirebase = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSavingFirebase(true);
    try {
      const res: any = await api.put('/admin/settings/integrations/FIREBASE', {
        isEnabled: firebaseConnected,
        environment: 'LIVE',
        credentials: {
          projectId: firebaseProjectId.trim(),
          clientEmail: firebaseClientEmail.trim(),
          privateKey: firebasePrivateKey.includes('•') ? undefined : firebasePrivateKey.trim(),
          messagingSenderId: firebaseSenderId.trim(),
          apiKey: firebaseWebApiKey.trim() || undefined,
          appId: firebaseWebAppId.trim() || undefined,
          authDomain: firebaseAuthDomain.trim() || undefined,
          storageBucket: firebaseStorageBucket.trim() || undefined,
          vapidKey: firebaseVapidKey.trim() || undefined,
        },
        config: {
          projectId: firebaseProjectId.trim(),
          messagingSenderId: firebaseSenderId.trim(),
          authDomain: firebaseAuthDomain.trim(),
          storageBucket: firebaseStorageBucket.trim(),
        },
      });

      const creds = res?.credentials || res?.data?.credentials;
      if (creds?.privateKey) {
        setFirebasePrivateKey(creds.privateKey);
      }

      const hasProj = Boolean(firebaseProjectId.trim());
      const hasEmail = Boolean(firebaseClientEmail.trim());
      const hasKey = Boolean((creds?.privateKey || firebasePrivateKey).trim());
      const hasSender = Boolean(firebaseSenderId.trim());
      const hasAny = hasProj || hasEmail || hasKey || hasSender || Boolean(firebaseWebApiKey.trim()) || Boolean(firebaseVapidKey.trim());
      const isFully = hasProj && hasEmail && hasKey;

      if (!hasAny) {
        setFirebaseSource('NONE');
        setFirebaseStatus('NOT CONFIGURED');
      } else if (isFully) {
        setFirebaseSource('DATABASE');
        setFirebaseStatus(firebaseLastTestResult === 'FAILED' ? 'CONNECTION ERROR' : 'CONNECTED');
      } else {
        setFirebaseSource('DATABASE');
        setFirebaseStatus('PARTIALLY CONFIGURED');
      }

      toast.success('✓ FCM credentials updated successfully');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || '✕ Unable to save Firebase credentials.');
    } finally {
      setIsSavingFirebase(false);
    }
  };

  const handleTestFirebase = async () => {
    setIsTestingFirebase(true);
    try {
      const res: any = await api.post('/admin/settings/integrations/FIREBASE/test', {
        credentials: {
          projectId: firebaseProjectId.trim(),
          clientEmail: firebaseClientEmail.trim(),
          privateKey: firebasePrivateKey.includes('•') ? undefined : firebasePrivateKey.trim(),
          messagingSenderId: firebaseSenderId.trim(),
        },
      });
      const data = res?.data || res;
      if (data?.success || data?.connected) {
        toast.success(data?.message || '✓ Connection check successful');
        setFirebaseConnected(true);
        setFirebaseStatus('CONNECTED');
        setFirebaseLastTestedAt(data?.lastTestedAt || new Date().toISOString());
        setFirebaseLastTestResult('SUCCESS');
        setFirebaseLastTestMessage(data?.message || 'Connection check successful');
      } else {
        const msg = data?.message || '✕ Connection failed';
        toast.error(msg);
        if (data?.status === 'NOT CONFIGURED') {
          const hasAny = Boolean(firebaseProjectId.trim() || firebaseClientEmail.trim() || firebasePrivateKey.trim());
          setFirebaseStatus(hasAny ? 'PARTIALLY CONFIGURED' : 'NOT CONFIGURED');
          setFirebaseLastTestResult(null);
        } else {
          setFirebaseStatus('CONNECTION ERROR');
          setFirebaseLastTestResult('FAILED');
        }
        setFirebaseLastTestedAt(new Date().toISOString());
        setFirebaseLastTestMessage(msg);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || '✕ Connection failed';
      toast.error(msg);
      setFirebaseStatus('CONNECTION ERROR');
      setFirebaseLastTestedAt(new Date().toISOString());
      setFirebaseLastTestResult('FAILED');
      setFirebaseLastTestMessage(msg);
    } finally {
      setIsTestingFirebase(false);
    }
  };

  const handleDisconnectFirebase = async () => {
    setIsDisconnectingFirebase(true);
    try {
      await api.delete('/admin/settings/integrations/FIREBASE');
      toast.success('Firebase FCM integration disconnected');
      setFirebaseConnected(false);
      setFirebaseStatus('NOT CONFIGURED');
      setFirebaseSource('NONE');
      setFirebaseProjectId('');
      setFirebaseClientEmail('');
      setFirebasePrivateKey('');
      setFirebaseSenderId('');
      setFirebaseWebApiKey('');
      setFirebaseWebAppId('');
      setFirebaseAuthDomain('');
      setFirebaseStorageBucket('');
      setFirebaseVapidKey('');
      setFirebaseLastTestedAt(null);
      setFirebaseLastTestResult(null);
      setFirebaseLastTestMessage(null);
      setShowDisconnectModal(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to disconnect Firebase');
    } finally {
      setIsDisconnectingFirebase(false);
    }
  };

  const handleSendTestNotification = async () => {
    if (!testTitle.trim() || !testMessage.trim()) {
      toast.error('Please enter notification title and message');
      return;
    }
    if (
      (testRecipientType === 'CUSTOMER' || testRecipientType === 'EMPLOYEE') &&
      !testRecipientId.trim()
    ) {
      toast.error(`Please specify a valid ${testRecipientType === 'CUSTOMER' ? 'Customer ID' : 'Employee ID'}`);
      return;
    }
    setIsSendingTestNotification(true);
    try {
      const res: any = await api.post('/admin/settings/integrations/FIREBASE/test-notification', {
        recipientType: testRecipientType,
        recipientId: testRecipientId.trim() || undefined,
        title: testTitle.trim(),
        message: testMessage.trim(),
      });
      const data = res?.data || res;
      if (data?.success) {
        toast.success(data?.message || '✓ Test notification sent successfully');
      } else {
        toast.error(data?.message || '✕ Failed to send test notification');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || '✕ Failed to send test notification');
    } finally {
      setIsSendingTestNotification(false);
    }
  };

  const handleSaveSmtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!smtpHost.trim()) {
      toast.error('Please enter SMTP Host');
      return false;
    }
    if (!smtpPort) {
      toast.error('Please enter SMTP Port');
      return false;
    }
    if (!smtpFromEmail.trim()) {
      toast.error('Please enter From Email address');
      return false;
    }

    setIsSavingSmtp(true);
    try {
      const res: any = await api.put('/admin/settings/integrations/SMTP', {
        isEnabled: smtpConnected,
        credentials: {
          username: smtpUsername.trim(),
          password: smtpPassword.trim(),
        },
        config: {
          host: smtpHost.trim(),
          port: Number(smtpPort) || 587,
          security: smtpSecurity,
          fromEmail: smtpFromEmail.trim(),
          fromName: smtpFromName.trim() || 'QuickBoom CRM',
        },
      });

      setSmtpSource('DATABASE');
      const creds = res?.credentials || res?.data?.credentials;
      if (creds?.password) {
        setSmtpPassword(creds.password);
      }
      setSmtpConnected(res?.isEnabled ?? true);
      toast.success('SMTP Email settings saved securely!');
      return true;
    } catch (err: any) {
      const rawMsg = err?.response?.data?.message || err?.message || 'Failed to save SMTP settings';
      const displayMsg = Array.isArray(rawMsg) ? rawMsg.join('. ') : rawMsg;
      toast.error(displayMsg);
      return false;
    } finally {
      setIsSavingSmtp(false);
    }
  };

  const handleTestSmtp = async () => {
    if (!smtpHost.trim()) {
      toast.error('Please enter SMTP Host to test connection');
      return;
    }
    if (!smtpPort) {
      toast.error('Please enter SMTP Port to test connection');
      return;
    }

    setIsTestingSmtp(true);
    try {
      const res: any = await api.post('/admin/settings/integrations/SMTP/test', {
        credentials: {
          username: smtpUsername.trim(),
          password: smtpPassword.trim(),
        },
        config: {
          host: smtpHost.trim(),
          port: Number(smtpPort) || 587,
          security: smtpSecurity,
          fromEmail: smtpFromEmail.trim(),
          fromName: smtpFromName.trim(),
        },
      });
      const data = res?.data || res;
      if (data?.success) {
        toast.success(data?.message || 'SMTP connection verified successfully!');
        setSmtpConnected(true);
      } else {
        toast.error(data?.message || 'SMTP connection test failed');
      }
    } catch (err: any) {
      const rawMsg = err?.response?.data?.message || err?.message || 'SMTP connection test failed';
      const displayMsg = Array.isArray(rawMsg) ? rawMsg.join('. ') : rawMsg;
      toast.error(displayMsg);
    } finally {
      setIsTestingSmtp(false);
    }
  };

  const handleSaveAndTestSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const saved = await handleSaveSmtp();
    if (saved) {
      await handleTestSmtp();
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

          {/* WHATSAPP BUSINESS API CARD - EXACT META DEVELOPER SETUP DESIGN */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-7 shadow-xs space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                  <WhatsAppIcon className="w-6 h-6 fill-[#25D366]" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 tracking-tight">Whatsapp Meta API Credentials</h2>
                  <p className="text-xs text-slate-500 mt-1 font-normal">
                    From{' '}
                    <a
                      href="https://developers.facebook.com/apps"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:text-blue-700 hover:underline font-medium inline-flex items-center gap-0.5"
                    >
                      Meta for Developers
                    </a>{' '}
                    → Your App → WhatsApp → API Setup
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={whatsappConnected}
                    onChange={(e) => setWhatsappConnected(e.target.checked)}
                    className="w-4 h-4 text-[#22C55E] rounded border-slate-300 focus:ring-[#22C55E]"
                  />
                  Active
                </label>
              </div>
            </div>

            <form onSubmit={handleSaveWhatsapp} className="space-y-5 text-xs">
              {/* Row 1: WhatsApp Business Phone Number ID & WhatsApp Business Account ID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-2">
                    WhatsApp Business Phone Number ID
                  </label>
                  <input
                    type="text"
                    value={whatsappPhoneNumberId}
                    onChange={(e) => setWhatsappPhoneNumberId(e.target.value)}
                    placeholder="903438676196217"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E] focus:outline-none transition-all placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-2">
                    WhatsApp Business Account ID
                  </label>
                  <input
                    type="text"
                    value={whatsappBusinessAccountId}
                    onChange={(e) => setWhatsappBusinessAccountId(e.target.value)}
                    placeholder="1585695696450414"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E] focus:outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Row 2: Meta Access Token */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-xs font-semibold text-slate-800">
                    Meta Access Token
                  </label>
                  {hasExistingWhatsappToken && (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-semibold border border-emerald-200">
                      <Check className="w-3 h-3 text-emerald-600" /> Saved
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showWhatsappKey ? 'text' : 'password'}
                    value={whatsappApiKey}
                    onChange={(e) => setWhatsappApiKey(e.target.value)}
                    placeholder={hasExistingWhatsappToken ? 'Leave blank to keep existing token' : 'Enter permanent Meta Access Token (EAAG...)'}
                    className="w-full pl-4 pr-11 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs font-mono font-medium focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E] focus:outline-none transition-all placeholder:text-slate-400 placeholder:font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowWhatsappKey(!showWhatsappKey)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    title={showWhatsappKey ? 'Hide token' : 'Show token'}
                  >
                    {showWhatsappKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 font-normal">
                  Token is stored securely on the server and never exposed to the browser.
                </p>
              </div>

              {/* Row 3: API Version & Webhook Verify Token */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-2">
                    API Version
                  </label>
                  <input
                    type="text"
                    value={whatsappApiVersion}
                    onChange={(e) => setWhatsappApiVersion(e.target.value)}
                    placeholder="v25.0"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E] focus:outline-none transition-all placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-2">
                    Webhook Verify Token
                  </label>
                  <input
                    type="text"
                    value={whatsappVerifyToken}
                    onChange={(e) => setWhatsappVerifyToken(e.target.value)}
                    placeholder="3f4e429cbf154b82ca819b5af5bc046110d18f336db6627a"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs font-mono font-medium focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E] focus:outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Row 4: Webhook URL with Copy button */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-2">
                  Webhook URL <span className="text-slate-400 font-normal">(copy this into Meta Dashboard)</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    readOnly
                    value="https://api.qbapp.online/api/v1/webhooks/whatsapp"
                    className="w-full pl-4 pr-12 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-700 text-xs font-mono select-all focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyWebhookUrl('https://api.qbapp.online/api/v1/webhooks/whatsapp')}
                    className="absolute right-2 px-2.5 py-1 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
                    title="Copy Webhook URL"
                  >
                    {copiedWebhookUrl ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Section: Auto-Subscribe Webhook Credentials */}
              <div className="pt-2 space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Auto-Subscribe Webhook Credentials</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-normal">
                    Sirf &quot;Subscribe Messages&quot; button use karne ke liye chahiye — Meta App Dashboard → Settings → Basic mein milega.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-2">
                      App ID
                    </label>
                    <input
                      type="text"
                      value={whatsappAppId}
                      onChange={(e) => setWhatsappAppId(e.target.value)}
                      placeholder="1446083643979885"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E] focus:outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-xs font-semibold text-slate-800">
                        App Secret
                      </label>
                      {hasExistingWhatsappAppSecret && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-semibold border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600" /> Saved
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showWhatsappAppSecret ? 'text' : 'password'}
                        value={whatsappAppSecret}
                        onChange={(e) => setWhatsappAppSecret(e.target.value)}
                        placeholder={hasExistingWhatsappAppSecret ? 'Leave blank to keep existing' : 'Enter Meta App Secret'}
                        className="w-full pl-4 pr-11 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs font-mono font-medium focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E] focus:outline-none transition-all placeholder:text-slate-400 placeholder:font-sans"
                      />
                      <button
                        type="button"
                        onClick={() => setShowWhatsappAppSecret(!showWhatsappAppSecret)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        title={showWhatsappAppSecret ? 'Hide secret' : 'Show secret'}
                      >
                        {showWhatsappAppSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3">
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={isSavingWhatsapp}
                    className="inline-flex items-center gap-2 bg-[#22C55E] hover:bg-[#16A34A] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSavingWhatsapp ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Save Settings
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleSubscribeWhatsapp}
                    disabled={isSubscribingWhatsapp || !whatsappBusinessAccountId.trim()}
                    className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-xl font-bold text-xs border border-slate-200 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubscribingWhatsapp ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#22C55E]" /> Subscribing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-emerald-600" /> Subscribe Messages
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={whatsappTestPhone}
                    onChange={(e) => setWhatsappTestPhone(e.target.value)}
                    placeholder="Test phone (e.g. 919876543210)"
                    className="w-48 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono font-medium focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E] focus:outline-none placeholder:text-slate-400 placeholder:font-sans"
                  />
                  <button
                    type="button"
                    onClick={handleTestWhatsapp}
                    disabled={isTestingWhatsapp || !whatsappPhoneNumberId.trim()}
                    className="inline-flex items-center gap-2 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3.5 py-2 rounded-xl font-semibold text-xs transition-colors cursor-pointer disabled:opacity-40"
                    title={whatsappTestPhone.trim() ? "Test sending real WhatsApp message" : "Test Meta API connectivity"}
                  >
                    {isTestingWhatsapp ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#22C55E]" /> Testing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 text-slate-500" /> {whatsappTestPhone.trim() ? "Send Test" : "Test Connection"}
                      </>
                    )}
                  </button>
                </div>
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

          {/* OPENAI API KEY CARD */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center font-bold">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-black text-slate-900">OpenAI</h2>
                    {openAiConnected ? (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-[#E8F9EE] text-[#1AA14D] font-extrabold border border-[#23C45E]/30">
                        <CheckCircle2 className="w-3 h-3 text-[#23C45E]" /> CONNECTED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-extrabold border border-amber-200">
                        <AlertTriangle className="w-3 h-3 text-amber-600" /> NOT CONFIGURED
                      </span>
                    )}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono font-bold border border-slate-200">
                      Source: {openAiSource}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Powers QB Marketplace AI image and content generation. Stored encrypted and accessed exclusively by the backend.
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={openAiConnected}
                  onChange={(e) => setOpenAiConnected(e.target.checked)}
                  className="w-4 h-4 text-[#23C45E] rounded border-slate-300 focus:ring-[#23C45E]"
                />
                Active
              </label>
            </div>

            <form onSubmit={handleSaveOpenAi} className="space-y-4 pt-4 border-t border-slate-100 text-xs">
              <div>
                <label className="block font-extrabold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-emerald-500" /> OpenAI API Key *
                </label>
                <div className="relative">
                  <input
                    type={showOpenAiKey ? 'text' : 'password'}
                    required
                    value={openAiApiKey}
                    onChange={(e) => setOpenAiApiKey(e.target.value)}
                    placeholder="sk-proj-..."
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-emerald-400 focus:border-transparent focus:outline-none font-semibold text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOpenAiKey(!showOpenAiKey)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    title={showOpenAiKey ? 'Hide key' : 'Show key'}
                  >
                    {showOpenAiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Credentials are encrypted with AES-256-GCM. Stored keys are masked and never exposed in full.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleTestOpenAi}
                  disabled={isTestingOpenAi || !openAiApiKey.trim()}
                  className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer disabled:opacity-50 border border-slate-200"
                >
                  {isTestingOpenAi ? (
                    <><Loader2 className="w-4 h-4 animate-spin text-emerald-500" /> Testing Connection...</>
                  ) : (
                    <><RefreshCw className="w-4 h-4 text-slate-600" /> Test Connection</>
                  )}
                </button>
                <button
                  type="submit"
                  disabled={isSavingOpenAi}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingOpenAi ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="w-4 h-4" /> Save OpenAI Key</>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* GOOGLE GEMINI API KEY CARD */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200/60 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-black text-slate-900">Google Gemini</h2>
                    {geminiConnected ? (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-[#E8F9EE] text-[#1AA14D] font-extrabold border border-[#23C45E]/30">
                        <CheckCircle2 className="w-3 h-3 text-[#23C45E]" /> CONNECTED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-extrabold border border-amber-200">
                        <AlertTriangle className="w-3 h-3 text-amber-600" /> NOT CONFIGURED
                      </span>
                    )}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono font-bold border border-slate-200">
                      Source: {geminiSource}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Powers QB Marketplace AI text, captions, vision, and video generation. Stored encrypted and accessed exclusively by the backend.
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={geminiConnected}
                  onChange={(e) => setGeminiConnected(e.target.checked)}
                  className="w-4 h-4 text-[#23C45E] rounded border-slate-300 focus:ring-[#23C45E]"
                />
                Active
              </label>
            </div>

            <form onSubmit={handleSaveGemini} className="space-y-4 pt-4 border-t border-slate-100 text-xs">
              <div>
                <label className="block font-extrabold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-indigo-500" /> Gemini API Key *
                </label>
                <div className="relative">
                  <input
                    type={showGeminiKey ? 'text' : 'password'}
                    required
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-indigo-400 focus:border-transparent focus:outline-none font-semibold text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    title={showGeminiKey ? 'Hide key' : 'Show key'}
                  >
                    {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Credentials are encrypted with AES-256-GCM. Stored keys are masked and never exposed in full.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleTestGemini}
                  disabled={isTestingGemini || !geminiApiKey.trim()}
                  className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer disabled:opacity-50 border border-slate-200"
                >
                  {isTestingGemini ? (
                    <><Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> Testing Connection...</>
                  ) : (
                    <><RefreshCw className="w-4 h-4 text-slate-600" /> Test Connection</>
                  )}
                </button>
                <button
                  type="submit"
                  disabled={isSavingGemini}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingGemini ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="w-4 h-4" /> Save Gemini Key</>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* FIREBASE CLOUD MESSAGING (FCM) INTEGRATION CARD */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
            {/* CARD HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 border border-orange-200/80 flex items-center justify-center font-bold shadow-2xs shrink-0">
                  <Bell className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-black text-slate-900">Firebase Push Notifications (FCM)</h2>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-md bg-orange-100/70 text-orange-800 font-extrabold tracking-wider border border-orange-200 uppercase">
                      FCM Push Service
                    </span>
                    {firebaseStatus === 'CONNECTED' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-[#E8F9EE] text-[#1AA14D] font-extrabold border border-[#23C45E]/30">
                        <CheckCircle2 className="w-3 h-3 text-[#23C45E]" /> CONNECTED
                      </span>
                    ) : firebaseStatus === 'PARTIALLY CONFIGURED' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-extrabold border border-blue-200">
                        <AlertCircle className="w-3 h-3 text-blue-600" /> PARTIALLY CONFIGURED
                      </span>
                    ) : firebaseStatus === 'CONNECTION ERROR' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-extrabold border border-rose-200">
                        <AlertTriangle className="w-3 h-3 text-rose-600" /> CONNECTION ERROR
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-extrabold border border-amber-200">
                        <AlertTriangle className="w-3 h-3 text-amber-600" /> NOT CONFIGURED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Firebase Cloud Messaging credentials for Android, iOS &amp; Web Push Notifications
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 select-none self-start sm:self-center">
                <input
                  type="checkbox"
                  checked={firebaseConnected}
                  onChange={(e) => setFirebaseConnected(e.target.checked)}
                  className="w-4 h-4 text-[#23C45E] rounded border-slate-300 focus:ring-[#23C45E]"
                />
                Active
              </label>
            </div>

            {/* NON-BLOCKING WARNING IF ACTIVE BUT INCOMPLETE */}
            {firebaseConnected && (!firebaseProjectId.trim() || !firebaseClientEmail.trim() || !firebasePrivateKey.trim()) && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="font-medium">
                  FCM is enabled but not fully configured. Push notifications will not be dispatched until Firebase configuration is complete.
                </p>
              </div>
            )}

            {/* FEATURE INDICATORS */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold border border-slate-200/60 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                Mobile &amp; Web Push
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold border border-slate-200/60 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                FCM V1 / Server Key
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold border border-slate-200/60 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Instant Push Dispatch
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono font-bold border border-slate-200 ml-auto">
                Source: {firebaseSource}
              </span>
            </div>

            {/* CREDENTIALS FORM */}
            <form onSubmit={handleSaveFirebase} className="space-y-4 pt-3 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1.5 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-orange-500" /> Firebase Project ID
                  </label>
                  <input
                    type="text"
                    value={firebaseProjectId}
                    onChange={(e) => setFirebaseProjectId(e.target.value)}
                    placeholder="e.g. your-project-id"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-orange-400 focus:border-transparent focus:outline-none font-semibold text-xs"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1.5 flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-orange-500" /> Messaging Sender ID
                  </label>
                  <input
                    type="text"
                    value={firebaseSenderId}
                    onChange={(e) => setFirebaseSenderId(e.target.value)}
                    placeholder="e.g. 123456789012"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-orange-400 focus:border-transparent focus:outline-none font-semibold text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1.5 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-orange-500" /> Firebase Client Email
                  </label>
                  <input
                    type="email"
                    value={firebaseClientEmail}
                    onChange={(e) => setFirebaseClientEmail(e.target.value)}
                    placeholder="firebase-adminsdk-...@your-project.iam.gserviceaccount.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-orange-400 focus:border-transparent focus:outline-none font-semibold text-xs"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1.5 flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-orange-500" /> Firebase Web API Key
                  </label>
                  <input
                    type="text"
                    value={firebaseWebApiKey}
                    onChange={(e) => setFirebaseWebApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-orange-400 focus:border-transparent focus:outline-none font-semibold text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1.5 flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-orange-500" /> Firebase Web App ID
                  </label>
                  <input
                    type="text"
                    value={firebaseWebAppId}
                    onChange={(e) => setFirebaseWebAppId(e.target.value)}
                    placeholder="1:123456789012:web:..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-orange-400 focus:border-transparent focus:outline-none font-semibold text-xs"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1.5 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-orange-500" /> Web Push Public VAPID Key
                  </label>
                  <input
                    type="text"
                    value={firebaseVapidKey}
                    onChange={(e) => setFirebaseVapidKey(e.target.value)}
                    placeholder="BOr314jZq_9bX..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-orange-400 focus:border-transparent focus:outline-none font-semibold text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1.5 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-slate-400" /> Firebase Auth Domain
                  </label>
                  <input
                    type="text"
                    value={firebaseAuthDomain}
                    onChange={(e) => setFirebaseAuthDomain(e.target.value)}
                    placeholder="your-project.firebaseapp.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-orange-400 focus:border-transparent focus:outline-none font-semibold text-xs"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1.5 flex items-center gap-1">
                    <Database className="w-3.5 h-3.5 text-slate-400" /> Firebase Storage Bucket
                  </label>
                  <input
                    type="text"
                    value={firebaseStorageBucket}
                    onChange={(e) => setFirebaseStorageBucket(e.target.value)}
                    placeholder="your-project.firebasestorage.app"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-orange-400 focus:border-transparent focus:outline-none font-semibold text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-extrabold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-orange-500" /> Firebase Private Key (Service Account)
                </label>
                <div className="relative">
                  <textarea
                    rows={4}
                    value={firebasePrivateKey}
                    onChange={(e) => setFirebasePrivateKey(e.target.value)}
                    placeholder="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-orange-400 focus:border-transparent focus:outline-none font-semibold text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowFirebaseKey(!showFirebaseKey)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    title={showFirebaseKey ? 'Hide key' : 'Show key'}
                  >
                    {showFirebaseKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Credentials are encrypted with AES-256-GCM. Stored private keys are masked and never exposed to the client.
                </p>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestFirebase}
                    disabled={isTestingFirebase}
                    className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer disabled:opacity-50 border border-slate-200"
                  >
                    {isTestingFirebase ? (
                      <><Loader2 className="w-4 h-4 animate-spin text-orange-500" /> Testing FCM Connection...</>
                    ) : (
                      <><RefreshCw className="w-4 h-4 text-slate-600" /> Test FCM Connection</>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDisconnectModal(true)}
                    disabled={firebaseStatus === 'NOT CONFIGURED' && !firebaseProjectId.trim() && !firebaseClientEmail.trim()}
                    className="inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer disabled:opacity-40 border border-rose-200"
                    title="Disconnect Firebase Integration"
                  >
                    <Unlink className="w-4 h-4" /> Disconnect
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSavingFirebase}
                  className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingFirebase ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</>
                  ) : (
                    <><Save className="w-4 h-4" /> Update FCM Credentials</>
                  )}
                </button>
              </div>
            </form>

            {/* AUDIT / TEST RESULT FOOTER */}
            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">
                LAST TESTED:{' '}
                {firebaseLastTestedAt ? (
                  <span className="font-semibold text-slate-700">
                    {new Date(firebaseLastTestedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })},{' '}
                    {new Date(firebaseLastTestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                ) : (
                  <span className="text-slate-400">Never tested</span>
                )}
                {firebaseLastTestResult && (
                  <span className={`ml-2 font-bold ${firebaseLastTestResult === 'SUCCESS' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    • {firebaseLastTestResult}
                  </span>
                )}
              </span>
              {firebaseLastTestMessage && (
                <span className="text-[11px] text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 font-mono">
                  {firebaseLastTestMessage}
                </span>
              )}
            </div>

            {/* FCM TEST NOTIFICATION SUB-CARD */}
            <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50/70 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-orange-500" /> Send Test Notification
                </h3>
                <span className="text-[10px] text-slate-400 font-medium">Verify live push delivery across devices</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Target Recipient</label>
                  <select
                    value={testRecipientType}
                    onChange={(e: any) => setTestRecipientType(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-400"
                  >
                    <option value="ALL_ADMINS">My Device (Current Admin / All Admins)</option>
                    <option value="CUSTOMER">Specific Customer ID</option>
                    <option value="EMPLOYEE">Specific Employee User ID</option>
                    <option value="ALL_ACTIVE_DEVICES">All Active Devices (Broadcast)</option>
                  </select>
                </div>

                {(testRecipientType === 'CUSTOMER' || testRecipientType === 'EMPLOYEE') && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      {testRecipientType === 'CUSTOMER' ? 'Customer ID' : 'Employee/User ID'}
                    </label>
                    <input
                      type="text"
                      value={testRecipientId}
                      onChange={(e) => setTestRecipientId(e.target.value)}
                      placeholder="e.g. 1"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-400"
                    />
                  </div>
                )}

                <div className={testRecipientType === 'ALL_ADMINS' || testRecipientType === 'ALL_ACTIVE_DEVICES' ? 'sm:col-span-2' : ''}>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Notification Title</label>
                  <input
                    type="text"
                    value={testTitle}
                    onChange={(e) => setTestTitle(e.target.value)}
                    placeholder="QuikBoom Test Notification"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Notification Message</label>
                <input
                  type="text"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="FCM push delivery is working correctly."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-400"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleSendTestNotification}
                  disabled={isSendingTestNotification}
                  className="inline-flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                >
                  {isSendingTestNotification ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending Push...</>
                  ) : (
                    <><Send className="w-3.5 h-3.5" /> Send Test Notification</>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* DISCONNECT CONFIRMATION MODAL */}
          {showDisconnectModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shrink-0 border border-rose-200">
                    <Unlink className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Disconnect Firebase FCM?</h3>
                    <p className="text-xs text-slate-500 font-medium">Remove Firebase integration credentials</p>
                  </div>
                </div>

                <div className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 leading-relaxed">
                  Disconnecting will remove saved FCM credentials from the database and stop push notifications from being sent through Firebase. Device tokens and past notification logs will remain intact.
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    disabled={isDisconnectingFirebase}
                    onClick={() => setShowDisconnectModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isDisconnectingFirebase}
                    onClick={handleDisconnectFirebase}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    {isDisconnectingFirebase ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Disconnecting...</>
                    ) : (
                      <><Unlink className="w-3.5 h-3.5" /> Disconnect</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SMTP EMAIL INTEGRATION CARD */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center font-bold shadow-2xs shrink-0">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-black text-slate-900">SMTP Email Integration</h2>
                    {smtpConnected ? (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-[#E8F9EE] text-[#1AA14D] font-extrabold border border-[#23C45E]/30">
                        <CheckCircle2 className="w-3 h-3 text-[#23C45E]" /> SMTP ACTIVE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-extrabold border border-amber-200">
                        <AlertTriangle className="w-3 h-3 text-amber-600" /> SMTP DISABLED
                      </span>
                    )}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono font-bold border border-slate-200">
                      Source: {smtpSource}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Configure your corporate or transactional SMTP mail server to send actual emails from the CRM.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200 shrink-0">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 px-1">
                  <input
                    type="checkbox"
                    checked={smtpConnected}
                    onChange={(e) => setSmtpConnected(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  Enable SMTP
                </label>
              </div>
            </div>

            <form onSubmit={handleSaveAndTestSmtp} className="space-y-4 pt-4 border-t border-slate-100 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1.5">
                    SMTP Host <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      placeholder="smtp.gmail.com or mail.domain.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:outline-none text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1.5">
                    Port <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={smtpPort}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSmtpPort(val);
                      if (val === '465') {
                        setSmtpSecurity('SSL');
                      } else if (val === '587' || val === '25') {
                        setSmtpSecurity('TLS');
                      }
                    }}
                    placeholder="587"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1.5">
                    Security (SSL/TLS)
                  </label>
                  <select
                    value={smtpSecurity}
                    onChange={(e) => setSmtpSecurity(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:outline-none text-xs"
                  >
                    <option value="TLS">STARTTLS / TLS (Port 587 recommended)</option>
                    <option value="SSL">SSL (Port 465 recommended)</option>
                    <option value="NONE">None / Plain (Port 25)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1.5">
                    SMTP Username
                  </label>
                  <input
                    type="text"
                    value={smtpUsername}
                    onChange={(e) => setSmtpUsername(e.target.value)}
                    placeholder="user@example.com or apikey"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1.5">
                    SMTP Password
                  </label>
                  <div className="relative">
                    <input
                      type={showSmtpPassword ? 'text' : 'password'}
                      value={smtpPassword}
                      onChange={(e) => setSmtpPassword(e.target.value)}
                      placeholder={smtpPassword ? '••••••••' : 'Enter app password or secret'}
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:outline-none text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      title={showSmtpPassword ? 'Hide password' : 'Show password'}
                    >
                      {showSmtpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1.5">
                    From Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={smtpFromEmail}
                    onChange={(e) => setSmtpFromEmail(e.target.value)}
                    placeholder="crm@yourcompany.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1.5">
                    From Name
                  </label>
                  <input
                    type="text"
                    value={smtpFromName}
                    onChange={(e) => setSmtpFromName(e.target.value)}
                    placeholder="QuickBoom CRM"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:outline-none text-xs"
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                Credentials are encrypted with AES-256-GCM. Stored passwords are never exposed in UI or API responses.
              </p>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleTestSmtp}
                    disabled={isTestingSmtp || !smtpHost.trim()}
                    className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer disabled:opacity-50 border border-slate-200"
                  >
                    {isTestingSmtp ? (
                      <><Loader2 className="w-4 h-4 animate-spin text-blue-500" /> Testing Connection...</>
                    ) : (
                      <><RefreshCw className="w-4 h-4 text-slate-600" /> Test Connection</>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleSaveSmtp()}
                    disabled={isSavingSmtp}
                    className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSavingSmtp ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                    ) : (
                      <><Save className="w-4 h-4" /> Save Configuration</>
                    )}
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingSmtp || isTestingSmtp}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSavingSmtp || isTestingSmtp ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Validating & Saving...</>
                    ) : (
                      <><CheckCircle2 className="w-4 h-4" /> Save & Test Connection</>
                    )}
                  </button>
                </div>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900">Notification & Alert Channels</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Configure automated email, WhatsApp, and in-app alert triggers.</p>
            </div>
            <Link
              href="/settings/notifications"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#E8F9EE] text-[#1AA14D] hover:bg-[#23C45E] hover:text-white rounded-xl text-xs font-black transition-all border border-[#23C45E]/30"
            >
              <Bell className="w-4 h-4" />
              <span>Go to Notification Center</span>
            </Link>
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

