import { useState, useEffect, useCallback } from 'react';

interface UseSidebarReturn {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  collapseSidebar: () => void;
  expandSidebar: () => void;
}

/**
 * Hook para gerenciar o estado de colapso da sidebar
 * Persiste a preferência no localStorage e detecta tamanho da tela
 */
export const useSidebar = (): UseSidebarReturn => {
  // Inicializar estado baseado no localStorage ou tamanho da tela
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    
    // Verificar preferência salva
    const saved = localStorage.getItem('sidebar_collapsed');
    if (saved !== null) {
      return saved === 'true';
    }
    
    // Padrão baseado no tamanho da tela
    // Mobile: colapsada, Desktop: expandida
    return window.innerWidth < 1024;
  });

  // Salvar preferência no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', String(isCollapsed));
  }, [isCollapsed]);

  // Ajustar baseado no resize da janela
  useEffect(() => {
    const handleResize = () => {
      const saved = localStorage.getItem('sidebar_collapsed');
      const wasManuallySet = saved !== null; // Se foi salvo manualmente pelo usuário
      
      // Em mobile (<640px), sempre colapsar
      if (window.innerWidth < 640) {
        setIsCollapsed(true);
      }
      // Em tablet (640-1023px), colapsada por padrão, mas respeitar preferência se foi definida manualmente
      else if (window.innerWidth >= 640 && window.innerWidth < 1024) {
        if (!wasManuallySet) {
          // Se nunca foi definido manualmente, colapsar em tablet
          setIsCollapsed(true);
        } else {
          // Se foi definido manualmente, respeitar a preferência salva
          setIsCollapsed(saved === 'true');
        }
      }
      // Em desktop (>= 1024px), expandir por padrão, mas respeitar preferência se foi definida manualmente
      else if (window.innerWidth >= 1024) {
        if (!wasManuallySet) {
          // Se nunca foi definido manualmente, expandir em desktop
          setIsCollapsed(false);
        } else {
          // Se foi definido manualmente, respeitar a preferência salva
          setIsCollapsed(saved === 'true');
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  const collapseSidebar = useCallback(() => {
    setIsCollapsed(true);
  }, []);

  const expandSidebar = useCallback(() => {
    setIsCollapsed(false);
  }, []);

  return {
    isCollapsed,
    toggleSidebar,
    collapseSidebar,
    expandSidebar,
  };
};
