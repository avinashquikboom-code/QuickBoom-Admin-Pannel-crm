'use client';

import * as React from 'react';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { icons } from '@/theme/icons';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

function GoogleMapsMark({ className }) {
  return (
    <div
      className={cn(
        'flex size-11 shrink-0 items-center justify-center rounded-2xl border border-[#E2E8E5] bg-white shadow-sm',
        className,
      )}
      aria-hidden
    >
      <svg width="28" height="28" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M24 4C16.27 4 10 10.27 10 18c0 10.5 14 26 14 26s14-15.5 14-26C38 10.27 31.73 4 24 4z"
          fill="#EA4335"
        />
        <circle cx="24" cy="18" r="7" fill="#B31412" />
        <circle cx="24" cy="18" r="4" fill="#F8F9FA" />
        <path d="M8 42h32" stroke="#34A853" strokeWidth="3" strokeLinecap="round" />
        <path d="M14 38l4-8" stroke="#FBBC04" strokeWidth="3" strokeLinecap="round" />
        <path d="M34 38l-4-8" stroke="#4285F4" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function GoogleMapsIntegrationModal({
  open,
  onOpenChange,
  apiKey,
  onApiKeyChange,
  onSave,
  saving = false,
  hasSavedKey = false,
}) {
  const [showKey, setShowKey] = React.useState(false);

  React.useEffect(() => {
    if (open) setShowKey(false);
  }, [open]);

  const handleOpenChange = (next) => {
    if (saving) return;
    onOpenChange(next);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave?.();
  };

  const trimmed = String(apiKey || '').trim();
  const canSubmit = Boolean(trimmed || hasSavedKey);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          'flex max-h-[min(92dvh,640px)] w-[calc(100%-2rem)] max-w-[600px] flex-col gap-0 overflow-hidden',
          'rounded-2xl border border-[#E2E8E5] bg-white p-0 text-[#172B24] shadow-xl',
          'sm:w-[min(600px,calc(100%-2rem))] md:w-[90vw] md:max-w-[600px]',
        )}
      >
        <div className="relative shrink-0 border-b border-[#E8EFEB] px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-start gap-3 pr-10 sm:gap-4">
            <GoogleMapsMark />
            <div className="min-w-0 flex-1 space-y-1">
              <DialogTitle className="text-base font-semibold text-[#172B24] sm:text-lg">Google Maps</DialogTitle>
              <DialogDescription className="text-xs leading-relaxed text-[#718078] sm:text-sm">
                Add your Google Maps API key to enable map features.
              </DialogDescription>
            </div>
          </div>
          <DialogClose
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={saving}
                className="absolute top-3 right-3 text-[#718078] hover:bg-[#F4F7F5] hover:text-[#172B24]"
                aria-label="Close"
              />
            }
          >
            <FontAwesomeIcon icon={faXmark} className="size-4" />
          </DialogClose>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
            <div className="space-y-2">
              <Label htmlFor="google-maps-api-key" className="text-xs font-medium text-[#172B24] sm:text-sm">
                API Key <span className="text-[#DC2626]">*</span>
              </Label>
              <div className="relative w-full">
                <Input
                  id="google-maps-api-key"
                  type={showKey ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={apiKey}
                  onChange={(event) => onApiKeyChange(event.target.value)}
                  placeholder="Enter Google Maps API key"
                  disabled={saving}
                  className="h-10 w-full pr-11 text-sm border-[#E2E8E5] focus-visible:ring-[#23C45E]/30 focus-visible:border-[#23C45E]"
                />
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setShowKey((value) => !value)}
                  className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#718078] transition-colors hover:bg-[#F4F7F5] hover:text-[#172B24] disabled:opacity-50"
                  aria-label={showKey ? 'Hide API key' : 'Show API key'}
                >
                  <FontAwesomeIcon icon={showKey ? icons.eyeSlash : icons.eye} className="size-4" />
                </button>
              </div>
              <p className="text-[11px] leading-relaxed text-[#718078] sm:text-xs">
                Use a valid API key from your Google Cloud Console.
                {hasSavedKey && !trimmed ? (
                  <span className="mt-1 block text-[#163A2E]">A key is already saved. Leave blank to keep it.</span>
                ) : null}
              </p>
            </div>
          </div>

          <div className="shrink-0 border-t border-[#E8EFEB] bg-white px-4 py-4 sm:px-6 sm:py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => handleOpenChange(false)}
                className="h-10 w-full border-[#E2E8E5] text-[#172B24] sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving || !canSubmit}
                className="h-10 w-full bg-[#23C45E] text-white hover:bg-[#1AA14D] sm:w-auto min-w-[9.5rem]"
              >
                {saving ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="size-3.5 animate-spin rounded-full border-2 border-white border-r-transparent" />
                    Saving…
                  </span>
                ) : (
                  'Save & Enable'
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
