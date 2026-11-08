'use client';

import * as React from 'react';
import { RequestDecisionDialog } from './request-decision-dialog';

const ApprovalDialogContext = React.createContext(null);

/**
 * @typedef {object} ProgrammaticDecisionConfig
 * @property {'approve' | 'reject'} mode
 * @property {string} title
 * @property {string} description
 * @property {string} primaryLabel
 * @property {string} noteLabel
 * @property {string} notePlaceholder
 * @property {boolean} [noteRequired]
 * @property {import('./approval-dialog-config').RequestDecisionCopy['summary']} [summary]
 * @property {(note: string) => void | Promise<void>} onSubmit
 */

export function ApprovalDialogProvider({ children }) {
  const [open, setOpen] = React.useState(false);
  const [config, setConfig] = React.useState(null);
  const [note, setNote] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const close = React.useCallback(() => {
    if (loading) {
      return;
    }
    setOpen(false);
    setConfig(null);
    setNote('');
  }, [loading]);

  const openWith = React.useCallback((next) => {
    setConfig(next);
    setNote('');
    setLoading(false);
    setOpen(true);
  }, []);

  const value = React.useMemo(
    () => ({
      /** @param {Omit<ProgrammaticDecisionConfig, 'mode'>} cfg */
      openApproval: (cfg) => openWith({ ...cfg, mode: 'approve' }),
      /** @param {Omit<ProgrammaticDecisionConfig, 'mode'>} cfg */
      openRejection: (cfg) => openWith({ ...cfg, mode: 'reject' }),
    }),
    [openWith],
  );

  const handleSubmit = async (submittedNote) => {
    if (!config?.onSubmit) {
      return;
    }
    setLoading(true);
    try {
      await config.onSubmit(submittedNote);
      close();
    } catch {
      /* Preserve note + keep dialog open for retry. */
    } finally {
      setLoading(false);
    }
  };

  return (
    <ApprovalDialogContext.Provider value={value}>
      {children}
      {config ? (
        <RequestDecisionDialog
          mode={config.mode}
          open={open}
          onOpenChange={(next) => {
            if (!next) {
              close();
            }
          }}
          title={config.title}
          description={config.description}
          summary={config.summary}
          primaryLabel={config.primaryLabel}
          noteLabel={config.noteLabel}
          notePlaceholder={config.notePlaceholder}
          noteRequired={config.noteRequired}
          note={note}
          onNoteChange={setNote}
          onSubmit={handleSubmit}
          loading={loading}
        />
      ) : null}
    </ApprovalDialogContext.Provider>
  );
}

export function useApprovalDialog() {
  const context = React.useContext(ApprovalDialogContext);
  if (!context) {
    throw new Error('useApprovalDialog must be used within ApprovalDialogProvider');
  }
  return context;
}
