'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface AdminSelectOption {
  value: string;
  label: string;
}

export interface AdminSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: AdminSelectOption[];
  icon?: any;
}

export const AdminSelect = React.forwardRef<HTMLSelectElement, AdminSelectProps>(
  ({ className = '', options = [], children, icon: Icon, ...props }, ref) => {
    return (
      <div className="relative">
        {Icon && (
          <Icon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        )}
        <select
          ref={ref}
          className={`w-full py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E] focus:bg-white font-medium appearance-none transition-all cursor-pointer ${
            Icon ? 'pl-10 pr-10' : 'pl-4 pr-10'
          } ${className}`}
          {...props}
        >
          {options.length > 0
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>
    );
  }
);
AdminSelect.displayName = 'AdminSelect';
