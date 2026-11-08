"use client";
import * as React from "react";
import { Sheet, SheetContent } from "@/components/common/Drawer";
import { DrawerHeader } from "./DrawerHeader";
import { DrawerFooter } from "./DrawerFooter";
import { cn } from "@/lib/utils";

const SIZE_CLASSES = {
  sm: "sm:max-w-[400px]",
  simple: "sm:max-w-[560px]",
  default: "sm:max-w-[560px]",
  standard: "sm:max-w-[560px]",
  md: "sm:max-w-[640px]",
  medium: "sm:max-w-[640px]",
  complex: "sm:max-w-[800px]",
  lg: "sm:max-w-[800px]",
  large: "sm:max-w-[840px]",
  xl: "sm:max-w-[900px]",
  full: "sm:max-w-full",
};

export function FormDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  submitLabel = "Save Changes",
  cancelLabel = "Cancel",
  loading = false,
  disabled = false,
  size = "standard",
  showFooter = true,
  footerExtra = null,
  className,
  contentClassName,
  bodyClassName,
}) {
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.standard;

  const handleClose = () => {
    if (loading) return;
    onOpenChange?.(false);
  };

  const handleFormSubmit = (e) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }
    onSubmit?.(e);
  };

  const formBody = (
    <div
      className={cn(
        "flex-1 overflow-y-auto px-6 py-5 text-xs text-slate-700 space-y-4",
        bodyClassName
      )}
    >
      {children}
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          "w-full h-full p-0 flex flex-col gap-0 bg-white border-l border-slate-200/90 shadow-2xl rounded-l-2xl sm:rounded-l-2xl overflow-hidden",
          sizeClass,
          contentClassName
        )}
      >
        {onSubmit ? (
          <form
            onSubmit={handleFormSubmit}
            className={cn("flex h-full w-full flex-col", className)}
          >
            <DrawerHeader title={title} description={description} />
            {formBody}
            {showFooter && (
              <DrawerFooter
                onCancel={handleClose}
                submitLabel={submitLabel}
                cancelLabel={cancelLabel}
                loading={loading}
                disabled={disabled}
              >
                {footerExtra}
              </DrawerFooter>
            )}
          </form>
        ) : (
          <div className={cn("flex h-full w-full flex-col", className)}>
            <DrawerHeader title={title} description={description} />
            {formBody}
            {showFooter && (
              <DrawerFooter
                onCancel={handleClose}
                onSubmit={onSubmit}
                submitLabel={submitLabel}
                cancelLabel={cancelLabel}
                loading={loading}
                disabled={disabled}
              >
                {footerExtra}
              </DrawerFooter>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export { DrawerHeader } from "./DrawerHeader";
export { DrawerFooter } from "./DrawerFooter";
export { DrawerFormField } from "./DrawerFormField";
