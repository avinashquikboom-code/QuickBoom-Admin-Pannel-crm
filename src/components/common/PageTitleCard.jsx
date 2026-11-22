'use client';

import * as React from 'react';
import {
  Users,
  UsersRound,
  Building2,
  Handshake,
  PhoneCall,
  MapPin,
  UserCheck,
  ListTodo,
  Activity,
  Database,
  Sparkles,
  BarChart3,
  History,
  CalendarCheck,
  CalendarX,
  Wallet,
  FileText,
  Banknote,
  Building,
  BadgeCheck,
  Clock,
  Calendar,
  MessageSquare,
  Mail,
  Megaphone,
  Coins,
  Star,
  Settings,
  LayoutDashboard,
  Layers,
  User,
  Bell,
  ShieldCheck,
} from 'lucide-react';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { Badge } from '@/components/common/Badge';
import { cn } from '@/lib/utils';

const DEFAULT_ICON_MAP = {
  // CRM
  leads: Users,
  customers: UsersRound,
  deals: Handshake,
  'follow-ups': PhoneCall,
  followups: PhoneCall,
  companies: Building2,
  visits: MapPin,
  tasks: ListTodo,
  activities: Activity,
  'lead limits': ShieldCheck,
  'lead-limits': ShieldCheck,
  contacted: Users,
  contacts: Users,
  proposals: FileText,
  crm: Handshake,
  'crm dashboard': LayoutDashboard,

  // Data Capture
  'data capture': Database,
  'data-capture': Database,
  'usage & quota': BarChart3,
  'usage & quotas': BarChart3,
  usage: BarChart3,
  'capture history': History,
  history: History,

  // HRM
  employees: Users,
  attendance: CalendarCheck,
  leaves: CalendarX,
  'leave management': CalendarX,
  payroll: Wallet,
  'salary slips': FileText,
  payslips: FileText,
  loans: Banknote,
  departments: Building,
  designations: BadgeCheck,
  shifts: Clock,
  'shifts & rosters': Clock,
  'remote work': Calendar,
  'geo tracking': MapPin,
  overtime: Clock,
  'break management': Clock,
  commissions: Coins,
  'salary targets': BarChart3,
  'late mark reports': Clock,
  announcements: Megaphone,
  'dashboard': LayoutDashboard,

  // Marketing
  'whatsapp marketing': MessageSquare,
  whatsapp: MessageSquare,
  'email marketing': Mail,
  'in app ad\'s': Sparkles,
  'in app ads': Sparkles,
  'content management': Sparkles,
  'trending content': Sparkles,
  'home banners': Layers,
  'marketing videos': Sparkles,
  campaigns: Megaphone,
  templates: FileText,

  // Settings & System
  settings: Settings,
  'system settings': Settings,
  users: Users,
  roles: ShieldCheck,
  company: Building2,
  integrations: Layers,
  notifications: Bell,
  'activity logs': History,
  'data management': Database,
  'google maps': MapPin,

  // General
  reports: BarChart3,
  'reports & analytics': BarChart3,
  dashboard: LayoutDashboard,
  'executive dashboard': LayoutDashboard,
  profile: User,
  'admin profile': User,
  'ai studio': Sparkles,
  'ai credits': Coins,
  influencers: Star,
  'influencer hub': Star,
  coupons: BadgeCheck,
  subscriptions: Wallet,
  invoices: FileText,
};

function resolveIcon(icon, title, moduleName) {
  if (icon) return icon;
  const key = String(title || '').toLowerCase().trim();
  if (DEFAULT_ICON_MAP[key]) return DEFAULT_ICON_MAP[key];

  const modKey = String(moduleName || '').toLowerCase().trim();
  if (DEFAULT_ICON_MAP[modKey]) return DEFAULT_ICON_MAP[modKey];

  for (const [k, v] of Object.entries(DEFAULT_ICON_MAP)) {
    if (key.includes(k) || modKey.includes(k)) return v;
  }
  return Layers;
}

function RenderIcon({ icon: Icon, className = 'size-6 sm:size-7 text-[#173D30]' }) {
  if (!Icon) return null;
  if (React.isValidElement(Icon)) return Icon;
  if (typeof Icon === 'object' && (Icon.iconName || Icon.prefix)) {
    return <FontAwesomeIcon icon={Icon} className="size-5 sm:size-6 text-[#173D30]" />;
  }
  if (typeof Icon === 'function' || typeof Icon === 'object') {
    return <Icon className={className} aria-hidden="true" />;
  }
  return null;
}

