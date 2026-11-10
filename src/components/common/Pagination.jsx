'use client';

import * as React from 'react';
import { Button } from './Button';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/lib/utils';

export function Pagination({ page = 1, totalPages = 1, onPageChange, className = '' }) {
    const pages = React.useMemo(() => {
        const total = Math.max(1, totalPages);
        if (total <= 5) {
            return Array.from({ length: total }, (_, i) => i + 1);
        }
        if (page <= 3) {
            return [1, 2, 3, 4, '...', total];
        }
        if (page >= total - 2) {
            return [1, '...', total - 3, total - 2, total - 1, total];
        }
        return [1, '...', page - 1, page, page + 1, '...', total];
    }, [page, totalPages]);

    return (
        <nav aria-label="Pagination" className={cn('flex max-w-full flex-wrap items-center gap-1.5', className)}>
            <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs rounded-lg border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
                aria-label="Previous page"
            >
                <FontAwesomeIcon icon={faChevronLeft} className="size-3 mr-1 text-slate-400" />
                <span className="hidden sm:inline">Prev</span>
            </Button>

            <div className="flex min-w-0 flex-wrap items-center gap-1">
                {pages.map((p, idx) => {
                    if (p === '...') {
                        return (
                            <span key={`ellipsis-${idx}`} className="px-2 text-xs text-slate-400">
                                …
                            </span>
                        );
                    }
                    const isCurrent = p === page;
                    return (
                        <button
                            key={p}
                            type="button"
                            onClick={() => onPageChange(Number(p))}
                            className={cn(
                                'size-8 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center',
                                isCurrent
                                    ? 'bg-[#1FC45B] text-white shadow-2xs font-bold'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                            )}
                            aria-current={isCurrent ? 'page' : undefined}
                        >
                            {p}
                        </button>
                    );
                })}
            </div>

            <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs rounded-lg border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
                aria-label="Next page"
            >
                <span className="hidden sm:inline">Next</span>
                <FontAwesomeIcon icon={faChevronRight} className="size-3 ml-1 text-slate-400" />
            </Button>
        </nav>
    );
}
