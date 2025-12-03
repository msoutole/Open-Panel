import React from 'react';
import { Check } from 'lucide-react';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ label, className = '', ...props }) => {
  const checkboxId = props.id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <input
          type="checkbox"
          id={checkboxId}
          className={`sr-only ${className}`}
          {...props}
        />
        <label
          htmlFor={checkboxId}
          className={`
            w-5 h-5 border-2 rounded flex items-center justify-center cursor-pointer transition-colors duration-200
            ${props.checked
              ? 'bg-primary border-primary'
              : 'bg-white border-border'
            }
            ${props.disabled
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:border-primary'
            }
          `}
        >
          {props.checked && (
            <Check size={14} strokeWidth={2} className="text-white" />
          )}
        </label>
      </div>
      {label && (
        <label
          htmlFor={checkboxId}
          className={`text-sm text-textPrimary cursor-pointer ${props.disabled ? 'opacity-50' : ''}`}
        >
          {label}
        </label>
      )}
    </div>
  );
};

