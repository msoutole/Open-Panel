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
  // Design System: Botões sem transformações, transições suaves apenas de cor
  const baseStyles = 'font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2';

  // Design System: Botão Padrão (Fundo Sólido)
  // Normal: bg-primary (#4A7BA7), texto branco
  // Hover: bg-primaryHover (mais escuro)
  // Active: bg-primaryActive (ainda mais escuro)
  const variantStyles = {
    primary: 'bg-primary hover:bg-primaryHover active:bg-primaryActive text-white focus:ring-primary/20',
    secondary: 'bg-secondary hover:bg-[#5b8b5e] active:bg-[#4b7b4e] text-white focus:ring-secondary/20',
    success: 'bg-success hover:bg-successHover active:bg-[#15803d] text-white focus:ring-success/20',
    error: 'bg-error hover:bg-errorHover active:bg-[#b91c1c] text-white focus:ring-error/20',
    // Design System: Botão Secundário (Outline)
    // Normal: borda azul, texto azul, fundo branco
    // Hover: borda azul, texto azul, fundo azul muito claro (primaryLight)
    // Active: borda azul, texto azul, fundo azul mais visível
    outline: 'border border-primary text-primary bg-white hover:bg-primaryLight active:bg-primary/10 focus:ring-primary/20',
  };

  // Design System: Padding interno de 24px (6 * 4px) para botões médios
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm', // 12px, 6px
    md: 'px-6 py-2 text-base', // 24px, 8px (conforme design system)
    lg: 'px-8 py-3 text-lg', // 32px, 12px
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} strokeWidth={1.5} className="animate-spin" />}
      <span className={isLoading ? 'opacity-70' : ''}>{children}</span>
    </button>
  );
};
