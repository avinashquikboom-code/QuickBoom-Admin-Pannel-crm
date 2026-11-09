'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldLabel } from '@/components/ui/field';
import { Skeleton } from '@/components/ui/skeleton';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { toast } from '@/hooks/use-toast';
import { apiError, departmentFormSchema, getDepartment, saveDepartment, type Department, type DepartmentFormValues } from './department-api';

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
  const fieldClass = 'h-11 rounded-xl border-slate-200 bg-white text-sm shadow-none';
  return (
    <Sheet open onOpenChange={(open: boolean) => { if (!open && !savingRef.current) onClose(); }}>
      <SheetContent side="right" showCloseButton={!saving} className="h-full gap-0 overflow-hidden bg-white p-0 data-[side=right]:!w-full data-[side=right]:!max-w-none data-[side=right]:sm:!w-[440px] data-[side=right]:sm:!max-w-[440px]">
        <SheetHeader className="border-b border-slate-100 bg-white px-5 py-5 pr-12 sm:px-6">
          <SheetTitle className="text-lg font-semibold text-[#172033]">{mode === 'create' ? 'Add Department' : readOnly ? 'Department Details' : 'Edit Department'}</SheetTitle>
          <SheetDescription className="mt-1 text-sm text-slate-500">{mode === 'create' ? 'Create a new department and assign organizational details.' : readOnly ? 'Department information returned by the directory.' : 'Update the department and its organizational details.'}</SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
            {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}{!record && id !== null && <Button type="button" variant="outline" className="mt-2" onClick={() => setRetry((v) => v + 1)}>Retry</Button>}</div>}
            {loading ? <div role="status" aria-label="Loading department" className="space-y-6">{[1, 2, 3, 4].map((n) => <Skeleton key={n} className="h-16 w-full rounded-xl" />)}</div> : (
              <fieldset disabled={blocked || readOnly} className="space-y-5">
                <Field className="gap-2">
                  <FieldLabel htmlFor="department-name" className="text-sm font-medium text-slate-700">Department Name <span className="text-rose-500">*</span></FieldLabel>
                  <Input type="text" id="department-name" placeholder="e.g. Human Resources" className={fieldClass} aria-invalid={!!form.formState.errors.name} aria-describedby="department-name-error" {...form.register('name')} />
                  {form.formState.errors.name && <p id="department-name-error" role="alert" className="text-xs text-rose-600">{form.formState.errors.name.message}</p>}
                </Field>
                <Field className="gap-2">
                  <FieldLabel htmlFor="department-code" className="text-sm font-medium text-slate-700">Department Code</FieldLabel>
                  <Input aria-invalid={!!form.formState.errors.code} aria-describedby="department-code-error" type="text" id="department-code" placeholder="e.g. HR" className={fieldClass} {...form.register('code')} />
                  <p id="department-code-error" role={form.formState.errors.code ? 'alert' : undefined} className="text-xs text-rose-600">{form.formState.errors.code?.message}</p>
                  {!form.formState.errors.code && <p className="text-xs text-slate-400">Leave blank and the department API generates a code.</p>}
                </Field>
                <Field className="gap-2">
                  <FieldLabel className="text-sm font-medium text-slate-700">Status</FieldLabel>
                  <div role="group" aria-label="Status" className="grid grid-cols-2 gap-2">
                    {([true, false] as const).map((active) => {
                      const selected = form.watch('isActive') === active;
                      return (
                        <button
                          key={String(active)}
                          type="button"
                          disabled={blocked || readOnly}
                          aria-pressed={selected}
                          onClick={() => form.setValue('isActive', active, { shouldDirty: true })}
                          className={`h-11 rounded-xl border text-sm font-semibold transition-colors ${selected ? 'border-[#16A34A] bg-[#16A34A] text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'} disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                          {active ? 'Active' : 'Inactive'}
                        </button>
                      );
                    })}
                  </div>
                </Field>
                {record && (
                  <p className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    Employees <span className="font-semibold text-slate-800">{record.employeesCount}</span>
                    <span className="mt-0.5 block text-xs text-slate-400">Counted from assigned employees. This is not entered on the form.</span>
                  </p>
                )}
                <Field className="gap-2">
                  <FieldLabel htmlFor="department-description" className="text-sm font-medium text-slate-700">Description</FieldLabel>
                  <Textarea id="department-description" rows={4} placeholder="Add a short description" className="min-h-28 resize-y rounded-xl border-slate-200 text-sm" {...form.register('description')} />
                </Field>
              </fieldset>
            )}
          </div>
          <div className="sticky bottom-0 flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 bg-white px-5 py-4 sm:px-6">
            <Button type="button" variant="outline" className="h-11 rounded-xl border-slate-200 px-5" disabled={saving} onClick={onClose}>{readOnly ? 'Close' : 'Cancel'}</Button>
            {!readOnly && <Button type="submit" disabled={blocked} className="h-11 rounded-xl bg-[#16A34A] px-5 text-white hover:bg-[#15803D]">{saving && <FontAwesomeIcon size={undefined} label={undefined} icon={faSpinner} className="size-4 animate-spin" />}{saving ? 'Saving…' : mode === 'create' ? 'Create Department' : 'Save Changes'}</Button>}
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
