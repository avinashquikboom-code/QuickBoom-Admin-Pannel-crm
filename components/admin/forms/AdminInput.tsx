'use client';

import React from 'react';

export interface AdminInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: any;
}

export const AdminInput = React.forwardRef<HTMLInputElement, AdminInputProps>(
  ({ className = '', icon: Icon, ...props }, ref) => {
    return (
      <div className="relative">
        {Icon && (
          <Icon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        )}
        <input
          ref={ref}
          className={`w-full py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#23C45E] focus:bg-white font-medium transition-all ${
            Icon ? 'pl-10 pr-4' : 'px-4'
          } ${className}`}
          {...props}
        />
      </div>
    );
  }
);
AdminInput.displayName = 'AdminInput';
