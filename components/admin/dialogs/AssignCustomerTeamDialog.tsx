'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Users, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';

type Team = { id: number; name: string; isActive: boolean };
interface Props {
  customer: { id: number; companyName: string };
  canAssign: boolean;
  onClose: () => void;
}

export function AssignCustomerTeamDialog({ customer, canAssign, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const queryClient = useQueryClient();
  const [teamId, setTeamId] = useState('');
  const [edited, setEdited] = useState(false);
  useEffect(() => { dialog.current?.showModal(); }, []);

  const detail = useQuery({
    queryKey: ['customer-team-dialog', customer.id],
    queryFn: async () => {
      const response: any = await api.get(`/customers/${customer.id}`);
      return response?.data ?? response;
    },
  });
  const teams = useQuery({
    queryKey: ['customer-team-dialog-options'],
    queryFn: async () => {
      const result: Team[] = [];
      let page = 1;
      let totalPages = 1;
      do {
        const response: any = await api.get('/teams', { params: { page, limit: 100, status: 'ACTIVE' } });
        const body = response?.data?.items ? response.data : response;
        const items = body?.items ?? body?.data ?? body;
        if (!Array.isArray(items)) throw new Error('Could not read the teams response.');
        result.push(...items.filter((team: Team) => team.isActive === true));
        totalPages = Number(body?.pagination?.totalPages ?? body?.meta?.totalPages ?? 1);
        page += 1;
      } while (page <= totalPages);
      return result;
    },
  });
  useEffect(() => {
    if (detail.data && !edited) setTeamId(detail.data.assignedTeamId ? String(detail.data.assignedTeamId) : '');
  }, [detail.data, edited]);

  const save = useMutation({
    mutationFn: async () => {
      if (!canAssign || !teams.data?.some(team => String(team.id) === teamId)) throw new Error('Select an active team.');
      const response: any = await api.patch(`/customers/${customer.id}/assign-team`, { teamId: Number(teamId) });
      const result = response?.data ?? response;
      if (result?.id !== customer.id || result?.assignedTeamId !== Number(teamId)) throw new Error('Assignment response could not be verified. Refresh the customer before retrying.');
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['customers-list'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-customer-details-drawer'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-customer-details-page'] }),
        queryClient.invalidateQueries({ queryKey: ['customer-team-dialog', customer.id] }),
      ]);
      toast.success(`Team assigned to ${customer.companyName}.`);
      onClose();
    },
  });
  const close = () => { if (!save.isPending) onClose(); };
  const loading = detail.isPending || teams.isPending;
  const error = detail.error || teams.error;
  const activeSelection = teams.data?.some(team => String(team.id) === teamId);
  const currentTeamMissing = detail.data?.assignedTeamId && !teams.data?.some(team => team.id === detail.data.assignedTeamId);

  return <dialog ref={dialog} aria-labelledby="assign-customer-team-title"
    onCancel={event => { event.preventDefault(); close(); }}
    className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-900/50">
    <form onSubmit={event => { event.preventDefault(); if (!loading && !error && activeSelection && !save.isPending) save.mutate(); }}>
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
        <div><h2 id="assign-customer-team-title" className="flex items-center gap-2 text-base font-bold"><Users className="h-5 w-5 text-emerald-600" />Assign Team</h2>
          <p className="mt-1 break-words text-sm text-slate-500">{customer.companyName}</p></div>
        <button type="button" aria-label="Close Assign Team" onClick={close} disabled={save.isPending} className="rounded-lg p-1.5 hover:bg-slate-100"><X className="h-4 w-4" /></button>
      </div>
      <div className="space-y-3 p-5">
        {loading ? <p role="status" className="text-sm text-slate-500">Loading customer and teams…</p> : error ? <div role="alert" className="text-sm text-rose-600">
          <p>{getErrorMessage(error)}</p><button type="button" onClick={() => { detail.refetch(); teams.refetch(); }} className="mt-2 font-bold underline">Retry</button>
        </div> : <>
          <label htmlFor="customer-team-selection" className="block text-xs font-bold text-slate-600">Team</label>
          <select id="customer-team-selection" value={teamId} disabled={save.isPending || !teams.data?.length}
            onChange={event => { setTeamId(event.target.value); setEdited(true); save.reset(); }}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
            <option value="">Select an active team</option>
            {currentTeamMissing && <option value={String(detail.data.assignedTeamId)} disabled>{detail.data.assignedTeam?.name || 'Current team'} (unavailable)</option>}
            {teams.data?.map(team => <option key={team.id} value={String(team.id)}>{team.name}</option>)}
          </select>
          {!teams.data?.length && <p role="status" className="text-sm text-slate-500">No active teams available.</p>}
        </>}
        {save.error && <p role="alert" className="text-sm text-rose-600">{getErrorMessage(save.error)}</p>}
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-100 p-4">
        <button type="button" onClick={close} disabled={save.isPending} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold disabled:opacity-50">Cancel</button>
        <button type="submit" disabled={!canAssign || loading || Boolean(error) || !activeSelection || save.isPending || Number(teamId) === detail.data?.assignedTeamId}
          className="rounded-xl bg-[#23C45E] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{save.isPending ? 'Assigning…' : 'Assign Team'}</button>
      </div>
    </form>
  </dialog>;
}
