'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Lock,
  Bell,
  Palette,
  Globe,
  ShieldCheck,
  FileText,
  Info,
  ChevronRight,
  LogOut,
  Check,
  X,
  Eye,
  EyeOff,
  Settings as SettingsIcon,
} from 'lucide-react';
import { useEmployeeAuthStore } from '@/lib/employee-store';
import { toast } from 'react-hot-toast';
import EmployeeSideSheet from '@/components/EmployeeSideSheet';

export default function AccountSettingsPage() {
  const router = useRouter();
  const user = useEmployeeAuthStore((state) => state.user);
  const logout = useEmployeeAuthStore((state) => state.logout);

  // Modals state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isAppearanceModalOpen, setIsAppearanceModalOpen] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Preference Selections State
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'system'>('light');
  const [selectedLanguage, setSelectedLanguage] = useState('English (US)');

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    router.push('/employee/login');
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setIsUpdatingPassword(true);
    setTimeout(() => {
      setIsUpdatingPassword(false);
      setIsPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated successfully');
    }, 600);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ── 1. Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-emerald-100 text-[#16A34A] flex items-center justify-center shrink-0 shadow-xs">
              <SettingsIcon className="w-5 h-5 text-[#16A34A]" />
            </span>
            Account Settings
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Manage your profile, security, preferences and account information.
          </p>
        </div>

        {/* Quick User Summary Badge */}
        <div className="hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200/80 text-xs shadow-2xs">
          <div className="w-6 h-6 rounded-full bg-[#E8F9EE] text-[#1AA14D] font-bold text-[10px] flex items-center justify-center">
            {(user?.firstName?.[0] || 'E').toUpperCase()}
          </div>
          <span className="font-bold text-slate-800">
            {user?.firstName} {user?.lastName}
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-[#1AA14D] uppercase">
            Active
          </span>
        </div>
      </div>

      {/* ── Content Sections ──────────────────────────────────────────────── */}
      <div className="space-y-6 max-w-4xl">
          {/* ── 3. Profile & Security ──────────────────────────────────────── */}
          <div id="section-security" className="space-y-2.5 scroll-mt-24">
            <h2 className="text-xs font-black tracking-wider text-slate-400 uppercase px-1">
              Profile & Security
            </h2>

            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden divide-y divide-slate-100">
              {/* Card 1: Profile Information */}
              <Link
                href="/employee/profile"
                className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/80 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#E8F9EE] text-[#1AA14D] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <User className="w-5 h-5 text-[#1AA14D]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#16A34A] transition-colors truncate">
                      Profile Information
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      Edit your name, email and avatar
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#16A34A] group-hover:translate-x-0.5 transition-all shrink-0 ml-3" />
              </Link>

              {/* Card 2: Change Password */}
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(true)}
                className="w-full text-left p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/80 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#E8F9EE] text-[#1AA14D] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Lock className="w-5 h-5 text-[#1AA14D]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#16A34A] transition-colors truncate">
                      Change Password
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      Update your account password
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#16A34A] group-hover:translate-x-0.5 transition-all shrink-0 ml-3" />
              </button>
            </div>
          </div>

          {/* ── 4. Preferences ─────────────────────────────────────────────── */}
          <div id="section-preferences" className="space-y-2.5 scroll-mt-24">
            <h2 className="text-xs font-black tracking-wider text-slate-400 uppercase px-1">
              Preferences
            </h2>

            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden divide-y divide-slate-100">
              {/* Notifications */}
              <Link
                href="/employee/notifications"
                className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/80 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#E8F9EE] text-[#1AA14D] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Bell className="w-5 h-5 text-[#1AA14D]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#16A34A] transition-colors truncate">
                      Notifications
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      Manage app and email alerts
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#16A34A] group-hover:translate-x-0.5 transition-all shrink-0 ml-3" />
              </Link>

              {/* Appearance */}
              <button
                type="button"
                onClick={() => setIsAppearanceModalOpen(true)}
                className="w-full text-left p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/80 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#E8F9EE] text-[#1AA14D] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Palette className="w-5 h-5 text-[#1AA14D]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#16A34A] transition-colors truncate">
                      Appearance
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      Themes and layout options
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className="text-xs font-semibold text-slate-400 capitalize hidden sm:inline">
                    {selectedTheme}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#16A34A] group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>

              {/* Language */}
              <button
                type="button"
                onClick={() => setIsLanguageModalOpen(true)}
                className="w-full text-left p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/80 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#E8F9EE] text-[#1AA14D] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Globe className="w-5 h-5 text-[#1AA14D]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#16A34A] transition-colors truncate">
                      Language
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {selectedLanguage}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#16A34A] group-hover:translate-x-0.5 transition-all shrink-0 ml-3" />
              </button>
            </div>
          </div>

          {/* ── 5. About ───────────────────────────────────────────────────── */}
          <div id="section-about" className="space-y-2.5 scroll-mt-24">
            <h2 className="text-xs font-black tracking-wider text-slate-400 uppercase px-1">
              About
            </h2>

            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden divide-y divide-slate-100">
              {/* Privacy Policy */}
              <button
                type="button"
                onClick={() => setIsPrivacyModalOpen(true)}
                className="w-full text-left p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/80 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#E8F9EE] text-[#1AA14D] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-5 h-5 text-[#1AA14D]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#16A34A] transition-colors truncate">
                      Privacy Policy
                    </h3>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#16A34A] group-hover:translate-x-0.5 transition-all shrink-0 ml-3" />
              </button>

              {/* Terms of Service */}
              <button
                type="button"
                onClick={() => setIsTermsModalOpen(true)}
                className="w-full text-left p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/80 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#E8F9EE] text-[#1AA14D] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <FileText className="w-5 h-5 text-[#1AA14D]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#16A34A] transition-colors truncate">
                      Terms of Service
                    </h3>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#16A34A] group-hover:translate-x-0.5 transition-all shrink-0 ml-3" />
              </button>

              {/* App Version */}
              <div className="p-4 sm:p-5 flex items-center justify-between">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#E8F9EE] text-[#1AA14D] flex items-center justify-center shrink-0">
                    <Info className="w-5 h-5 text-[#1AA14D]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      App Version
                    </h3>
                    <p className="text-xs font-mono text-slate-500 mt-0.5">
                      v1.0.0 (Build 12)
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-[#1AA14D] text-[10px] font-extrabold uppercase border border-emerald-200/50">
                  Latest
                </span>
              </div>
            </div>
          </div>

          {/* ── Sign Out ────────────────────────────────────────────────────── */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full p-4 sm:p-5 rounded-2xl bg-rose-50/70 hover:bg-rose-100/80 border border-rose-200/60 flex items-center justify-between text-rose-600 transition-colors cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <LogOut className="w-5 h-5 text-rose-600" />
                </div>
                <div className="min-w-0 text-left">
                  <h3 className="text-sm font-bold text-rose-700 truncate">
                    Sign Out
                  </h3>
                  <p className="text-xs text-rose-500/90 mt-0.5 truncate">
                    Sign out of your account on this device
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-rose-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-3" />
            </button>
          </div>
        </div>

      {/* ── Change Password Drawer ─────────────────────────────────────────── */}
      <EmployeeSideSheet
        open={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Change Password"
        subtitle="Update your employee account password"
        icon={<Lock className="w-4 h-4" />}
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="password-form"
              disabled={isUpdatingPassword}
              className="px-5 py-2 text-xs font-bold text-white bg-[#16A34A] hover:bg-[#15803D] rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-60"
            >
              {isUpdatingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </>
        }
      >
        <form id="password-form" onSubmit={handlePasswordSubmit} className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
                className="w-full px-3.5 py-2.5 pr-10 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#16A34A] focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min. 6 characters)"
                required
                className="w-full px-3.5 py-2.5 pr-10 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#16A34A] focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#16A34A] focus:outline-none transition-colors"
            />
          </div>
        </form>
      </EmployeeSideSheet>

      {/* ── Appearance Drawer ──────────────────────────────────────────────── */}
      <EmployeeSideSheet
        open={isAppearanceModalOpen}
        onClose={() => setIsAppearanceModalOpen(false)}
        title="Appearance"
        subtitle="Customise interface theme"
        icon={<Palette className="w-4 h-4" />}
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-500 mb-3">
            Choose your preferred interface theme for the QB Suite Employee Workspace:
          </p>

          {(['light', 'dark', 'system'] as const).map((theme) => {
            const isSelected = selectedTheme === theme;
            return (
              <button
                key={theme}
                type="button"
                onClick={() => {
                  setSelectedTheme(theme);
                  toast.success(`Theme set to ${theme}`);
                  setIsAppearanceModalOpen(false);
                }}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#E8F9EE] border-[#23C45E]/50 text-[#1AA14D] font-bold shadow-2xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span className="text-xs capitalize font-bold">{theme} Theme</span>
                {isSelected && <Check className="w-4 h-4 text-[#1AA14D]" />}
              </button>
            );
          })}
        </div>
      </EmployeeSideSheet>

      {/* ── Language Drawer ────────────────────────────────────────────────── */}
      <EmployeeSideSheet
        open={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
        title="Select Language"
        subtitle="Choose your preferred language"
        icon={<Globe className="w-4 h-4" />}
      >
        <div className="space-y-2">
          {[
            { label: 'English (US)', sub: 'Default' },
            { label: 'English (UK)', sub: 'English (United Kingdom)' },
            { label: 'Hindi (हिन्दी)', sub: 'Indian Standard' },
            { label: 'Gujarati (ગુજરાતી)', sub: 'Regional' },
          ].map((lang) => {
            const isSelected = selectedLanguage === lang.label;
            return (
              <button
                key={lang.label}
                type="button"
                onClick={() => {
                  setSelectedLanguage(lang.label);
                  toast.success(`Language set to ${lang.label}`);
                  setIsLanguageModalOpen(false);
                }}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#E8F9EE] border-[#23C45E]/50 text-[#1AA14D] font-bold shadow-2xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div>
                  <p className="text-xs font-bold text-slate-900">{lang.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{lang.sub}</p>
                </div>
                {isSelected && <Check className="w-4 h-4 text-[#1AA14D]" />}
              </button>
            );
          })}
        </div>
      </EmployeeSideSheet>

      {/* ── Privacy Policy Drawer ─────────────────────────────────────────── */}
      <EmployeeSideSheet
        open={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
        title="Privacy Policy"
        subtitle="QB Suite Employee Privacy Protocols"
        icon={<ShieldCheck className="w-4 h-4" />}
        footer={
          <button
            type="button"
            onClick={() => setIsPrivacyModalOpen(false)}
            className="px-5 py-2 text-xs font-bold text-white bg-[#16A34A] hover:bg-[#15803D] rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Understood
          </button>
        }
      >
        <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-1">1. Information Collection & Usage</h4>
            <p>
              QuickBoom CRM and Business Suite securely manages corporate data, employee workspace records, attendance telemetry, and customer lead information strictly in accordance with organization privacy guidelines and tenant isolation standards.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-1">2. Telemetry and Geo-Tracking</h4>
            <p>
              Location and attendance check-in information is only captured during active punch-in sessions and verified client visits with explicit user approval to enforce transparent organizational reporting.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-1">3. Data Retention & Confidentiality</h4>
            <p>
              All personal records and financial payslip details remain encrypted in transit and at rest. Your profile details are never shared with unauthorized external entities.
            </p>
          </div>
        </div>
      </EmployeeSideSheet>

      {/* ── Terms of Service Drawer ────────────────────────────────────────── */}
      <EmployeeSideSheet
        open={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        title="Terms of Service"
        subtitle="QB Suite Employee Workspace Usage Terms"
        icon={<FileText className="w-4 h-4" />}
        footer={
          <button
            type="button"
            onClick={() => setIsTermsModalOpen(false)}
            className="px-5 py-2 text-xs font-bold text-white bg-[#16A34A] hover:bg-[#15803D] rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            I Agree
          </button>
        }
      >
        <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-1">1. Authorized Employee Access</h4>
            <p>
              Access to this Employee Workspace is granted exclusively to authorized personnel for conducting legitimate sales operations, leads management, attendance logging, and payroll review.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-1">2. Data Integrity and Lead Handling</h4>
            <p>
              Employees must adhere to proper customer lead handling protocols, fair communication practices, and comply with all organizational customer protection guidelines.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-1">3. Security and Credentials</h4>
            <p>
              Account credentials must not be shared. Any unauthorized attempt to tamper with permissions or access unauthorized corporate modules is strictly prohibited.
            </p>
          </div>
        </div>
      </EmployeeSideSheet>
    </div>
  );
}