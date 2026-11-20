"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

function Table({ className, ...props }) {
    return (
        <div data-slot="table-container" tabIndex={0} role="region" aria-label="Scrollable table" className="relative min-w-0 max-w-full w-full overflow-x-auto overscroll-x-contain">
            <table data-slot="table" className={cn("w-full caption-bottom text-xs text-left", className)} {...props}/>
        </div>
    );
}

function TableHeader({ className, ...props }) {
    return (
        <thead
            data-slot="table-header"
            className={cn(
                "border-b border-emerald-100/90 bg-[#F4FAF6] text-[#163A2E] [&_tr]:border-b [&_tr]:border-emerald-100/80",
                className
            )}
            {...props}
        />
    );
}

function TableBody({ className, ...props }) {
    return (
        <tbody
            data-slot="table-body"
            className={cn("[&_tr:last-child]:border-0 divide-y divide-slate-100/80 font-normal text-slate-700", className)}
            {...props}
        />
    );
}

function TableFooter({ className, ...props }) {
    return (
        <tfoot
            data-slot="table-footer"
            className={cn("border-t border-slate-200/80 bg-slate-50 font-medium [&>tr]:last:border-b-0", className)}
            {...props}
        />
    );
}

function TableRow({ className, ...props }) {
    return (
        <tr
            data-slot="table-row"
            className={cn(
                "border-b border-slate-100/90 transition-colors hover:bg-[#F9FCFA] has-aria-expanded:bg-[#F4FAF6] data-[state=selected]:bg-[#EAF8EC]/70",
                className
            )}
            {...props}
        />
    );
}

function TableHead({ className, ...props }) {
    return (
        <th
            data-slot="table-head"
            className={cn(
                "h-11 px-4 text-left align-middle font-semibold text-xs text-[#163A2E] tracking-wider whitespace-nowrap [&:has([role=checkbox])]:pr-0",
                className
            )}
            {...props}
        />
    );
}

function TableCell({ className, ...props }) {
    return (
        <td
            data-slot="table-cell"
            className={cn("p-4 align-middle whitespace-nowrap text-xs text-slate-700 [&:has([role=checkbox])]:pr-0", className)}
            {...props}
        />
    );
}

function TableCaption({ className, ...props }) {
    return (<caption data-slot="table-caption" className={cn("mt-4 text-xs text-muted-foreground", className)} {...props}/>);
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption, };
