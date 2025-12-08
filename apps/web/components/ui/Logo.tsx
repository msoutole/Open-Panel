import React from 'react';

interface LogoProps {
  collapsed?: boolean; // Só ícone (sidebar retraída)
  size?: 'sm' | 'md' | 'lg'; // Tamanhos disponíveis
  showTagline?: boolean; // Mostrar "by Soullabs"
  className?: string;
}

const sizeMap = {
  sm: {
    icon: 'h-8 w-8 text-base',
    text: 'text-lg',
    tagline: 'text-[9px]',
    gap: 'gap-2',
    plus: 'text-sm',
  },
  md: {
    icon: 'h-10 w-10 text-lg',
    text: 'text-xl',
    tagline: 'text-[9px]',
    gap: 'gap-3',
    plus: 'text-base',
  },
  lg: {
    icon: 'h-12 w-12 text-xl',
    text: 'text-2xl',
    tagline: 'text-[10px]',
    gap: 'gap-4',
    plus: 'text-lg',
  },
};

export const Logo: React.FC<LogoProps> = ({
  collapsed = false,
  size = 'md',
  showTagline = true,
  className = '',
}) => {
  const { icon, text, tagline, gap, plus } = sizeMap[size] ?? sizeMap.md;

  return (
    <div
      className={`flex items-center ${collapsed ? 'justify-center' : gap} ${className}`}
      aria-label="SOU+SER by SOULLABS"
    >
      <div
        className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primaryDark shadow-lg text-white ${icon} flex-shrink-0 overflow-hidden`}
      >
        <span className="font-black leading-none tracking-tight">S</span>
        <span className="absolute -top-0.5 -right-1.5 text-[8px] font-black text-white/90 rotate-[12deg]">+</span>
        <div className="absolute top-0.5 left-0.5 h-1.5 w-1.5 rounded-full bg-white/30" />
      </div>

      {!collapsed && (
        <div className="flex flex-col min-w-0 leading-tight">
          <div className={`flex items-baseline ${gap === 'gap-2' ? 'gap-1' : 'gap-1.5'}`}>
            <span className={`${text} font-extrabold text-textPrimary dark:text-white`}>SOU</span>
            <span className={`${plus} font-black text-primary`}>+</span>
            <span className={`${text} font-extrabold text-textPrimary dark:text-white`}>SER</span>
          </div>
          {showTagline && (
            <div className="flex flex-col leading-tight">
              <span className={`${tagline} text-slate-500 dark:text-slate-400 tracking-[0.2em] uppercase`}>
                by SOULLABS
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 tracking-wide">
                Seu Servidor mais inteligente.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export type { LogoProps };
