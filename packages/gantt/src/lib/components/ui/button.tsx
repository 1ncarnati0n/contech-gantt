'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './utils';

const buttonVariants = cva(
  // Base styles
  [
    'inline-flex items-center justify-center gap-2',
    'whitespace-nowrap rounded-md text-sm font-medium',
    'transition-colors duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-[var(--gantt-text-primary)] text-[var(--gantt-bg-primary)]',
          'hover:bg-[var(--gantt-text-secondary)]',
          'focus-visible:ring-[var(--gantt-focus)]',
        ],
        primary: [
          'bg-blue-600 text-white',
          'hover:bg-blue-700',
          'focus-visible:ring-blue-500',
          'shadow-sm',
        ],
        destructive: [
          'bg-red-600 text-white',
          'hover:bg-red-700',
          'focus-visible:ring-red-500',
          'shadow-sm',
        ],
        outline: [
          'border border-[var(--gantt-border)]',
          'bg-[var(--gantt-bg-primary)]',
          'text-[var(--gantt-text-secondary)]',
          'hover:bg-[var(--gantt-bg-hover)]',
          'hover:text-[var(--gantt-text-primary)]',
          'focus-visible:ring-[var(--gantt-focus)]',
        ],
        secondary: [
          'bg-[var(--gantt-bg-secondary)]',
          'text-[var(--gantt-text-secondary)]',
          'hover:bg-[var(--gantt-bg-hover)]',
          'focus-visible:ring-[var(--gantt-focus)]',
        ],
        ghost: [
          'text-[var(--gantt-text-secondary)]',
          'hover:bg-[var(--gantt-bg-hover)]',
          'hover:text-[var(--gantt-text-primary)]',
          'focus-visible:ring-[var(--gantt-focus)]',
        ],
        link: [
          'text-blue-600 underline-offset-4',
          'hover:underline',
          'focus-visible:ring-blue-500',
        ],
        success: [
          'bg-green-600 text-white',
          'hover:bg-green-700',
          'focus-visible:ring-green-500',
          'shadow-sm',
        ],
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 py-2',
        lg: 'h-11 px-6 text-base',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, loading = false, disabled, children, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="sr-only">Loading...</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
