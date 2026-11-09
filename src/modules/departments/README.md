# Departments integration

Route: `/admin/sections/departments`. The specific route replaces the generic sample-data screen for Departments only.

## Existing backend contract

All paths below are relative to the existing Axios client's configured API base. Requests use that client's current admin session. The existing admin role helper controls management actions; the backend remains authoritative for authorization and tenant access.

| Operation | Existing endpoint | Behavior |
| --- | --- | --- |
| List | `GET /departments?page=…&limit=100` | Reads every page before displaying counts; search, sorting, status filters and display pagination operate over these API records. |
| Details | `GET /departments/:id` | Fetches fresh values for both view and edit drawers. |
| Create | `POST /departments` | Sends name, optional code/description/headId and isActive. |
| Edit | `PATCH /departments/:id` | Same form; null headId clears the head. |
| Status | `PATCH /departments/:id` | Sends isActive only. |
| Delete | `DELETE /departments/:id` | Backend deactivates departments with employees; otherwise deletes and unassigns linked designations. Displays the returned message. |
| Head lookup | `GET /employees?search=…&page=…&limit=30` | Searchable, paginated employee selector using the existing endpoint defaults. |

The global backend response interceptor returns `{ data, meta }`; department counts use `employeesCount` and `designationsCount`. The module validates response shapes with Zod and shows errors rather than substituting sample records. Duplicate names/codes are validated by the backend. Code generation/collision handling remains backend-owned.

## Unsupported capabilities and limits

- Archive state/operation: the schema only has `isActive`, and there is no archive endpoint. The Archived tab count is therefore 0 and its list is empty. Archive Department explains that limitation and does not call the API.
- Export endpoint: none exists. CSV downloads are generated from the real, fully loaded records in the selected status tab, across all pages. The table's local text search/selection does not narrow this export. Values are escaped and formula-prefixed values neutralized.
- Aggregate department counts and server sorting: not exposed. Every list page is fetched using the existing pagination contract, then the shared DataTable handles sorting/search/pagination. Very large directories may benefit from a future backend aggregate API.
- A 401 is surfaced as an expired-session error. Token refresh stays in the shared API client.
- `QB_SUITE_RULES.md` is not in the repository. The screen follows `DEVELOPMENT_WORK_RULES.md`, the shared PageHeader, and the master-section layout. Status counts and the employee total are calculated from the loaded department records. There is no separate statistics endpoint.

## Verification boundary

Do not exercise mutations against production for verification. In particular, the existing backend's department list service can auto-seed defaults when no records exist, so even live GET checks require an appropriate test environment. Runtime create/edit/delete and employee permissions should be checked with an authorized test account. No backend, schema, migration, deployment or environment file is changed by this module.
