<!-- e4b1313c-02b7-4a4c-b54e-af7b6a8f9fb1 8a05ae22-ddc7-455a-aa61-2ce83fa8e80d -->
# Plano de Melhorias no Design System e Visual do Dashboard

## Objetivos

1. **Skeleton Screens**: Substituir "N/A" e estados vazios por componentes skeleton com animação shimmer
2. **Métricas do Sistema**: Refatorar cards com micro-gráficos (sparklines), progress rings finos e hierarquia tipográfica melhorada
3. **Dashboard Geral**: Transformar ações rápidas em cards de atalho e melhorar badges semânticos nos projetos
4. **Hover States**: Adicionar elevação e transições suaves nos cards

## Análise do Estado Atual

### Componentes Existentes

- `SkeletonLoader.tsx`: Tem componentes básicos mas sem shimmer effect
- `BentoMetricsGrid.tsx`: Já usa gráficos de área mas precisa melhorias
- `ProgressBar.tsx`: Existe mas é para barras horizontais, não rings
- `DashboardView.tsx`: Tem ações rápidas como botões simples e badges básicos

### Estrutura de Dados

- `SystemMetrics` interface em `apps/web/services/api.ts` com `cpu`, `memory`, `disk`, `network`
- Projetos têm `status` que pode ser "Running", "Stopped", "Building", etc.

## Implementação

### 1. Melhorar Skeleton Screens com Shimmer Effect

**Arquivo**: `apps/web/components/SkeletonLoader.tsx`

- Adicionar animação shimmer usando CSS keyframes no `index.html`
- Criar variante `shimmer` no componente `Skeleton`
- Substituir `animate-pulse` por shimmer em componentes específicos
- Criar `SkeletonMetricCard` específico para cards de métricas
- Criar `SkeletonProjectCard` para cards de projeto

**Mudanças**:

- Adicionar `@keyframes shimmer` no `<style>` do `index.html`
- Atualizar `Skeleton` para suportar animação shimmer
- Criar componentes especializados para diferentes contextos

### 2. Criar Componente ProgressRing

**Arquivo**: `apps/web/components/ui/ProgressRing.tsx` (novo)

- Componente SVG circular com stroke fino (`strokeWidth={1.5}`)
- Suporta cores semânticas (primary, success, warning, error)
- Mostra percentual no centro
- Usa cores do design system (`border` para fundo, cor semântica para progresso)
- Tamanho configurável (padrão ~80px)
- Animação suave na mudança de valor

**Props**:

```typescript
interface ProgressRingProps {
  value: number; // 0-100
  size?: number; // tamanho em px
  strokeWidth?: number; // padrão 1.5
  color?: 'primary' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  label?: string;
  className?: string;
}
```

### 3. Criar Componente Badge Semântico

**Arquivo**: `apps/web/components/ui/Badge.tsx` (novo)

- Badge com cores semânticas baseadas no status
- Variantes: `success`, `warning`, `error`, `info`, `neutral`
- Tamanhos: `sm`, `md`, `lg`
- Suporta ícones opcionais
- Usa cores do design system

**Props**:

```typescript
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  className?: string;
}
```

**Mapeamento de Status**:

- "Running" → `success` (verde)
- "Stopped" → `error` (vermelho)
- "Building" → `warning` (laranja)
- "Paused" → `info` (azul)
- Outros → `neutral` (cinza)

### 4. Refatorar BentoMetricsGrid com Micro-Gráficos e Progress Rings

**Arquivo**: `apps/web/components/BentoMetricsGrid.tsx`

**Mudanças**:

- **CPU Card**:
  - Substituir gráfico grande por micro-gráfico (sparkline) compacto
  - Altura reduzida (~60px)
  - Usar `loadAverage` para histórico de 15-30 minutos
  - Valor principal maior e mais destacado
  - Remover "N/A", usar skeleton quando sem dados

- **RAM Card**:
  - Substituir barra de progresso por `ProgressRing`
  - Mostrar valor principal grande (ex: "13.15 GB")
  - Labels menores e secundários
  - Cor semântica: warning se > 90%, success se < 70%

- **Storage Card**:
  - Substituir PieChart por `ProgressRing` fino
  - Mesma abordagem do RAM
  - Valor principal grande no centro

- **Network Card**:
  - Adicionar micro-gráfico de linha (sparkline) para histórico
  - Mostrar valor principal grande
  - Usar `rxRate` e `txRate` se disponível

- **Hierarquia Tipográfica**:
  - Valor principal: `text-2xl` ou `text-3xl` font-bold
  - Labels: `text-xs` text-textSecondary uppercase tracking-wider
  - Subtítulos: `text-sm` text-textSecondary

- **Skeleton States**:
  - Substituir "Nenhum dado disponível" por `SkeletonMetricCard`
  - Usar shimmer effect durante carregamento

### 5. Transformar Ações Rápidas em Cards de Atalho

