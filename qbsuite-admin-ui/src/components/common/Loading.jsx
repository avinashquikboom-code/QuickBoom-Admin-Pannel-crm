import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '../icons/FontAwesomeIcon';
export function Loading({ label = 'Loading…', className = '' }) { return <div role="status" className={('flex items-center justify-center gap-2 p-6 text-muted-foreground ' + className)}><FontAwesomeIcon icon={faSpinner} className="animate-spin text-primary" />{label}</div>; }
