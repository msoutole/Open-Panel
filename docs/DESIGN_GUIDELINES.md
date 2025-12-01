# Guia de Diretrizes de Design - Open Panel v1.0

**by Soullabs**

---

## 1. Paleta de Cores

### Cores Primárias & Destaque

| Nome | Hex | Uso |
|------|-----|-----|
| **Azul Dessaturado** | `#4A7BA7` | Cor primária da marca, botões principais, links ativos |
| **Verde Dessaturado** | `#6B9B6E` | Cor secundária, ações positivas, confirmações |

### Cores de Status

| Nome | Hex | Uso |
|------|-----|-----|
| **Sucesso** | `#22c55e` | Operações bem-sucedidas, estados ativos |
| **Aviso** | `#f97316` | Alertas, ações que requerem atenção |
| **Erro** | `#ef4444` | Erros, falhas, ações destrutivas |

### Cores de Texto

| Nome | Hex | Uso |
|------|-----|-----|
| **Primário** | `#1f2937` | Títulos, textos principais |
| **Secundário** | `#6b7280` | Textos secundários, legendas, placeholders |

### Cores de Fundo & Bordas

| Nome | Hex | Uso |
|------|-----|-----|
| **Fundo** | `#F8FAFC` | Background principal da aplicação |
| **Card** | `#FFFFFF` | Fundo de cards, modais, containers |
| **Borda** | `#e2e8f0` | Bordas de elementos, separadores |

---

## 2. Espaçamento Modular

Utilizamos um sistema de espaçamento baseado em múltiplos de **4px** ou **8px** para garantir consistência e alinhamento. Isso se aplica a margens, paddings e lacunas (gaps) entre elementos.

### Escala de Espaçamento

| Tamanho | Valor | Uso |
|---------|-------|-----|
| **Pequeno (xs)** | 4px | Espaçamento mínimo entre ícones e texto |
| **Pequeno (sm)** | 8px | Itens de lista compactos, espaçamento interno mínimo |
| **Médio (md)** | 16px | Paddings internos de componentes |
| **Médio (lg)** | 24px | Lacunas entre componentes (ex: botões, cards) |
| **Grande (xl)** | 32px | Margens de cartões, espaçamento entre seções |
| **Grande (2xl)** | 48px | Lacunas entre seções principais |

### Exemplos de Aplicação

- **Ícones e texto**: Gap de 4px ou 8px
- **Paddings de botões**: 16px horizontal, 10px vertical (médio)
- **Margens entre cards**: 24px
- **Espaçamento entre seções**: 32px ou 48px

---

## 3. Layout de Grid

### Grid Responsivo de 12 Colunas

Um grid flexível de **12 colunas** é a base para layouts responsivos. As margens externas do container e o gap entre colunas seguem o sistema modular.

#### Breakpoints

| Breakpoint | Largura | Colunas Típicas |
|------------|---------|-----------------|
| **Mobile** | < 640px | 1 coluna (12/12) |
| **Tablet** | 640px - 1024px | 2-3 colunas (6/12 ou 4/12) |
| **Desktop** | > 1024px | 3-4 colunas (4/12 ou 3/12) |

#### Exemplo de Uso

- **Dashboard cards**: 3 colunas em desktop (4/12 cada), 1 coluna em mobile (12/12)
- **Lista de projetos**: 3 colunas em desktop, 2 em tablet, 1 em mobile

### Alinhamento

O alinhamento é **à esquerda** para texto e elementos de UI, priorizando legibilidade e coesão visual.

---

## 4. Componentes - Botões

### Botão Primário (Fundo Sólido)

Usado para ações principais (ex: "Criar Projeto", "Salvar").

#### Estados

| Estado | Estilo |
|--------|--------|
| **Normal** | `bg-[#4A7BA7]`, `text-white`, `rounded-lg`, `px-5 py-2.5` |
| **Hover** | `bg-[#3a6b97]`, `shadow-md` |
| **Active** | `bg-[#2a5b87]`, `scale-95` |
| **Disabled** | `opacity-50`, `cursor-not-allowed` |

