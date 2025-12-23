'use client';

import * as React from 'react';
import { cn } from './utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Error state styling */
  error?: boolean;
  /** Start adornment (icon or text) */
  startAdornment?: React.ReactNode;
  /** End adornment (icon, text, or unit label) */
  endAdornment?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, startAdornment, endAdornment, ...props }, ref) => {
    const hasAdornment = startAdornment || endAdornment;

    if (hasAdornment) {
      return (
        <div className="relative flex items-center">
          {startAdornment && (
            <div className="absolute left-3 flex items-center text-[var(--gantt-text-muted)]">
              {startAdornment}
            </div>
          )}
          <input
            type={type}
            className={cn(
              // Base styles
              'flex h-10 w-full rounded-md border px-3 py-2 text-sm',
              'bg-[var(--gantt-bg-primary)]',
              'text-[var(--gantt-text-primary)]',
              'placeholder:text-[var(--gantt-text-muted)]',
              // Focus styles
              'focus:outline-none focus:ring-2 focus:ring-offset-1',
              // Transitions
              'transition-colors duration-150',
              // Disabled
              'disabled:cursor-not-allowed disabled:opacity-50',
              // Default border
              !error && [
                'border-[var(--gantt-border)]',
                'focus:border-[var(--gantt-focus)]',
                'focus:ring-[var(--gantt-focus)]/20',
              ],
              // Error state
              error && [
                'border-red-500',
                'focus:border-red-500',
                'focus:ring-red-500/20',
              ],
              // Adornment padding
              startAdornment && 'pl-10',
              endAdornment && 'pr-10',
              className
            )}
            ref={ref}
            aria-invalid={error}
            {...props}
          />
          {endAdornment && (
            <div className="absolute right-3 flex items-center text-[var(--gantt-text-muted)]">
              {endAdornment}
            </div>
          )}
        </div>
      );
    }

    return (
      <input
        type={type}
        className={cn(
          // Base styles
          'flex h-10 w-full rounded-md border px-3 py-2 text-sm',
          'bg-[var(--gantt-bg-primary)]',
          'text-[var(--gantt-text-primary)]',
          'placeholder:text-[var(--gantt-text-muted)]',
          // Focus styles
          'focus:outline-none focus:ring-2 focus:ring-offset-1',
          // Transitions
          'transition-colors duration-150',
          // Disabled
          'disabled:cursor-not-allowed disabled:opacity-50',
          // File input
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          // Default border
          !error && [
            'border-[var(--gantt-border)]',
            'focus:border-[var(--gantt-focus)]',
            'focus:ring-[var(--gantt-focus)]/20',
          ],
          // Error state
          error && [
            'border-red-500',
            'focus:border-red-500',
            'focus:ring-red-500/20',
          ],
          className
        )}
        ref={ref}
        aria-invalid={error}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input };
