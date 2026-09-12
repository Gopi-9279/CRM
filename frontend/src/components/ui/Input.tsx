import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`flex h-10 w-full rounded-md border bg-surface px-3 py-2 text-sm placeholder:text-text-secondary focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50
        ${error ? 'border-error focus:ring-error/50' : 'border-border focus:ring-primary/50'}
        ${className}`}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
