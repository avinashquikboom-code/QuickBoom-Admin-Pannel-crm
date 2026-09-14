'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  CreditCard,
  History,
  Share2,
  CheckCircle2,
  XCircle,
  Clock,
  Edit2,
  ExternalLink,
  Layers,
  Image as ImageIcon,
  Video,
  FileText,
  Hash,
  Instagram,
  Facebook,
  Youtube,
  Linkedin,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  AiSocialAdminService,
  AiServiceConfigItem,
  AiGenerationItem,
  AiCreditTransactionItem,
  ConnectedSocialAccountItem,
  SocialPublishItem,
} from '@/lib/services/ai-social.service';
import {
  AdminPageHero,
  AdminStatCard,
  AdminFormDrawer,
} from '@/components/admin';

export default function AiStudioAdminPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'services' | 'generations' | 'transactions' | 'social'>('services');

  // Edit Service State
  const [editingService, setEditingService] = useState<AiServiceConfigItem | null>(null);
  const [editCreditCost, setEditCreditCost] = useState(1);
  const [editPricePerCredit, setEditPricePerCredit] = useState(10);
  const [editIsActive, setEditIsActive] = useState(true);

  // Queries
  const { data: services = [], isLoading: loadingServices } = useQuery<AiServiceConfigItem[]>({
    queryKey: ['admin-ai-services'],
    queryFn: () => AiSocialAdminService.getAiServices(),
  });

  const { data: generationsData, isLoading: loadingGenerations } = useQuery<{ items: AiGenerationItem[]; total: number }>({
    queryKey: ['admin-ai-generations'],
    queryFn: () => AiSocialAdminService.getGenerations({ limit: 50 }),
    enabled: activeTab === 'generations',
  });

  const { data: transactionsData, isLoading: loadingTransactions } = useQuery<{ items: AiCreditTransactionItem[]; total: number }>({
    queryKey: ['admin-ai-transactions'],
    queryFn: () => AiSocialAdminService.getCreditTransactions({ limit: 50 }),
    enabled: activeTab === 'transactions',
  });

  const { data: publishesData, isLoading: loadingPublishes } = useQuery<{ items: SocialPublishItem[]; total: number }>({
    queryKey: ['admin-social-publishes'],
    queryFn: () => AiSocialAdminService.getSocialPublishes({ limit: 50 }),
    enabled: activeTab === 'social',
  });

  // Service Edit Mutation
  const updateServiceMutation = useMutation({
    mutationFn: async () => {
      if (!editingService) return;
      return AiSocialAdminService.updateAiService(editingService.code, {
        creditCost: Number(editCreditCost),
        pricePerCredit: Number(editPricePerCredit),
        isActive: editIsActive,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ai-services'] });
      toast.success('AI Service pricing updated');
      setEditingService(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update service');
    },
  });

  const openEditService = (service: AiServiceConfigItem) => {
    setEditingService(service);
    setEditCreditCost(service.creditCost);
    setEditPricePerCredit(service.pricePerCredit);
    setEditIsActive(service.isActive);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'POSTER':
        return <ImageIcon className="w-4 h-4 text-purple-500" />;
      case 'VIDEO':
        return <Video className="w-4 h-4 text-red-500" />;
      case 'CAPTION':
        return <Hash className="w-4 h-4 text-emerald-500" />;
      default:
        return <FileText className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <AdminPageHero
        title="AI Content Creation & Social Publishing"
        subtitle="Manage QB Marketplace AI studio services, credit wallet pricing, generation logs, and automated social publishing."
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <AdminStatCard
          title="Active AI Services"
          value={loadingServices ? '...' : services.filter((s) => s.isActive).length.toString()}
          icon={<Sparkles className="w-5 h-5 text-primary" />}
        />
        <AdminStatCard
          title="Avg Credit Price"
          value="₹10 / credit"
          icon={<CreditCard className="w-5 h-5 text-emerald-500" />}
        />
        <AdminStatCard
          title="Social Channels"
          value="5 Platforms"
          icon={<Share2 className="w-5 h-5 text-sky-500" />}
        />
        <AdminStatCard
          title="Publishing Engine"
          value="Auto-Cron Active"
          icon={<Clock className="w-5 h-5 text-amber-500" />}
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border overflow-x-auto">
        <button
          onClick={() => setActiveTab('services')}
          className={`px-5 py-3 text-sm font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'services'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          AI Services & Credit Pricing
        </button>
        <button
          onClick={() => setActiveTab('generations')}
          className={`px-5 py-3 text-sm font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'generations'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <History className="w-4 h-4" />
          Generation History
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-5 py-3 text-sm font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'transactions'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Credit Wallet Ledger
        </button>
        <button
          onClick={() => setActiveTab('social')}
          className={`px-5 py-3 text-sm font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'social'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Share2 className="w-4 h-4" />
          Social Publishing Queue
        </button>
      </div>

      {/* TAB 1: AI SERVICES */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Configure credit usage and per-credit cost for customer AI tools in QB Marketplace.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {services.map((svc) => (
              <div
                key={svc.code}
                className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="p-2 rounded-lg bg-primary/10 text-primary">
                      {getTypeIcon(svc.code)}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        svc.isActive
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-red-500/10 text-red-500'
                      }`}
                    >
                      {svc.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  <h3 className="font-bold text-foreground text-sm">{svc.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 min-h-[36px]">
                    {svc.description || 'AI generation capability.'}
                  </p>

                  <div className="mt-4 pt-3 border-t border-border space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Credit Cost:</span>
                      <span className="font-bold text-foreground">{svc.creditCost} Credits</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price / Credit:</span>
                      <span className="font-semibold text-foreground">₹{svc.pricePerCredit}</span>
                    </div>
                    <div className="flex justify-between text-primary font-semibold">
                      <span>Per Gen Total:</span>
                      <span>₹{(svc.creditCost * svc.pricePerCredit).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border">
                  <button
                    onClick={() => openEditService(svc)}
                    className="w-full btn btn-outline btn-xs flex items-center justify-center gap-1.5"
                  >
                    <Edit2 className="w-3 h-3" /> Edit Pricing & Status
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: GENERATIONS HISTORY */}
      {activeTab === 'generations' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="p-3">Generation ID</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Tool</th>
                  <th className="p-3">Product / Objective</th>
                  <th className="p-3">Credits</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loadingGenerations ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      Loading generations...
                    </td>
                  </tr>
                ) : (generationsData?.items || []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-muted-foreground">
                      No AI generations logged yet.
                    </td>
                  </tr>
                ) : (
                  (generationsData?.items || []).map((gen) => (
                    <tr key={gen.id} className="hover:bg-muted/30">
                      <td className="p-3 font-mono text-primary font-semibold">{gen.generationId}</td>
                      <td className="p-3">
                        <span className="font-semibold text-foreground">{gen.customer?.name || 'Customer'}</span>
                        <div className="text-[10px] text-muted-foreground">{gen.customer?.email}</div>
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 font-semibold">
                          {getTypeIcon(gen.type)} {gen.type}
                        </span>
                      </td>
                      <td className="p-3 max-w-xs truncate">
                        <span className="text-foreground font-medium">{gen.product}</span>
                        {gen.objective && <div className="text-[10px] text-muted-foreground">{gen.objective}</div>}
                      </td>
                      <td className="p-3 font-bold text-foreground">{gen.creditsSpent} cr</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            gen.status === 'COMPLETED'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : gen.status === 'PROCESSING'
                              ? 'bg-amber-500/10 text-amber-500'
                              : 'bg-red-500/10 text-red-500'
                          }`}
                        >
                          {gen.status}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">{new Date(gen.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CREDIT WALLET LEDGER */}
      {activeTab === 'transactions' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="p-3">Transaction Date</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Credits</th>
                  <th className="p-3">Balance After</th>
                  <th className="p-3">Notes / Service</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loadingTransactions ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      Loading transactions...
                    </td>
                  </tr>
                ) : (transactionsData?.items || []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-muted-foreground">
                      No credit transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  (transactionsData?.items || []).map((tx) => (
                    <tr key={tx.id} className="hover:bg-muted/30">
                      <td className="p-3 text-muted-foreground">{new Date(tx.createdAt).toLocaleString()}</td>
                      <td className="p-3 font-semibold text-foreground">{tx.customer?.name || 'Customer'}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tx.type === 'PURCHASE' || tx.type === 'BONUS'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : 'bg-amber-500/10 text-amber-500'
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="p-3 font-bold">
                        <span className={tx.amount > 0 ? 'text-emerald-500' : 'text-foreground'}>
                          {tx.amount > 0 ? `+${tx.amount}` : tx.amount} cr
                        </span>
                      </td>
                      <td className="p-3 font-mono">{tx.balanceAfter} cr</td>
                      <td className="p-3 text-muted-foreground">{tx.notes || tx.serviceCode || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SOCIAL PUBLISHING */}
      {activeTab === 'social' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="p-3">Publish ID</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Platform</th>
                  <th className="p-3">Content Preview</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Schedule / Published At</th>
                  <th className="p-3">External Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loadingPublishes ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      Loading social queue...
                    </td>
                  </tr>
                ) : (publishesData?.items || []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-muted-foreground">
                      No posts in social publishing queue.
                    </td>
                  </tr>
                ) : (
                  (publishesData?.items || []).map((pub) => (
                    <tr key={pub.id} className="hover:bg-muted/30">
                      <td className="p-3 font-mono text-primary font-semibold">{pub.publishId}</td>
                      <td className="p-3 font-semibold text-foreground">{pub.customer?.name || 'Customer'}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-muted font-bold text-foreground">
                          {pub.platform}
                        </span>
                      </td>
                      <td className="p-3 max-w-xs truncate text-muted-foreground">
                        {pub.content || '(Media only)'}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            pub.status === 'PUBLISHED'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : pub.status === 'SCHEDULED'
                              ? 'bg-sky-500/10 text-sky-500'
                              : 'bg-red-500/10 text-red-500'
                          }`}
                        >
                          {pub.status}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {pub.publishedAt
                          ? new Date(pub.publishedAt).toLocaleString()
                          : pub.scheduledFor
                          ? `Scheduled: ${new Date(pub.scheduledFor).toLocaleString()}`
                          : '-'}
                      </td>
                      <td className="p-3">
                        {pub.externalPostUrl ? (
                          <a
                            href={pub.externalPostUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            View Post <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Service Drawer */}
      <AdminFormDrawer
        isOpen={!!editingService}
        onClose={() => setEditingService(null)}
        title={`Edit ${editingService?.name}`}
        subtitle="Configure credit usage and pricing"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateServiceMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold mb-1">Credits Deducted Per Generation *</label>
            <input
              type="number"
              min="1"
              max="50"
              required
              value={editCreditCost}
              onChange={(e) => setEditCreditCost(Number(e.target.value))}
              className="input input-bordered w-full text-xs"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Number of wallet credits charged each time a customer runs this AI tool.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Price Per Credit (₹) *</label>
            <input
              type="number"
              min="1"
              required
              value={editPricePerCredit}
              onChange={(e) => setEditPricePerCredit(Number(e.target.value))}
              className="input input-bordered w-full text-xs"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Used when customer purchases credits directly or tops up their wallet.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="serviceIsActive"
              checked={editIsActive}
              onChange={(e) => setEditIsActive(e.target.checked)}
              className="checkbox checkbox-primary checkbox-sm"
            />
            <label htmlFor="serviceIsActive" className="text-xs font-medium cursor-pointer">
              Enable this AI tool for customers in QB Marketplace
            </label>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-border">
            <button
              type="button"
              onClick={() => setEditingService(null)}
              className="btn btn-ghost btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateServiceMutation.isPending}
              className="btn btn-primary btn-sm"
            >
              {updateServiceMutation.isPending ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </AdminFormDrawer>
    </div>
  );
}
