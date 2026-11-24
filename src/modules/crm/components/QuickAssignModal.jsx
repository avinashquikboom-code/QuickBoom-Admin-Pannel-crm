'use client';

import * as React from 'react';
import {
  Users,
  UserCheck,
  Sparkles,
  X,
  AlertCircle,
  Check,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Label } from '@/components/common/Label';
import { SalesEmployeeSelect, filterSalesEmployees } from './SalesEmployeeSelect';
import { bulkAssignLeads, saveLead, crmError } from '@/modules/crm/crm-api';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function QuickAssignModal({
  open,
  onOpenChange,
  leads = [], // [{ id, title, firstName, lastName, ... }]
  employees = [],
  departments = [],
  onAssigned,
}) {
  const [mode, setMode] = React.useState('SINGLE'); // 'SINGLE' | 'DISTRIBUTE'
  const [selectedRepId, setSelectedRepId] = React.useState(null);
  const [selectedRepsForDistribution, setSelectedRepsForDistribution] = React.useState(new Set());
  const [saving, setSaving] = React.useState(false);

  const salesEmployees = React.useMemo(() => {
    return filterSalesEmployees(employees, departments);
  }, [employees, departments]);

  React.useEffect(() => {
    if (open) {
      setMode('SINGLE');
      setSelectedRepId(null);
      if (salesEmployees.length > 0) {
        setSelectedRepsForDistribution(new Set(salesEmployees.map((e) => e.recordId || e.id)));
      }
    }
  }, [open, salesEmployees]);

  if (!open) return null;

  const isMultiple = leads.length > 1;
  const leadTitle = isMultiple
    ? `${leads.length} Selected Leads`
    : leads[0]?.title || `${leads[0]?.firstName || ''} ${leads[0]?.lastName || ''}`.trim() || `Lead #${leads[0]?.id}`;

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();

    if (mode === 'SINGLE') {
      setSaving(true);
      try {
        if (isMultiple) {
          await bulkAssignLeads({
            ids: leads.map((l) => l.id),
            employeeId: selectedRepId || undefined,
            assignedToId: selectedRepId || undefined,
          });
          toast.success(`Assigned ${leads.length} leads successfully`);
        } else if (leads[0]?.id) {
          await saveLead(
            {
              assignedToId: selectedRepId || null,
            },
            leads[0].id
          );
          toast.success(`Lead assigned successfully`);
        }
        onAssigned?.();
        onOpenChange(false);
      } catch (err) {
        toast.error(crmError(err));
      } finally {
        setSaving(false);
      }
    } else {
      // Round-robin distribution
      const activeRepIds = Array.from(selectedRepsForDistribution);
      if (activeRepIds.length === 0) {
        toast.error('Select at least one Sales representative.');
        return;
      }
      setSaving(true);
      try {
        let successCount = 0;
        for (let i = 0; i < leads.length; i++) {
          const targetRepId = activeRepIds[i % activeRepIds.length];
          await saveLead({ assignedToId: targetRepId }, leads[i].id);
          successCount += 1;
        }
        toast.success(`Distributed ${successCount} leads among ${activeRepIds.length} representatives`);
        onAssigned?.();
        onOpenChange(false);
      } catch (err) {
        toast.error(crmError(err));
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-[#16A34A] ring-1 ring-emerald-200/60">
              <UserCheck className="size-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isMultiple ? 'Assign Selected Leads' : 'Assign Sales Representative'}
              </h3>
              <p className="text-[11px] text-slate-500 truncate max-w-[240px]">
                {leadTitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex size-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Multiple Mode Switcher (if > 1 lead) */}
        {isMultiple && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setMode('SINGLE')}
              className={cn(
                'flex items-center justify-center gap-1.5 p-2 rounded-xl border font-bold transition-all',
                mode === 'SINGLE'
                  ? 'border-[#16A34A] bg-emerald-50/70 text-[#16A34A]'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              )}
            >
              <UserCheck className="size-3.5" />
              <span>Assign All to One</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('DISTRIBUTE')}
              className={cn(
                'flex items-center justify-center gap-1.5 p-2 rounded-xl border font-bold transition-all',
                mode === 'DISTRIBUTE'
                  ? 'border-[#16A34A] bg-emerald-50/70 text-[#16A34A]'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              )}
            >
              <Sparkles className="size-3.5" />
              <span>Distribute Equally</span>
            </button>
          </div>
        )}

        {/* Single Assignee Form */}
        {mode === 'SINGLE' ? (
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-800">
              Select Sales Department Employee:
            </Label>
            <SalesEmployeeSelect
              value={selectedRepId}
              onChange={(id) => setSelectedRepId(id)}
              employees={employees}
              departments={departments}
              placeholder="Search or pick Sales Representative..."
              allowClear={true}
            />
            <p className="text-[11px] text-slate-400">
              Only active Sales representatives are eligible to receive leads. Select &ldquo;Unassigned&rdquo; to remove assignment.
            </p>
          </div>
        ) : (
          /* Distribute Equally Form */
          <div className="space-y-2 text-xs">
            <Label className="text-xs font-bold text-slate-800">
              Distribute {leads.length} Leads Across Selected Representatives:
            </Label>
            <div className="max-h-48 overflow-y-auto space-y-1 rounded-xl border border-slate-200 p-2">
              {salesEmployees.map((emp) => {
                const empId = emp.recordId || emp.id;
                const isChecked = selectedRepsForDistribution.has(empId);
                return (
                  <label
                    key={empId}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const next = new Set(selectedRepsForDistribution);
                        if (e.target.checked) next.add(empId);
                        else next.delete(empId);
                        setSelectedRepsForDistribution(next);
                      }}
                      className="size-3.5 rounded text-[#16A34A] focus:ring-[#16A34A]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 truncate">{emp.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{emp.employeeCode || emp.id}</p>
                    </div>
                  </label>
                );
              })}
            </div>
            {selectedRepsForDistribution.size > 0 && (
              <p className="text-[11px] text-slate-500 font-medium">
                Each representative will receive approximately{' '}
                <span className="font-bold text-[#16A34A]">
                  {Math.ceil(leads.length / selectedRepsForDistribution.size)}
                </span>{' '}
                leads.
              </p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="rounded-xl text-xs h-9 px-4"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={saving}
            className="rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold h-9 px-5 shadow-xs"
          >
            {saving ? 'Assigning...' : 'Confirm Assignment'}
          </Button>
        </div>
      </div>
    </div>
  );
}
