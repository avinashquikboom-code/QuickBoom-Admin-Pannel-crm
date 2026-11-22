'use client';

import * as React from 'react';
import { PageTitleCard } from '@/components/common/PageTitleCard';
import { RoleCommissionConfigurationsCard } from '@/components/commission/RoleCommissionConfigurationsCard';
import { DesignationCommissionSettingsCard } from '@/components/commission/DesignationCommissionSettingsCard';
import { PreviewCommissionCard } from '@/components/commission/PreviewCommissionCard';
import { Percent } from 'lucide-react';
import api from '../../../../../lib/api';

const unwrap = (value) => value?.data ?? value;

const TABS = [
  { id: 'configurations', label: 'Commission Configurations' },
  { id: 'settings', label: 'Commission Settings' },
];

export default function CommissionSettingsPage() {
  const [activeTab, setActiveTab] = React.useState('configurations');
  const [roles, setRoles] = React.useState([]);

  // Preload roles for the preview calculator and configuration selectors
  React.useEffect(() => {
    let isMounted = true;
    api
      .get('/commissions/configs/roles')
      .then((res) => {
        if (isMounted) {
          setRoles(unwrap(res) || []);
        }
      })
      .catch(() => {
        // Fallback handled in cards
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="max-w-none w-full min-w-0 space-y-5 sm:space-y-6 pb-28 overflow-x-hidden">
      {/* 1. Commission Settings Hero Banner (Rendered strictly once at top) */}
      <PageTitleCard
        category="COMPENSATION & PAYROLL"
        title="Commission Settings"
        description="Configure commission rules, roles, and preview payouts."
        icon={Percent}
      />

      {/* 2. Navigation Tabs (Horizontally scrollable on mobile) */}
      <div className="border-b border-[#E2E8E5] bg-white rounded-xl shadow-2xs p-1.5 sm:p-2">
        <nav
          className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none"
          aria-label="Commission Settings Tabs"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#163A2E] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-[#E8F1EC] hover:text-[#163A2E]'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* 3. Tab 1: Commission Configurations (Role-based configurations + Preview) */}
      {activeTab === 'configurations' && (
        <div className="space-y-5 sm:space-y-6 min-w-0">
          {/* Role-based Commission Configurations Card */}
          <RoleCommissionConfigurationsCard
            roles={roles}
            onRolesLoaded={(loaded) => setRoles(loaded)}
          />

          {/* Preview Commission Card (Placed directly below configuration table) */}
          <PreviewCommissionCard roles={roles} />
        </div>
      )}

      {/* 4. Tab 2: Commission Settings (Designation-based settings + Preview) */}
      {activeTab === 'settings' && (
        <div className="space-y-5 sm:space-y-6 min-w-0">
          {/* Designation Commission Settings Card */}
          <DesignationCommissionSettingsCard />

          {/* Preview Commission Card */}
          <PreviewCommissionCard roles={roles} />
        </div>
      )}
    </div>
  );
}
