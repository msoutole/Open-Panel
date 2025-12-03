import React from 'react';

interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Radio: React.FC<RadioProps> = ({ label, className = '', ...props }) => {
  const radioId = props.id || `radio-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <input
          type="radio"
          id={radioId}
          className={`sr-only ${className}`}
          {...props}
        />
        <label
          htmlFor={radioId}
          className={`
            w-5 h-5 border-2 rounded-full flex items-center justify-center cursor-pointer transition-colors duration-200
            ${props.checked
              ? 'border-primary'
              : 'bg-white border-border'
            }
            ${props.disabled
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:border-primary'
            }
          `}
        >
          {props.checked && (
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
          )}
        </label>
      </div>
      {label && (
        <label
          htmlFor={radioId}
          className={`text-sm text-textPrimary cursor-pointer ${props.disabled ? 'opacity-50' : ''}`}
        >
          {label}
        </label>
      )}
    </div>
  );
};

