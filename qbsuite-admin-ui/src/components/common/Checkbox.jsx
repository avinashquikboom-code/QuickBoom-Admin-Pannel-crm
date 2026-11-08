"use client";
import { useId } from 'react';
import { Checkbox as Primitive } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
export function Checkbox({ label, onChange, onCheckedChange, id, ...props }) {
  const generated = useId();
  const inputId = id || generated;
  return <Label htmlFor={inputId} className="inline-flex items-center gap-2"><Primitive {...props} id={inputId}
    onCheckedChange={(checked, details) => { onCheckedChange?.(checked, details); onChange?.({ target: { checked, name: props.name, value: props.value } }); }} />{label}</Label>;
}
