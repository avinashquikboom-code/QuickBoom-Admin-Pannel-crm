'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { Loader2, ArrowLeft, Building2, User, Phone, Mail, Lock, CheckCircle2, ShieldAlert } from 'lucide-react';
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
      await api.post('/auth/email-otp/verify', { email: formData.email, otp: emailOtp });
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link href="/employee/login" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-6 group">
          <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
          Back to Login
        </Link>
        <div className="bg-white py-10 px-6 shadow-2xl shadow-slate-200/50 rounded-3xl sm:px-12 border border-slate-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-sm">
              <User className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create Employee Account</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">Sign up to access your workspace</p>
          </div>

          {stage === 'details' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="John Doe"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Mobile</label>
                  <input
                    name="mobile"
                    type="tel"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="9876543210"
                    maxLength={10}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">City</label>
                  <input
                    name="city"
                    type="text"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="Mumbai"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="john@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Password</label>
                  <input
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Confirm</label>
                  <input
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Employee Type</label>
                <select
                  name="employeeType"
                  value={formData.employeeType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                >
                  <option value="COMPANY">Company Employee</option>
                  <option value="FREELANCER">Freelancer</option>
                </select>
              </div>

              {formData.employeeType === 'COMPANY' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Company Name</label>
                  <input
                    name="companyName"
                    type="text"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="Company Ltd"
                  />
                </div>
              )}

              <button
                onClick={handleContinue}
                disabled={isLoading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-black text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-4"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue to Verification'}
              </button>
            </div>
          )}

          {stage === 'mobile_otp' && (
            <div className="space-y-6 text-center animate-in fade-in zoom-in-95">
              <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                <Phone className="w-8 h-8 text-blue-600" />
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
                className="w-full text-center tracking-widest text-2xl px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="000000"
              />

              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-slate-500">Expires in {formatTime(timer)}</span>
                <button
                  onClick={handleSendMobileOtp}
                  disabled={timer > 0 || isLoading}
                  className="text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Resend OTP
                </button>
              </div>

              <button
                onClick={handleVerifyMobileOtp}
                disabled={isLoading || mobileOtp.length < 4}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-black text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Mobile'}
              </button>
            </div>
          )}

          {stage === 'email_otp' && (
            <div className="space-y-6 text-center animate-in fade-in zoom-in-95">
              <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-blue-600" />
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
                className="w-full text-center tracking-widest text-2xl px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="000000"
              />

              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-slate-500">Expires in {formatTime(timer)}</span>
                <button
                  onClick={handleSendEmailOtp}
                  disabled={timer > 0 || isLoading}
                  className="text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Resend Code
                </button>
              </div>

              <button
                onClick={handleVerifyEmailOtp}
                disabled={isLoading || emailOtp.length < 4}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-black text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
      </div>
    </div>
  );
}
