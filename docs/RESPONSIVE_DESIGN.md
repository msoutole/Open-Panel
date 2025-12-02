# 📱 Design Responsivo - Open Panel

**Última atualização**: 2025-01-27

Este documento descreve a implementação do design responsivo no Open Panel, incluindo a sidebar retrátil e adaptações para diferentes tamanhos de tela.

---

## 🎯 Visão Geral

O Open Panel foi totalmente adaptado para funcionar perfeitamente em dispositivos mobile, tablet e desktop, com uma sidebar retrátil que otimiza o uso do espaço em telas menores.

---

## 📐 Breakpoints

### Mobile (< 640px)
- Sidebar oculta por padrão, acessível via botão hamburger
- Header com elementos essenciais apenas
- Grid de 1 coluna no dashboard
- Dropdowns com largura adaptada ao viewport
- Overlay escuro quando sidebar está aberta

### Tablet (640px - 1024px)
- Sidebar retrátil por padrão (64px)
- Grid de 2 colunas no dashboard
- Header com busca condicional (oculta em telas menores)
- Sidebar pode ser expandida via toggle

### Desktop (> 1024px)
- Sidebar expandida por padrão (256px)
- Grid de 4 colunas no dashboard
- Todos os elementos visíveis
- Busca sempre visível no header

---

## 🎨 Componentes Responsivos

### Sidebar Retrátil

**Estados**:
- **Expandida**: 256px de largura, mostra ícones e labels
- **Retraída**: 64px de largura, mostra apenas ícones

**Funcionalidades**:
- Animação suave de transição (300ms)
- Tooltips nos itens quando retraída
- Botão toggle para expandir/retrair
- Persistência da preferência no localStorage
- Detecção automática de tamanho de tela

**Implementação**:
```typescript
// Hook useSidebar gerencia o estado
const { isCollapsed, toggleSidebar } = useSidebar();

// Sidebar adapta-se ao estado
<Sidebar 
  isCollapsed={isCollapsed}
  onToggle={toggleSidebar}
  isMobile={isMobile}
/>
```

**Código**: `apps/web/hooks/useSidebar.ts`, `apps/web/components/Sidebar.tsx`

---

### Header Responsivo

**Adaptações Mobile**:
- Botão hamburger para abrir/fechar sidebar
- Busca oculta em telas menores (< 1024px)
- Dropdowns com largura máxima adaptada ao viewport
- Informações do usuário ocultas em telas muito pequenas

**Dropdown de Perfil**:
- Avatar com iniciais do usuário
- Melhor hierarquia visual
- Separadores mais claros
- Estados hover aprimorados

**Dropdown de Notificações**:
- Scroll suave quando há muitas notificações
- Indicadores visuais para não lidas
- Melhor espaçamento entre itens
- Estado vazio com ícone

**Código**: `apps/web/components/Header.tsx`

---

### Dashboard Responsivo

**Grid de Métricas**:
- Mobile: 1 coluna (`grid-cols-1`)
- Tablet: 2 colunas (`sm:grid-cols-2`)
- Desktop: 4 colunas (`lg:grid-cols-4`)

**Grid de Projetos**:
- Mobile: 1 coluna
- Tablet: 2 colunas (`md:grid-cols-2`)
- Desktop: 3 colunas (`lg:grid-cols-3`)

**Espaçamento**:
- Padding adaptativo: `p-4` (mobile) → `md:p-8` (desktop)
- Gaps responsivos: `gap-4` → `gap-6`

**Código**: `apps/web/components/DashboardView.tsx`

---

## 🔧 Hook useSidebar

Hook customizado para gerenciar o estado da sidebar.

**Localização**: `apps/web/hooks/useSidebar.ts`

**API**:
```typescript
interface UseSidebarReturn {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  collapseSidebar: () => void;
  expandSidebar: () => void;
}
```

**Características**:
- Persiste preferência no localStorage
- Detecta tamanho da tela para comportamento padrão
- Ajusta automaticamente em mobile (< 640px)

**Uso**:
```typescript
const { isCollapsed, toggleSidebar } = useSidebar();

// Toggle sidebar
<button onClick={toggleSidebar}>
  {isCollapsed ? 'Expand' : 'Collapse'}
</button>
```

---

## 🎭 Animações

### Sidebar
- Transição de largura: `transition-all duration-300 ease-in-out`
- Tooltips: `animate-in fade-in slide-in-from-left-2 duration-200`
- Overlay: fade in/out suave

### Dropdowns
- Entrada: `animate-in fade-in slide-in-from-top-2 duration-200`
- Hover states: `transition-colors duration-150`

### Cards
- Entrada: `animate-in fade-in slide-in-from-bottom-4 duration-500`

---

## ♿ Acessibilidade

### Navegação por Teclado
- Todos os botões são focáveis
- Navegação por Tab funciona corretamente
- Enter/Space ativam ações

### ARIA Labels
- Botões têm `aria-label` apropriados
- Sidebar tem `role="navigation"`
- Dropdowns têm `aria-expanded`

### Screen Readers
- Tooltips acessíveis quando sidebar retraída
- Estados visuais também comunicados via texto

---

## 📊 Performance

### Otimizações
- Transições CSS (não JavaScript) para melhor performance
- Lazy loading de componentes pesados
- Debounce em eventos de resize
- Memoização de cálculos de layout

### Métricas
- Transição da sidebar: < 300ms
- Renderização inicial: < 100ms
- Re-render em resize: < 50ms

---

## 🧪 Testes

### Breakpoints a Testar
- 320px (mobile pequeno)
- 640px (mobile grande / tablet pequeno)
- 768px (tablet)
- 1024px (desktop pequeno)
- 1280px+ (desktop grande)

### Cenários
1. Sidebar expandida/retraída em cada breakpoint
2. Dropdowns não ultrapassam viewport
3. Grid adapta corretamente
4. Overlay funciona em mobile
5. Tooltips aparecem corretamente

---

## 🔮 Melhorias Futuras

### Planejadas
- [ ] Touch gestures para sidebar (swipe)
- [ ] Modo landscape otimizado para tablets
- [ ] PWA com suporte offline
- [ ] Dark mode responsivo
- [ ] Animações reduzidas para usuários com preferência de movimento reduzido

---

## 📚 Referências

- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Responsive Design](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)

---

**Mantido por**: OpenPanel Core Team  
**Última revisão**: 2025-01-27

