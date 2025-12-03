import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-textPrimary mb-1"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full px-4 py-2.5 border rounded-lg text-textPrimary placeholder-textSecondary bg-inputBg
            focus:outline-none transition-colors duration-200
            ${error
              ? 'border-error focus:border-error focus:ring-4 focus:ring-error/10'
              : 'border-border focus:border-primary focus:ring-4 focus:ring-primary/10'
            }
            disabled:bg-inputDisabled disabled:text-textSecondary disabled:cursor-not-allowed disabled:border-border
            ${className}`}
          {...props}
        />
        {error && (
          <div className="flex items-center gap-1 mt-1">
            <AlertCircle size={14} strokeWidth={1.5} className="text-error" />
            <p className="text-xs text-error">{error}</p>
          </div>
        )}
        {helperText && !error && (
          <p className="text-xs text-textSecondary mt-1">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
