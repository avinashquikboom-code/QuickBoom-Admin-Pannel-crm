'use client';
import { Input } from './Input';
import { FontAwesomeIcon } from '../icons/FontAwesomeIcon';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
export function SearchBar({ className = '', ...props }) { return <div className={('relative ' + className)}><FontAwesomeIcon icon={faMagnifyingGlass} className="absolute top-2 left-3 text-muted-foreground" /><Input type="search" aria-label="Search" placeholder="Search…" {...props} className="pl-10" /></div>; }
