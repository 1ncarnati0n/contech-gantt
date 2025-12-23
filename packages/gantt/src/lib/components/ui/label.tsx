'use client';

import * as React from 'react';
import { cn } from './utils';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** Required indicator */
  required?: boolean;
  /** Error state */
  error?: boolean;
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, error, children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'text-sm font-medium leading-none',
        'text-[var(--gantt-text-secondary)]',
        'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        error && 'text-red-500',
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="ml-1 text-red-500" aria-hidden="true">
          *
        </span>
      )}
    </label>
  )
);

Label.displayName = 'Label';

export { Label };
