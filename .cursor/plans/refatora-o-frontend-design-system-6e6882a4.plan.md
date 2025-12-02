<!-- 6e6882a4-5e89-4e01-9378-e691a085f915 97ac9b50-59c4-4570-bc98-100712c2058e -->
# Refatoração do Frontend - Design System Open Panel

## Objetivo

Aplicar as diretrizes de design das imagens ao frontend, tornando a aplicação mais sóbria, profissional e séria, com paleta de cores limitada e design consistente.

## Estrutura de Implementação

### 1. Configuração Base do Tailwind CSS

- **Arquivo**: `apps/web/index.html`
- Atualizar configuração do Tailwind com paleta de cores oficial:
- Primárias: `#4A7BA7` (Azul Dessaturado), `#6B9B6E` (Verde Dessaturado)
- Status: `#22c55e` (Sucesso), `#f97316` (Aviso), `#ef4444` (Erro)
- Texto: `#1f2937` (Primário), `#6b7280` (Secundário)
- Fundo: `#F8FAFC` (Background), `#FFFFFF` (Card), `#e2e8f0` (Borda)
- Remover cores antigas não utilizadas
- Configurar espaçamento modular (4px, 8px, 16px, 24px, 32px, 48px)

### 2. Componentes Base (UI)

- **Arquivos**: `apps/web/components/ui/*.tsx`
- **Button.tsx**: Refatorar para usar cores oficiais, estados (normal, hover, active, disabled) conforme diretrizes
- **Input.tsx**: Aplicar estados (normal, foco, erro, desativado) com cores corretas
- **Textarea.tsx**: Seguir mesmo padrão de Input
- **Select.tsx**: Aplicar estilo consistente
- **Card.tsx**: Atualizar para usar cores e espaçamento corretos

### 3. Componentes Principais

#### 3.1 Sidebar (`apps/web/components/Sidebar.tsx`)

- Aplicar cores oficiais
- Ícones com `strokeWidth={1.5}` ou `strokeWidth={2}` consistente
- Espaçamento modular (padding: 24px, gap: 16px)
- Remover cores excessivas, manter sóbrio

#### 3.2 Header (`apps/web/components/Header.tsx`)

- Atualizar cores de texto e fundo
- Ícones com strokeWidth consistente
- Input de busca seguindo diretrizes de formulário
- Dropdowns com estilo sóbrio

#### 3.3 DashboardView (`apps/web/components/DashboardView.tsx`)

- **StatCard**: Remover gradientes e cores vibrantes, usar paleta oficial
- **ProjectCard**: Aplicar cores sóbrias, remover efeitos excessivos
- **ProjectListItem**: Mesmo tratamento
- Gráficos: Usar apenas cores da paleta oficial
- Espaçamento modular em todos os elementos

#### 3.4 SettingsView (`apps/web/components/SettingsView.tsx`)

- Formulários seguindo diretrizes
- Botões com variantes corretas
- Cards e containers sóbrios
- Ícones consistentes

#### 3.5 SecurityView (`apps/web/components/SecurityView.tsx`)

- Aplicar paleta oficial
- Tabelas e listas com estilo sóbrio
- Estados de status usando cores oficiais

#### 3.6 Outros Componentes

- **CreateProjectModal.tsx**: Formulários conforme diretrizes
- **CreateServiceModal.tsx**: Mesmo padrão
- **ProjectDetails.tsx**: Layout sóbrio
- **ServiceDetailView.tsx**: Cores e espaçamento corretos
- **GeminiChat.tsx**: Aplicar design system (se necessário)
- **WebTerminal.tsx**: Manter tema escuro mas aplicar diretrizes onde aplicável

### 4. Páginas

#### 4.1 Login (`apps/web/pages/Login.tsx`)

- Formulário seguindo diretrizes
- Cores e espaçamento corretos
- Branding "by Soullabs" conforme especificado

#### 4.2 Onboarding (`apps/web/pages/Onboarding.tsx`)

- Aplicar design system
- Ilustrações minimalistas (se houver)
- Formulários consistentes

### 5. Tipografia

- Aplicar hierarquia correta:
- Títulos: `text-2xl font-bold text-[#1f2937]`
- Subtítulos: `text-xl font-semibold text-[#1f2937]`
- Corpo: `text-base font-normal text-[#1f2937]`
- Secundário: `text-sm font-normal text-[#6b7280]`
- Labels: `text-xs font-medium text-[#6b7280] uppercase tracking-wider`

### 6. Ícones

- Todos os ícones devem usar `strokeWidth={1.5}` ou `strokeWidth={2}` consistentemente
- Cores: `#6b7280` (padrão) ou `#4A7BA7` (interativo/status)
- Verificar todos os componentes e padronizar

### 7. Espaçamento Modular

- Aplicar sistema de espaçamento baseado em múltiplos de 4px/8px
- Revisar todos os componentes:
- Gaps: 4px, 8px, 16px, 24px
- Paddings: 16px, 24px, 32px
- Margins: 24px, 32px, 48px

### 8. Remoção de Cores Excessivas

- Remover gradientes desnecessários
- Substituir cores vibrantes por paleta oficial
- Manter apenas cores de status quando necessário
- Background sempre `#F8FAFC` ou `#FFFFFF`

### 9. Documentação

- **Arquivo**: `docs/DESIGN_GUIDELINES.md`
- Atualizar com exemplos de código refatorados
- Adicionar referências aos componentes atualizados

## Ordem de Implementação

1. Configuração Tailwind (base)
2. Componentes UI (Button, Input, etc.)
3. Sidebar e Header (navegação)
4. DashboardView (principal)
5. SettingsView e SecurityView
6. Modais e outros componentes
7. Páginas (Login, Onboarding)
8. Revisão final e ajustes

## Critérios de Sucesso

- ✅ Todas as cores seguem a paleta oficial
- ✅ Espaçamento modular aplicado consistentemente
- ✅ Ícones com strokeWidth consistente
- ✅ Design sóbrio e profissional
- ✅ Tipografia seguindo hierarquia correta
- ✅ Componentes seguem diretrizes de botões, inputs e cards
- ✅ Sem cores excessivas ou gradientes desnecessários

### To-dos

- [ ] Atualizar configuração do Tailwind CSS em index.html com paleta de cores oficial e espaçamento modular
- [ ] Refatorar componentes base (Button, Input, Textarea, Select, Card) seguindo diretrizes
- [ ] Refatorar Sidebar e Header aplicando cores oficiais, ícones consistentes e espaçamento modular
- [ ] Refatorar DashboardView removendo cores excessivas, aplicando paleta oficial e espaçamento modular
- [ ] Refatorar SettingsView e SecurityView aplicando design system
- [ ] Refatorar modais e outros componentes (CreateProjectModal, ProjectDetails, etc.)
- [ ] Refatorar páginas Login e Onboarding seguindo diretrizes
- [ ] Padronizar todos os ícones (strokeWidth) e aplicar tipografia correta em todos os componentes
- [ ] Atualizar DESIGN_GUIDELINES.md com exemplos dos componentes refatorados