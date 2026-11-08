'use client';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import * as React from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from '@/components/ui/alert-dialog';
import { Button } from '@/components/common/Button';
import { Textarea } from '@/components/common/Textarea';
import { Label } from '@/components/common/Label';
import { faCheckCircle, faCircleInfo, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'default', onConfirm, note, }) {
    const getIcon = () => {
        switch (variant) {
            case 'destructive':
                return (<div className="flex size-10 items-center justify-center rounded-full bg-rose-100 text-rose-600 shrink-0">
            <FontAwesomeIcon icon={faTriangleExclamation} className="size-5"/>
          </div>);
            case 'success':
                return (<div className="flex size-10 items-center justify-center rounded-full bg-brand-light text-brand shrink-0">
            <FontAwesomeIcon icon={faCheckCircle} className="size-5"/>
          </div>);
            default:
                return (<div className="flex size-10 items-center justify-center rounded-full bg-brand-light text-brand shrink-0">
            <FontAwesomeIcon icon={faCircleInfo} className="size-5"/>
          </div>);
        }
    };
    const getButtonClass = () => {
        switch (variant) {
            case 'destructive':
                return 'bg-rose-600 hover:bg-rose-700 text-white';
            case 'success':
                return 'bg-brand hover:bg-primary-hover text-primary-foreground';
            default:
                return 'bg-brand hover:bg-primary-hover text-primary-foreground';
        }
    };
    return (<AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md bg-white border border-slate-200 shadow-xl rounded-xl">
        <div className="flex items-start gap-4">
          {getIcon()}
          <div className="flex-1 space-y-1">
            <AlertDialogHeader className="p-0 text-left">
              <AlertDialogTitle className="text-base font-semibold text-slate-900">
                {title}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-slate-500 pt-1">
                {description}
              </AlertDialogDescription>
            </AlertDialogHeader>

            {note && (<div className="mt-4 space-y-1.5 pt-2">
                <Label className="text-xs font-medium text-slate-700">
                  {note.label} {note.required && <span className="text-rose-500">*</span>}
                </Label>
                <Textarea value={note.value} onChange={(e) => note.onChange(e.target.value)} placeholder={note.placeholder} rows={3} className="resize-none text-sm border-slate-200 focus-visible:ring-brand"/>
              </div>)}
          </div>
        </div>

        <AlertDialogFooter className="mt-4 flex flex-row items-center justify-end gap-2 border-t border-slate-100 pt-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-slate-200 text-slate-700 hover:bg-slate-100 text-xs sm:text-sm">
            {cancelLabel}
          </Button>
          <Button type="button" onClick={() => {
            onConfirm();
            onOpenChange(false);
        }} disabled={note?.required && !note.value.trim()} className={`${getButtonClass()} text-xs sm:text-sm font-medium`}>
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>);
}
