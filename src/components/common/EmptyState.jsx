import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import * as React from 'react';
import { Button } from '@/components/common/Button';
import { faInbox } from '@fortawesome/free-solid-svg-icons';
export function EmptyState({ icon, title, description, actionLabel, onAction, }) {
    return (<div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/60 p-12 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-brand-light text-brand">
        {icon || <FontAwesomeIcon icon={faInbox} className="size-7"/>}
      </div>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      {actionLabel && onAction && (<Button onClick={onAction} className="mt-5 bg-brand hover:bg-primary-hover text-primary-foreground font-medium">
          {actionLabel}
        </Button>)}
    </div>);
}
