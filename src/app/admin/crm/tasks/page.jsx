'use client';

import * as React from 'react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { toast } from '@/hooks/use-toast';
import { CrmScreen } from '@/modules/crm/CrmScreen';
import { bulkDeleteTasks, crmError, loadEmployees, loadTasks, personName, removeTask, saveTask, sessionCan, taskHistory } from '@/modules/crm/crm-api';
import { PermanentDeleteDialog } from '@/components/common/PermanentDeleteDialog';
import { AdminBulkSelectionToolbar, AdminBulkDeleteButton } from '@/components/admin/bulk-selection';

const blank = { title: '', description: '', priority: 'MEDIUM', status: 'PENDING', employeeId: '', dueDate: '', dueTime: '06:00 PM', category: '', notes: '' };

export default function TasksRoute() {
  const [allowed, setAllowed] = React.useState(false);
  const [employees, setEmployees] = React.useState([]);
  const [types, setTypes] = React.useState([]);
  const [pendingDelete, setPendingDelete] = React.useState(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [refreshToken, setRefreshToken] = React.useState(0);
  const [selectedTasks, setSelectedTasks] = React.useState([]);
  const clearSelectionRef = React.useRef(null);

  React.useEffect(() => { setAllowed(sessionCan('TASK') || sessionCan('CRM')); loadEmployees().then(setEmployees).catch(() => setEmployees([])); }, []);
  const load = React.useCallback(async (query) => {
    const result = await loadTasks({ page: query.page, limit: 20, search: query.search || undefined, status: query.status || undefined, priority: query.priority || undefined, employeeId: query.employeeId || undefined, isOverdue: query.isOverdue || undefined });
    setTypes(result.types);
    return result;
  }, []);

  const confirmDelete = async () => {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    try {
      await removeTask(pendingDelete.id);
      toast.success(`Task "${pendingDelete.title}" permanently deleted`);
      setPendingDelete(null);
      setRefreshToken((v) => v + 1);
    } catch (err) {
      toast.error(crmError(err));
    } finally {
      setDeleting(false);
    }
  };

  const confirmBulkDelete = async () => {
    if (!selectedTasks.length || deleting) return;
    setDeleting(true);
    try {
      const ids = selectedTasks.map((t) => t.id);
      const res = await bulkDeleteTasks(ids, true);
      const count = res?.data?.deletedCount ?? res?.deletedCount ?? ids.length;
      toast.success(`${count} tasks permanently deleted`);
      clearSelectionRef.current?.();
      setSelectedTasks([]);
      setBulkDeleteOpen(false);
      setRefreshToken((v) => v + 1);
    } catch (err) {
      toast.error(crmError(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <CrmScreen
        title="Tasks"
        description="Tasks from the task API. Activity types come from master data and are sent as the task category."
        actionLabel="Add task"
        canCreate={allowed}
        load={load}
        blank={blank}
        refreshToken={refreshToken}
        enableSelection={allowed}
        onSelectionChange={setSelectedTasks}
        toolbar={({ selected, clearSelection }) => {
          clearSelectionRef.current = clearSelection;
          if (!selected?.length || !allowed) return null;
          return (
            <AdminBulkSelectionToolbar
              count={selected.length}
              noun="tasks"
              onClear={clearSelection}
            >
              <AdminBulkDeleteButton
                count={selected.length}
                onClick={() => setBulkDeleteOpen(true)}
                loading={deleting}
              />
            </AdminBulkSelectionToolbar>
          );
        }}
        stats={(result) => [{ label: 'Total', value: result.metrics?.total }, { label: 'Pending', value: result.metrics?.pending }, { label: 'Completed', value: result.metrics?.completed }, { label: 'Overdue', value: result.metrics?.overdue }]}
        filters={[{ key: 'status', label: 'All statuses', options: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'SUBMITTED', 'UNDER_REVIEW', 'REJECTED', 'BLOCKED'].map((value) => ({ value, label: value })) }, { key: 'priority', label: 'All priorities', options: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((value) => ({ value, label: value })) }, { key: 'isOverdue', label: 'Any due date', options: [{ value: 'true', label: 'Overdue' }] }]}
        columns={[{ header: 'Task', accessorKey: 'title' }, { header: 'Priority', accessorKey: 'priority' }, { header: 'Due', cell: (row) => `${String(row.dueDate || '').slice(0, 10)} ${row.dueTime || ''}` }, { header: 'Employee', cell: (row) => personName(row.employee) }, { header: 'Category', cell: (row) => row.category || '—' }, { header: 'Status', cell: (row) => <StatusBadge status={String(row.status || '').toLowerCase()} /> }]}
        renderForm={(form, setForm) => <div className="grid gap-3"><Field label="Title"><Input required value={form.title || ''} onChange={(event) => setForm({ ...form, title: event.target.value })} /></Field><Field label="Description"><Input required value={form.description || ''} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field><Field label="Priority"><select className="h-9 rounded-md border px-2 text-sm" value={form.priority || 'MEDIUM'} onChange={(event) => setForm({ ...form, priority: event.target.value })}>{['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Due date"><Input required type="date" value={String(form.dueDate || '').slice(0, 10)} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} /></Field><Field label="Due time"><Input required value={form.dueTime || ''} onChange={(event) => setForm({ ...form, dueTime: event.target.value })} /></Field><Field label="Employee"><select className="h-9 rounded-md border px-2 text-sm" value={form.employeeId || ''} onChange={(event) => setForm({ ...form, employeeId: event.target.value })}><option value="">Unassigned</option>{employees.map((employee) => <option key={employee.recordId} value={employee.recordId}>{employee.name}</option>)}</select></Field><Field label="Activity type"><select className="h-9 rounded-md border px-2 text-sm" value={form.category || ''} onChange={(event) => setForm({ ...form, category: event.target.value })}><option value="">None</option>{types.map((type) => <option key={type.id || type.code} value={type.code || type.name}>{type.name}</option>)}</select></Field></div>}
        onSave={async (form, id) => { await saveTask(form, id); toast.success(id ? 'Task updated' : 'Task created'); }}
        rowActions={(reload) => allowed ? [{ label: 'Delete', onSelect: (row) => setPendingDelete(row) }] : []}
        detail={(row) => <TaskDetail row={row} />}
      />
      <PermanentDeleteDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => { if (!open) setPendingDelete(null); }}
        recordName={pendingDelete?.title}
        noun="task"
        warningNote="Task proofs, reviews, and history will be permanently deleted with this task."
        loading={deleting}
        onConfirm={confirmDelete}
      />
      <PermanentDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        count={selectedTasks.length}
        noun="task"
        warningNote="Selected tasks and their proofs, reviews, and history records will be permanently removed."
        loading={deleting}
        onConfirm={confirmBulkDelete}
      />
    </>
  );
}

function TaskDetail({ row }) {
  const [history, setHistory] = React.useState([]);
  React.useEffect(() => { taskHistory(row.id).then(setHistory).catch(() => setHistory([])); }, [row.id]);
  return <div className="space-y-2 text-sm"><p className="font-medium">{row.title}</p><p>{row.description}</p><p>Due {String(row.dueDate || '').slice(0, 10)} {row.dueTime} · {row.priority}</p><p className="font-medium">History</p>{history.length === 0 && <p className="text-slate-500">No task history returned.</p>}{history.map((item) => <p key={item.id}>{item.action || item.status || item.comment || JSON.stringify(item)}</p>)}</div>;
}
function Field({ label, children }) { return <Label className="grid gap-1 text-xs">{label}{children}</Label>; }
