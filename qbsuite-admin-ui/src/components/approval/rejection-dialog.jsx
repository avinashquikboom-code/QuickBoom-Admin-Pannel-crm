'use client';

import { RequestDecisionDialog } from './request-decision-dialog';

/** Rejection variant of the shared request decision dialog. */
export function RejectionDialog(props) {
  return <RequestDecisionDialog mode="reject" {...props} />;
}
