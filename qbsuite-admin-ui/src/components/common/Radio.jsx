"use client";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useId } from 'react';
export function Radio({ label, value = 'selected', checked, onChange, id, name, ...props }) {
  const generated = useId();
  return <RadioGroup name={name} value={checked ? value : ''} onValueChange={() => onChange?.({ target: { value, checked: true, name } })}>
    <Label htmlFor={id || generated} className="inline-flex items-center gap-2"><RadioGroupItem {...props} id={id || generated} value={value} />{label}</Label>
  </RadioGroup>;
}
