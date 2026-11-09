# Target salary actions and selection

Target Salary uses `AdminRowActions` and `AdminSelectCheckbox` with assignment IDs. Select All selects only the displayed page. Filters, period changes, paging and reloads clear selection. Approved reviews and payroll dependencies block edit/deactivation on the server. CSV/PDF export includes only selected assignments. Bulk edit is intentionally absent.

## Shared action audit

- `components/common/AdminRowActions.jsx` already renders inline Font Awesome buttons with native title tooltips, green Edit, red destructive actions and neutral View. Existing concurrent changes to this shared component were preserved.
- `components/common/DataTable.jsx`, `AdminTableComponents.jsx`, and the data-table re-export use this shared component. Their column-visibility dropdowns are not row-action menus.
- CRM, Master Management, Customers, Billing and Data Capture inherit these shared table actions and selection where enabled by their existing screens. Unsupported actions were not added.
- Departments already uses the shared actions. Its remaining dropdown import does not render an action menu.
- Integrations had an actual three-dot action menu. It now uses inline Enable/Disable and Disconnect actions, preserving the existing disconnect confirmation and API calls. No unsupported Delete or bulk configuration operation was added.
- Target Salary's bespoke table now exposes View, Edit, Delete, page selection, selected PDF/CSV export, and guarded bulk deactivation. Approve remains a separate existing action.

## Period semantics and deployment

The existing salary target policy table now supports explicit month/year assignments. Existing rows remain at month/year 0/0 as legacy defaults. Editing or deleting a legacy row for a displayed month creates a period override; it does not change other months. Deactivation retains the assignment as a tombstone so a legacy default cannot silently reappear. Approved review snapshots and payroll records are never deleted. New assignments for the same employee/period are rejected by the database unique index, including deactivated assignments.

Apply the reviewed backend migration through the normal approved deployment process before running the updated API. No production migration or deployment was performed by this task. Salary calculation formulas remain unchanged.
