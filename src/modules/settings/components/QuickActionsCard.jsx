'use client';

import * as React from 'react';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faBolt, faTrashCan, faArrowsRotate, faRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';

export function QuickActionsCard({ onClearCache, onSyncSettings, onDiscardChanges, isDirty, busy }) {
  return (
    <Card className="border border-[#E2E8E5] bg-white p-4 sm:p-5 shadow-xs rounded-2xl space-y-4">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
          <FontAwesomeIcon icon={faBolt} className="text-[#163A2E] size-3.5" />
          Quick Actions
        </h3>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Common administrative governance tasks.
        </p>
      </div>

      <div className="space-y-2.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={onClearCache}
          className="w-full justify-start text-xs font-semibold border-[#E2E8E5] text-slate-700 hover:bg-[#E8F1EC] hover:text-[#163A2E] h-9"
        >
          <FontAwesomeIcon icon={faTrashCan} className="size-3.5 mr-2 text-slate-400" />
          Clear Cache
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={onSyncSettings}
          className="w-full justify-start text-xs font-semibold border-[#E2E8E5] text-slate-700 hover:bg-[#E8F1EC] hover:text-[#163A2E] h-9"
        >
          <FontAwesomeIcon icon={faArrowsRotate} className="size-3.5 mr-2 text-slate-400" />
          Sync System Settings
        </Button>

        {isDirty && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={onDiscardChanges}
            className="w-full justify-start text-xs font-semibold text-rose-600 hover:bg-rose-50 h-9"
          >
            <FontAwesomeIcon icon={faRotateLeft} className="size-3.5 mr-2 text-rose-500" />
            Discard Unsaved Changes
          </Button>
        )}
      </div>
    </Card>
  );
}
