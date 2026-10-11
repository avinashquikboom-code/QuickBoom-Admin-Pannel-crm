/** Keep ledger rows and their sibling metrics together after the API interceptor. */
export function normalizeCommissionLedgerResponse<T>(response: unknown): {
  data: T[];
  summary: Record<string, number>;
  meta: Record<string, number>;
} {
  let body = response;
  for (let depth = 0; depth < 3; depth++) {
    if (!body || typeof body !== 'object') break;
    const value = body as Record<string, unknown>;
    if (value.success === false) throw new Error('Commission API reported an unsuccessful response');
    if (Array.isArray(value.data) && value.summary && typeof value.summary === 'object' && value.meta && typeof value.meta === 'object') {
      const summary = value.summary as Record<string, number>;
      const meta = value.meta as Record<string, number>;
      if (typeof summary.totalCommission !== 'number' || typeof meta.total !== 'number') break;
      return { data: value.data as T[], summary, meta };
    }
    body = value.data;
  }
  throw new Error('Commission response is missing ledger rows, summary or pagination');
}
