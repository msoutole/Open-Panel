<!-- 02cfe346-513d-4408-8900-4220a23d304b 76372653-788f-4d52-8807-3cec4ad90019 -->
# Melhorias de UI e Responsividade

## Objetivos

1. Melhorar a visualização dos dropdowns de perfil e notificações no Header
2. Implementar sidebar retrátil com animação suave
3. Tornar toda a aplicação responsiva para mobile, tablet e desktop
4. Definir Português Brasileiro como linguagem primária da aplicação
5. Implementar CRUD completo para todas as funcionalidades presentes

## Arquivos a Modificar

### 1. Header Component (`apps/web/components/Header.tsx`)

- **Melhorias no dropdown de perfil:**
- Adicionar avatar com inicial do usuário ou imagem
- Melhorar espaçamento e hierarquia visual
- Adicionar separadores visuais mais claros
- Melhorar estados hover e transições

- **Melhorias no dropdown de notificações:**
- Adicionar scroll suave quando houver muitas notificações
- Melhorar visualização de notificações não lidas
- Adicionar indicadores visuais mais claros
- Melhorar espaçamento entre itens

### 2. Sidebar Component (`apps/web/components/Sidebar.tsx`)

- **Implementar sidebar retrátil:**
- Adicionar estado de colapso/expansão
- Criar versão compacta mostrando apenas ícones quando retraída
- Adicionar botão toggle para expandir/retrair
- Implementar animação suave de transição
- Ajustar largura: 64px (retraída) / 256px (expandida)
- Adicionar tooltips nos ícones quando retraída

### 3. App Component (`apps/web/App.tsx`)

- **Gerenciar estado da sidebar:**
- Adicionar estado `isSidebarCollapsed` no AppContent
- Passar estado e handler para Sidebar
- Ajustar margem do conteúdo principal baseado no estado da sidebar
- Implementar responsividade: sidebar oculta em mobile, overlay em tablet

### 4. DashboardView Component (`apps/web/components/DashboardView.tsx`)

- **Melhorar responsividade:**
- Ajustar grid de cards para diferentes breakpoints
- Mobile: 1 coluna
- Tablet: 2 colunas  
- Desktop: 4 colunas
- Melhorar padding e espaçamento em telas menores

### 5. Header Component - Responsividade (`apps/web/components/Header.tsx`)

- **Adaptações mobile:**
- Ocultar barra de busca em telas pequenas
- Ajustar tamanho dos dropdowns para não ultrapassar viewport
- Melhorar posicionamento dos dropdowns em mobile

### 6. Internacionalização - Português Brasileiro (`apps/web/src/i18n/`)

- **Definir PT-BR como linguagem primária:**
- Configurar i18n com Português Brasileiro como padrão
- Traduzir todos os textos da interface para PT-BR
- Atualizar mensagens de erro e validação
- Traduzir tooltips e placeholders
- Garantir consistência terminológica
- Atualizar documentação de componentes com textos em PT-BR

### 7. CRUD Completo - Todas as Funcionalidades

- **Projetos:**
- [x] Create (Criar projeto)
- [x] Read (Listar e visualizar projetos)
- [ ] Update (Editar projeto existente)
- [ ] Delete (Excluir projeto)

- **Serviços/Containers:**
- [x] Create (Criar serviço)
- [x] Read (Listar e visualizar serviços)
- [ ] Update (Editar serviço)
- [ ] Delete (Excluir serviço)

- **Usuários (IAM):**
- [ ] Create (Criar usuário)
- [ ] Read (Listar e visualizar usuários)
- [ ] Update (Editar usuário)
- [ ] Delete (Excluir usuário)

- **Backups:**
- [ ] Create (Criar backup manual)
- [x] Read (Listar backups)
- [ ] Update (Editar configurações de backup)
- [ ] Delete (Excluir backup)

- **Configurações:**
- [ ] Create (Criar configuração)
- [x] Read (Visualizar configurações)
- [ ] Update (Atualizar configurações)
- [ ] Delete (Remover configuração)

- **Logs de Segurança:**
- [ ] Create (Registrar evento de segurança)
- [x] Read (Visualizar logs)
- [ ] Update (Marcar como resolvido)
- [ ] Delete (Arquivar logs antigos)

## Breakpoints e Responsividade

### Mobile (< 640px)

- Sidebar oculta por padrão, acessível via botão hamburger
- Header com elementos essenciais apenas
- Grid de 1 coluna no dashboard
- Dropdowns com largura adaptada ao viewport

### Tablet (640px - 1024px)