/**
 * PageTitleCard
 *
 * A reusable, premium title card for all QB Suite Admin Panel pages.
 * Supports:
 * - Soft green & white gradient background with subtle border & shadow
 * - Light-green rounded square icon container
 * - Module label, breadcrumb, and optional badge
 * - Prominent title and descriptive subtitle
 * - Contextual right-aligned actions
 * - Optional decorative right-side wave illustration
 * - Full responsive layout (320px small mobile to 1440px+ large desktop)
 */
export function PageTitleCard({
  moduleName,
  category,
  title,
  description,
  icon,
  breadcrumb,
  badge,
  badgeVariant = 'green',
  primaryAction,
  secondaryAction,
  actions,
  rightContent,
  illustration,
  variant = 'default',
  className,
}) {
  const resolvedModule = moduleName || category;
  const ResolvedIcon = resolveIcon(icon, title, resolvedModule);
  const hasActions = Boolean(primaryAction || secondaryAction || actions || rightContent);

  const renderedBadge =
    typeof badge === 'string' ? (
      <Badge
        variant="outline"
        className={cn(
          'text-xs font-semibold py-0.5 px-2.5 rounded-full border shadow-2xs',
          badgeVariant === 'green'
            ? 'border-emerald-200 bg-emerald-50 text-[#173D30]'
            : 'border-slate-200 bg-slate-50 text-slate-700'
        )}
      >
        {badge}
      </Badge>
    ) : (
      badge
    );

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#E2E8E5] bg-gradient-to-r from-[#F0F7F4] via-white to-[#F0F7F4] p-4 sm:p-6 lg:p-7 shadow-xs',
        className
      )}
    >
      {/* Decorative Wave Illustration on Far Right */}
      {illustration ? (
        <div className="pointer-events-none absolute right-0 top-0 h-full max-w-[40%] select-none sm:block hidden" aria-hidden="true">
          {illustration}
        </div>
      ) : (
        <div
          className="pointer-events-none absolute -right-6 -top-6 h-44 w-64 sm:h-56 sm:w-80 select-none text-emerald-600/10 sm:block hidden"
          aria-hidden="true"
        >
          <svg viewBox="0 0 320 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
            <path d="M40 0C120 40 180 140 320 120V0H40Z" fill="currentColor" />
            <path d="M0 60C100 100 190 210 320 180V0H0V60Z" fill="currentColor" fillOpacity="0.5" />
            <circle cx="250" cy="50" r="40" stroke="currentColor" strokeWidth="8" strokeDasharray="6 6" fill="none" opacity="0.4" />
          </svg>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Icon Box + Title Info */}
        <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 min-w-0">
          {/* Icon Box */}
          {ResolvedIcon && (
            <div className="flex size-11 sm:size-13 md:size-14 shrink-0 items-center justify-center rounded-2xl bg-[#EAF7EF] text-[#173D30] border border-emerald-100/90 shadow-2xs">
              <RenderIcon icon={ResolvedIcon} />
            </div>
          )}

          {/* Title & Metadata */}
          <div className="min-w-0 space-y-1">
            {/* Module Name / Breadcrumb / Badge */}
            {(resolvedModule || breadcrumb || renderedBadge) && (
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {resolvedModule && (
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#205541]">
                    {resolvedModule}
                  </span>
                )}
                {breadcrumb && (
                  <>
                    <span className="text-slate-300 text-xs">/</span>
                    <span className="text-xs font-semibold text-slate-600">{breadcrumb}</span>
                  </>
                )}
                {renderedBadge}
              </div>
            )}

            {/* Prominent Page Title */}
            <h1 className="break-words text-xl sm:text-2xl lg:text-[28px] font-bold tracking-tight text-[#172B24] leading-tight">
              {title}
            </h1>

            {/* Descriptive Subtitle */}
            {description && (
              <p className="break-words text-xs sm:text-sm text-[#5B6B63] max-w-2xl leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Right: Contextual Page Actions */}
        {hasActions && (
          <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:gap-2.5 lg:w-auto lg:justify-end shrink-0">
            {secondaryAction}
            {primaryAction}
            {actions}
            {rightContent}
          </div>
        )}
      </div>
    </div>
  );
}
