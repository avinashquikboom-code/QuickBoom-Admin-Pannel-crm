import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';
import { Mail, Phone, AlertCircle, ShieldAlert, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'QB Suite Account Deletion Request',
  description: 'Request deletion of your QB Suite account and associated data.',
};

export default function AccountDeletionPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-800">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="QB Suite"
              width={140}
              height={36}
              className="h-8 w-auto object-contain"
              priority
            />
          </div>
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Settings</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 my-auto">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-10 shadow-xs space-y-6">
          {/* Card Header */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/60 flex items-center justify-center font-bold shadow-2xs shrink-0">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                QB Suite Account Deletion Request
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Official Account & Data Deletion Policy and Support
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 space-y-6 text-sm text-slate-700 leading-relaxed">
            <p>
              If you would like to request the deletion of your QB Suite account, please contact us using the support details below. Our team will be happy to assist you.
            </p>

            <div className="p-4 sm:p-5 bg-amber-50/80 border border-amber-200/70 rounded-xl text-amber-900 text-xs sm:text-sm font-medium leading-relaxed flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <span>
                For security and verification purposes, please contact us using the same email address or mobile number associated with your QB Suite account authentication.
              </span>
            </div>

            {/* Contact Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Support Team
                </span>
                <span className="font-extrabold text-slate-900 text-base block">
                  QB Suite
                </span>
              </div>

              <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Email
                </span>
                <a
                  href="mailto:support@quikboom.in"
                  className="font-extrabold text-[#1AA14D] hover:text-[#15803d] hover:underline text-sm sm:text-base inline-flex items-center gap-1.5 transition-colors break-all"
                >
                  <Mail className="w-4 h-4 shrink-0" />
                  <span>support@quikboom.in</span>
                </a>
              </div>

              <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Phone
                </span>
                <a
                  href="tel:+919284216276"
                  className="font-extrabold text-[#1AA14D] hover:text-[#15803d] hover:underline text-sm sm:text-base inline-flex items-center gap-1.5 transition-colors"
                >
                  <Phone className="w-4 h-4 shrink-0" />
                  <span>+91 9284216276</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-400 border-t border-slate-200/60 bg-white">
        <p>&copy; {new Date().getFullYear()} QB Suite. All rights reserved.</p>
      </footer>
    </div>
  );
}
