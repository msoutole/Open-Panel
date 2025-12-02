import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'error' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  className = '',
  ...props
}) => {
  const baseStyles = 'font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2';

  const variantStyles = {
    primary: 'bg-primary hover:bg-primaryHover active:bg-primaryActive active:scale-95 text-white focus:ring-primary/20',
    secondary: 'bg-secondary hover:bg-[#5b8b5e] active:bg-[#4b7b4e] active:scale-95 text-white focus:ring-secondary/20',
    success: 'bg-success hover:bg-successHover active:bg-[#15803d] active:scale-95 text-white focus:ring-success/20',
    error: 'bg-error hover:bg-errorHover active:bg-[#b91c1c] active:scale-95 text-white focus:ring-error/20',
    outline: 'border-2 border-primary text-primary bg-white hover:bg-primary hover:text-white active:bg-primaryHover active:border-primaryHover active:scale-95 focus:ring-primary/20',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
};
