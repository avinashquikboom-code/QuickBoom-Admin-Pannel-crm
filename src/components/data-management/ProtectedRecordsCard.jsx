'use client';

import * as React from 'react';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import {
  faShieldHalved,
  faUserShield,
  faKey,
  faLock,
  faSliders,
  faCreditCard,
  faClockRotateLeft,
  faFileCode,
  faDatabase,
} from '@fortawesome/free-solid-svg-icons';

const PROTECTED_SYSTEM_ITEMS = [
  {
    title: 'Admin & User Accounts',
    description: 'Master Super Admin, manager credentials, and employee user accounts.',
    icon: faUserShield,
  },
  {
    title: 'Sessions & Tokens',
    description: 'Active session tokens, refresh credentials, and JWT signing contexts.',
    icon: faKey,
  },
  {
    title: 'Roles & Permissions',
    description: 'RBAC role hierarchy, system guards, and security policies.',
    icon: faLock,
  },
  {
    title: 'Tenant Configuration',
    description: 'System singletons, domain routing, and company localization settings.',
    icon: faSliders,
  },
  {
    title: 'Integrations & Credentials',
    description: 'Google Maps API keys, WhatsApp tokens, AWS S3 & gateway secrets.',
    icon: faCreditCard,
  },
  {
    title: 'System Audit Logs',
    description: 'Immutable security telemetry, user action trails, and login events.',
    icon: faClockRotateLeft,
  },
  {
    title: 'System Templates',
    description: 'Core system email blueprints, Meta templates, and notification layouts.',
    icon: faFileCode,
  },
  {
    title: 'Prisma Migration History',
    description: 'Database schema versioning, foreign key integrity, and migrations.',
    icon: faDatabase,
  },
];

export function ProtectedRecordsCard({ counts, dynamicRecords = [], className = '' }) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className={`rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4 min-w-0 w-full ${className}`}>
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-emerald-50 text-[#163A2E] flex items-center justify-center border border-emerald-100 shrink-0">
            <FontAwesomeIcon icon={faShieldHalved} className="size-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">Protected Records</h3>
            <p className="text-[11px] text-slate-500 truncate">Non-selectable · Always preserved</p>
          </div>
        </div>
        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 shrink-0">
          Shielded
        </span>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed">
        The following infrastructure records, security identities, and administrative credentials are never deleted by any data reset:
      </p>

      {/* Structured protected list */}
      <div className="space-y-2">
        {(expanded ? PROTECTED_SYSTEM_ITEMS : PROTECTED_SYSTEM_ITEMS.slice(0, 4)).map((item) => (
          <div
            key={item.title}
            className="flex items-start gap-3 p-2.5 rounded-xl border border-slate-100 bg-[#F7F9F8] text-xs transition-colors hover:bg-slate-50"
          >
            <div className="size-7 rounded-lg bg-white border border-slate-200 text-[#163A2E] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <FontAwesomeIcon icon={item.icon} className="size-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-bold text-slate-800 block truncate">{item.title}</span>
              <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">{item.description}</span>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full text-center text-xs font-semibold text-[#163A2E] hover:text-[#204C3D] py-1.5 border-t border-slate-100 cursor-pointer transition-colors"
      >
        {expanded ? 'Show less protected categories' : `Show all ${PROTECTED_SYSTEM_ITEMS.length} protected categories`}
      </button>

      {/* Live breakdown counts if available from reset preview */}
      {counts && (
        <div className="mt-3 space-y-2 rounded-xl bg-emerald-50/60 border border-emerald-200/80 p-3 text-xs">
          <div className="flex items-center justify-between font-bold text-emerald-950">
            <span>Preserved Rows Count</span>
            <span>{Number(counts.systemCritical?.records || 0).toLocaleString()} records</span>
          </div>
          {counts.note && <p className="text-[11px] text-emerald-800">{counts.note}</p>}
        </div>
      )}
    </div>
  );
}
