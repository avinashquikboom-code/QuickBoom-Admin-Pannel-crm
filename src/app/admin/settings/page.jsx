'use client';

import * as React from 'react';
import { toast } from 'react-hot-toast';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import {
  faGear,
  faSliders,
  faGlobe,
  faClock,
  faCoins,
  faPalette,
  faServer,
  faUpload,
  faTrashCan,
  faArrowsRotate,
  faCheck,
  faTriangleExclamation,
  faShieldHalved,
  faCircleCheck,
  faFloppyDisk,
  faRotateLeft,
  faBolt,
} from '@fortawesome/free-solid-svg-icons';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import {
  loadGeneralSettings,
  updateGeneralSettings,
  uploadGeneralLogo,
  removeGeneralLogo,
  loadGeneralOptions,
  clearApplicationCache,
  syncSystemSettings,
} from '@/modules/settings/general-settings-api';

const TABS = [
  { id: 'application', label: 'Application', icon: faSliders },
  { id: 'localization', label: 'Localization', icon: faGlobe },
  { id: 'datetime', label: 'Date & Time', icon: faClock },
  { id: 'currency', label: 'Currency', icon: faCoins },
  { id: 'branding', label: 'Branding', icon: faPalette },
  { id: 'advanced', label: 'Advanced', icon: faServer },
];

