export function Skeleton({ className = '', ...props }) { return <div aria-hidden="true" className={('animate-pulse rounded-lg bg-muted motion-reduce:animate-none ' + className)} {...props} />; }