#### Código Exemplo (Tailwind)

```tsx
<button className="bg-[#4A7BA7] hover:bg-[#3a6b97] active:bg-[#2a5b87] text-white font-medium px-5 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
  Botão Primário
</button>
```

### Botão Secundário (Outline)

Usado para ações secundárias (ex: "Cancelar", "Voltar").

#### Estados

| Estado | Estilo |
|--------|--------|
| **Normal** | `border-2 border-[#4A7BA7]`, `text-[#4A7BA7]`, `bg-white` |
| **Hover** | `bg-[#4A7BA7]`, `text-white` |
| **Active** | `bg-[#3a6b97]`, `border-[#3a6b97]` |

#### Código Exemplo (Tailwind)

```tsx
<button className="border-2 border-[#4A7BA7] text-[#4A7BA7] bg-white hover:bg-[#4A7BA7] hover:text-white active:bg-[#3a6b97] active:border-[#3a6b97] font-medium px-5 py-2.5 rounded-lg transition-all">
  Botão Secundário
</button>
```

### Botão de Sucesso

Usado para ações positivas (ex: "Confirmar Deploy", "Ativar").

```tsx
<button className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-medium px-5 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all">
  Confirmar
</button>
```

### Botão de Erro/Destruição

Usado para ações destrutivas (ex: "Deletar", "Remover").

```tsx
<button className="bg-[#ef4444] hover:bg-[#dc2626] text-white font-medium px-5 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all">
  Deletar
</button>
```

---

## 5. Componentes - Campos de Formulário

### Campo de Texto (Input)

#### Estados

| Estado | Estilo |
|--------|--------|
| **Normal** | `border border-[#e2e8f0]`, `bg-white`, `text-[#1f2937]`, `rounded-lg` |
| **Foco** | `border-[#4A7BA7]`, `ring-4 ring-[#4A7BA7]/10` |
| **Erro** | `border-[#ef4444]`, `ring-4 ring-[#ef4444]/10` |
| **Desativado** | `bg-[#f1f5f9]`, `text-[#94a3b8]`, `cursor-not-allowed` |

#### Código Exemplo

```tsx
{/* Normal */}
<input
  type="text"
  placeholder="Nome de usuário"
  className="w-full px-4 py-3 border border-[#e2e8f0] rounded-lg text-[#1f2937] placeholder-[#6b7280] focus:outline-none focus:border-[#4A7BA7] focus:ring-4 focus:ring-[#4A7BA7]/10 transition-all"
/>

{/* Erro */}
<input
  type="text"
  placeholder="entrada.inválida"
  className="w-full px-4 py-3 border-2 border-[#ef4444] rounded-lg text-[#1f2937] focus:outline-none focus:ring-4 focus:ring-[#ef4444]/10 transition-all"
/>
<p className="text-xs text-[#ef4444] mt-1">Este campo é obrigatório.</p>

{/* Desativado */}
<input
  type="text"
  placeholder="Campo desativado"
  disabled
  className="w-full px-4 py-3 border border-[#e2e8f0] rounded-lg bg-[#f1f5f9] text-[#94a3b8] cursor-not-allowed"
/>
```

### Área de Texto (Textarea)

```tsx
<textarea
  placeholder="Deixe seu comentário..."
  rows={4}
  className="w-full px-4 py-3 border border-[#e2e8f0] rounded-lg text-[#1f2937] placeholder-[#6b7280] focus:outline-none focus:border-[#4A7BA7] focus:ring-4 focus:ring-[#4A7BA7]/10 transition-all resize-none"
/>
```

### Campo de Seleção (Select)

```tsx
<select className="w-full px-4 py-3 border border-[#e2e8f0] rounded-lg text-[#1f2937] bg-white focus:outline-none focus:border-[#4A7BA7] focus:ring-4 focus:ring-[#4A7BA7]/10 transition-all appearance-none">
  <option>Opção 1</option>
  <option>Opção 2</option>
  <option>Opção 3</option>
</select>
```

### Checkbox e Radio

