'use client';

import * as React from 'react';
import { AdminRowActions as AdminRowActionsBase } from '@/components/common/AdminRowActions';

export function DataTableRowActions(props) {
    return <AdminRowActionsBase {...props} />;
}

export function AdminRowActions(props) {
    return <AdminRowActionsBase {...props} />;
}
export default DataTableRowActions;
