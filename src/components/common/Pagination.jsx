'use client';
import { Button } from './Button';
export function Pagination({ page = 1, totalPages = 1, onPageChange, className = '' }) { return <nav aria-label="Pagination" className={('flex items-center gap-2 ' + className)}><Button variant="outline" disabled={page <= 1} onClick={() => onPageChange(page-1)}>Previous</Button><span aria-live="polite" className="text-sm">Page {page} of {Math.max(1,totalPages)}</span><Button variant="outline" disabled={page >= totalPages} onClick={() => onPageChange(page+1)}>Next</Button></nav>; }
