/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useLanguageStore } from '../../store/languageStore';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    const { isRTL } = useLanguageStore();

    const variants = {
      primary: 'bg-ink-900 text-white hover:bg-brand-600 transition-colors',
      secondary: 'bg-ink-100 text-ink-900 hover:bg-ink-300 transition-colors',
      outline: 'border border-ink-900 text-ink-900 bg-transparent hover:bg-ink-900 hover:text-white transition-all',
      ghost: 'bg-transparent hover:bg-ink-100 text-ink-500 hover:text-ink-900 transition-colors',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest',
      md: 'px-5 py-2 text-sm font-medium',
      lg: 'px-8 py-3 text-base font-medium',
    };

    return (
      <button
        ref={ref}
        disabled={isLoading || props.disabled}
        className={cn(
          'inline-flex items-center justify-center rounded-2xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          isRTL ? 'font-sans' : 'font-sans',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