- Sidebar retrátil por padrão ou overlay
- Grid de 2 colunas no dashboard
- Header com busca condicional

### Desktop (> 1024px)

- Sidebar expandida por padrão
- Grid de 4 colunas no dashboard
- Todos os elementos visíveis

## Implementação Técnica

### Hook para gerenciar sidebar

- Criar hook `useSidebar` para gerenciar estado de colapso
- Persistir preferência no localStorage
- Detectar tamanho da tela para comportamento padrão

### Animações

- Usar Tailwind transitions para sidebar
- Animar largura, opacidade e transform
- Duração: 200-300ms para transições suaves

### Acessibilidade

- Adicionar aria-labels nos botões
- Manter navegação por teclado funcional
- Tooltips acessíveis quando sidebar retraída

### Internacionalização (i18n)

- Verificar configuração atual do i18n em `apps/web/src/i18n/`
- Definir Português Brasileiro (pt-BR) como locale padrão
- Criar/atualizar arquivos de tradução em `apps/web/src/i18n/locales/pt-BR/`
- Traduzir todos os textos hardcoded nos componentes
- Usar hooks de tradução (`useTranslation`) em todos os componentes
- Garantir que mensagens de API também sejam traduzidas quando possível

### CRUD Completo

**Padrão de Implementação:**

- Criar modais/formulários para Create e Update
- Implementar validação de formulários (usar biblioteca como react-hook-form + zod)
- Adicionar confirmação para operações Delete
- Implementar loading states durante operações
- Adicionar tratamento de erros com mensagens traduzidas
- Atualizar listas automaticamente após operações CRUD
- Implementar otimistic updates quando apropriado

**Endpoints de API necessários:**

- Verificar endpoints existentes em `apps/api/`
- Criar endpoints faltantes para Update e Delete
- Garantir validação adequada no backend
- Implementar tratamento de erros consistente

**Componentes a criar/atualizar:**

- Modais de edição para cada entidade
- Formulários de criação/edição
- Confirmações de exclusão
- Feedback visual (toasts) para sucesso/erro

#### UI e Responsividade (Concluído)

- [x] Melhorar visualização do dropdown de perfil no Header com melhor espaçamento, avatar e separadores visuais
- [x] Melhorar visualização do dropdown de notificações com scroll suave e indicadores visuais aprimorados
- [x] Implementar sidebar retrátil com estados expandido/retraído, animações e botão toggle
- [x] Adicionar gerenciamento de estado da sidebar no App.tsx e ajustar layout do conteúdo principal
- [x] Tornar Header, Sidebar e DashboardView totalmente responsivos para mobile, tablet e desktop
- [x] Atualizar documentação em docs/ com as melhorias implementadas

#### Internacionalização - Português Brasileiro

- [ ] Configurar i18n com PT-BR como linguagem padrão
- [ ] Traduzir todos os textos da interface para Português Brasileiro
- [ ] Traduzir mensagens de erro e validação
- [ ] Traduzir tooltips, placeholders e labels
- [ ] Traduzir notificações e toasts
- [ ] Garantir consistência terminológica em toda aplicação
- [ ] Atualizar documentação de componentes com textos em PT-BR

#### CRUD Completo - Funcionalidades

- [ ] Implementar Update (Editar) para Projetos
- [ ] Implementar Delete (Excluir) para Projetos
- [ ] Implementar Update (Editar) para Serviços/Containers
- [ ] Implementar Delete (Excluir) para Serviços/Containers
- [ ] Implementar CRUD completo para Usuários (IAM)
- [ ] Implementar CRUD completo para Backups
- [ ] Implementar CRUD completo para Configurações
- [ ] Implementar operações de Update e Delete para Logs de Segurança
- [ ] Adicionar confirmações de exclusão em todas as operações Delete
- [ ] Implementar validações adequadas em todas as operações CRUD
- [ ] Adicionar feedback visual (toasts) para todas as operações CRUD

### To-dos

- [x] Melhorar visualização do dropdown de perfil no Header com melhor espaçamento, avatar e separadores visuais
- [x] Melhorar visualização do dropdown de notificações com scroll suave e indicadores visuais aprimorados
- [x] Implementar sidebar retrátil com estados expandido/retraído, animações e botão toggle
- [x] Adicionar gerenciamento de estado da sidebar no App.tsx e ajustar layout do conteúdo principal
- [x] Tornar Header, Sidebar e DashboardView totalmente responsivos para mobile, tablet e desktop
- [x] Atualizar documentação em docs/ com as melhorias implementadas