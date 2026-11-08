"use client";
import * as React from "react";
import { SheetHeader, SheetTitle, SheetDescription } from "@/components/common/Drawer";
import { cn } from "@/lib/utils";

export function DrawerHeader({ title, description, className, children, ...props }) {
  return (
    <SheetHeader
      className={cn(
        "shrink-0 border-b border-slate-200/80 bg-white px-6 py-4.5 text-left",
        className
      )}
      {...props}
    >
      {title && (
        <SheetTitle className="text-base font-bold text-slate-900 leading-snug">
          {title}
        </SheetTitle>
      )}
      {description && (
        <SheetDescription className="text-xs text-slate-500 mt-0.5">
          {description}
        </SheetDescription>
      )}
      {children}
    </SheetHeader>
  );
}
