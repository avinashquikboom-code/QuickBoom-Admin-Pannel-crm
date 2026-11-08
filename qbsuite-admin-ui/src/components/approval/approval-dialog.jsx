'use client';

import { RequestDecisionDialog } from './request-decision-dialog';

/** Approval variant of the shared request decision dialog. */
export function ApprovalDialog(props) {
  return <RequestDecisionDialog mode="approve" {...props} />;
}
