'use client';
import React from 'react';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { cn } from '@/lib/utils';

export function FormField({
  label,
  required,
  error,
  hint,
  children,
  className,
  disabled = false,
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center gap-1">
        <Label className="text-xs font-medium text-slate-700">
          {label}
        </Label>
        {required && (
          <span className="text-red-500 font-bold text-sm">*</span>
        )}
      </div>
      <div className="relative">
        {children}
      </div>
      {error && (
        <p className="text-xs text-red-600 font-medium mt-1">
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-xs text-slate-500 mt-1">
          {hint}
        </p>
      )}
    </div>
  );
}

export function InputField({
  label,
  required,
  error,
  hint,
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
  className,
  ...props
}) {
  return (
    <FormField label={label} required={required} error={error} hint={hint} className={className}>
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={cn(
          'h-9 text-xs',
          error && 'border-red-300 focus-visible:ring-red-500'
        )}
        {...props}
      />
    </FormField>
  );
}