**Arquivo**: `apps/web/components/DashboardView.tsx`

**Mudanças** (linhas ~771-804):

- Criar componente `QuickActionCard` interno ou separado
- Layout: Grid 3 colunas (ou flex wrap) com cards quadrados/retangulares
- Cada card:
  - Ícone grande com fundo circular usando `primary/10`
  - Texto da ação abaixo
  - Hover: elevar card e destacar borda com `primary`
  - `rounded-lg` (8px)
  - Padding: `p-4` ou `p-6`
  - Transição suave

**Estrutura**:

```tsx
<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
  <QuickActionCard
    icon={Plus}
    label={LL.dashboard.quickActionCreateProject()}
    onClick={handleCreateProject}
    primary
  />
  {/* ... */}
</div>
```

### 6. Melhorar Cards de Projeto com Badges Semânticos e Hover

**Arquivo**: `apps/web/components/DashboardView.tsx`

**Mudanças** (componentes `ProjectCard` e `ProjectListItem`):

- **Badge de Status**:
  - Substituir badge atual (linha ~198) por componente `Badge`
  - Mapear `project.status` para variante semântica
  - Usar cores vibrantes e contrastantes

- **Hover States**:
  - Adicionar `shadow-lg` no hover (elevação)
  - Intensificar borda com `border-primary` ou `border-primaryHover`
  - Transição suave: `transition-all duration-200`
  - Opcional: leve `transform translate-y-[-2px]` no hover

- **Estrutura Visual**:
  - Manter layout atual mas melhorar feedback visual
  - Garantir que badges sejam escaneáveis rapidamente

### 7. Adicionar Keyframes Shimmer no CSS

**Arquivo**: `apps/web/index.html`

**Mudanças** (dentro do `<style>`):

- Adicionar `@keyframes shimmer`:
```css
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

- Criar classe utilitária `.animate-shimmer` se necessário

### 8. Atualizar Exportações de Componentes UI

**Arquivo**: `apps/web/components/ui/index.ts`

- Adicionar exports:
  - `export { Badge } from './Badge';`
  - `export { ProgressRing } from './ProgressRing';`

## Arquivos a Criar

1. `apps/web/components/ui/Badge.tsx` - Componente de badge semântico
2. `apps/web/components/ui/ProgressRing.tsx` - Componente de anel de progresso fino

## Arquivos a Modificar

1. `apps/web/components/SkeletonLoader.tsx` - Adicionar shimmer e componentes especializados
2. `apps/web/components/BentoMetricsGrid.tsx` - Refatorar com micro-gráficos e progress rings
3. `apps/web/components/DashboardView.tsx` - Cards de atalho e badges semânticos
4. `apps/web/index.html` - Adicionar keyframes shimmer
5. `apps/web/components/ui/index.ts` - Exportar novos componentes

## Considerações Técnicas

- **Performance**: Micro-gráficos devem ser leves (máx 30 pontos de dados)
- **Acessibilidade**: Badges devem ter contraste adequado (WCAG AA)
- **Responsividade**: Cards de atalho devem funcionar em mobile (grid 1 coluna)
- **Consistência**: Todos os componentes devem usar cores e espaçamento do design system
- **Animações**: Transições devem ser suaves (200-300ms) e não intrusivas

## Ordem de Implementação Sugerida

1. Criar `Badge` e `ProgressRing` (componentes base)
2. Adicionar shimmer no CSS e melhorar `SkeletonLoader`
3. Refatorar `BentoMetricsGrid` com novos componentes
4. Transformar ações rápidas em cards
5. Aplicar badges semânticos nos projetos
6. Ajustes finais de hover e elevação

### To-dos

- [ ] Criar componente Badge semântico em apps/web/components/ui/Badge.tsx com variantes success/warning/error/info/neutral e suporte a ícones
- [ ] Criar componente ProgressRing em apps/web/components/ui/ProgressRing.tsx com stroke fino (1.5px), cores semânticas e animação suave
- [ ] Adicionar keyframes shimmer no CSS do index.html e criar variante shimmer no SkeletonLoader
- [ ] Criar SkeletonMetricCard e SkeletonProjectCard especializados com shimmer effect em SkeletonLoader.tsx
- [ ] Refatorar BentoMetricsGrid: substituir gráficos grandes por micro-gráficos (sparklines), usar ProgressRing para RAM/Storage, melhorar hierarquia tipográfica e substituir N/A por skeletons
- [ ] Transformar ações rápidas em cards de atalho no DashboardView: criar grid com cards quadrados, ícones com fundo circular e hover states melhorados
- [ ] Aplicar Badge semântico nos ProjectCard e ProjectListItem, mapeando status (Running/Stopped/Building) para cores apropriadas
- [ ] Adicionar elevação (shadow-lg) e transições suaves nos cards de projeto e métricas no hover
- [ ] Adicionar exports de Badge e ProgressRing no apps/web/components/ui/index.ts