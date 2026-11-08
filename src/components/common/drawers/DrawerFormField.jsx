"use client";
import * as React from "react";
import { Label } from "@/components/common/Label";
import { cn } from "@/lib/utils";

export function DrawerFormField({
  label,
  required = false,
  error,
  hint,
  children,
  className,
  id,
}) {
  return (
    <div className={cn("space-y-1.5 text-xs", className)}>
      {label && (
        <Label htmlFor={id} className="text-xs font-medium text-slate-700 flex items-center gap-1">
          <span>{label}</span>
          {required && <span className="text-rose-600 font-bold">*</span>}
        </Label>
      )}
      {children}
      {hint && !error && (
        <p className="text-[11px] text-slate-400 leading-tight">{hint}</p>
      )}
      {error && (
        <p className="text-[11px] font-medium text-rose-600 leading-tight">{error}</p>
      )}
    </div>
  );
}
