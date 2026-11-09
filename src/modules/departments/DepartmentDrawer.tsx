'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldLabel } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandItem } from '@/components/ui/command';
import { Skeleton } from '@/components/ui/skeleton';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faBuilding, faChevronDown, faSpinner, faUsers } from '@fortawesome/free-solid-svg-icons';
import { toast } from '@/hooks/use-toast';
import { apiError, departmentFormSchema, getDepartment, listDepartmentHeads, saveDepartment, type Department, type DepartmentFormValues, type DepartmentHead } from './department-api';

function HeadSelector({ value, selectedName, onChange, disabled }: {
  value: number | null; selectedName?: string; onChange: (id: number | null) => void; disabled: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [heads, setHeads] = React.useState<DepartmentHead[]>([]);
  const [selected, setSelected] = React.useState<DepartmentHead | null>(null);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [retry, setRetry] = React.useState(0);
  React.useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    const timer = setTimeout(() => {
      listDepartmentHeads(search, page, controller.signal)
        .then((result) => { setHeads(result.data); setTotalPages(result.meta.totalPages); })
        .catch((err: unknown) => { if (!controller.signal.aborted) { setHeads([]); setError(apiError(err)); } })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [open, search, page, retry]);
  const label = value ? (selected?.id === value ? selected.name : selectedName || `Employee #${value}`) : 'Select department head';
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button id="department-head" type="button" variant="outline" className="h-11 w-full justify-between text-left font-normal" disabled={disabled} />}>
        <span className="truncate">{label}</span><FontAwesomeIcon size={undefined} label={undefined} icon={faChevronDown} className="size-3 text-slate-400" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(370px,calc(100vw-3rem))] p-1">
        <Command shouldFilter={false} className="h-auto">
          <CommandInput aria-label="Search employees" placeholder="Search employees…" value={search} onValueChange={(text: string) => { setSearch(text); setPage(1); setHeads([]); }} className="text-sm" />
          <CommandList className="max-h-64">
            <CommandItem value="unassigned" onSelect={() => { onChange(null); setSelected(null); setOpen(false); }} className="text-sm">Unassigned</CommandItem>
            {loading ? <p role="status" className="p-3 text-xs text-slate-500">Loading employees…</p> : error ? (
              <div role="alert" className="p-3 text-xs text-rose-600">{error}<Button type="button" variant="ghost" className="mt-2" onClick={() => setRetry((v) => v + 1)}>Retry</Button></div>
            ) : heads.length === 0 ? <p className="p-3 text-xs text-slate-500">No employees found.</p> : heads.map((head) => (
              <CommandItem key={head.id} value={String(head.id)} onSelect={() => { onChange(head.id); setSelected(head); setOpen(false); }} className="items-start py-2">
                <div className="min-w-0"><p className="truncate font-medium">{head.name}</p><p className="truncate text-xs text-slate-500">{[head.employeeCode, head.email].filter(Boolean).join(' · ')}</p></div>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
        <div className="flex items-center justify-between border-t p-2 text-xs text-slate-500">
          <Button type="button" variant="ghost" className="text-xs" disabled={loading || page <= 1} onClick={() => setPage((v) => v - 1)}>Previous</Button>
          <span>Page {page} of {Math.max(1, totalPages)}</span>
          <Button type="button" variant="ghost" className="text-xs" disabled={loading || !!error || page >= totalPages} onClick={() => setPage((v) => v + 1)}>Next</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function DepartmentDrawer({ id, mode, onClose, onSaved }: {
  id: number | null; mode: 'create' | 'edit' | 'view'; onClose: () => void; onSaved: () => void;
}) {
  const readOnly = mode === 'view';
  const [record, setRecord] = React.useState<Department | null>(null);
  const [loading, setLoading] = React.useState(id !== null);
  const [saving, setSaving] = React.useState(false);
  const savingRef = React.useRef(false);
  const [error, setError] = React.useState('');
  const [retry, setRetry] = React.useState(0);
  const form = useForm<DepartmentFormValues>({ defaultValues: { name: '', code: '', description: '', headId: null, isActive: true } });
  const { reset } = form;
  React.useEffect(() => {
    if (id === null) return;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    getDepartment(id, controller.signal).then((d) => {
      setRecord(d);
      reset({ name: d.name, code: d.code, description: d.description || '', headId: d.headId, isActive: d.isActive });
    }).catch((err: unknown) => { if (!controller.signal.aborted) setError(apiError(err)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, reset, retry]);

  const submit = form.handleSubmit(async (values) => {
    if (savingRef.current || readOnly || loading || (id !== null && !record)) return;
    const parsed = departmentFormSchema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) form.setError(issue.path[0] as keyof DepartmentFormValues, { message: issue.message });
      return;
    }
    savingRef.current = true;
    setSaving(true);
    setError('');
    try {
      await saveDepartment(parsed.data, id ?? undefined);
      toast.success(id === null ? 'Department created' : 'Department updated');
      onSaved();
    } catch (err) {
      const message = apiError(err);
      setError(message);
      if (/name.*already exists/i.test(message)) form.setError('name', { message });
      if (/code.*already exists/i.test(message)) form.setError('code', { message });
    }
    finally { savingRef.current = false; setSaving(false); }
  });
  const blocked = saving || loading || (id !== null && !record);
  const fieldClass = 'h-11 rounded-lg border-slate-200 bg-white text-sm';
  return (
    <Sheet open onOpenChange={(open: boolean) => { if (!open && !savingRef.current) onClose(); }}>
      <SheetContent side="right" showCloseButton={!saving} className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[420px]">
        <SheetHeader className="border-b border-slate-100 bg-gradient-to-br from-[#E8F8EE] to-white px-6 py-7 pr-10">
          <div className="mb-4 flex size-11 items-center justify-center rounded-xl border border-green-200 bg-white text-[#169F4D]"><FontAwesomeIcon size={undefined} label={undefined} icon={faBuilding} className="size-5" /></div>
          <SheetTitle className="text-xl font-semibold text-[#172033]">{mode === 'create' ? 'Create New Department' : readOnly ? 'Department Details' : 'Edit Department'}</SheetTitle>
          <SheetDescription className="mt-2 text-sm leading-relaxed text-slate-500">{mode === 'create' ? 'Fill out the required information to register a new department.' : readOnly ? 'Department information and organizational structure.' : 'Update the department information and organizational structure.'}</SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-6">
            {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}{!record && id !== null && <Button type="button" variant="outline" className="mt-2" onClick={() => setRetry((v) => v + 1)}>Retry</Button>}</div>}
            {loading ? <div role="status" aria-label="Loading department" className="space-y-6">{[1, 2, 3, 4].map((n) => <Skeleton key={n} className="h-16 w-full" />)}</div> : (
              <fieldset disabled={blocked || readOnly} className="space-y-5">
                <Field className="gap-2">
                  <FieldLabel htmlFor="department-name" className="text-xs font-semibold">Department Name <span className="text-rose-500">*</span></FieldLabel>
                  <Input type="text" id="department-name" placeholder="e.g. Engineering & Technology" className={fieldClass} aria-invalid={!!form.formState.errors.name} aria-describedby="department-name-error" {...form.register('name')} />
                  {form.formState.errors.name && <p id="department-name-error" role="alert" className="text-xs text-rose-600">{form.formState.errors.name.message}</p>}
                </Field>
                <Field className="gap-2"><FieldLabel htmlFor="department-code" className="text-xs font-semibold">Department Code / Reference</FieldLabel><Input aria-invalid={!!form.formState.errors.code} aria-describedby="department-code-error" type="text" id="department-code" placeholder="e.g. ENG" className={fieldClass} {...form.register('code')} /><p id="department-code-error" role={form.formState.errors.code ? "alert" : undefined} className="text-xs text-rose-600">{form.formState.errors.code?.message}</p><p className="text-xs text-slate-400">Leave blank to use the automatically generated code.</p></Field>
                <Field className="gap-2"><FieldLabel htmlFor="department-head" className="text-xs font-semibold">Head of Department</FieldLabel><HeadSelector value={form.watch('headId')} selectedName={record?.head} onChange={(value) => form.setValue('headId', value, { shouldDirty: true })} disabled={blocked || readOnly} /></Field>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4"><FontAwesomeIcon size={undefined} label={undefined} icon={faUsers} className="size-5 text-slate-400" /><div><p className="text-xs font-semibold text-slate-600">Employees</p><p className="mt-1 text-sm text-slate-500">{record ? `${record.employeesCount} assigned employees` : 'No employees assigned yet'}</p></div></div>
                <Field className="gap-2"><FieldLabel htmlFor="department-status" className="text-xs font-semibold">Status</FieldLabel>
                  <Select value={form.watch('isActive') ? 'active' : 'inactive'} onValueChange={(value: string | null) => { if (value) form.setValue('isActive', value === 'active', { shouldDirty: true }); }} disabled={blocked || readOnly}>
                    <SelectTrigger id="department-status" className={`${fieldClass} w-full`}><SelectValue className="" /></SelectTrigger>
                    <SelectContent className="bg-white"><SelectItem value="active" className="text-sm">Active</SelectItem><SelectItem value="inactive" className="text-sm">Inactive</SelectItem></SelectContent>
                  </Select>
                </Field>
                <Field className="gap-2"><FieldLabel htmlFor="department-description" className="text-xs font-semibold">Description & Operational Scope</FieldLabel><Textarea id="department-description" rows={4} placeholder="Describe the department’s responsibilities…" className="resize-y rounded-lg text-sm" {...form.register('description')} /></Field>
              </fieldset>
            )}
          </div>
          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
            <Button type="button" variant="outline" className="h-10" disabled={saving} onClick={onClose}>{readOnly ? 'Close' : 'Cancel'}</Button>
            {!readOnly && <Button type="submit" disabled={blocked} className="h-10 bg-[#1FC45B] text-white hover:bg-[#169F4D]">{saving && <FontAwesomeIcon size={undefined} label={undefined} icon={faSpinner} className="size-4 animate-spin" />}{saving ? 'Saving…' : mode === 'create' ? 'Create Department' : 'Save Changes'}</Button>}
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
