"use client";
import { Form as FormPrimitive } from '@base-ui/react/form';
import { cn } from '@/lib/utils';
export function Form({ className, ...props }) {
  return <FormPrimitive data-slot="form" className={cn('space-y-4', className)} {...props} />;
}
export { Field, FieldLabel, FieldDescription, FieldError, FieldGroup, FieldSet } from './field';