export default function GeneralSettingsPage() {
  const [activeTab, setActiveTab] = React.useState('application');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [uploadingLogo, setUploadingLogo] = React.useState(false);

  // Form states
  const [settings, setSettings] = React.useState({
    appName: 'QB Suite',
    appLogoUrl: '',
    defaultLanguage: 'en',
    availableLanguages: ['en', 'mr'],
    defaultLocale: 'en-IN',
    defaultTimezone: 'Asia/Kolkata',
    dateFormat: 'DD-MM-YYYY',
    timeFormat: '12h',
    firstDayOfWeek: 'Monday',
    defaultCurrency: 'INR',
    currencySymbol: '₹',
    currencyCode: 'INR',
    decimalPrecision: 2,
    numberFormatting: 'en-IN',
    currencyDisplayFormat: 'SYMBOL_FIRST',
    faviconUrl: '',
    loginPageBranding: '',
    primaryColor: '#163A2E',
    secondaryColor: '#204C3D',
    paleColor: '#E8F1EC',
    configVersion: '1.0.0',
    applicationStatus: {
      status: 'HEALTHY',
      version: '1.0.0',
      environment: 'PRODUCTION',
      lastUpdated: null,
      lastSyncedAt: null,
    },
  });

  const [savedSettings, setSavedSettings] = React.useState(null);

  // Options loaded dynamically from backend
  const [options, setOptions] = React.useState({
    languages: [
      { code: 'en', label: 'English', native: 'English', isDefault: true },
      { code: 'mr', label: 'Marathi', native: 'मराठी', isDefault: false },
    ],
    currencies: [
      { code: 'INR', symbol: '₹', name: 'Indian Rupee (INR)', defaultPrecision: 2 },
      { code: 'USD', symbol: '$', name: 'US Dollar (USD)', defaultPrecision: 2 },
      { code: 'EUR', symbol: '€', name: 'Euro (EUR)', defaultPrecision: 2 },
      { code: 'GBP', symbol: '£', name: 'British Pound (GBP)', defaultPrecision: 2 },
      { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham (AED)', defaultPrecision: 2 },
    ],
    timezones: [
      { value: 'Asia/Kolkata', label: '(GMT+05:30) India Standard Time - Kolkata' },
      { value: 'UTC', label: '(GMT+00:00) Coordinated Universal Time - UTC' },
      { value: 'Asia/Dubai', label: '(GMT+04:00) Gulf Standard Time - Dubai' },
      { value: 'America/New_York', label: '(GMT-05:00) Eastern Time - New York' },
      { value: 'Europe/London', label: '(GMT+00:00) Greenwich Mean Time - London' },
      { value: 'Asia/Singapore', label: '(GMT+08:00) Singapore Standard Time' },
    ],
    dateFormats: [
      'DD-MM-YYYY',
      'MM-DD-YYYY',
      'YYYY-MM-DD',
      'DD/MM/YYYY',
      'DD MMM YYYY',
    ],
    timeFormats: [
      { value: '12h', label: '12-hour (02:30 PM)' },
      { value: '24h', label: '24-hour (14:30)' },
    ],
    firstDayOptions: [
      { value: 'Monday', label: 'Monday (Standard Workweek)' },
      { value: 'Sunday', label: 'Sunday' },
      { value: 'Saturday', label: 'Saturday' },
    ],
    numberFormattingOptions: [
      { value: 'en-IN', label: 'Indian (1,00,000.00)' },
      { value: 'en-US', label: 'International (100,000.00)' },
    ],
    currencyDisplayOptions: [
      { value: 'SYMBOL_FIRST', label: 'Symbol first (₹1,000)' },
      { value: 'CODE_FIRST', label: 'Code first (INR 1,000)' },
    ],
  });

  // Modal dialog states
  const [confirmDialog, setConfirmDialog] = React.useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    action: null,
  });

  // File upload input ref
  const fileInputRef = React.useRef(null);

  // Load initial settings and options
  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [fetchedSettings, fetchedOptions] = await Promise.all([
        loadGeneralSettings().catch(() => null),
        loadGeneralOptions().catch(() => null),
      ]);

      if (fetchedSettings) {
        setSettings((prev) => ({
          ...prev,
          ...fetchedSettings,
          applicationStatus: fetchedSettings.applicationStatus || prev.applicationStatus,
        }));
        setSavedSettings(fetchedSettings);
      }

      if (fetchedOptions) {
        setOptions((prev) => ({ ...prev, ...fetchedOptions }));
      }
    } catch (err) {
      toast.error('Failed to load application settings from server');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Unsaved changes detection
  const isDirty = React.useMemo(() => {
    if (!savedSettings) return false;
    const keysToCheck = [
      'appName',
      'defaultLanguage',
      'defaultLocale',
      'defaultTimezone',
      'dateFormat',
      'timeFormat',
      'firstDayOfWeek',
      'defaultCurrency',
      'currencySymbol',
      'currencyCode',
      'decimalPrecision',
      'numberFormatting',
      'currencyDisplayFormat',
      'loginPageBranding',
      'primaryColor',
      'secondaryColor',
      'paleColor',
    ];
    return keysToCheck.some((key) => settings[key] !== savedSettings[key]);
  }, [settings, savedSettings]);

  // Handle generic field change
  const handleChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle currency selection change (auto-update symbol & code)
  const handleCurrencySelect = (code) => {
    const selected = options.currencies.find((c) => c.code === code);
    setSettings((prev) => ({
      ...prev,
      defaultCurrency: code,
      currencyCode: code,
      currencySymbol: selected?.symbol || prev.currencySymbol,
      decimalPrecision: selected?.defaultPrecision ?? prev.decimalPrecision,
    }));
  };

  // Save changes to backend
  const handleSave = async () => {
    if (!settings.appName?.trim()) {
      toast.error('Application Name is required');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        appName: settings.appName.trim(),
        defaultLanguage: settings.defaultLanguage,
        availableLanguages: settings.availableLanguages,
        defaultLocale: settings.defaultLocale,
        defaultTimezone: settings.defaultTimezone,
        dateFormat: settings.dateFormat,
        timeFormat: settings.timeFormat,
        firstDayOfWeek: settings.firstDayOfWeek,
        defaultCurrency: settings.defaultCurrency,
        currencySymbol: settings.currencySymbol,
        currencyCode: settings.currencyCode,
        decimalPrecision: Number(settings.decimalPrecision),
        numberFormatting: settings.numberFormatting,
        currencyDisplayFormat: settings.currencyDisplayFormat,
        loginPageBranding: settings.loginPageBranding || null,
        primaryColor: settings.primaryColor,
        secondaryColor: settings.secondaryColor,
        paleColor: settings.paleColor,
      };

      const result = await updateGeneralSettings(payload);
      toast.success(result?.message || 'General settings saved successfully');
      setSavedSettings((prev) => ({ ...prev, ...payload }));
      // Refresh status from server
      await fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Reset form to saved
  const handleReset = () => {
    if (savedSettings) {
      setSettings((prev) => ({
        ...prev,
        ...savedSettings,
      }));
      toast.success('Changes reverted to saved configuration');
    }
  };

  // Logo upload
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo image must be under 5MB');
      return;
    }

    try {
      setUploadingLogo(true);
      const res = await uploadGeneralLogo(file);
      const newLogoUrl = res?.data?.appLogoUrl || res?.appLogoUrl;
      setSettings((prev) => ({
        ...prev,
        appLogoUrl: newLogoUrl,
      }));
      if (savedSettings) {
        setSavedSettings((prev) => ({ ...prev, appLogoUrl: newLogoUrl }));
      }
      toast.success('Application logo updated successfully');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Logo remove
  const handleLogoRemove = async () => {
    try {
      setUploadingLogo(true);
      await removeGeneralLogo();
      setSettings((prev) => ({
        ...prev,
        appLogoUrl: '',
      }));
      if (savedSettings) {
        setSavedSettings((prev) => ({ ...prev, appLogoUrl: '' }));
      }
      toast.success('Application logo removed');
    } catch (err) {
      toast.error('Failed to remove logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  // Cache clear action
  const handleClearCache = async () => {
    try {
      const res = await clearApplicationCache();
      toast.success(res?.message || 'Application cache cleared successfully');
    } catch (err) {
      toast.error('Failed to clear application cache');
    } finally {
      setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    }
  };

  // Sync settings action
  const handleSyncSettings = async () => {
    try {
      const res = await syncSystemSettings();
      toast.success(res?.message || 'System settings synchronized successfully');
      await fetchData();
    } catch (err) {
      toast.error('Failed to synchronize system settings');
    } finally {
      setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    }
  };

  // Format sample date for live preview
  const liveDatePreview = React.useMemo(() => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthStr = monthNames[now.getMonth()];

    let formattedDate = `${day}-${month}-${year}`;
    if (settings.dateFormat === 'MM-DD-YYYY') formattedDate = `${month}-${day}-${year}`;
    if (settings.dateFormat === 'YYYY-MM-DD') formattedDate = `${year}-${month}-${day}`;
    if (settings.dateFormat === 'DD/MM/YYYY') formattedDate = `${day}/${month}/${year}`;
    if (settings.dateFormat === 'DD MMM YYYY') formattedDate = `${day} ${monthStr} ${year}`;

    const hours24 = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    let formattedTime = `${String(hours24).padStart(2, '0')}:${minutes}`;
    if (settings.timeFormat === '12h') {
      const ampm = hours24 >= 12 ? 'PM' : 'AM';
      const hours12 = hours24 % 12 || 12;
      formattedTime = `${String(hours12).padStart(2, '0')}:${minutes} ${ampm}`;
    }

    return `${formattedDate} · ${formattedTime}`;
  }, [settings.dateFormat, settings.timeFormat]);

  // Format sample currency for live preview
  const liveCurrencyPreview = React.useMemo(() => {
    const amount = 125450.75;
    const precision = Number(settings.decimalPrecision ?? 2);
    const fixed = amount.toFixed(precision);

    let [intPart, decPart] = fixed.split('.');
    let formattedNumber = intPart;

    if (settings.numberFormatting === 'en-IN') {
      // Indian numbering format: 1,25,450
      const lastThree = intPart.substring(intPart.length - 3);
      const otherNumbers = intPart.substring(0, intPart.length - 3);
      if (otherNumbers !== '') {
        formattedNumber = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
      }
    } else {
      // Standard international format: 125,450
      formattedNumber = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    const finalNumber = decPart !== undefined && precision > 0 ? `${formattedNumber}.${decPart}` : formattedNumber;

    if (settings.currencyDisplayFormat === 'CODE_FIRST') {
      return `${settings.currencyCode || 'INR'} ${finalNumber}`;
    }
    return `${settings.currencySymbol || '₹'} ${finalNumber}`;
  }, [
    settings.decimalPrecision,
    settings.numberFormatting,
    settings.currencyDisplayFormat,
    settings.currencySymbol,
    settings.currencyCode,
  ]);

  return (
    <div className="max-w-none space-y-5 sm:space-y-6 w-full min-w-0 overflow-x-hidden pb-12">
      {/* 1. Page Header with SYSTEM GOVERNANCE category badge and Settings Illustration */}
      <PageHeader
        category="SYSTEM GOVERNANCE"
        title="General Settings"
        description="Configure core application preferences for this admin panel."
        icon={faGear}
        badge={
          isDirty ? (
            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 text-xs px-2.5 py-0.5 font-semibold">
              <span className="size-1.5 rounded-full bg-amber-500 animate-pulse mr-1.5" />
              Unsaved changes
            </Badge>
          ) : (
            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-[#163A2E] text-xs px-2.5 py-0.5 font-semibold">
              <FontAwesomeIcon icon={faCircleCheck} className="size-3 mr-1 text-emerald-600" />
              Synced
            </Badge>
          )
        }
        actions={
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {isDirty && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={saving}
                className="border-[#E2E8E5] text-slate-700 hover:bg-slate-100"
              >
                <FontAwesomeIcon icon={faRotateLeft} className="size-3.5 mr-1.5" />
                Reset
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="bg-[#163A2E] hover:bg-[#204C3D] text-white shadow-xs font-semibold px-4"
            >
              <FontAwesomeIcon icon={saving ? faArrowsRotate : faFloppyDisk} className={`size-3.5 mr-1.5 ${saving ? 'animate-spin' : ''}`} />
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        }
      />

      {/* 2. Navigation Tabs (Horizontally scrollable on mobile) */}
      <div className="relative border-b border-[#E2E8E5] bg-white rounded-xl shadow-2xs p-1.5 sm:p-2">
        <nav
          className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none"
          aria-label="Settings Tabs"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                  isActive
                    ? 'bg-[#163A2E] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-[#E8F1EC] hover:text-[#163A2E]'
                }`}
              >
                <FontAwesomeIcon icon={tab.icon} className={`size-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* 3. Main Content: 2-Column Grid (Main Settings on left, Status Cards on right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 min-w-0">
        {/* Left Column: Active Tab Content (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-6 min-w-0">
          {/* TAB 1: APPLICATION SETTINGS */}
          {activeTab === 'application' && (
            <Card className="border border-[#E2E8E5] bg-white p-4 sm:p-6 shadow-xs rounded-2xl space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Application Configuration</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  General application identification, logo asset, and core runtime formatting.
                </p>
              </div>

              {/* Application Logo Upload */}
              <div className="space-y-3">
                <label className="block text-xs sm:text-sm font-semibold text-slate-800">
                  Application Logo
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl border border-dashed border-[#E2E8E5] bg-[#F7F9F8]">
                  <div className="relative size-20 rounded-xl border border-slate-200 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                    {settings.appLogoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={settings.appLogoUrl}
                        alt="Application Logo Preview"
                        className="size-full object-contain p-2"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 text-center p-2">
                        <FontAwesomeIcon icon={faShieldHalved} className="size-6 text-[#163A2E]/40" />
                        <span className="text-[10px] font-semibold mt-1 text-slate-500">No Logo</span>
                      </div>
                    )}
                    {uploadingLogo && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                        <FontAwesomeIcon icon={faArrowsRotate} className="size-5 text-[#163A2E] animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                      {settings.appName || 'QB Suite'} Logo
                    </p>
                    <p className="text-[11px] sm:text-xs text-slate-500">
                      Recommended: Transparent PNG, SVG, or WEBP (Max 5MB, 512×512px).
                    </p>
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingLogo}
                        className="border-[#E2E8E5] hover:bg-emerald-50 hover:text-[#163A2E] text-xs h-8"
                      >
                        <FontAwesomeIcon icon={faUpload} className="size-3 mr-1.5" />
                        Upload Logo
                      </Button>
                      {settings.appLogoUrl && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={handleLogoRemove}
                          disabled={uploadingLogo}
                          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 text-xs h-8"
                        >
                          <FontAwesomeIcon icon={faTrashCan} className="size-3 mr-1.5" />
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {/* Application Name */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label htmlFor="appName" className="block text-xs sm:text-sm font-semibold text-slate-800">
                    Application Name <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    id="appName"
                    value={settings.appName}
                    onChange={(e) => handleChange('appName', e.target.value)}
                    placeholder="Enter application title (e.g. QB Suite)"
                    className="h-10 text-sm border-[#E2E8E5] focus-visible:ring-[#163A2E]"
                    required
                  />
                  <p className="text-[11px] text-slate-500">
                    Displayed across the Admin top navigation, email notifications, and browser title bar.
                  </p>
                </div>

                {/* Default Language */}
                <div className="space-y-1.5">
                  <label htmlFor="defaultLanguage" className="block text-xs sm:text-sm font-semibold text-slate-800">
                    Default Language
                  </label>
                  <select
                    id="defaultLanguage"
                    value={settings.defaultLanguage}
                    onChange={(e) => handleChange('defaultLanguage', e.target.value)}
                    className="w-full h-10 rounded-md border border-[#E2E8E5] bg-white px-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#163A2E]"
                  >
                    {options.languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.label} ({lang.native})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Default Currency */}
                <div className="space-y-1.5">
                  <label htmlFor="defaultCurrency" className="block text-xs sm:text-sm font-semibold text-slate-800">
                    Default Currency
                  </label>
                  <select
                    id="defaultCurrency"
                    value={settings.defaultCurrency}
                    onChange={(e) => handleCurrencySelect(e.target.value)}
                    className="w-full h-10 rounded-md border border-[#E2E8E5] bg-white px-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#163A2E]"
                  >
                    {options.currencies.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Default Timezone */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label htmlFor="defaultTimezone" className="block text-xs sm:text-sm font-semibold text-slate-800">
                    Default Timezone
                  </label>
                  <select
                    id="defaultTimezone"
                    value={settings.defaultTimezone}
                    onChange={(e) => handleChange('defaultTimezone', e.target.value)}
                    className="w-full h-10 rounded-md border border-[#E2E8E5] bg-white px-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#163A2E]"
                  >
                    {options.timezones.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Format */}
                <div className="space-y-1.5">
                  <label htmlFor="dateFormat" className="block text-xs sm:text-sm font-semibold text-slate-800">
                    Date Format
                  </label>
                  <select
                    id="dateFormat"
                    value={settings.dateFormat}
                    onChange={(e) => handleChange('dateFormat', e.target.value)}
                    className="w-full h-10 rounded-md border border-[#E2E8E5] bg-white px-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#163A2E]"
                  >
                    {options.dateFormats.map((fmt) => (
                      <option key={fmt} value={fmt}>
                        {fmt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Time Format */}
                <div className="space-y-1.5">
                  <label htmlFor="timeFormat" className="block text-xs sm:text-sm font-semibold text-slate-800">
                    Time Format
                  </label>
                  <select
                    id="timeFormat"
                    value={settings.timeFormat}
                    onChange={(e) => handleChange('timeFormat', e.target.value)}
                    className="w-full h-10 rounded-md border border-[#E2E8E5] bg-white px-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#163A2E]"
                  >
                    {options.timeFormats.map((tf) => (
                      <option key={tf.value} value={tf.value}>
                        {tf.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Form Action Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  disabled={!isDirty || saving}
                  className="border-[#E2E8E5] text-slate-700"
                >
                  Discard Changes
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSave}
                  disabled={!isDirty || saving}
                  className="bg-[#163A2E] hover:bg-[#204C3D] text-white font-semibold px-4"
                >
                  {saving ? 'Saving Changes…' : 'Save Application Settings'}
                </Button>
              </div>
            </Card>
          )}

          {/* TAB 2: LOCALIZATION */}
          {activeTab === 'localization' && (
            <Card className="border border-[#E2E8E5] bg-white p-4 sm:p-6 shadow-xs rounded-2xl space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Localization & Regional Settings</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Configure language preferences, multilingual support, and translation availability.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-semibold text-slate-800">
                    Default System Language
                  </label>
                  <select
                    value={settings.defaultLanguage}
                    onChange={(e) => handleChange('defaultLanguage', e.target.value)}
                    className="w-full h-10 rounded-md border border-[#E2E8E5] bg-white px-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#163A2E]"
                  >
                    {options.languages.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.label} ({l.native})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-semibold text-slate-800">
                    Default System Locale
                  </label>
                  <Input
                    value={settings.defaultLocale}
                    onChange={(e) => handleChange('defaultLocale', e.target.value)}
                    placeholder="e.g. en-IN or mr-IN"
                    className="h-10 text-sm border-[#E2E8E5]"
                  />
                </div>
              </div>

              {/* Supported Languages List */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs sm:text-sm font-semibold text-slate-800">
                  Configured Languages in Portal
                </label>
                <div className="space-y-2.5">
                  {options.languages.map((lang) => {
                    const isSelected = settings.defaultLanguage === lang.code;
                    return (
                      <div
                        key={lang.code}
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                          isSelected ? 'border-[#163A2E] bg-[#E8F1EC]/60' : 'border-[#E2E8E5] bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="size-8 rounded-lg bg-white border border-[#E2E8E5] flex items-center justify-center font-bold text-xs text-[#163A2E]">
                            {lang.code.toUpperCase()}
                          </span>
                          <div>
                            <p className="text-xs sm:text-sm font-semibold text-slate-900">{lang.label}</p>
                            <p className="text-[11px] text-slate-500">{lang.native}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isSelected && (
                            <Badge className="bg-[#163A2E] text-white text-[10px] px-2 py-0.5">
                              Primary Default
                            </Badge>
                          )}
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Active
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Translation Status Notice */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 flex items-start gap-3">
                <FontAwesomeIcon icon={faCircleCheck} className="size-5 text-emerald-700 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-bold text-emerald-900">Translation System Status</p>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Core dashboard UI strings, CRM fields, and HRM status badges are 100% synchronized with the centralized dictionary.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSave}
                  disabled={!isDirty || saving}
                  className="bg-[#163A2E] hover:bg-[#204C3D] text-white font-semibold px-4"
                >
                  {saving ? 'Saving…' : 'Save Localization'}
                </Button>
              </div>
            </Card>
          )}

          {/* TAB 3: DATE & TIME */}
          {activeTab === 'datetime' && (
            <Card className="border border-[#E2E8E5] bg-white p-4 sm:p-6 shadow-xs rounded-2xl space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Date & Time Standards</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Centralize timestamps, attendance calculations, schedule clocks, and workweek definitions.
                </p>
              </div>

              {/* Live Preview Box */}
              <div className="rounded-xl border border-[#163A2E]/20 bg-[#E8F1EC] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#163A2E]">
                    Live Display Format Preview
                  </span>
                  <p className="text-lg sm:text-xl font-bold text-[#163A2E] mt-0.5">
                    {liveDatePreview}
                  </p>
                </div>
                <Badge className="bg-[#163A2E] text-white self-start sm:self-center text-xs">
                  {settings.defaultTimezone}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs sm:text-sm font-semibold text-slate-800">
                    Default Timezone
                  </label>
                  <select
                    value={settings.defaultTimezone}
                    onChange={(e) => handleChange('defaultTimezone', e.target.value)}
                    className="w-full h-10 rounded-md border border-[#E2E8E5] bg-white px-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#163A2E]"
                  >
                    {options.timezones.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-semibold text-slate-800">
                    Date Format
                  </label>
                  <select
                    value={settings.dateFormat}
                    onChange={(e) => handleChange('dateFormat', e.target.value)}
                    className="w-full h-10 rounded-md border border-[#E2E8E5] bg-white px-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#163A2E]"
                  >
                    {options.dateFormats.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-semibold text-slate-800">
                    Time Format
                  </label>
                  <select
                    value={settings.timeFormat}
                    onChange={(e) => handleChange('timeFormat', e.target.value)}
                    className="w-full h-10 rounded-md border border-[#E2E8E5] bg-white px-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#163A2E]"
                  >
                    {options.timeFormats.map((tf) => (
                      <option key={tf.value} value={tf.value}>
                        {tf.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs sm:text-sm font-semibold text-slate-800">
                    First Day of the Week
                  </label>
                  <select
                    value={settings.firstDayOfWeek}
                    onChange={(e) => handleChange('firstDayOfWeek', e.target.value)}
                    className="w-full h-10 rounded-md border border-[#E2E8E5] bg-white px-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#163A2E]"
                  >
                    {options.firstDayOptions.map((fd) => (
                      <option key={fd.value} value={fd.value}>
                        {fd.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500">
                    Used for employee attendance weekly summaries, shift scheduling calendars, and weekly sales metrics.
                  </p>
                </div>
                  </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSave}
                  disabled={!isDirty || saving}
                  className="bg-[#163A2E] hover:bg-[#204C3D] text-white font-semibold px-4"
                >
                  {saving ? 'Saving…' : 'Save Date & Time'}
                </Button>
              </div>
            </Card>
          )}

          {/* TAB 4: CURRENCY */}
          {activeTab === 'currency' && (
            <Card className="border border-[#E2E8E5] bg-white p-4 sm:p-6 shadow-xs rounded-2xl space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Currency & Financial Display</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Configure default currency symbol, ISO code, decimal precision, and Indian vs. International numbering.
                </p>
                  </div>

              {/* Live Preview Box */}
              <div className="rounded-xl border border-[#163A2E]/20 bg-[#E8F1EC] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#163A2E]">
                    Formatted Currency Preview
                  </span>
                  <p className="text-xl sm:text-2xl font-bold text-[#163A2E] mt-0.5 font-mono">
                    {liveCurrencyPreview}
                  </p>
                  </div>
                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">ISO Standard</span>
                  <p className="text-sm font-bold text-slate-800">{settings.currencyCode} ({settings.currencySymbol})</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-semibold text-slate-800">
                    Default Currency
                  </label>
                  <select
                    value={settings.defaultCurrency}
                    onChange={(e) => handleCurrencySelect(e.target.value)}
                    className="w-full h-10 rounded-md border border-[#E2E8E5] bg-white px-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#163A2E]"
                  >
                    {options.currencies.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-semibold text-slate-800">
                    Currency Symbol
                  </label>
                  <Input
                    value={settings.currencySymbol}
                    onChange={(e) => handleChange('currencySymbol', e.target.value)}
                    className="h-10 text-sm border-[#E2E8E5]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-semibold text-slate-800">
                    Currency Code (ISO)
                  </label>
                  <Input
                    value={settings.currencyCode}
                    onChange={(e) => handleChange('currencyCode', e.target.value)}
                    className="h-10 text-sm border-[#E2E8E5]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-semibold text-slate-800">
                    Decimal Precision
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="4"
                    value={settings.decimalPrecision}
                    onChange={(e) => handleChange('decimalPrecision', Number(e.target.value))}
                    className="h-10 text-sm border-[#E2E8E5]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-semibold text-slate-800">
                    Number Formatting Standard
                  </label>
                  <select
                    value={settings.numberFormatting}
                    onChange={(e) => handleChange('numberFormatting', e.target.value)}
                    className="w-full h-10 rounded-md border border-[#E2E8E5] bg-white px-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#163A2E]"
                  >
                    {options.numberFormattingOptions.map((nf) => (
                      <option key={nf.value} value={nf.value}>
                        {nf.label}
                      </option>
                    ))}
                  </select>
                </div>

                  <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-semibold text-slate-800">
                    Currency Display Format
                  </label>
                  <select
                    value={settings.currencyDisplayFormat}
                    onChange={(e) => handleChange('currencyDisplayFormat', e.target.value)}
                    className="w-full h-10 rounded-md border border-[#E2E8E5] bg-white px-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#163A2E]"
                  >
                    {options.currencyDisplayOptions.map((cd) => (
                      <option key={cd.value} value={cd.value}>
                        {cd.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSave}
                  disabled={!isDirty || saving}
                  className="bg-[#163A2E] hover:bg-[#204C3D] text-white font-semibold px-4"
                >
                  {saving ? 'Saving…' : 'Save Currency Settings'}
                </Button>
              </div>
            </Card>
          )}

          {/* TAB 5: BRANDING */}
          {activeTab === 'branding' && (
            <Card className="border border-[#E2E8E5] bg-white p-4 sm:p-6 shadow-xs rounded-2xl space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Brand Identity & Styling</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Visual theme palette, application title, and login page branding elements.
                </p>
              </div>

              {/* Theme Palette Card */}
              <div className="space-y-3">
                <label className="block text-xs sm:text-sm font-semibold text-slate-800">
                  QB Suite Theme Color Palette
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-slate-200 p-3 bg-white space-y-2">
                    <div className="h-12 w-full rounded-lg bg-[#163A2E] shadow-xs flex items-center justify-center text-white text-xs font-mono font-bold">
                      #163A2E
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Primary Green</p>
                      <p className="text-[11px] text-slate-500">Core headers, primary buttons, active tabs</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-3 bg-white space-y-2">
                    <div className="h-12 w-full rounded-lg bg-[#204C3D] shadow-xs flex items-center justify-center text-white text-xs font-mono font-bold">
                      #204C3D
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Secondary Green</p>
                      <p className="text-[11px] text-slate-500">Interactive hover states & accents</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-3 bg-white space-y-2">
                    <div className="h-12 w-full rounded-lg bg-[#E8F1EC] border border-emerald-100 shadow-2xs flex items-center justify-center text-[#163A2E] text-xs font-mono font-bold">
                      #E8F1EC
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Pale Green</p>
                      <p className="text-[11px] text-slate-500">Card highlights, pills, banner gradient</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Branding Text Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-semibold text-slate-800">
                    Application Name
                  </label>
                  <Input
                    value={settings.appName}
                    onChange={(e) => handleChange('appName', e.target.value)}
                    placeholder="QB Suite"
                    className="h-10 text-sm border-[#E2E8E5]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-semibold text-slate-800">
                    Login Portal Subtitle
                  </label>
                  <Input
                    value={settings.loginPageBranding || ''}
                    onChange={(e) => handleChange('loginPageBranding', e.target.value)}
                    placeholder="Enterprise CRM & Workforce Management"
                    className="h-10 text-sm border-[#E2E8E5]"
                  />
                </div>
              </div>

              {/* Brand Preview Panel */}
              <div className="rounded-xl border border-[#E2E8E5] bg-[#F7F9F8] p-4 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Header Branding Live Mockup
                </span>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#163A2E] text-white">
                  <div className="flex items-center gap-2.5">
                    {settings.appLogoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={settings.appLogoUrl} alt="Logo" className="size-6 object-contain" />
                    ) : (
                      <div className="size-6 rounded bg-white/20 flex items-center justify-center font-bold text-xs text-white">
                        QB
                      </div>
                    )}
                    <span className="font-bold text-sm tracking-tight">{settings.appName || 'QB Suite'}</span>
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded text-white/90">Admin</span>
                  </div>
                  <span className="text-xs text-white/80 font-medium">Enterprise Portal</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSave}
                  disabled={!isDirty || saving}
                  className="bg-[#163A2E] hover:bg-[#204C3D] text-white font-semibold px-4"
                >
                  {saving ? 'Saving…' : 'Save Branding'}
                </Button>
              </div>
            </Card>
          )}

          {/* TAB 6: ADVANCED */}
          {activeTab === 'advanced' && (
            <Card className="border border-[#E2E8E5] bg-white p-4 sm:p-6 shadow-xs rounded-2xl space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Advanced System Governance</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Cache invalidation, synchronized configuration verification, and system telemetry.
                </p>
              </div>

              {/* Operations Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Clear Cache Card */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="size-9 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
                      <FontAwesomeIcon icon={faTrashCan} className="size-4" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900">Clear Application Cache</h3>
                      <p className="text-[11px] text-slate-500">Purges cached metadata, permissions, and session lookup tables.</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setConfirmDialog({
                        isOpen: true,
                        title: 'Clear Application Cache?',
                        message:
                          'This will clear all in-memory configuration and permission caches. Database records and active user sessions will NOT be deleted.',
                        confirmText: 'Clear Cache',
                        action: handleClearCache,
                      })
                    }
                    className="w-full border-amber-200 bg-amber-50/50 hover:bg-amber-100 text-amber-800 font-semibold text-xs h-9"
                  >
                    Clear Application Cache
                  </Button>
                </div>

                {/* Sync Settings Card */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="size-9 rounded-lg bg-emerald-50 text-[#163A2E] border border-emerald-200 flex items-center justify-center shrink-0">
                      <FontAwesomeIcon icon={faArrowsRotate} className="size-4" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900">Sync System Settings</h3>
                      <p className="text-[11px] text-slate-500">Validates PostgreSQL schema values and broadcast active configs.</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      setConfirmDialog({
                        isOpen: true,
                        title: 'Synchronize System Settings?',
                        message:
                          'This will validate current general settings against PostgreSQL storage and update the synchronization timestamp.',
                        confirmText: 'Sync Now',
                        action: handleSyncSettings,
                      })
                    }
                    className="w-full bg-[#163A2E] hover:bg-[#204C3D] text-white font-semibold text-xs h-9"
                  >
                    Sync System Settings
                  </Button>
                </div>
              </div>

              {/* Advanced Technical Details */}
              <div className="rounded-xl border border-[#E2E8E5] bg-[#F7F9F8] p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Database & Configuration Metadata
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold">Config Table</span>
                    <p className="font-mono font-bold text-slate-800">general_settings</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold">Scope</span>
                    <p className="font-mono font-bold text-slate-800">System Singleton</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold">Engine</span>
                    <p className="font-mono font-bold text-slate-800">PostgreSQL 18</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold">ORM Provider</span>
                    <p className="font-mono font-bold text-slate-800">Prisma Client 5</p>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Status & Quick Action Cards (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-5 sm:space-y-6 min-w-0">
          {/* Card 1: Application Status */}
          <Card className="border border-[#E2E8E5] bg-white p-4 sm:p-5 shadow-xs rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                <FontAwesomeIcon icon={faServer} className="text-[#163A2E] size-3.5" />
                Application Status
              </h3>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
                {settings.applicationStatus?.status || 'HEALTHY'}
              </span>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">System Version</span>
                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">
                  v{settings.applicationStatus?.version || settings.configVersion || '1.0.0'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Environment</span>
                <Badge className="bg-[#163A2E] text-white text-[10px] font-semibold uppercase">
                  {settings.applicationStatus?.environment || 'PRODUCTION'}
                </Badge>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Last Updated</span>
                <span className="font-semibold text-slate-800 text-xs text-right">
                  {settings.applicationStatus?.lastUpdated
                    ? new Date(settings.applicationStatus.lastUpdated).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'System Initialized'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500">Last Synced</span>
                <span className="font-semibold text-slate-800 text-xs text-right">
                  {settings.applicationStatus?.lastSyncedAt
                    ? new Date(settings.applicationStatus.lastSyncedAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Just now'}
                </span>
              </div>
            </div>
          </Card>

          {/* Card 2: Quick Actions */}
          <Card className="border border-[#E2E8E5] bg-white p-4 sm:p-5 shadow-xs rounded-2xl space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                <FontAwesomeIcon icon={faBolt} className="text-[#163A2E] size-3.5" />
                Quick Actions
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Common administrative governance tasks.
              </p>
            </div>

            <div className="space-y-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setConfirmDialog({
                    isOpen: true,
                    title: 'Clear Application Cache?',
                    message:
                      'Are you sure you want to invalidate all application cache layers?',
                    confirmText: 'Clear Cache',
                    action: handleClearCache,
                  })
                }
                className="w-full justify-start text-xs font-semibold border-[#E2E8E5] text-slate-700 hover:bg-[#E8F1EC] hover:text-[#163A2E] h-9"
              >
                <FontAwesomeIcon icon={faTrashCan} className="size-3.5 mr-2 text-slate-400" />
                Clear Cache
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setConfirmDialog({
                    isOpen: true,
                    title: 'Synchronize System Settings?',
                    message:
                      'Are you sure you want to re-synchronize general system settings?',
                    confirmText: 'Sync Settings',
                    action: handleSyncSettings,
                  })
                }
                className="w-full justify-start text-xs font-semibold border-[#E2E8E5] text-slate-700 hover:bg-[#E8F1EC] hover:text-[#163A2E] h-9"
              >
                <FontAwesomeIcon icon={faArrowsRotate} className="size-3.5 mr-2 text-slate-400" />
                Sync System Settings
              </Button>

              {isDirty && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="w-full justify-start text-xs font-semibold text-rose-600 hover:bg-rose-50 h-9"
                >
                  <FontAwesomeIcon icon={faRotateLeft} className="size-3.5 mr-2 text-rose-500" />
                  Discard Unsaved Changes
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Confirmation Modal Dialog */}
      {confirmDialog.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5 sm:p-6 shadow-xl border border-[#E2E8E5] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <FontAwesomeIcon icon={faTriangleExclamation} className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{confirmDialog.title}</h3>
                <p className="text-xs text-slate-500">Action confirmation required</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {confirmDialog.message}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                className="border-slate-200 text-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={confirmDialog.action}
                className="bg-[#163A2E] hover:bg-[#204C3D] text-white font-semibold"
              >
                {confirmDialog.confirmText}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
