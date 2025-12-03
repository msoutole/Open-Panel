import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    const textareaId = props.id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-textPrimary mb-1"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`w-full px-4 py-2.5 border rounded-lg text-textPrimary placeholder-textSecondary bg-inputBg
            focus:outline-none transition-colors duration-200 resize-y
            ${error
              ? 'border-error focus:border-error focus:ring-4 focus:ring-error/10'
              : 'border-border focus:border-primary focus:ring-4 focus:ring-primary/10'
            }
            disabled:bg-inputDisabled disabled:text-textSecondary disabled:cursor-not-allowed disabled:border-border
            ${className}`}
          rows={4}
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

Textarea.displayName = 'Textarea';
