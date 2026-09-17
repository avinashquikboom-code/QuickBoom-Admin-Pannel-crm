'use client';

import React from 'react';
import { Banknote, CheckCircle, RefreshCw, CreditCard, Shield, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { AdminPageHero } from '@/components/admin';

export default function MasterPaymentMethodsPage() {
  const { data: resData, isLoading, refetch } = useQuery({
    queryKey: ['master-payment-methods'],
    queryFn: async () => {
      const res: any = await api.get('/master/payment-methods');
      return res?.data || res || {};
    },
  });

  const methods: any[] = Array.isArray(resData?.data) ? resData.data : Array.isArray(resData) ? resData : [];
  const gatewayConfig = resData?.gatewayConfig || {};

  return (
    <div className="space-y-6">
      <AdminPageHero
        title="Payment Methods Master"
        description="Supported client payment channels, gateway integration status, automated Razorpay checkout, and manual offline transfer rules."
        badge={{ text: 'Billing & Gateway', icon: Banknote, variant: 'indigo' }}
      />

      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
              Payment Gateway Mode: {gatewayConfig.mode || 'TEST'}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Live Checkout credentials and gateway webhooks configured in Admin Integrations.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            Manage Keys <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <button
            type="button"
            onClick={() => refetch()}
            className="p-2 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {methods.map((pm) => (
          <div
            key={pm.code}
            className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                    pm.type === 'ONLINE'
                      ? 'bg-blue-50 text-blue-700 border-blue-100'
                      : 'bg-amber-50 text-amber-700 border-amber-100'
                  }`}
                >
                  {pm.type}
                </span>

                {pm.isEnabled ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                    <CheckCircle className="w-3.5 h-3.5" /> Active Channel
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-400">Disabled</span>
                )}
              </div>

              <h3 className="text-base font-black text-slate-900 mt-3">{pm.name}</h3>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                {pm.description}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Captured Transactions</span>
                <span className="text-base font-black text-slate-900">{pm.transactionsCount} Invoices</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-400 px-2 py-0.5 bg-slate-100 rounded-md">
                {pm.code}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
