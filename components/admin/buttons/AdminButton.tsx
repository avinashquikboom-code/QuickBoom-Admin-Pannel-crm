'use client';

import React from 'react';
import { LucideIcon, Loader2 } from 'lucide-react';

export interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  children?: React.ReactNode;
  className?: string;
}

export function AdminButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  children,
  className = '',
  disabled,
  ...props
}: AdminButtonProps) {
  const variantStyles = {
    primary:
      'bg-[#23C45E] hover:bg-[#1AA14D] text-white shadow-md shadow-[#23C45E]/20 border-transparent',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-transparent',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 border-transparent',
    outline: 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 border-transparent',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5 font-bold',
    md: 'px-4 py-2 text-xs sm:text-sm rounded-xl gap-2 font-black',
    lg: 'px-5 py-2.5 text-sm rounded-xl gap-2.5 font-black',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border select-none active:scale-[0.99] ${
        variantStyles[variant]
      } ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className={`animate-spin ${iconSizes[size]}`} />
      ) : (
        Icon && iconPosition === 'left' && <Icon className={iconSizes[size]} />
      )}

      {children}

      {!loading && Icon && iconPosition === 'right' && <Icon className={iconSizes[size]} />}
    </button>
  );
}

export const PrimaryButton = (props: AdminButtonProps) => (
  <AdminButton variant="primary" {...props} />
);

export const SecondaryButton = (props: AdminButtonProps) => (
  <AdminButton variant="outline" {...props} />
);
