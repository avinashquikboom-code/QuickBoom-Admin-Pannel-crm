import Link from 'next/link';
import { QbSuiteLogoMark } from '@/components/auth/login/login-branding-panel';

export const metadata = {
  title: 'Forgot Password | QB Suite Admin',
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#F7FAFC] px-4 py-8">
      <div className="w-full max-w-[670px] rounded-[28px] border border-[#E9F2F8] bg-white px-6 py-8 shadow-[0_24px_80px_rgba(16,29,53,0.08)] sm:px-10 sm:py-10">
        <div className="flex flex-col items-center text-center">
          <QbSuiteLogoMark size="sm" />
          <h1 className="mt-4 text-2xl font-bold text-[#101D35]">Reset your password</h1>
          <p className="mt-2 text-sm text-[#64748B]">
            Use your organization&apos;s password recovery flow. Contact your system administrator if
            you need help restoring access.
          </p>
        </div>
        <div className="mt-6 rounded-xl border border-brand-light bg-brand-light/60 px-4 py-3 text-sm text-brand-dark">
          Email-based reset is handled by the QB Suite identity service configured for this
          deployment.
        </div>
        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm font-semibold text-brand hover:text-brand-dark">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
