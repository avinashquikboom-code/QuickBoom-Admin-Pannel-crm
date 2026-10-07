'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import api from '@/lib/api';

export default function EmployeeRegisterPage() {
  const router = useRouter();
  
  // Stages: 'details' -> 'mobile_otp' -> 'email_otp' -> 'success'
  const [stage, setStage] = useState<'details' | 'mobile_otp' | 'email_otp' | 'success'>('details');
  const [isLoading, setIsLoading] = useState(false);
  
  // Registration Form State (Matching Mobile App DTO)
  const [formData, setFormData] = useState({
    fullName: '',
    city: '',
    mobile: '',
    email: '',
    password: '',
    confirmPassword: '',
    employeeType: 'COMPANY',
    companyName: '',
    referralCode: '',
  });

  // OTP State
  const [mobileOtp, setMobileOtp] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [mobileVerified, setMobileVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  // Timer
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSendMobileOtp = async () => {
    if (formData.mobile.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    setIsLoading(true);
    try {
      await api.post('/auth/send-otp', { mobile: formData.mobile, type: 'registration' });
      toast.success(`OTP sent via SMS to +91 ${formData.mobile}`);
      setStage('mobile_otp');
      setTimer(120);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send OTP. Please try again.');
      // If endpoint doesn't exist yet, we allow proceeding in dev mode
      if (process.env.NODE_ENV === 'development') {
        toast.success(`[DEV] Mock OTP sent to +91 ${formData.mobile}`);
        setStage('mobile_otp');
        setTimer(120);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyMobileOtp = async () => {
    if (mobileOtp.length < 4) {
      toast.error('Please enter the OTP');
      return;
    }
    setIsLoading(true);
    try {
      await api.post('/auth/verify-otp', { mobile: formData.mobile, otp: mobileOtp });
      toast.success('Mobile number verified successfully');
      setMobileVerified(true);
      handleSendEmailOtp();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
      if (process.env.NODE_ENV === 'development') {
        toast.success('[DEV] Mobile verified');
        setMobileVerified(true);
        handleSendEmailOtp();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendEmailOtp = async () => {
    setIsLoading(true);
    try {
      await api.post('/auth/email/send-otp', { email: formData.email, type: 'registration' });
      toast.success(`Verification code sent to ${formData.email}`);
      setStage('email_otp');
      setTimer(120);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send email verification.');
      if (process.env.NODE_ENV === 'development') {
        toast.success(`[DEV] Mock email sent to ${formData.email}`);
        setStage('email_otp');
        setTimer(120);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (emailOtp.length < 4) {
      toast.error('Please enter the email verification code');
      return;
    }
    setIsLoading(true);
    try {
      await api.post('/auth/email/verify-otp', { email: formData.email, otp: emailOtp });
      toast.success('Email verified successfully');
      setEmailVerified(true);
      submitFinalRegistration();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid email code');
      if (process.env.NODE_ENV === 'development') {
        toast.success('[DEV] Email verified');
        setEmailVerified(true);
        submitFinalRegistration();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const submitFinalRegistration = async () => {
    setIsLoading(true);
    try {
      // Calls the EXACT same endpoint as Employee Mobile: '/mobile/auth/register/employee'
      await api.post('/mobile/auth/register/employee', {
        fullName: formData.fullName,
        city: formData.city,
        mobile: formData.mobile,
        email: formData.email.toLowerCase(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        employeeType: formData.employeeType,
        companyName: formData.employeeType === 'COMPANY' ? formData.companyName : undefined,
        referralCode: formData.referralCode || undefined,
      });
      
      toast.success('Registration completed successfully! Please login.');
      setStage('success');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed. Mobile/Email may already be in use.');
      setStage('details'); // Reset to fix errors
    } finally {
      setIsLoading(false);
    }
  };

  const validateDetails = () => {
    if (formData.fullName.length < 2) return 'Please enter a valid full name.';
    if (formData.mobile.length < 10) return 'Please enter a valid 10-digit mobile number.';
    if (!formData.email.includes('@')) return 'Please enter a valid email address.';
    if (formData.password.length < 6) return 'Password must be at least 6 characters.';
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match.';
    if (formData.employeeType === 'COMPANY' && !formData.companyName) return 'Company name is required.';
    return null;
  };

  const handleContinue = () => {
    const error = validateDetails();
    if (error) {
      toast.error(error);
      return;
    }
    handleSendMobileOtp();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const fieldClass =
    'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15';

  const features = [
    { icon: Users, title: 'Manage Your Team', text: 'Add employees and assign roles' },
    { icon: ShieldCheck, title: 'Secure Access', text: 'Role based permissions' },
    { icon: Mail, title: 'Instant Login', text: 'Employee will receive login credentials via email' },
    { icon: BadgeCheck, title: 'Stay Organized', text: 'Keep your team and work in one place' },
  ];

  return (
    <div className="min-h-screen bg-[#F7FBF8] lg:grid lg:grid-cols-[minmax(280px,32%)_minmax(0,1fr)]">
      <aside className="relative flex flex-col justify-between overflow-hidden bg-[#F3FBF6] px-6 py-8 sm:px-8 lg:px-10 lg:py-12">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white ring-1 ring-[#16A34A]/15">
              <Image src="/app_logo.png" alt="QB Suite" width={24} height={24} className="object-contain" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-900">QB Suite</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#16A34A]">Business Suite</p>
            </div>
          </div>

          <h1 className="mt-10 text-4xl font-bold leading-tight tracking-tight text-slate-900">
            Create
            <br />
            Employee Account
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-6 text-slate-500">
            Add a new team member and give them access to the workspace.
          </p>

          <div className="mt-8 space-y-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="flex items-start gap-3 rounded-2xl border border-white/80 bg-white/70 p-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E8F9EE] text-[#16A34A]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">{feature.title}</span>
                    <span className="mt-0.5 block text-xs leading-5 text-slate-500">{feature.text}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-[#16A34A]/15 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#16A34A] text-lg font-bold text-white">QB</div>
            <div className="min-w-0 flex-1">
              <div className="h-2.5 w-28 rounded-full bg-slate-200" />
              <div className="mt-2 h-2 w-20 rounded-full bg-emerald-100" />
            </div>
            <KeyRound className="h-4 w-4 text-[#16A34A]" />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="h-8 rounded-lg bg-slate-50" />
            <div className="h-8 rounded-lg bg-emerald-50" />
            <div className="h-8 rounded-lg bg-slate-50" />
          </div>
        </div>
      </aside>

      <main className="flex items-start justify-center px-4 py-8 sm:px-8 lg:px-12 lg:py-10">
        <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E8F9EE] text-[#16A34A]">
                <UserPlus className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Create Employee Account</h2>
                <p className="mt-1 text-sm text-slate-500">Fill in the details below to register a new employee.</p>
              </div>
            </div>
            <Link href="/employee/login" className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-slate-800">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Login
            </Link>
          </div>
          {stage === 'details' && (
            <div className="space-y-8">
              <section>
                <h3 className="text-sm font-bold text-slate-900">Personal Information</h3>
                <p className="mt-1 text-xs text-slate-500">Basic details about the employee</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="block text-xs font-semibold text-slate-600">
                    Full Name *
                    <span className="relative mt-1.5 block">
                      <UserPlus className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input name="fullName" type="text" value={formData.fullName} onChange={handleInputChange} placeholder="Enter full name" className={`${fieldClass} pl-10`} />
                    </span>
                  </label>
                  <label className="block text-xs font-semibold text-slate-600">
                    City
                    <span className="relative mt-1.5 block">
                      <MapPin className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input name="city" type="text" value={formData.city} onChange={handleInputChange} placeholder="City" className={`${fieldClass} pl-10`} />
                    </span>
                  </label>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-bold text-slate-900">Employment Details</h3>
                <p className="mt-1 text-xs text-slate-500">How this employee joins the workspace</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="block text-xs font-semibold text-slate-600">
                    Employee Type *
                    <span className="relative mt-1.5 block">
                      <Building2 className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                      <select name="employeeType" value={formData.employeeType} onChange={handleInputChange} className={`${fieldClass} pl-10`}>
                        <option value="COMPANY">Company Employee</option>
                        <option value="FREELANCER">Freelancer</option>
                      </select>
                    </span>
                  </label>
                  {formData.employeeType === 'COMPANY' && (
                    <label className="block text-xs font-semibold text-slate-600">
                      Company Name *
                      <input name="companyName" type="text" value={formData.companyName} onChange={handleInputChange} placeholder="Company name" className={`${fieldClass} mt-1.5`} />
                    </label>
                  )}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-bold text-slate-900">Contact Details</h3>
                <p className="mt-1 text-xs text-slate-500">Contact information for verification</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="block text-xs font-semibold text-slate-600">
                    Mobile Number *
                    <span className="relative mt-1.5 block">
                      <Phone className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input name="mobile" type="tel" value={formData.mobile} onChange={handleInputChange} placeholder="10-digit mobile number" maxLength={10} className={`${fieldClass} pl-10`} />
                    </span>
                  </label>
                  <label className="block text-xs font-semibold text-slate-600">
                    Email Address *
                    <span className="relative mt-1.5 block">
                      <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="name@company.com" className={`${fieldClass} pl-10`} />
                    </span>
                  </label>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-bold text-slate-900">Access</h3>
                <p className="mt-1 text-xs text-slate-500">Password used to sign in after verification</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="block text-xs font-semibold text-slate-600">
                    Password *
                    <span className="relative mt-1.5 block">
                      <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input name="password" type="password" value={formData.password} onChange={handleInputChange} placeholder="At least 6 characters" className={`${fieldClass} pl-10`} />
                    </span>
                  </label>
                  <label className="block text-xs font-semibold text-slate-600">
                    Confirm Password *
                    <span className="relative mt-1.5 block">
                      <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleInputChange} placeholder="Re-enter password" className={`${fieldClass} pl-10`} />
                    </span>
                  </label>
                </div>
              </section>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <Link href="/employee/login" className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Cancel
                </Link>
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={isLoading}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#16A34A] px-5 text-sm font-semibold text-white hover:bg-[#15803D] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  Continue to Verification
                </button>
              </div>
            </div>
          )}

          {stage === 'mobile_otp' && (
            <div className="space-y-6 text-center animate-in fade-in zoom-in-95">
              <div className="mx-auto w-16 h-16 bg-[#E8F9EE] rounded-full flex items-center justify-center">
                <Phone className="w-8 h-8 text-[#16A34A]" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Verify Mobile Number</h3>
                <p className="text-sm text-slate-500 mt-1">Enter the OTP sent via MSG91 to +91 {formData.mobile}</p>
              </div>
              
              <input
                type="text"
                value={mobileOtp}
                onChange={(e) => setMobileOtp(e.target.value.replace(/\D/g, ''))}
                maxLength={6}
                className="w-full text-center tracking-widest text-2xl px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/15 focus:border-[#16A34A] transition-all"
                placeholder="000000"
              />

              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-slate-500">Expires in {formatTime(timer)}</span>
                <button
                  onClick={handleSendMobileOtp}
                  disabled={timer > 0 || isLoading}
                  className="text-[#16A34A] hover:text-[#15803D] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Resend OTP
                </button>
              </div>

              <button
                onClick={handleVerifyMobileOtp}
                disabled={isLoading || mobileOtp.length < 4}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-black text-white bg-[#16A34A] hover:bg-[#15803D] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Mobile'}
              </button>
            </div>
          )}

          {stage === 'email_otp' && (
            <div className="space-y-6 text-center animate-in fade-in zoom-in-95">
              <div className="mx-auto w-16 h-16 bg-[#E8F9EE] rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-[#16A34A]" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Verify Email Address</h3>
                <p className="text-sm text-slate-500 mt-1">Enter the verification code sent to {formData.email}</p>
              </div>
              
              <input
                type="text"
                value={emailOtp}
                onChange={(e) => setEmailOtp(e.target.value)}
                maxLength={6}
                className="w-full text-center tracking-widest text-2xl px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/15 focus:border-[#16A34A] transition-all"
                placeholder="000000"
              />

              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-slate-500">Expires in {formatTime(timer)}</span>
                <button
                  onClick={handleSendEmailOtp}
                  disabled={timer > 0 || isLoading}
                  className="text-[#16A34A] hover:text-[#15803D] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Resend Code
                </button>
              </div>

              <button
                onClick={handleVerifyEmailOtp}
                disabled={isLoading || emailOtp.length < 4}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-black text-white bg-[#16A34A] hover:bg-[#15803D] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Email & Complete Registration'}
              </button>
            </div>
          )}

          {stage === 'success' && (
            <div className="text-center space-y-4 animate-in fade-in zoom-in-95">
              <div className="mx-auto w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 shadow-sm border border-emerald-100">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">Registration Complete</h3>
              <p className="text-slate-500 font-medium">Your employee account has been created successfully. You can now login to access your workspace.</p>
              
              <div className="pt-6">
                <Link
                  href="/employee/login"
                  className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-black text-white bg-emerald-600 hover:bg-emerald-700 transition-all"
                >
                  Continue to Login
                </Link>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
