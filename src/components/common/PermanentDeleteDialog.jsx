'use client';

import * as React from 'react';
import { ConfirmDialog } from './ConfirmDialog';

/**
 * PermanentDeleteDialog
 * Reusable dialog for permanent (hard) database deletion across QB Suite tables.
 *
 * @param {boolean} open
 * @param {function} onOpenChange
 * @param {string} [title] - Custom title (optional)
 * @param {string} [recordName] - Name or code of the single item being deleted
 * @param {number} [count=1] - Number of items for bulk deletion
 * @param {string} [noun='record'] - Noun describing the entity (e.g. 'department', 'employee', 'task')
 * @param {string} [warningNote] - Optional extra note (e.g. 'Unassigned tasks will be unlinked')
 * @param {boolean} [loading=false] - Deletion in progress
 * @param {function} onConfirm - Callback to perform deletion
 */
export function PermanentDeleteDialog({
  open,
  onOpenChange,
  title,
  recordName,
  count = 1,
  noun = 'record',
  warningNote,
  loading = false,
  onConfirm,
}) {
  const isBulk = count > 1 || (!recordName && count !== 1);
  const resolvedTitle = title || (isBulk
    ? `Permanently delete ${count} selected ${noun}s?`
    : `Delete ${recordName ? `“${recordName}”` : `this ${noun}`} permanently?`);

  const description = isBulk
    ? `This action is irreversible. ${count} selected ${noun}s will be permanently removed from the database along with eligible dependent records.`
    : `This action cannot be undone. ${recordName ? `“${recordName}”` : `The selected ${noun}`} and its eligible dependent data will be permanently deleted from the database.`;

  const confirmLabel = loading
    ? 'Deleting…'
    : isBulk
      ? `Permanently Delete ${count} ${noun}s`
      : 'Permanently Delete';

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      variant="destructive"
      title={resolvedTitle}
      description={description}
      confirmLabel={confirmLabel}
      cancelLabel="Cancel"
      loading={loading}
      closeOnConfirm={false}
      details={warningNote ? (
        <div className="rounded-lg bg-rose-50/70 border border-rose-200/80 p-2.5 text-xs text-rose-800 font-medium">
          {warningNote}
        </div>
      ) : null}
      onConfirm={onConfirm}
    />
  );
}
