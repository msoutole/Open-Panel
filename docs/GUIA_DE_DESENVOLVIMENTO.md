# 👨‍💻 OpenPanel - Guia de Desenvolvimento

Este guia destina-se a desenvolvedores e agentes de IA que desejam contribuir com o OpenPanel.

---

## 🤖 Agentes de IA

O OpenPanel é desenvolvido com uma abordagem "AI-First". Definimos papéis claros para agentes de IA:

### Papéis
1. **Gestor (Orquestrador)**: Planeja tarefas, mantém o contexto e garante a integridade do monorepo.
2. **Especialista Backend**: Foca em Hono, Prisma, Docker e lógica de negócios.
3. **Especialista Frontend**: Foca em React, TailwindCSS, UX e integração com API.

### Convenções
- **Idioma**: Português Brasileiro (pt-BR).
- **Commits**: Semantic Commits (ex: `feat: add login`, `fix: resolve auth bug`).
- **Arquivos**: Nomes em `kebab-case`.

---

## 🛠️ Padrões de Código

### Backend (Node.js/Hono)
- **Tipagem**: Use `zod` para validação de entrada e saída.
- **Erros**: Use `HTTPException` do Hono para erros HTTP.
- **Serviços**: Lógica de negócios deve ficar em `src/services/`, não nos controllers.
- **Env**: Use `env.ts` para acessar variáveis de ambiente de forma tipada.

### Frontend (React)
- **Componentes**: Funcionais com Hooks.
- **Estilos**: TailwindCSS (evite CSS puro ou Modules, exceto se necessário).
- **Estado**: React Query para dados do servidor, Context API para estado global simples.

---

## ✅ Checklist de Testes

Antes de submeter um PR, verifique:

### Backend
- [ ] Rotas retornam status codes corretos (200, 201, 400, 401, 404, 500).
- [ ] Validação de entrada (Zod) está funcionando.
- [ ] Tratamento de erros captura exceções não tratadas.
- [ ] Autenticação/Autorização verificada em rotas protegidas.

### Frontend
- [ ] Layout responsivo não quebra em mobile.
- [ ] Formulários têm validação e feedback visual.
- [ ] Loading states são exibidos durante requisições.
- [ ] Erros de API são mostrados ao usuário (Toasts).

---

## 🔄 Refatoração e Melhores Práticas

### Exemplo de Refatoração
Evite funções gigantes. Quebre em funções menores e puras sempre que possível.

**Ruim:**
```typescript
async function processOrder(req) {
  // 200 linhas de validação, busca no banco, cálculo, envio de email...
}
```

**Bom:**
```typescript
async function processOrder(req) {
  const data = validateOrder(req);
  const user = await getUser(data.userId);
  const total = calculateTotal(data.items);
  await saveOrder(user, total);
  await sendEmail(user);
}
```

### Correções TypeScript Comuns
- Evite `any`. Use `unknown` se não souber o tipo e faça narrowing.
- Use `interface` para objetos públicos e `type` para uniões/interseções.
- Em `try/catch`, o erro é `unknown`. Verifique `if (error instanceof Error)`.

---

## 📦 Templates de Aplicação

O OpenPanel suporta templates para deploy rápido (ex: WordPress, Node.js, Python).

### Adicionando um Novo Template
Edite `apps/api/src/services/application-templates.ts` e adicione ao array `APPLICATION_TEMPLATES`:

```typescript
{
  id: 'novo-template',
  name: 'Novo Template',
  category: 'framework',
  // ... configurações
}
```

---

## 📝 Comandos Úteis

- **Iniciar tudo**: `npm start`
- **Dev API**: `npm run dev:api`
- **Dev Web**: `npm run dev:web`
- **Banco de Dados**: `npm run db:studio` (Interface visual)

> Para detalhes da arquitetura, consulte o [Manual Técnico](./MANUAL_TECNICO.md).
