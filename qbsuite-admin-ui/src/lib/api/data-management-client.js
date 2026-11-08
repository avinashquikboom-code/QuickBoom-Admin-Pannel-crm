/**
 * @deprecated UI-only phase — use `@/lib/data-management/local-data-management` from the page.
 * Kept as a stub so future BFF wiring has a single import path.
 */

export {
  getLocalOverview as fetchDataManagementOverview,
  getLocalModules as fetchDataManagementModules,
  buildLocalDeletionPreview as postDeletionPreview,
  buildLocalExecuteResult as postDeletionExecute,
} from '@/lib/data-management/local-data-management';

export async function fetchDataManagementHistory() {
  return [];
}
