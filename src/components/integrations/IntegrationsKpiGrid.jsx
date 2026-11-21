'use client';

import * as React from 'react';
import { Layers, ShieldCheck, Sliders, AlertTriangle } from 'lucide-react';

function useAnimatedCount(target, duration = 800) {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    const end = Number(target) || 0;
    if (end === 0) {
      setCount(0);
      return;
    }

    let start = 0;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo curve
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.round(start + (end - start) * ease);
      setCount(current);

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    const frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [target, duration]);

  return count;
}

export function AnimatedKpiCard({
  title,
  value,
  icon: Icon,
  badge,
  badgeType = 'neutral',
  iconColor,
  iconBg,
  subtext,
  onClick,
}) {
  const animatedValue = useAnimatedCount(value);

  const badgeStyles = {
    positive: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    negative: 'bg-rose-50 text-rose-700 border-rose-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    neutral: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300 min-h-[128px] ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#718096]">
            {title}
          </p>
          <div className="flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#172033]">
              {animatedValue}
            </span>
            {badge && (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  badgeStyles[badgeType] || badgeStyles.neutral
                }`}
              >
                {badge}
              </span>
            )}
          </div>
          {subtext && (
            <p className="text-[11px] text-[#718096] pt-0.5">{subtext}</p>
          )}
        </div>

        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl border ${iconBg} ${iconColor} transition-transform group-hover:scale-105`}
        >
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}

export function IntegrationsKpiGrid({ counts = {}, onFilterClick }) {
  const { total = 0, connected = 0, missing = 0, issues = 0 } = counts;

  const connectedPercent = total > 0 ? Math.round((connected / total) * 100) : 0;
  const issuesPercent = total > 0 ? Math.round((issues / total) * 100) : 0;

  const kpis = [
    {
      title: 'Total Integrations',
      value: total,
      icon: Layers,
      badge: 'All Modules',
      badgeType: 'neutral',
      iconColor: 'text-[#173D30]',
      iconBg: 'bg-emerald-50 border-emerald-200/80',
      subtext: 'Core third-party services',
      onClick: () => onFilterClick?.('ALL'),
    },
    {
      title: 'Connected',
      value: connected,
      icon: ShieldCheck,
      badge: `${connectedPercent}% Active`,
      badgeType: 'positive',
      iconColor: 'text-[#20C466]',
      iconBg: 'bg-emerald-50/90 border-emerald-200',
      subtext: 'Fully verified & operational',
      onClick: () => onFilterClick?.('CONNECTED'),
    },
    {
      title: 'Not Configured',
      value: missing,
      icon: Sliders,
      badge: 'Requires Setup',
      badgeType: 'neutral',
      iconColor: 'text-slate-600',
      iconBg: 'bg-slate-100 border-slate-200',
      subtext: 'Credentials not yet saved',
      onClick: () => onFilterClick?.('NOT_CONFIGURED'),
    },
    {
      title: 'Connection Issues',
      value: issues,
      icon: AlertTriangle,
      badge: issues > 0 ? `${issuesPercent}% Issues` : 'All Good',
      badgeType: issues > 0 ? 'negative' : 'positive',
      iconColor: issues > 0 ? 'text-rose-600' : 'text-slate-500',
      iconBg: issues > 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-100 border-slate-200',
      subtext: issues > 0 ? 'Verification failed' : 'Zero active errors',
      onClick: () => onFilterClick?.('ERROR'),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 w-full">
      {kpis.map((kpi, i) => (
        <AnimatedKpiCard key={i} {...kpi} />
      ))}
    </div>
  );
}
