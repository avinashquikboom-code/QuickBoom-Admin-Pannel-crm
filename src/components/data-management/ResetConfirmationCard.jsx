'use client';

import * as React from 'react';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import {
  faTriangleExclamation,
  faTrashCan,
  faArrowsRotate,
  faCircleCheck,
  faLock,
} from '@fortawesome/free-solid-svg-icons';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { ConfirmModal } from '@/modules/settings/components/ConfirmModal';

export function ResetConfirmationCard({
  scope,
  reason,
  onReasonChange,
  confirmation,
  onConfirmationChange,
  acknowledgement,
  onAcknowledgementChange,
  globalConfirmation,
  onGlobalConfirmationChange,
  disableReasons = [],
  unresolvedDependencies = [],
  onIncludeModule,
  resetDisabled = true,
  busy = false,
  onExecuteReset,
  estimatedRecords = 0,
}) {
  const [showConfirmModal, setShowConfirmModal] = React.useState(false);

  const getRequiredPhrase = () => {
    if (scope === 'global') return 'RESET GLOBAL';
    if (scope === 'application') return 'RESET ALL DATA';
    return 'RESET';
  };

  const requiredPhrase = getRequiredPhrase();

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-xs space-y-5">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="text-base font-bold text-slate-900">Reset Confirmation & Authorization</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Verify dependencies, record count, and type the required security confirmation phrase.
        </p>
      </div>

      {/* Destructive Warning Box */}
      <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 flex items-start gap-3">
        <div className="size-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
          <FontAwesomeIcon icon={faTriangleExclamation} className="size-4" />
        </div>
        <div className="space-y-1">
          <p className="text-xs sm:text-sm font-bold text-rose-950">
            Permanent Data Destruction Warning
          </p>
          <p className="text-xs text-rose-800 leading-relaxed">
            This operation will permanently delete {Number(estimatedRecords || 0).toLocaleString()} selected records. System accounts, security roles, and audit trails remain protected. This action cannot be reversed.
          </p>
        </div>
      </div>

      {/* Unresolved Blockers Warning if any */}
      {unresolvedDependencies.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs sm:text-sm">
            <FontAwesomeIcon icon={faTriangleExclamation} className="size-4 text-amber-600" />
            <span>Unresolved Dependencies ({unresolvedDependencies.length})</span>
          </div>
          <p className="text-xs text-amber-800">
            The following modules have dependent records that prevent reset. Include them to proceed:
          </p>
          <div className="space-y-2">
            {unresolvedDependencies.map((dep) => (
              <div
                key={`dep-${dep.module}-${dep.model}`}
                className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-amber-200 text-xs gap-2 flex-wrap"
              >
                <div>
                  <span className="font-bold text-slate-800">{dep.label}</span>
                  <span className="text-[11px] text-slate-500 block">
                    {dep.records} records in module: {dep.resolutionModule?.name || dep.module}
                  </span>
                </div>
                {dep.resolutionModule?.id && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onIncludeModule(dep.resolutionModule.id)}
                    className="h-7 text-xs border-amber-300 text-amber-900 hover:bg-amber-100"
                  >
                    Include {dep.resolutionModule.name}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form Fields */}
      <div className="space-y-4">
        {/* Reset Reason */}
        <div className="space-y-1.5">
          <label className="block text-xs sm:text-sm font-semibold text-slate-800">
            Reset Reason (Optional)
          </label>
          <Input
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="Audit log note (e.g. Q4 database purge or staging cleanup)"
            className="h-10 text-xs sm:text-sm border-slate-200"
          />
        </div>

        {/* Confirmation Phrase 1 */}
        <div className="space-y-1.5">
          <label className="block text-xs sm:text-sm font-semibold text-slate-800">
            Type <span className="font-mono text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">RESET</span> to confirm
          </label>
          <Input
            value={confirmation}
            onChange={(e) => onConfirmationChange(e.target.value)}
            placeholder="RESET"
            className="h-10 text-xs sm:text-sm border-slate-200 font-mono"
            aria-label="Type RESET to confirm"
          />
        </div>

        {/* Confirmation Phrase 2 for Application Scope */}
        {scope !== 'selected' && (
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-semibold text-slate-800">
              Type <span className="font-mono text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">RESET ALL DATA</span> for full tenant reset
            </label>
            <Input
              value={acknowledgement}
              onChange={(e) => onAcknowledgementChange(e.target.value)}
              placeholder="RESET ALL DATA"
              className="h-10 text-xs sm:text-sm border-slate-200 font-mono"
              aria-label="Type RESET ALL DATA to confirm"
            />
          </div>
        )}

        {/* Confirmation Phrase 3 for Global Scope */}
        {scope === 'global' && (
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-semibold text-slate-800">
              Type <span className="font-mono text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">RESET GLOBAL</span> for every tenant
            </label>
            <Input
              value={globalConfirmation}
              onChange={(e) => onGlobalConfirmationChange(e.target.value)}
              placeholder="RESET GLOBAL"
              className="h-10 text-xs sm:text-sm border-slate-200 font-mono"
              aria-label="Type RESET GLOBAL to confirm"
            />
          </div>
        )}
      </div>

      {/* Validation / Disable Reasons */}
      {disableReasons.length > 0 && (
        <div className="space-y-1 pt-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Prerequisites To Enable Execution:
          </span>
          <ul className="space-y-1 text-xs text-amber-800 bg-amber-50/50 p-2.5 rounded-lg border border-amber-200/60">
            {disableReasons.map((r) => (
              <li key={r} className="flex items-center gap-1.5">
                <span className="size-1 rounded-full bg-amber-500 shrink-0" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          Required confirmation: <code className="font-bold text-slate-800">{requiredPhrase}</code>
        </p>

        <Button
          type="button"
          disabled={resetDisabled || busy}
          onClick={() => setShowConfirmModal(true)}
          className={`w-full sm:w-auto font-semibold px-5 h-10 ${
            resetDisabled
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
          }`}
        >
          <FontAwesomeIcon
            icon={busy ? faArrowsRotate : faTrashCan}
            className={`size-3.5 mr-2 ${busy ? 'animate-spin' : ''}`}
          />
          {busy ? 'Executing Reset…' : 'Execute Data Reset'}
        </Button>
      </div>

      {/* Modal Dialog Confirmation */}
      <ConfirmModal
        isOpen={showConfirmModal}
        title="Execute Destructive Data Reset?"
        message={`Are you completely certain you want to purge ${Number(
          estimatedRecords || 0
        ).toLocaleString()} records under '${scope.toUpperCase()}' scope? This operation cannot be undone.`}
        confirmText="Confirm & Execute"
        onConfirm={() => {
          setShowConfirmModal(false);
          onExecuteReset();
        }}
        onCancel={() => setShowConfirmModal(false)}
        busy={busy}
      />
    </div>
  );
}
