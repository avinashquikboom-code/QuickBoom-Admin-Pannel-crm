'use client';
import React from 'react';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 1, label: 'Personal', title: 'Personal Information' },
  { id: 2, label: 'Employment', title: 'Employment Information' },
  { id: 3, label: 'Organization', title: 'Organization & Salary' },
  { id: 4, label: 'Emergency', title: 'Emergency Information' },
  { id: 5, label: 'Mobile Login', title: 'Mobile Access' },
  { id: 6, label: 'Review', title: 'Review & Confirmation' },
];

export function WizardStepIndicator({ currentStep, completedSteps, errors = {} }) {
  return (
    <div className="w-full bg-white border-b border-slate-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
          {STEPS.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = currentStep === step.id;
            const hasError = errors[step.id];
            const isUpcoming = step.id > currentStep;

            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all border-2',
                      isCurrent
                        ? 'bg-brand text-white border-brand shadow-md'
                        : isCompleted
                          ? 'bg-brand text-white border-brand'
                          : hasError
                            ? 'bg-red-50 text-red-600 border-red-300'
                            : isUpcoming
                              ? 'bg-slate-100 text-slate-400 border-slate-200'
                              : 'bg-white text-slate-400 border-slate-200'
                    )}
                  >
                    {isCompleted ? (
                      <FontAwesomeIcon icon={faCheckCircle} className="size-5" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      {step.label}
                    </p>
                  </div>
                </div>

                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mb-8 transition-colors',
                      isCompleted ? 'bg-brand' : 'bg-slate-200'
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export { STEPS };
