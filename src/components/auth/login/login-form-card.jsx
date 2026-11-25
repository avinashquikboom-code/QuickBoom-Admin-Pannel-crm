'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { icons } from '@/theme/icons';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { loginAdmin, validateLoginForm } from '@/lib/auth/admin-login';
import { LOGIN_BRAND, QbSuiteLogoMark } from './login-branding-panel';

export function LoginFormCard({ className }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [remember, setRemember] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState({});
  const [formNotice, setFormNotice] = React.useState(null);
  const [showAdminHelp, setShowAdminHelp] = React.useState(false);

  React.useEffect(() => {
    const reason = searchParams.get('reason');
    if (reason === 'session_expired') {
      setFormNotice({
        level: 'warning',
        message: 'Your session has expired. Please sign in again.',
      });
    }
  }, [searchParams]);

  const onSubmit = (event) => {
    event.preventDefault();
    if (loading) {
      return;
    }
    setFormNotice(null);
    const errors = validateLoginForm({ email, password });
    setFieldErrors(errors);
    if (!email.trim() && !password) {
      toast.error('Please enter your email and password.', { id: 'login-missing-fields' });
    }
    if (Object.keys(errors).length > 0) {
      return;
    }

    setLoading(true);
    const trimmedEmail = email.trim();
    loginAdmin({ email: trimmedEmail, password, remember })
      .then(() => {
        toast.success('Login successful. Welcome back!', { id: 'login-success' });
        const next = searchParams.get('next');
        const destination =
          next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/login')
            ? next
            : '/admin/dashboard';
        router.push(destination);
        router.refresh();
      })
      .catch((error) => {
        const message = error?.message || 'Something went wrong. Please try again later.';
        setFormNotice({ level: error?.level || 'error', message });
        const notify = error?.level === 'warning' ? toast.warning : toast.error;
        notify(message, { id: `login-${message}` });
      })
      .finally(() => setLoading(false));
  };

  return (
    <div
      className={cn(
        'w-full max-w-[460px] rounded-2xl border bg-white px-6 py-7 sm:px-9 sm:py-8',
        'border-[#E2E8E5] shadow-[0_12px_40px_rgba(7,61,48,0.08)]',
        className,
      )}
    >
      <div className="flex flex-col items-center text-center">
        <QbSuiteLogoMark size="sm" />
        <h2
          className="mt-4 text-xl font-bold tracking-tight sm:text-2xl"
          style={{ color: LOGIN_BRAND.navy }}
        >
          Welcome Back
        </h2>
        <p className="mt-1.5 text-sm" style={{ color: LOGIN_BRAND.muted }}>
          Sign in to your QB Suite Admin account to continue
        </p>
      </div>

      {formNotice ? (
        <div
          role="alert"
          className={cn(
            'mt-5 flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs font-medium',
            formNotice.level === 'warning'
              ? 'border-amber-200 bg-amber-50 text-amber-800'
              : 'border-red-200 bg-red-50 text-[#DC2626]',
          )}
        >
          <FontAwesomeIcon
            icon={icons.shield || icons.lock}
            className="mt-0.5 size-3.5 shrink-0"
            aria-hidden
          />
          <span>{formNotice.message}</span>
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        <div className="space-y-1.5">
          <label
            htmlFor="admin-login-email"
            className="block text-[13px] font-semibold"
            style={{ color: LOGIN_BRAND.navy }}
          >
            Email Address
          </label>
          <div className="relative">
            <FontAwesomeIcon
              icon={icons.mail}
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
              style={{ color: LOGIN_BRAND.muted }}
              aria-hidden
            />
            <input
              id="admin-login-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="username"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) {
                  setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              className={cn(
                'h-11 w-full rounded-xl border pr-3 pl-10 text-sm outline-none transition-[border-color,box-shadow]',
                'bg-white placeholder:text-[#94A3B8]',
                fieldErrors.email
                  ? 'border-[#DC2626] ring-2 ring-red-100'
                  : 'border-[#E2E8E5] focus:border-[#123D32] focus:ring-2 focus:ring-[#E8F1EC]',
              )}
              style={{ color: LOGIN_BRAND.navy }}
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? 'admin-login-email-error' : undefined}
              required
            />
          </div>
          {fieldErrors.email ? (
            <p id="admin-login-email-error" className="text-xs font-medium text-[#DC2626]">
              {fieldErrors.email}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="admin-login-password"
            className="block text-[13px] font-semibold"
            style={{ color: LOGIN_BRAND.navy }}
          >
            Password
          </label>
          <div className="relative">
            <FontAwesomeIcon
              icon={icons.lock}
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
              style={{ color: LOGIN_BRAND.muted }}
              aria-hidden
            />
            <input
              id="admin-login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              className={cn(
                'h-11 w-full rounded-xl border pr-11 pl-10 text-sm outline-none transition-[border-color,box-shadow]',
                'bg-white placeholder:text-[#94A3B8]',
                fieldErrors.password
                  ? 'border-[#DC2626] ring-2 ring-red-100'
                  : 'border-[#E2E8E5] focus:border-[#123D32] focus:ring-2 focus:ring-[#E8F1EC]',
              )}
              style={{ color: LOGIN_BRAND.navy }}
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? 'admin-login-password-error' : undefined}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#64748B] transition hover:bg-[#F3F8F5] hover:text-[#142D25]"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <FontAwesomeIcon icon={icons.eyeSlash} className="size-4" />
              ) : (
                <FontAwesomeIcon icon={icons.eye} className="size-4" />
              )}
            </button>
          </div>
          {fieldErrors.password ? (
            <p id="admin-login-password-error" className="text-xs font-medium text-[#DC2626]">
              {fieldErrors.password}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
          <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] font-medium text-[#475569]">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="size-4 rounded border-[#E2E8E5] accent-[#123D32] focus:ring-[#123D32]/30"
            />
            Remember me
          </label>
          <Link
            href="/forgot-password"
            className="text-[13px] font-semibold text-[#123D32] transition hover:text-[#176B50]"
          >
            Forgot Password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white shadow-[0_6px_18px_rgba(18,61,50,0.24)] transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
          style={{
            background: `linear-gradient(90deg, ${LOGIN_BRAND.primary} 0%, ${LOGIN_BRAND.secondaryGreen} 100%)`,
          }}
        >
          {loading ? (
            <>
              <FontAwesomeIcon icon={icons.spinner} className="size-4 animate-spin" aria-hidden />
              Signing in...
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={icons.signIn} className="size-4" aria-hidden />
              Sign In
            </>
          )}
        </button>
      </form>

      <div className="mt-5 border-t border-[#E2E8E5] pt-4 text-center">
        <p className="text-xs text-[#64748B]">
          Need workspace access or account help?{' '}
          <button
            type="button"
            onClick={() => setShowAdminHelp((prev) => !prev)}
            className="font-semibold text-[#123D32] underline-offset-2 hover:underline"
          >
            Contact Your Administrator
          </button>
        </p>
        {showAdminHelp ? (
          <div className="mt-2.5 rounded-xl border border-[#E2E8E5] bg-[#F3F8F5] px-3 py-2 text-left text-xs text-[#142D25]">
            <p className="font-semibold">Administrator Support</p>
            <p className="mt-0.5 text-[#64748B]">
              Reach your organization&apos;s Super Admin or email{' '}
              <a href="mailto:support@qbapp.online" className="font-medium text-[#123D32] underline">
                support@qbapp.online
              </a>{' '}
              to provision or unlock your account.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
