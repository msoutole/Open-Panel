import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = false,
  onClick
}) => {
  const baseStyles = 'bg-card rounded-xl border border-border shadow-sm';
  const hoverStyles = hover
    ? 'hover:shadow-xl hover:border-primary/30 hover:-translate-y-1 transition-all duration-200 cursor-pointer'
    : 'transition-shadow duration-200';

  return (
    <div
      className={`${baseStyles} ${hoverStyles} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
