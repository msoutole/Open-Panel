import React, { forwardRef } from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, className = '', ...props }, ref) => {
    const selectId = props.id || `select-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-textPrimary mb-1"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={`w-full px-4 py-3 border rounded-lg text-textPrimary bg-white
              focus:outline-none transition-all duration-200 appearance-none cursor-pointer
              ${error
                ? 'border-error focus:border-error focus:ring-4 focus:ring-error/10'
                : 'border-border focus:border-primary focus:ring-4 focus:ring-primary/10'
              }
              disabled:bg-[#f1f5f9] disabled:text-[#94a3b8] disabled:cursor-not-allowed
              ${className}`}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <ChevronDown size={18} strokeWidth={1.5} className="text-textSecondary" />
          </div>
        </div>
        {error && (
          <div className="flex items-center gap-1 mt-1">
            <AlertCircle size={14} strokeWidth={2} className="text-error" />
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

Select.displayName = 'Select';
