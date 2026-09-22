'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mail, MessageSquare } from 'lucide-react';

interface TemplatesHeaderTabsProps {
  emailCount?: number;
  metaCount?: number;
}

export function TemplatesHeaderTabs({ emailCount, metaCount }: TemplatesHeaderTabsProps) {
  const pathname = usePathname();
  const isEmail = pathname.startsWith('/templates/email');
  const isMeta = pathname.startsWith('/templates/meta');

  return (
    <div className="flex items-center gap-2 border-b border-slate-200/80 pb-4 mb-6">
      <Link
        href="/templates/email"
        className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
          isEmail
            ? 'bg-slate-900 text-white shadow-sm'
            : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80'
        }`}
      >
        <Mail className={`w-4 h-4 ${isEmail ? 'text-blue-400' : 'text-slate-500'}`} />
        <span>Email Templates</span>
        {typeof emailCount === 'number' && (
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
              isEmail ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {emailCount}
          </span>
        )}
      </Link>

      <Link
        href="/templates/meta"
        className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
          isMeta
            ? 'bg-[#1AA14D] text-white shadow-sm shadow-emerald-900/20'
            : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80'
        }`}
      >
        <MessageSquare className={`w-4 h-4 ${isMeta ? 'text-emerald-100' : 'text-[#25D366]'}`} />
        <span>Meta / WhatsApp Templates</span>
        {typeof metaCount === 'number' && (
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
              isMeta ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            {metaCount}
          </span>
        )}
      </Link>
    </div>
  );
}
