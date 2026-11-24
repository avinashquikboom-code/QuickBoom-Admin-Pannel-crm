'use client';

import * as React from 'react';
import { useEmployeeWizardStore } from '@/lib/stores/employee-wizard-store';
import { validateStep } from '@/lib/validations/employee-wizard-validation';
import { Step1PersonalInfo } from './Step1PersonalInfo';
import { Step2EmploymentInfo } from './Step2EmploymentInfo';
import { Step3OrganizationSalary } from './Step3OrganizationSalary';
import { Step4EmergencyInfo } from './Step4EmergencyInfo';
import { Step5MobileAccess } from './Step5MobileAccess';
import { Step6ReviewConfirmation } from './Step6ReviewConfirmation';
import { DesktopStepNavigation, MobileStepNavigation, STEPS } from './WizardStepIndicator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { toast } from '@/hooks/use-toast';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Save,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function EmployeeRegistrationWizard({
  open,
  onOpenChange,
  onSuccess,
  editEmployee = null,
  offices = [],
  shifts = [],
  assignmentError = '',
  designations = [],
  designationError = '',
  designationLoading = false,
  departments = [],
  organizationError = '',
  organizationLoading = false,
  employees = [],
  teams = [],
}) {
  const store = useEmployeeWizardStore();
  const [loading, setLoading] = React.useState(false);
  const [stepValid, setStepValid] = React.useState(false);
  const [draftPrompt, setDraftPrompt] = React.useState(null);
  const scrollAreaRef = React.useRef(null);

  // Initialize store when modal opens or editEmployee changes
  React.useEffect(() => {
    if (!open) return;

    if (editEmployee) {
      store.initializeForEdit(editEmployee);
      setDraftPrompt(null);
    } else {
      store.initializeForCreate();
      // Check for saved draft
      const draftMeta = store.getSavedDraftMeta();
      if (draftMeta) {
        setDraftPrompt(draftMeta);
      }
    }
  }, [open, editEmployee]);

  // Current Step Meta
  const currentStepIndex = Math.max(0, Math.min(STEPS.length - 1, store.currentStep - 1));
  const currentStepMeta = STEPS[currentStepIndex];
  const isFirstStep = store.currentStep === 1;
  const isLastStep = store.currentStep === STEPS.length;
  const isEditMode = store.mode === 'edit';
  const completionPercentage = store.calculateCompletionPercentage();

  // Handle Step Navigation with Validation Guard
  const handleNext = () => {
    store.markStepAttempted(store.currentStep);

    // Validate current step
    const currentData = store.getAllData();
    let stepValidation;
    if (store.currentStep === 1) {
      stepValidation = validateStep(1, currentData.personal, store.mode);
    } else if (store.currentStep === 2) {
      stepValidation = validateStep(2, currentData.employment, store.mode);
    } else if (store.currentStep === 3) {
      stepValidation = validateStep(3, currentData.organization, store.mode);
    } else if (store.currentStep === 4) {
      stepValidation = validateStep(4, currentData.emergency, store.mode);
    } else if (store.currentStep === 5) {
      stepValidation = validateStep(5, currentData.mobileAccess, store.mode);
    } else {
      stepValidation = { isValid: true, errors: {} };
    }

    if (!stepValidation.isValid) {
      store.setStepErrors(store.currentStep, stepValidation.errors);
      toast.error('Please complete all required fields on this step');
      // Scroll to top of form area
      scrollAreaRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    store.markStepCompleted(store.currentStep);
    if (store.currentStep < STEPS.length) {
      store.setCurrentStep(store.currentStep + 1);
      scrollAreaRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (store.currentStep > 1) {
      store.setCurrentStep(store.currentStep - 1);
      scrollAreaRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStepJump = (stepId) => {
    if (stepId <= store.currentStep || store.completedSteps.includes(stepId)) {
      store.setCurrentStep(stepId);
      scrollAreaRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Draft Actions
  const handleSaveDraft = () => {
    const saved = store.saveDraftToStorage();
    if (saved) {
      toast.success('Draft Saved Successfully', {
        description: 'You can safely resume onboarding anytime from this browser.',
      });
      setDraftPrompt(null);
    } else {
      toast.info('Draft saving is available for new employee registrations.');
    }
  };

  const handleResumeDraft = () => {
    const loaded = store.loadDraftFromStorage();
    if (loaded) {
      toast.success('Draft Resumed', {
        description: `Restored progress for ${draftPrompt?.name || 'employee registration'}.`,
      });
    }
    setDraftPrompt(null);
  };

  const handleDiscardDraft = () => {
    store.clearDraft();
    setDraftPrompt(null);
    store.initializeForCreate();
    toast.info('Saved draft discarded. Starting fresh registration.');
  };

  // Check unsaved changes
  const hasUnsavedChanges = () => {
    if (isEditMode) {
      return Boolean(store.password || Object.keys(store.touchedFields).length > 0);
    }
    return Boolean(
      store.firstName ||
      store.lastName ||
      store.corporateEmail ||
      store.phone ||
      store.currentStep > 1
    );
  };

  const handleClose = () => {
    if (loading) return;
    if (hasUnsavedChanges()) {
      const confirm = window.confirm(
        'You have unsaved changes in this employee onboarding form. Are you sure you want to exit? Your progress may be lost.'
      );
      if (!confirm) return;
    }
    store.reset();
    onOpenChange(false);
  };

  // Final Submission
  const handleSubmit = async () => {
    // Validate entire form
    const fullValidation = validateStep(6, store.getAllData(), store.mode);
    if (!fullValidation.isValid) {
      toast.error('Validation Incomplete', {
        description: 'Please review and fill in all mandatory fields before submitting.',
      });
      store.setCurrentStep(6);
      return;
    }

    if (!store.departmentId) {
      toast.error('Please assign a department in Step 3');
      store.setCurrentStep(3);
      return;
    }
    if (!store.designation) {
      toast.error('Please assign a designation in Step 3');
      store.setCurrentStep(3);
      return;
    }

    setLoading(true);
    try {
      const payload = store.getAllData();
      await onSuccess?.(payload);

      // On successful submission: clear draft and reset
      store.clearDraft();
      store.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(isEditMode ? 'Update Failed' : 'Registration Failed', {
        description: error.message || 'Please verify details and try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Render Step Body
  const renderStepContent = () => {
    switch (store.currentStep) {
      case 1:
        return <Step1PersonalInfo onValidationChange={setStepValid} />;
      case 2:
        return (
          <Step2EmploymentInfo
            onValidationChange={setStepValid}
            offices={offices}
            shifts={shifts}
            assignmentError={assignmentError}
          />
        );
      case 3:
        return (
          <Step3OrganizationSalary
            onValidationChange={setStepValid}
            departments={departments}
            organizationError={organizationError}
            organizationLoading={organizationLoading}
            designations={designations}
            designationError={designationError}
            designationLoading={designationLoading}
            employees={employees}
            teams={teams}
          />
        );
      case 4:
        return <Step4EmergencyInfo onValidationChange={setStepValid} />;
      case 5:
        return <Step5MobileAccess onValidationChange={setStepValid} />;
      case 6:
        return (
          <Step6ReviewConfirmation
            onEdit={handleStepJump}
            offices={offices}
            shifts={shifts}
            departments={departments}
            designations={designations}
            employees={employees}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) handleClose();
        else onOpenChange(true);
      }}
    >
      <SheetContent
        side="right"
        showCloseButton={false}
        overlayClassName="bg-slate-900/50 backdrop-blur-xs"
        className="!inset-y-0 !right-0 !left-auto !h-dvh !w-full !max-w-none !gap-0 !overflow-hidden !p-0 bg-white border-l border-slate-200 shadow-2xl data-[side=right]:!w-full data-[side=right]:!max-w-none lg:!w-[1040px] lg:!max-w-[min(1060px,100vw)] duration-300 flex flex-col"
      >
        {/* ── STICKY TOP HEADER ────────────────────────────────────────── */}
        <SheetHeader className="sticky top-0 z-30 flex shrink-0 flex-row items-center justify-between border-b border-slate-200 bg-white px-5 py-3.5 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#16A34A] text-white shadow-xs">
              <Sparkles className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <SheetTitle className="text-base sm:text-lg font-bold text-slate-900 truncate">
                  {isEditMode
                    ? `Edit Employee: ${store.firstName} ${store.lastName}`
                    : 'Add Employee Master'}
                </SheetTitle>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.2 text-[10px] font-bold shrink-0',
                    isEditMode
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-[#16A34A]'
                  )}
                >
                  {isEditMode ? 'Edit Mode' : 'New Onboarding'}
                </span>
              </div>
              <SheetDescription className="text-xs text-slate-500 truncate mt-0.5">
                {currentStepMeta?.title} · Step {store.currentStep} of {STEPS.length}
              </SheetDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditMode && (
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={loading}
                title="Save progress as draft"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
              >
                <Save className="size-3.5 text-slate-500" />
                <span>Save Draft</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              aria-label="Close"
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>
        </SheetHeader>

        {/* ── RESUME DRAFT BANNER (If draft detected) ──────────────────── */}
        {draftPrompt && !isEditMode && (
          <div className="flex items-center justify-between gap-3 border-b border-emerald-200 bg-emerald-50 px-5 py-2.5 text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <RotateCcw className="size-4 text-[#16A34A] shrink-0" />
              <span>
                Saved draft found for <strong>{draftPrompt.name}</strong> ({draftPrompt.dateFormatted}).
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleResumeDraft}
                className="rounded-lg bg-[#16A34A] px-2.5 py-1 text-xs font-bold text-white shadow-xs hover:bg-[#15803D]"
              >
                Resume Draft
              </button>
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="rounded-lg border border-emerald-300 bg-white px-2 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100/60"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* ── MOBILE HORIZONTAL NAVIGATION (< lg) ────────────────────── */}
        <MobileStepNavigation
          currentStep={store.currentStep}
          completedSteps={store.completedSteps}
          stepErrors={store.stepErrors}
          onStepClick={handleStepJump}
          completionPercentage={completionPercentage}
        />

        {/* ── DESKTOP 2-COLUMN LAYOUT BODY (lg+) ──────────────────────── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left Column: Desktop Vertical Steps Navigation */}
          <DesktopStepNavigation
            currentStep={store.currentStep}
            completedSteps={store.completedSteps}
            stepErrors={store.stepErrors}
            onStepClick={handleStepJump}
            completionPercentage={completionPercentage}
          />

          {/* Right Column: Scrollable Form Body */}
          <main
            ref={scrollAreaRef}
            className="flex-1 min-h-0 overflow-y-auto px-5 py-6 sm:px-8 bg-[#F8FAF9]/50"
          >
            <div className="max-w-3xl mx-auto space-y-6">
              {renderStepContent()}
            </div>
          </main>
        </div>

        {/* ── STICKY BOTTOM FOOTER NAVIGATION ─────────────────────────── */}
        <footer className="sticky bottom-0 z-30 flex shrink-0 items-center justify-between border-t border-slate-200 bg-white px-5 py-3.5 sm:px-6 shadow-sm">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={isFirstStep || loading}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-colors',
              isFirstStep || loading
                ? 'opacity-40 cursor-not-allowed bg-slate-50'
                : 'hover:bg-slate-50 hover:text-slate-900 cursor-pointer'
            )}
          >
            <ChevronLeft className="size-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-2.5">
            {!isEditMode && (
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={loading}
                className="inline-flex sm:hidden items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
              >
                <Save className="size-3.5 text-slate-500" />
                <span>Save Draft</span>
              </button>
            )}

            {!isLastStep ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#16A34A] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#15803D] transition-colors cursor-pointer"
              >
                <span>Next Step</span>
                <ChevronRight className="size-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className={cn(
                  'inline-flex items-center gap-2 rounded-xl bg-[#16A34A] px-6 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#15803D] transition-colors',
                  loading && 'opacity-60 cursor-not-allowed'
                )}
              >
                {loading ? (
                  <>
                    <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" />
                    <span>{isEditMode ? 'Update Employee' : 'Create Employee'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </footer>
      </SheetContent>
    </Sheet>
  );
}
