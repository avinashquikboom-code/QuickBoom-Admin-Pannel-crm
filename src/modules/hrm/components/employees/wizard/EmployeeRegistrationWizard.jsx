'use client';
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import { useEmployeeWizardStore } from '@/lib/stores/employee-wizard-store';
import { Step1PersonalInfo } from './Step1PersonalInfo';
import { Step2EmploymentInfo } from './Step2EmploymentInfo';
import { Step3OrganizationSalary } from './Step3OrganizationSalary';
import { Step4EmergencyInfo } from './Step4EmergencyInfo';
import { Step5MobileAccess } from './Step5MobileAccess';
import { Step6ReviewConfirmation } from './Step6ReviewConfirmation';
import { WizardStepIndicator } from './WizardStepIndicator';
import { Dialog, DialogContent } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faXmark, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 1, label: 'Personal' },
  { id: 2, label: 'Employment' },
  { id: 3, label: 'Organization' },
  { id: 4, label: 'Emergency' },
  { id: 5, label: 'Mobile Login' },
  { id: 6, label: 'Review' },
];

export function EmployeeRegistrationWizard({ open, onOpenChange, onSuccess }) {
  const store = useEmployeeWizardStore();
  const [loading, setLoading] = useState(false);
  const [stepValid, setStepValid] = useState(false);
  const [confirmationAgreed, setConfirmationAgreed] = useState(false);

  const currentStepIndex = store.currentStep - 1;
  const isFirstStep = store.currentStep === 1;
  const isLastStep = store.currentStep === STEPS.length;

  // Get step content based on current step
  const getStepContent = () => {
    switch (store.currentStep) {
      case 1:
        return (
          <Step1PersonalInfo
            onValidationChange={(isValid) => setStepValid(isValid)}
          />
        );
      case 2:
        return (
          <Step2EmploymentInfo
            onValidationChange={(isValid) => setStepValid(isValid)}
          />
        );
      case 3:
        return (
          <Step3OrganizationSalary
            onValidationChange={(isValid) => setStepValid(isValid)}
          />
        );
      case 4:
        return (
          <Step4EmergencyInfo
            onValidationChange={(isValid) => setStepValid(isValid)}
          />
        );
      case 5:
        return <Step5MobileAccess />;
      case 6:
        return (
          <Step6ReviewConfirmation
            onEdit={(step) => handleEditStep(step)}
          />
        );
      default:
        return null;
    }
  };

  const handleNext = () => {
    if (!stepValid && store.currentStep < 6) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (store.currentStep < STEPS.length) {
      store.markStepCompleted(store.currentStep);
      store.setCurrentStep(store.currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (store.currentStep > 1) {
      store.setCurrentStep(store.currentStep - 1);
    }
  };

  const handleEditStep = (step) => {
    store.setCurrentStep(step);
  };

  const handleSubmit = async () => {
    if (!stepValid) {
      toast.error('Please review and confirm all information');
      return;
    }

    setLoading(true);
    try {
      // Simulate API call to create employee
      await new Promise(resolve => setTimeout(resolve, 1500));

      const data = store.getAllData();
      const newEmployeeId = `EMP-${1000 + Math.floor(Math.random() * 9000)}`;

      // Here you would make an actual API call
      // const response = await fetch('/api/employees', { method: 'POST', body: JSON.stringify(data) });

      console.log('Employee Registration Data:', {
        ...data,
        employeeId: newEmployeeId,
      });

      toast.success('Employee Registered Successfully', {
        description: `${data.personal.firstName} ${data.personal.lastName} (${newEmployeeId}) has been onboarded.`,
      });

      // Reset and close
      store.reset();
      onOpenChange(false);
      onSuccess?.({
        ...data,
        employeeId: newEmployeeId,
      });
    } catch (error) {
      toast.error('Registration Failed', {
        description: error.message || 'Please try again',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (store.currentStep > 1) {
      if (window.confirm('Are you sure you want to close? Any unsaved changes will be lost.')) {
        store.reset();
        onOpenChange(false);
      }
    } else {
      store.reset();
      onOpenChange(false);
    }
  };

  useEffect(() => {
    if (store.currentStep === 6) {
      setStepValid(true);
    }
  }, [store.currentStep]);

  const stepContent = getStepContent();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col p-0 bg-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-900">Add Employee Master</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {STEPS[currentStepIndex].label} – Step {store.currentStep} of {STEPS.length}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={loading}
            className="h-8 w-8 p-0 hover:bg-slate-100"
          >
            <FontAwesomeIcon icon={faXmark} className="size-5 text-slate-600" />
          </Button>
        </div>

        {/* Step Indicator */}
        <WizardStepIndicator
          currentStep={store.currentStep}
          completedSteps={store.completedSteps}
          errors={store.stepErrors}
        />

        {/* Form Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {stepContent}
        </div>

        {/* Footer - Fixed */}
        <div className="border-t border-slate-200 bg-white px-6 py-4 flex items-center justify-between gap-3 shrink-0">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={isFirstStep || loading}
            className="h-9 px-4 text-xs"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="size-3 mr-1.5" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                toast.info('Draft saving feature coming soon');
              }}
              disabled={loading}
              className="h-9 px-4 text-xs"
            >
              Save Draft
            </Button>

            {!isLastStep ? (
              <Button
                onClick={handleNext}
                disabled={loading || (!stepValid && store.currentStep < 6)}
                className={cn(
                  'h-9 px-6 text-xs bg-brand hover:bg-primary-hover text-white font-medium',
                  (!stepValid && store.currentStep < 6) && 'opacity-50 cursor-not-allowed'
                )}
              >
                Next Step
                <FontAwesomeIcon icon={faChevronRight} className="size-3 ml-1.5" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading || !stepValid}
                className={cn(
                  'h-9 px-6 text-xs bg-brand hover:bg-primary-hover text-white font-medium',
                  (!stepValid || loading) && 'opacity-50 cursor-not-allowed'
                )}
              >
                {loading ? 'Submitting...' : 'Submit Registration'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
