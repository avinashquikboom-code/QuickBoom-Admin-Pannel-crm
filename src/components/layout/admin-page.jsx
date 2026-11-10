import { cn } from '@/lib/utils';

export function AdminPageContainer({ children, className }) {
  return <div className={cn('flex w-full min-w-0 max-w-none flex-col gap-5', className)}>{children}</div>;
}

export function PageToolbar({ children, className }) {
  return <div className={cn('flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center', className)}>{children}</div>;
}

export function PageFilters({ children, className }) {
  return <div className={cn('grid w-full min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-3', className)}>{children}</div>;
}

export function ResponsiveCardGrid({ children, className }) {
  return (
    <div className={cn('grid w-full min-w-0 max-w-none gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr))]', className)}>
      {children}
    </div>
  );
}

export function PageSection({ title, description, actions, children, className }) {
  return (
    <section className={cn('min-w-0', className)}>
      {(title || description || actions) && (
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            {title && <h2 className="text-base font-semibold text-[#172B24]">{title}</h2>}
            {description && <p className="text-sm text-[#718078]">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function ResponsiveTable({ children, label = 'Records', className }) {
  return (
    <div aria-label={label} className={cn('w-full min-w-0 overflow-x-auto rounded-2xl border border-[#E2E8E5] bg-white shadow-sm', className)}>
      {children}
    </div>
  );
}

export function CategoryNav({ items, value, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={cn(
            'inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm',
            value === item.id ? 'border-[#163A2E] bg-[#163A2E] text-white' : 'border-[#E2E8E5] bg-white text-[#172B24]'
          )}
          onClick={() => onChange(item.id)}
        >
          {item.icon}
          {item.name}
        </button>
      ))}
    </div>
  );
}
