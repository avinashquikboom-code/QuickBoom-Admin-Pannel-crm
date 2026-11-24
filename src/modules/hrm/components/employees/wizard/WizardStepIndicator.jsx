'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  User,
  Briefcase,
  Building2,
  PhoneCall,
  Smartphone,
  CheckCircle2,
  Check,
  AlertCircle,
} from 'lucide-react';

export const STEPS = [
  {
    id: 1,
    label: 'Personal Info',
    title: 'Personal Information',
    subtitle: 'Photo, identity & addresses',
    icon: User,
  },
  {
    id: 2,
    label: 'Employment',
    title: 'Employment Details',
    subtitle: 'Classification, shift & location',
    icon: Briefcase,
  },
  {
    id: 3,
    label: 'Organization',
    title: 'Organization & Role',
    subtitle: 'Department, designation & pay',
    icon: Building2,
  },
  {
    id: 4,
    label: 'Emergency',
    title: 'Emergency Contact',
    subtitle: 'Primary & alternate contacts',
    icon: PhoneCall,
  },
  {
    id: 5,
    label: 'Mobile Access',
    title: 'Mobile App Access',
    subtitle: 'Login credentials & permissions',
    icon: Smartphone,
  },
  {
    id: 6,
    label: 'Review',
    title: 'Review & Submit',
    subtitle: 'Final inspection & onboarding',
    icon: CheckCircle2,
  },
];

/**
 * Vertical Step Navigation for Desktop (950px+)
 */
export function DesktopStepNavigation({
  currentStep,
  completedSteps = [],
  stepErrors = {},
  onStepClick,
  completionPercentage = 0,
}) {
  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-slate-200 bg-[#FBFDFB] p-4 select-none justify-between">
      <div className="space-y-4">
        <div className="px-2 pt-1 pb-2 border-b border-slate-200/80">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
            ONBOARDING STEPS
          </p>
          <p className="text-xs font-bold text-slate-800 mt-0.5">
            Step {currentStep} of {STEPS.length}
          </p>
        </div>

        <nav className="space-y-1.5" aria-label="Onboarding Wizard Steps">
          {STEPS.map((step) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = currentStep === step.id;
            const hasError = Boolean(stepErrors[step.id] && Object.keys(stepErrors[step.id]).length > 0);
            const isClickable = isCompleted || step.id <= currentStep;
            const StepIcon = step.icon;

            return (
              <button
                key={step.id}
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick?.(step.id)}
                className={cn(
                  'group flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition-all',
                  isCurrent
                    ? 'bg-emerald-50 text-slate-900 shadow-xs ring-1 ring-[#16A34A]/40'
                    : isCompleted
                      ? 'text-slate-700 hover:bg-slate-100/80 cursor-pointer'
                      : 'text-slate-400 cursor-not-allowed opacity-60'
                )}
              >
                {/* Step indicator circle */}
                <div
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors mt-0.5',
                    isCurrent
                      ? 'bg-[#16A34A] text-white shadow-xs'
                      : isCompleted
                        ? 'bg-emerald-100 text-[#16A34A]'
                        : hasError
                          ? 'bg-rose-100 text-rose-600'
                          : 'bg-slate-100 text-slate-400'
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-4 stroke-[2.5]" />
                  ) : hasError ? (
                    <AlertCircle className="size-3.5 text-rose-600" />
                  ) : (
                    <span>{step.id}</span>
                  )}
                </div>

                {/* Step text */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p
                      className={cn(
                        'text-xs font-bold truncate',
                        isCurrent ? 'text-[#16A34A]' : isCompleted ? 'text-slate-800' : 'text-slate-500'
                      )}
                    >
                      {step.label}
                    </p>
                    {isCurrent && (
                      <span className="shrink-0 rounded-full bg-emerald-100/80 px-1.5 py-0.2 text-[9px] font-bold text-[#16A34A]">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {step.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Completion Progress at bottom of vertical navigation */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs mt-4">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-semibold text-slate-600 text-[11px]">Form Completion</span>
          <span className="font-bold text-[#16A34A] text-[11px]">{completionPercentage}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full bg-[#16A34A] transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, completionPercentage))}%` }}
          />
        </div>
        <p className="text-[10px] text-slate-400 mt-2 leading-tight">
          Fields are saved in real-time as you complete each section.
        </p>
      </div>
    </aside>
  );
}

/**
 * Compact Horizontal Step Navigation for Mobile & Tablets (< 1024px)
 */
export function MobileStepNavigation({
  currentStep,
  completedSteps = [],
  stepErrors = {},
  onStepClick,
  completionPercentage = 0,
}) {
  return (
    <div className="lg:hidden w-full border-b border-slate-200 bg-[#FBFDFB] px-4 py-3 select-none">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="flex size-5 items-center justify-center rounded-full bg-[#16A34A] text-[10px] font-bold text-white">
            {currentStep}
          </span>
          <span className="text-xs font-bold text-slate-800">
            {STEPS[currentStep - 1]?.title}
          </span>
        </div>
        <span className="text-[11px] font-bold text-[#16A34A]">
          {completionPercentage}% Done
        </span>
      </div>

      {/* Horizontal Step Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {STEPS.map((step) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          const isClickable = isCompleted || step.id <= currentStep;

          return (
            <button
              key={step.id}
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick?.(step.id)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors shrink-0',
                isCurrent
                  ? 'bg-[#16A34A] text-white shadow-xs'
                  : isCompleted
                    ? 'bg-emerald-50 text-[#16A34A] border border-emerald-200/60'
                    : 'bg-slate-100 text-slate-400 opacity-60'
              )}
            >
              {isCompleted ? (
                <Check className="size-3 stroke-[2.5]" />
              ) : (
                <span>{step.id}</span>
              )}
              <span className="text-[11px]">{step.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
