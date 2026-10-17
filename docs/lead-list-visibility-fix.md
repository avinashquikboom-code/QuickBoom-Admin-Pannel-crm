# Lead list visibility fix

## Cause and change

Admin `/leads` calls GET `/api/v1/leads` through `lib/leads-api.ts`.
The shared Axios interceptor returns the HTTP body. The Nest transform interceptor returns `{data: Lead[], total, totalPages, pagination}`.
The old Lead adapter unwrapped this to the array, then the page read `list.data.data` and `list.data.total`. Both were undefined, so the table and pagination displayed zero.
The Lead-specific adapter now preserves records and pagination in the object expected by the page. It also accepts the nested list envelope and rejects malformed/failed responses instead of displaying false empty results. It does not filter or paginate the returned rows again.

Changed files:
- `lib/leads-api.ts`: response normalization and development-only request/mapping diagnostics with returned IDs.
- `tests/lead-list-contract.test.cjs`: five focused response-contract checks.
- Backend `src/modules/lead/lead.service.ts`: logs final list WHERE; no query/authorization changes.

## Read-only database/service evidence

Configured database snapshot on 2026-10-17:
- Lead count: 2, unchanged by this task.
- Existing Super Admin: user ID 1, accountType SUPER_ADMIN.
- Exact default WHERE: `{"AND":[{"deletedAt":null},{}]}`.
- Existing list service returns total 2, IDs `[2,1]`. No WHERE condition excluded these records; the frontend response mapping lost them.
- Lead 2: source DATA_CAPTURE, status NEW, createdFrom MOBILE_APP, assignedToId 1, createdById 2, deletedAt null.
- Lead 1: source DATA_CAPTURE, status NEW, createdFrom ADMIN_PANEL, assignedToId null, createdById 1, deletedAt null.
- No MANUAL-source Lead exists in this configured database. A real manual record cannot be compared or confirmed here; none was created for testing.
- Current schema is the previously requested single-organization schema: Lead has no customerId or employeeId column. Assignment uses assignedToId. No tenant restriction was removed by this fix.
- Current Lead schema has no persisted stageId relation. Its pre-existing response stageId=1 is synthetic and remains a separate pending stage-restoration issue. This fix adds no stage join/filter.

Both manual creation and Data Capture import already invalidate `['leads']`; import also refreshes capture list/detail and Lead detail. No extra invalidation was necessary. Default status All omits status; default request has no source/createdFrom/stage filter. Ordering remains createdAt DESC, id DESC.

## Verification and limits

- Five contract tests passed: mixed MANUAL/DATA_CAPTURE records, actual sibling pagination envelope, nested envelope/later pages, empty results, malformed/error responses.
- Admin production build passed.
- Backend production build passed.
- Database read and actual LeadService.findAll executed successfully; no data changes.
- No authenticated browser API session was available: service results above are not claimed as an observed HTTP/browser response. Browser hard refresh was not manually tested.
- Mobile checkout currently has no Lead list screen/service to exercise. Mobile end-to-end visibility and real stage restoration remain pending the architecture clarification from the earlier request.
- No migration, deployment workflow, existing data, or unrelated module changed. Source changes have not been deployed by this task.
