'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from './utils';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Label text */
  label?: string;
  /** Description text */
  description?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="flex items-start gap-3">
        <div className="relative flex items-center">
          <input
            ref={ref}
            type="checkbox"
            id={inputId}
            className={cn(
              'peer h-4 w-4 shrink-0 appearance-none',
              'rounded border cursor-pointer',
              'bg-[var(--gantt-bg-primary)]',
              'border-[var(--gantt-border)]',
              'checked:bg-blue-600 checked:border-blue-600',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-1',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'transition-colors duration-150',
              className
            )}
            {...props}
          />
          <Check
            className={cn(
              'absolute left-0.5 top-0.5 h-3 w-3 text-white',
              'pointer-events-none opacity-0',
              'peer-checked:opacity-100',
              'transition-opacity duration-150'
            )}
            strokeWidth={3}
          />
        </div>
        {(label || description) && (
          <div className="flex flex-col gap-0.5">
            {label && (
              <label
                htmlFor={inputId}
                className={cn(
                  'text-sm font-medium leading-none cursor-pointer',
                  'text-[var(--gantt-text-secondary)]',
                  'peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-xs text-[var(--gantt-text-muted)]">
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };
