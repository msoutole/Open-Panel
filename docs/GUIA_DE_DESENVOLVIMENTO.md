# 👨‍💻 OpenPanel - Guia de Desenvolvimento

Este guia destina-se a desenvolvedores e agentes de IA que desejam contribuir com o OpenPanel.

---

## 🤖 Agentes de IA

O OpenPanel é desenvolvido com uma abordagem "AI-First". Definimos papéis claros para agentes de IA:

### Papéis
1. **Gestor (Orquestrador)**: Planeja tarefas, mantém o contexto e garante a integridade do monorepo.
2. **Especialista Backend**: Foca em Hono, Prisma, Docker e lógica de negócios.
3. **Especialista Frontend**: Foca em React, TailwindCSS, UX e integração com API.
4. **QA Specialist**: Testes automatizados e validação de qualidade.
5. **Security Auditor**: Revisão de segurança e compliance.

### Convenções
- **Idioma**: Português Brasileiro (pt-BR) para documentação e comentários.
- **Commits**: Semantic Commits (ex: `feat: add login`, `fix: resolve auth bug`).
- **Arquivos**: Nomes em `kebab-case` para arquivos, `PascalCase` para componentes.

---

## 🛠️ Padrões de Código

### Backend (Node.js/Hono)

#### Estrutura de Rotas
```typescript
// apps/api/src/routes/example/index.ts
import { Hono } from 'hono';
import { listHandler } from './handlers/list';
import { createHandler } from './handlers/create';

const example = new Hono();

example.get('/', listHandler);
example.post('/', createHandler);

export default example;
```

#### Validação com Zod
```typescript
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

const createSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['WEB', 'API', 'DATABASE']),
});

example.post('/', zValidator('json', createSchema), createHandler);
```

#### Tratamento de Erros
```typescript
import { HTTPException } from 'hono/http-exception';

if (!resource) {
  throw new HTTPException(404, { message: 'Recurso não encontrado' });
}
```

#### Variáveis de Ambiente
```typescript
// SEMPRE use o env tipado
import { env } from '@/lib/env';

const dbUrl = env.DATABASE_URL; // Tipado e validado
```

### Frontend (React)

#### Componentes Funcionais
```typescript
interface Props {
  title: string;
  onClose: () => void;
}

export function Modal({ title, onClose }: Props) {
  const LL = useTranslations();
  
  return (
    <div className="modal">
      <h2>{title}</h2>
      <button onClick={onClose}>{LL.common.close()}</button>
    </div>
  );
}
```

#### Hooks Customizados
```typescript
// Sempre com null safety
export function useLogs(containerId: string) {
  const [logs, setLogs] = useState<Log[]>([]);
  
  useEffect(() => {
    if (logs.length > 0 && logs[0]?.id === newLog.id) {
      return; // Evitar duplicatas
    }
    // ...
  }, [containerId]);
  
  return logs;
}
```

---

## ✅ Checklist de Testes

Antes de submeter um PR, verifique:

### Backend
- [ ] Rotas retornam status codes corretos (200, 201, 400, 401, 404, 500).
- [ ] Validação de entrada (Zod) está funcionando.
- [ ] Tratamento de erros captura exceções não tratadas.
- [ ] Autenticação/Autorização verificada em rotas protegidas.
- [ ] WebSocket handlers têm tratamento de erro.

### Frontend
- [ ] Layout responsivo não quebra em mobile.
- [ ] Formulários têm validação e feedback visual.
- [ ] Loading states são exibidos durante requisições.
- [ ] Erros de API são mostrados ao usuário (Toasts).
- [ ] Componentes têm tipos TypeScript corretos.
- [ ] Traduções existem em pt-BR e en.

---

## 🔄 Fluxo de Desenvolvimento

### 1. Criar Branch
```bash
git checkout -b feat/nome-da-feature
```

### 2. Desenvolver
```bash
npm run dev        # API + Web
npm run type-check # Validar tipos
```

### 3. Testar
```bash
npm run test -w apps/api
```

### 4. Commit
```bash
git add .
git commit -m "feat: descrição clara da mudança"
```

### 5. Push e PR
```bash
git push origin feat/nome-da-feature
```

---

## 📦 Templates de Aplicação

O OpenPanel suporta templates para deploy rápido.

### Adicionando um Novo Template
Edite `apps/api/src/services/application-templates.ts`:

```typescript
{
  id: 'novo-template',
  name: 'Novo Template',
  description: 'Descrição breve',
  category: 'framework',
  icon: 'Code',
  defaultPort: 3000,
  dockerImage: 'user/image:tag',
  envVars: [
    { key: 'NODE_ENV', value: 'production', required: true }
  ],
  healthCheck: {
    path: '/health',
    interval: 30
  }
}
```

---

## 📝 Comandos Úteis

```bash
# Inicialização
npm start                    # Tudo automático

# Desenvolvimento
npm run dev                  # API + Web
npm run dev:api              # Apenas API
npm run dev:web              # Apenas Web

# Banco de Dados
npm run db:generate          # Gerar Prisma Client
npm run db:push              # Sincronizar schema
npm run db:studio            # Interface visual

# Qualidade
npm run type-check           # Verificar tipos
npm run lint                 # ESLint
npm run lint:fix             # Corrigir lint
npm run test -w apps/api     # Testes
```

---

## 🐛 Debug

### Logs Estruturados
```typescript
import { logInfo, logError } from '@/lib/logger';

logInfo('Operação iniciada', { userId, action: 'create' });
logError('Falha na operação', error, { context: 'deploy' });
```

### Type Check por Workspace
```bash
npm run type-check -w apps/api
npm run type-check -w apps/web
npm run type-check -w packages/shared
```

---

> Para detalhes da arquitetura, consulte o [Manual Técnico](./MANUAL_TECNICO.md).
