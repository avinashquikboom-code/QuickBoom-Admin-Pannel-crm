import { config } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon as ReactFontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleQuestion } from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/lib/utils';

// Next.js imports the supporting stylesheet once in the root layout.
config.autoAddCss = false;

const sizes = { 12: 'size-3', 14: 'size-3.5', 16: 'size-4', 18: 'size-4.5', 20: 'size-5', 22: 'size-5.5', 24: 'size-6', 32: 'size-8' };

/** Accepts a Font Awesome icon definition, Tailwind classes and SVG props.
 * Decorative by default; use label for a meaningful standalone icon.
 */
export function FontAwesomeIcon({ icon = faCircleQuestion, size, label, className, ...props }) {
  const hasDimensions = typeof className === 'string' && /(?:^|\s)(?:size-|h-|w-)/.test(className);
  return <ReactFontAwesomeIcon
    {...props}
    icon={icon}
    size={typeof size === 'string' ? size : undefined}
    className={cn('inline-block shrink-0', !hasDimensions && sizes[typeof size === 'number' ? size : 20], className)}
    aria-hidden={label ? undefined : true}
    aria-label={label}
    role={label ? 'img' : undefined}
  />;
}
