"use client";
import * as React from "react";
import { SheetFooter } from "@/components/common/Drawer";
import { Button } from "@/components/common/Button";
import { Loading } from "@/components/common/Loading";
import { cn } from "@/lib/utils";

export function DrawerFooter({
  onCancel,
  onSubmit,
  submitLabel = "Save Changes",
  cancelLabel = "Cancel",
  loading = false,
  disabled = false,
  submitType = "submit",
  children,
  className,
  ...props
}) {
  return (
    <SheetFooter
      className={cn(
        "shrink-0 flex-row items-center justify-end gap-2 sm:gap-2.5 border-t border-slate-200/80 bg-slate-50/80 px-4 py-3 sm:px-6 sm:py-4",
        className
      )}
      {...props}
    >
      {children ? (
        children
      ) : (
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={loading}
            className="h-9 px-4 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            {cancelLabel}
          </Button>
          <Button
            type={submitType}
            size="sm"
            onClick={onSubmit}
            disabled={loading || disabled}
            className="h-9 px-4 bg-brand hover:bg-primary-hover text-primary-foreground text-xs font-semibold shadow-xs transition-colors"
          >
            {loading ? <Loading label="Saving…" className="p-0 text-white" /> : submitLabel}
          </Button>
        </>
      )}
    </SheetFooter>
  );
}