```tsx
{/* Checkbox */}
<label className="flex items-center gap-2 cursor-pointer">
  <input
    type="checkbox"
    className="w-4 h-4 rounded border-[#e2e8f0] text-[#4A7BA7] focus:ring-2 focus:ring-[#4A7BA7]/20"
  />
  <span className="text-sm text-[#1f2937]">Normal</span>
</label>

{/* Radio */}
<label className="flex items-center gap-2 cursor-pointer">
  <input
    type="radio"
    name="radio-group"
    className="w-4 h-4 border-[#e2e8f0] text-[#4A7BA7] focus:ring-2 focus:ring-[#4A7BA7]/20"
  />
  <span className="text-sm text-[#1f2937]">Selecionado</span>
</label>
```

---

## 6. Iconografia

### Diretrizes

- **Estilo**: Ícones de linha (outline) com traço consistente de **1.5px** ou **2px**.
- **Formato**: **SVG** para escalabilidade e clareza.
- **Paleta de Cores**:
  - Cor de texto secundário (`#6b7280`) para ícones padrão
  - Cor de destaque (`#4A7BA7`) para ícones interativos ou de status
- **Consistência e Simplicidade**: Ícones devem ser facilmente reconhecíveis e compreendidos, evitando detalhes excessivos que comprometam a clareza.

### Biblioteca Recomendada

**Lucide React** (já instalada no projeto)

### Exemplos de Uso

```tsx
import { Settings, Folder, Plus, Check } from 'lucide-react';

{/* Ícone padrão (secundário) */}
<Settings size={20} strokeWidth={1.5} className="text-[#6b7280]" />

{/* Ícone interativo (destaque) */}
<Plus size={20} strokeWidth={2} className="text-[#4A7BA7]" />

{/* Ícone de sucesso */}
<Check size={20} strokeWidth={2} className="text-[#22c55e]" />
```

### Consistência de Peso Visual

Manter o peso visual consistente em todos os ícones. Se usar `strokeWidth={1.5}` em um contexto, usar o mesmo peso em ícones adjacentes.

---

## 7. Ilustrações (se aplicável)

### Diretrizes

- **Estilo**: Minimalista e abstrato, com formas geométricas simples e linhas limpas.
- **Paleta**: Estritamente limitada às cores da identidade visual (fundo, texto, destaque dessaturado).
- **Uso**: Apenas para fins funcionais:
  - Onboarding
  - Estados vazios (empty states)
  - Páginas de erro
  - **NÃO** para fins decorativos.
- **Tom**: Profissional e direto, sem elementos lúdicos.

### Exemplo de Contexto

- **Empty State de Projetos**: Ilustração minimalista de um servidor/container vazio.
- **Erro 404**: Ilustração abstrata de um caminho quebrado.

---

## 8. Tipografia

### Fontes

