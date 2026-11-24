'use client';

import * as React from 'react';
import { useEmployeeWizardStore } from '@/lib/stores/employee-wizard-store';
import { validateStep } from '@/lib/validations/employee-wizard-validation';
import { FormField, InputField, SectionHeader } from './FormField';
import {
  Smartphone,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  Bell,
  MapPin,
  Clock,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function Step5MobileAccess({ onValidationChange }) {
  const store = useEmployeeWizardStore();
  const [showPassword, setShowPassword] = React.useState(false);

  // Compute validation
  const validation = React.useMemo(() => {
    return validateStep(
      5,
      {
        enableMobileAccess: store.enableMobileAccess,
        password: store.password,
      },
      store.mode
    );
  }, [store.enableMobileAccess, store.password, store.mode]);

  // Sync validation state with parent
  React.useEffect(() => {
    store.setStepErrors(5, validation.errors);
    onValidationChange?.(validation.isValid);
  }, [validation.isValid, validation.errors, onValidationChange, store]);

  const isErrorVisible = (fieldName) => {
    const hasError = Boolean(validation.errors[fieldName]);
    const isTouched = Boolean(store.touchedFields[fieldName]);
    const isAttempted = Boolean(store.stepAttempted[5]);
    return hasError && (isTouched || isAttempted);
  };

  const loginIdentifier = store.corporateEmail || store.phone || 'Enter corporate email in Step 1';

  return (
    <div className="space-y-6">
      {/* ── SECTION 1: MOBILE ACCESS STATUS TOGGLE ─────────────────── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <SectionHeader
          title="Mobile Application Access"
          description="Grant or revoke mobile app authentication credentials for employee self-service."
          icon={Smartphone}
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl border border-emerald-100 bg-emerald-50/40">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#16A34A] text-white shadow-xs shrink-0 mt-0.5">
              <Smartphone className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-slate-900">
                  Enable QuikBoom Mobile App Access
                </span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.2 text-[10px] font-bold',
                    store.enableMobileAccess
                      ? 'bg-emerald-100 text-[#16A34A]'
                      : 'bg-slate-200 text-slate-600'
                  )}
                >
                  {store.enableMobileAccess ? 'Authorized' : 'Disabled'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Allows employee to log into the QuikBoom Android & iOS app for punch-in, leaves, and salary slips.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={store.enableMobileAccess}
              onChange={(e) => store.updateField('enableMobileAccess', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#16A34A]"></div>
          </label>
        </div>
      </div>

      {/* ── SECTION 2: AUTHENTICATION IDENTIFIER & PASSWORD SETUP ───── */}
      {store.enableMobileAccess ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs animate-fadeIn space-y-5">
          <SectionHeader
            title="Authentication Credentials"
            description="Secure sign-in credentials used on the mobile application."
            icon={KeyRound}
          />

          {/* Login Identifier Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                REGISTERED MOBILE LOGIN IDENTIFIER
              </p>
              <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 font-mono">
                {loginIdentifier}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Employees can sign in using their corporate email, employee code, or primary mobile number.
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 rounded-lg bg-white px-2.5 py-1 border border-slate-200 text-xs font-semibold text-emerald-700">
              <ShieldCheck className="size-3.5 text-[#16A34A]" />
              <span>Multi-Tenant Auth</span>
            </div>
          </div>

          {/* Password Setup */}
          <div className="space-y-3">
            <FormField
              label={store.mode === 'edit' ? 'Reset Mobile Password (Optional)' : 'Initial Password (Optional)'}
              optional
              error={validation.errors.password}
              touched={isErrorVisible('password')}
              hint={
                store.mode === 'edit'
                  ? 'Leave blank to preserve current password. Enter a new password only to reset.'
                  : 'Leave blank to assign the default temporary password (123456). Minimum 6 characters.'
              }
            >
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={
                    store.mode === 'edit'
                      ? '•••••••••••• (Current password preserved)'
                      : 'Enter initial password or leave blank for default'
                  }
                  value={store.password}
                  onChange={(e) => store.updateField('password', e.target.value)}
                  onBlur={() => store.touchField('password')}
                  autoComplete="new-password"
                  className={cn(
                    'w-full h-10 rounded-xl border bg-white px-3 pr-10 text-xs sm:text-[13px] font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1',
                    validation.errors.password && isErrorVisible('password')
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-400 bg-rose-50/20'
                      : 'border-slate-200 focus:border-[#16A34A] focus:ring-[#16A34A]'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </FormField>
          </div>

          {/* Mobile App Permissions & Features */}
          <div className="border-t border-slate-100 pt-4">
            <h5 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
              <span>Mobile Application Capabilities</span>
              <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-semibold text-slate-500">
                Default RBAC
              </span>
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <Clock className="size-4 text-[#16A34A] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-slate-800">Geo-fenced Attendance</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Punch-in restricted to assigned office perimeter</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <UserCheck className="size-4 text-[#16A34A] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-slate-800">Self-Service Requests</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Apply for leaves, salary advances, and remote duty</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <Bell className="size-4 text-[#16A34A] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-slate-800">Push Notifications</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Instant alerts for approvals and shift schedule updates</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <MapPin className="size-4 text-[#16A34A] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-slate-800">Field Geo-Tracking</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Duty location tracking when clocked in</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 p-5 text-xs text-amber-800 flex items-start gap-3">
          <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-900">Mobile Login is Disabled</p>
            <p className="mt-1 leading-relaxed">
              This employee will not be able to log in to the QuikBoom mobile application or record mobile punch-in attendance.
              Their profile and payroll records remain active in the system. Toggle above to enable access anytime.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
