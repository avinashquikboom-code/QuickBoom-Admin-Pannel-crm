'use client';

import * as React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * AnimatedCounter
 * Smoothly interpolates numeric values from previous to current value.
 * Supports Indian number formatting (en-IN), currency prefix, percentages,
 * and directional change highlights (green for increase, red for decrease).
 */
export function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
  showIndicator = true,
  highlightOnChange = true,
}) {
  const target = Number.isFinite(Number(value)) ? Number(value) : 0;
  const [displayValue, setDisplayValue] = React.useState(target);
  const [changeType, setChangeType] = React.useState(null); // 'up' | 'down' | null
  const [delta, setDelta] = React.useState(0);
  const prevRef = React.useRef(target);
  const isFirstRender = React.useRef(true);

  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevRef.current = target;
      setDisplayValue(target);
      return;
    }

    const start = prevRef.current;
    if (start === target) return;

    const diff = target - start;
    setDelta(diff);
    setChangeType(diff > 0 ? 'up' : 'down');

    // Check prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setDisplayValue(target);
      prevRef.current = target;
      const timer = setTimeout(() => setChangeType(null), 2000);
      return () => clearTimeout(timer);
    }

    let frameId;
    const startTime = performance.now();
    const duration = Math.min(1000, Math.max(400, Math.abs(diff) > 1000 ? 800 : 500));

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Cubic ease out: 1 - (1 - progress)^3
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + diff * eased;

      setDisplayValue(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(target);
        prevRef.current = target;
      }
    };

    frameId = requestAnimationFrame(step);
    const highlightTimer = setTimeout(() => {
      setChangeType(null);
    }, 2500);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(highlightTimer);
    };
  }, [target]);

  const formattedNumber = React.useMemo(() => {
    if (decimals > 0) {
      return displayValue.toLocaleString('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    }
    return Math.round(displayValue).toLocaleString('en-IN');
  }, [displayValue, decimals]);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 transition-colors duration-500',
        highlightOnChange && changeType === 'up' && 'text-emerald-700',
        highlightOnChange && changeType === 'down' && 'text-rose-700',
        className
      )}
    >
      <span>
        {prefix}
        {formattedNumber}
        {suffix}
      </span>

      {showIndicator && changeType && (
        <span
          className={cn(
            'inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-tight transition-all duration-300 animate-in fade-in zoom-in-90',
            changeType === 'up'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
              : 'bg-rose-50 text-rose-700 border border-rose-200/60'
          )}
          title={`${changeType === 'up' ? '+' : ''}${delta.toLocaleString('en-IN')}`}
        >
          {changeType === 'up' ? (
            <ArrowUpRight className="size-3 mr-0.5 stroke-[2.5]" />
          ) : (
            <ArrowDownRight className="size-3 mr-0.5 stroke-[2.5]" />
          )}
          {changeType === 'up' ? '+' : ''}
          {decimals > 0 ? delta.toFixed(decimals) : Math.round(delta).toLocaleString('en-IN')}
        </span>
      )}
    </span>
  );
}