- **Primária**: Sistema de fontes padrão do navegador (sans-serif) para melhor performance e legibilidade.
- **Fallback**: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`

### Escalas de Tamanho

| Uso | Classe Tailwind | Tamanho |
|-----|-----------------|---------|
| **Display (H1)** | `text-4xl` | 36px |
| **Heading (H2)** | `text-2xl` | 24px |
| **Subheading (H3)** | `text-xl` | 20px |
| **Body** | `text-base` | 16px |
| **Small** | `text-sm` | 14px |
| **Caption** | `text-xs` | 12px |

### Pesos de Fonte

| Uso | Classe Tailwind | Peso |
|-----|-----------------|------|
| **Regular** | `font-normal` | 400 |
| **Medium** | `font-medium` | 500 |
| **Semibold** | `font-semibold` | 600 |
| **Bold** | `font-bold` | 700 |

### Hierarquia e Legibilidade

- **Títulos de página**: `text-2xl font-bold text-[#1f2937]`
- **Títulos de seção**: `text-xl font-semibold text-[#1f2937]`
- **Corpo de texto**: `text-base font-normal text-[#1f2937]`
- **Texto secundário**: `text-sm font-normal text-[#6b7280]`
- **Labels e legendas**: `text-xs font-medium text-[#6b7280] uppercase tracking-wider`

---

## 9. Cards e Containers

### Card Padrão

Cards são usados para agrupar informações relacionadas.

```tsx
<div className="bg-white p-6 rounded-xl border border-[#e2e8f0] shadow-sm hover:shadow-md transition-shadow">
  {/* Conteúdo do card */}
</div>
```

### Card com Hover (Interativo)

```tsx
<div className="bg-white p-6 rounded-xl border border-[#e2e8f0] shadow-sm hover:shadow-xl hover:border-[#4A7BA7]/30 hover:-translate-y-1 transition-all cursor-pointer">
  {/* Conteúdo do card interativo */}
</div>
```

### Card de Projeto (Exemplo)

```tsx
<div className="bg-white p-6 rounded-xl border border-[#e2e8f0] shadow-sm hover:shadow-xl hover:border-[#4A7BA7]/30 transition-all group cursor-pointer">
  <div className="flex items-start justify-between mb-4">
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-lg bg-[#4A7BA7]/10 flex items-center justify-center text-[#4A7BA7] group-hover:bg-[#4A7BA7] group-hover:text-white transition-colors">
        <Layers size={24} strokeWidth={1.5} />
      </div>
      <div>
        <h3 className="font-semibold text-base text-[#1f2937]">Project Alpha</h3>
        <p className="text-xs text-[#6b7280]">Running</p>
      </div>
    </div>
    <span className="px-2 py-1 rounded-full text-[10px] uppercase font-bold bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20">Active</span>
  </div>
  {/* Mais conteúdo */}
</div>
```

---

## 10. Estados de UI

### Loading (Carregamento)

```tsx
import { Loader2 } from 'lucide-react';

<div className="flex items-center justify-center gap-2 text-[#6b7280]">
  <Loader2 size={20} className="animate-spin" />
  <span className="text-sm">Carregando...</span>
</div>
```

### Empty State (Estado Vazio)

```tsx
<div className="py-12 text-center">
  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F8FAFC] flex items-center justify-center">
    <Folder size={32} strokeWidth={1.5} className="text-[#6b7280]" />
  </div>
  <h3 className="text-base font-semibold text-[#1f2937] mb-2">Nenhum projeto encontrado</h3>
  <p className="text-sm text-[#6b7280]">Crie seu primeiro projeto para começar.</p>
</div>
```

### Error State (Estado de Erro)

```tsx
<div className="p-4 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg flex items-start gap-3">
  <AlertCircle size={20} strokeWidth={2} className="text-[#ef4444] shrink-0" />
  <div>
    <h4 className="text-sm font-semibold text-[#ef4444]">Erro no Deploy</h4>
    <p className="text-xs text-[#6b7280] mt-1">Não foi possível fazer o deploy do projeto. Verifique os logs.</p>
  </div>
</div>
```

---

## 11. Sombras (Shadows)

### Escala de Sombras

| Uso | Classe Tailwind | Valor |
|-----|-----------------|-------|
| **Nenhuma** | `shadow-none` | none |
| **Sutil** | `shadow-sm` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` |
| **Padrão** | `shadow` | `0 1px 3px 0 rgb(0 0 0 / 0.1)` |
| **Média** | `shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.1)` |
| **Grande** | `shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.1)` |
| **Extra Grande** | `shadow-xl` | `0 20px 25px -5px rgb(0 0 0 / 0.1)` |

### Aplicação

- **Cards em repouso**: `shadow-sm`
- **Cards em hover**: `shadow-xl`
- **Botões**: `shadow-sm` (hover: `shadow-md`)
- **Modais**: `shadow-xl`

---

## 12. Animações e Transições

### Princípios

- **Sutis e funcionais**: Animações devem melhorar a UX, não distrair.
- **Duração**: 150ms a 300ms para a maioria das transições.
- **Easing**: `ease-in-out` ou `ease-out`.

### Exemplos

```tsx
{/* Transição de cor/sombra */}
<div className="transition-all duration-200 ease-in-out">
  {/* ... */}
</div>

{/* Hover com escala */}
<button className="transition-transform duration-150 active:scale-95">
  {/* ... */}
