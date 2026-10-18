import type { QueryClient } from '@tanstack/react-query';

export interface SavedCustomerTeam {
  id: number;
  assignedTeamId: number | null;
  assignedTeam: { id: number; name: string; isActive?: boolean } | null;
}

/** Apply only an assignment returned and validated by the save API. */
export async function cacheSavedCustomerTeam(client: QueryClient, saved: SavedCustomerTeam) {
  await client.cancelQueries({ queryKey: ['customers-list'] });
  const merge = (row: any) => row && Number(row.id) === saved.id
    ? { ...row, assignedTeamId: saved.assignedTeamId, assignedTeam: saved.assignedTeam } : row;
  const mergeList = (value: any): any => {
    if (!value) return value;
    if (Array.isArray(value)) return value.map(merge);
    return { ...value,
      ...(value.data ? { data: mergeList(value.data) } : {}),
      ...(Array.isArray(value.items) ? { items: value.items.map(merge) } : {}),
    };
  };
  client.setQueriesData({ queryKey: ['customers-list'] }, mergeList);
  client.setQueriesData({ predicate: query =>
    ['admin-customer-details-drawer', 'admin-customer-details-page', 'customer-team-dialog', 'customer-assigned-team'].includes(String(query.queryKey[0])) &&
    Number(query.queryKey[1]) === saved.id,
  }, merge);
}
