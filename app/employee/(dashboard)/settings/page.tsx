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
  ChevronRight,
  LogOut,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useEmployeeAuthStore } from '@/lib/employee-store';
import { getUserRole } from '@/lib/access-control';
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

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Employee';
  const roleLabel = getUserRole(user);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Account Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your profile, security, preferences and account information.</p>
      </div>

      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#1AA14D] text-lg font-bold text-white">
          {(user?.firstName?.[0] || 'E').toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-slate-900">{displayName}</p>
          <p className="truncate text-sm text-slate-500">{user?.email || 'Signed in'}</p>
          {roleLabel && (
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#1AA14D]">{roleLabel}</p>
          )}
        </div>
      </div>

      <div className="space-y-5">
          {/* ── 3. Profile & Security ──────────────────────────────────────── */}
          <div id="section-security" className="space-y-2">
            <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Profile & Security
            </h2>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
              {/* Card 1: Profile Information */}
              <Link
                href="/employee/profile"
                className="flex items-center justify-between p-4 hover:bg-slate-50 sm:p-5"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F9EE] text-[#1AA14D]">
                    <User className="w-5 h-5 text-[#1AA14D]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-slate-900">
                      Profile Information
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      Edit your name, email and avatar
                    </p>
                  </div>
                </div>
                <ChevronRight className="ml-3 h-4 w-4 shrink-0 text-slate-300" />
              </Link>

              {/* Card 2: Change Password */}
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(true)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-slate-50 sm:p-5"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F9EE] text-[#1AA14D]">
                    <Lock className="w-5 h-5 text-[#1AA14D]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-slate-900">
                      Change Password
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      Update your account password
                    </p>
                  </div>
                </div>
                <ChevronRight className="ml-3 h-4 w-4 shrink-0 text-slate-300" />
              </button>
            </div>
          </div>

          {/* ── 4. Preferences ─────────────────────────────────────────────── */}
          <div id="section-preferences" className="space-y-2">
            <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Preferences
            </h2>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
              {/* Notifications */}
              <Link
                href="/employee/notifications"
                className="flex items-center justify-between p-4 hover:bg-slate-50 sm:p-5"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F9EE] text-[#1AA14D]">
                    <Bell className="w-5 h-5 text-[#1AA14D]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-slate-900">
                      Notifications
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      Manage app and email alerts
                    </p>
                  </div>
                </div>
                <ChevronRight className="ml-3 h-4 w-4 shrink-0 text-slate-300" />
              </Link>

              {/* Appearance */}
              <button
                type="button"
                onClick={() => setIsAppearanceModalOpen(true)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-slate-50 sm:p-5"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F9EE] text-[#1AA14D]">
                    <Palette className="w-5 h-5 text-[#1AA14D]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-slate-900">
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
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </div>
              </button>

              {/* Language */}
              <button
                type="button"
                onClick={() => setIsLanguageModalOpen(true)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-slate-50 sm:p-5"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F9EE] text-[#1AA14D]">
                    <Globe className="w-5 h-5 text-[#1AA14D]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-slate-900">
                      Language
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {selectedLanguage}
                    </p>
                  </div>
                </div>
                <ChevronRight className="ml-3 h-4 w-4 shrink-0 text-slate-300" />
              </button>
            </div>
          </div>

          {/* ── 5. About ───────────────────────────────────────────────────── */}
          <div id="section-about" className="space-y-2">
            <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
              About
            </h2>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
              {/* Privacy Policy */}
              <button
                type="button"
                onClick={() => setIsPrivacyModalOpen(true)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-slate-50 sm:p-5"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F9EE] text-[#1AA14D]">
                    <ShieldCheck className="w-5 h-5 text-[#1AA14D]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-slate-900">
                      Privacy Policy
                    </h3>
                  </div>
                </div>
                <ChevronRight className="ml-3 h-4 w-4 shrink-0 text-slate-300" />
              </button>

              {/* Terms of Service */}
              <button
                type="button"
                onClick={() => setIsTermsModalOpen(true)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-slate-50 sm:p-5"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F9EE] text-[#1AA14D]">
                    <FileText className="w-5 h-5 text-[#1AA14D]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-slate-900">
                      Terms of Service
                    </h3>
                  </div>
                </div>
                <ChevronRight className="ml-3 h-4 w-4 shrink-0 text-slate-300" />
              </button>
            </div>
          </div>

          {/* ── Sign Out ────────────────────────────────────────────────────── */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-between rounded-2xl border border-rose-200 bg-white p-4 text-rose-600 hover:bg-rose-50 sm:p-5"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                  <LogOut className="w-5 h-5" />
                </div>
                <div className="min-w-0 text-left">
                  <h3 className="truncate text-sm font-semibold text-rose-700">
                    Sign Out
                  </h3>
                  <p className="mt-0.5 truncate text-xs text-rose-500">
                    Sign out of your account on this device
                  </p>
                </div>
              </div>
              <ChevronRight className="ml-3 h-4 w-4 shrink-0 text-rose-300" />
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