'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, Lock, LogIn, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { persistSession } from '@/lib/auth/admin-session';
import { validateLoginForm } from '@/lib/auth/admin-login';
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

  const onSubmit = (event) => {
    event.preventDefault();
    if (loading) {
      return;
    }
    const errors = validateLoginForm({ email, password });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setLoading(true);
    const trimmedEmail = email.trim();
    persistSession({
      token: 'local-screen-session',
      user: { email: trimmedEmail },
      remember,
    });
    toast.success('Signed in successfully');
    const next = searchParams.get('next');
    router.push(next || '/admin/dashboard');
    router.refresh();
    setLoading(false);
  };

  return (
    <div
      className={cn(
        'w-full max-w-[680px] rounded-[28px] border bg-white px-6 py-8 sm:px-10 sm:py-10',
        'border-[#E8EEF4] shadow-[0_8px_40px_rgba(20,33,61,0.06)]',
        className,
      )}
    >
      <div className="flex flex-col items-center text-center">
        <QbSuiteLogoMark size="sm" />
        <p className="mt-4 text-lg font-bold" style={{ color: LOGIN_BRAND.navy }}>
          QB Suite
        </p>
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.22em]"
          style={{ color: LOGIN_BRAND.muted }}
        >
          Admin Panel
        </p>
        <h2 className="mt-6 text-2xl font-bold sm:text-[1.65rem]" style={{ color: LOGIN_BRAND.navy }}>
          Welcome Back 👋
        </h2>
        <p className="mt-2 text-sm" style={{ color: LOGIN_BRAND.muted }}>
          Sign in to access your admin dashboard
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
        <div className="space-y-2">
          <label htmlFor="admin-login-email" className="text-sm font-medium" style={{ color: LOGIN_BRAND.navy }}>
            Email Address
          </label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2"
              style={{ color: LOGIN_BRAND.muted }}
              aria-hidden
            />
            <input
              id="admin-login-email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) {
                  setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              className={cn(
                'h-12 w-full rounded-xl border pr-3 pl-11 text-sm outline-none transition-[border-color,box-shadow]',
                'bg-white placeholder:text-[#94A3B8]',
                fieldErrors.email
                  ? 'border-rose-400 ring-2 ring-rose-100'
                  : 'border-[#D9E1E9] focus:border-[#5EC169] focus:ring-2 focus:ring-[#EAF8EC]',
              )}
              style={{ color: LOGIN_BRAND.navy }}
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? 'admin-login-email-error' : undefined}
              required
            />
          </div>
          {fieldErrors.email ? (
            <p id="admin-login-email-error" className="text-xs text-rose-600">
              {fieldErrors.email}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="admin-login-password" className="text-sm font-medium" style={{ color: LOGIN_BRAND.navy }}>
            Password
          </label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2"
              style={{ color: LOGIN_BRAND.muted }}
              aria-hidden
            />
            <input
              id="admin-login-password"
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
                'h-12 w-full rounded-xl border pr-12 pl-11 text-sm outline-none transition-[border-color,box-shadow]',
                'bg-white placeholder:text-[#94A3B8]',
                fieldErrors.password
                  ? 'border-rose-400 ring-2 ring-rose-100'
                  : 'border-[#D9E1E9] focus:border-[#5EC169] focus:ring-2 focus:ring-[#EAF8EC]',
              )}
              style={{ color: LOGIN_BRAND.navy }}
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? 'admin-login-password-error' : undefined}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute top-1/2 right-2.5 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#14213D]"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
            </button>
          </div>
          {fieldErrors.password ? (
            <p id="admin-login-password-error" className="text-xs text-rose-600">
              {fieldErrors.password}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[#475569]">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="size-4 rounded border-[#D9E1E9] text-[#5EC169] focus:ring-[#5EC169]/30"
            />
            Remember me
          </label>
          <Link
            href="/forgot-password"
            className="text-sm font-semibold text-[#5EC169] hover:text-[#218B45]"
          >
            Forgot Password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white shadow-[0_6px_20px_rgba(94,193,105,0.28)] transition hover:brightness-[1.02] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
          style={{
            background: `linear-gradient(90deg, ${LOGIN_BRAND.primary} 0%, ${LOGIN_BRAND.darkGreen} 100%)`,
          }}
        >
          {loading ? (
            <>
              <Loader2 className="size-[18px] animate-spin" aria-hidden />
              Signing In…
            </>
          ) : (
            <>
              <LogIn className="size-[18px]" aria-hidden />
              Sign In
            </>
          )}
        </button>
      </form>
    </div>
  );
}