</button>

{/* Fade in */}
<div className="animate-in fade-in duration-300">
  {/* ... */}
</div>
```

---

## 13. Branding - Soullabs

### Logo e Assinatura

- **Posição**: Sidebar, footer, página de login.
- **Formato**: "Open Panel **by Soullabs**"
- **Estilo**:
  - "Open Panel": `font-bold text-xl text-[#1f2937]`
  - "by Soullabs": `text-xs text-[#6b7280] font-medium`

### Exemplo de Implementação

```tsx
{/* Sidebar */}
<div className="p-6 flex items-center gap-3">
  <div className="bg-[#4A7BA7] p-2 rounded-lg text-white shadow-md">
    <Box size={24} strokeWidth={2.5} />
  </div>
  <div>
    <span className="font-bold text-xl text-[#1f2937] block leading-none">Open Panel</span>
    <span className="text-xs text-[#6b7280] font-medium">by Soullabs</span>
  </div>
</div>

{/* Footer (Login) */}
<div className="mt-8 text-center text-xs text-[#6b7280]">
  <p>© 2024 Soullabs. All rights reserved.</p>
</div>
```

---

## 14. Responsividade

### Breakpoints (Tailwind)

| Breakpoint | Min Width | Uso |
|------------|-----------|-----|
| `sm` | 640px | Tablets pequenos |
| `md` | 768px | Tablets |
| `lg` | 1024px | Desktops pequenos |
| `xl` | 1280px | Desktops grandes |
| `2xl` | 1536px | Telas muito grandes |

### Abordagem Mobile-First

Sempre começar o design para mobile e expandir para telas maiores.

```tsx
{/* 1 coluna em mobile, 2 em tablet, 3 em desktop */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards */}
</div>
```

---

## 15. Acessibilidade

### Princípios

- **Contraste de cores**: Mínimo de 4.5:1 para texto normal, 3:1 para texto grande.
- **Foco visível**: Sempre usar `focus:ring` e `focus:outline` para navegação por teclado.
- **ARIA labels**: Usar `aria-label`, `aria-labelledby` quando necessário.
- **Semântica HTML**: Usar tags corretas (`<button>`, `<nav>`, `<main>`, etc).

### Exemplos

```tsx
{/* Botão com foco visível */}
<button className="... focus:outline-none focus:ring-4 focus:ring-[#4A7BA7]/20">
  Ação
</button>

{/* Input com label */}
<label htmlFor="email" className="block text-sm font-medium text-[#1f2937] mb-1">
  Email
</label>
<input id="email" type="email" className="..." />
```

---

## 16. Checklist de Implementação

Ao implementar uma nova tela ou componente, certifique-se de:

- [ ] Usar paleta de cores oficial (`#4A7BA7`, `#6B9B6E`, `#22c55e`, etc)
- [ ] Aplicar espaçamento modular (4px, 8px, 16px, 24px, 32px, 48px)
- [ ] Usar grid de 12 colunas para layouts responsivos
- [ ] Implementar estados de botões (normal, hover, active, disabled)
- [ ] Implementar estados de inputs (normal, foco, erro, desativado)
- [ ] Usar ícones de lucide-react com strokeWidth consistente (1.5px ou 2px)
- [ ] Adicionar transições suaves (150ms - 300ms)
- [ ] Testar responsividade em mobile, tablet e desktop
- [ ] Garantir contraste de cores adequado (acessibilidade)
- [ ] Adicionar branding "by Soullabs" quando apropriado

---

## 17. Recursos Adicionais

### Ferramentas Recomendadas

- **Paleta de cores**: [Coolors](https://coolors.co)
- **Ícones**: [Lucide React](https://lucide.dev)
- **Tipografia**: [Type Scale](https://typescale.com)
- **Acessibilidade**: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Documentação de Referência

- [Tailwind CSS](https://tailwindcss.com/docs)
- [Lucide React](https://lucide.dev/guide/packages/lucide-react)
- [React 19](https://react.dev)

---

**Documento criado por Soullabs - Versão 1.0 - 2024**
