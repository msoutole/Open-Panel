# 🔍 Revisão de Execução do OpenPanel

**Data:** 15 de Janeiro de 2025  
**Objetivo:** Garantir que o projeto OpenPanel será executado corretamente

## ✅ Correções Realizadas

### 1. Configuração de REDIS_URL
**Problema:** O REDIS_URL não incluía o número do database (0), necessário para o Redis.

**Correção:** Atualizado `scripts/utils/env.js` para incluir `/0` no final do REDIS_URL:
```env
REDIS_URL=redis://:${redisPassword}@localhost:6379/0
```

### 2. Verificação de Scripts NPM
**Status:** ✅ Todos os scripts estão configurados corretamente:
- `dev:api`: Executa `npm run dev -w apps/api` (tsx watch)
- `dev:web`: Executa `npm run dev -w apps/web` (vite)

### 3. Carregamento de Variáveis de Ambiente
**Status:** ✅ Configuração correta:
- **API:** Carrega `.env` da raiz automaticamente (ver `apps/api/src/index.ts`)
- **Web:** Configurado para carregar `.env` da raiz via `vite.config.ts` (`envDir: path.resolve(__dirname, '../..')`)
- **start.js:** Carrega `.env` antes de iniciar processos

### 4. Compatibilidade Windows
**Status:** ✅ Scripts compatíveis com Windows:
- `commandExists()` detecta Windows e usa `where` ao invés de `which`
- `spawn()` usa `shell: true` para compatibilidade Windows
- Caminhos absolutos usados quando necessário

## 📋 Checklist de Execução

### Pré-requisitos
- [x] Node.js 18+ instalado
- [x] Docker Desktop instalado e rodando
- [x] npm 10+ instalado
- [x] Permissões de escrita no diretório do projeto

### Passos de Execução
1. **Clonar/baixar o projeto**
   ```bash
   cd d:\Open-Panel
   ```

2. **Executar script de inicialização**
   ```bash
   npm start
   ```

3. **O script automaticamente:**
   - ✅ Verifica Node.js e Docker
   - ✅ Cria arquivo `.env` com valores seguros (se não existir)
   - ✅ Instala dependências npm
   - ✅ Inicia containers Docker (PostgreSQL, Redis, Traefik)
   - ✅ Configura banco de dados (Prisma)
   - ✅ Cria usuário admin padrão
   - ✅ Inicia API (porta 3001) e Web (porta 3000)

4. **Acessar aplicação:**
   - 🌐 Web Interface: http://localhost:3000
   - 🔌 API Endpoint: http://localhost:3001
   - 📊 Traefik Panel: http://localhost:8080

5. **Credenciais padrão:**
   - 📧 Email: `admin@admin.com.br`
   - 🔑 Senha: `admin123`
   - ⚠️ **ALTERE A SENHA APÓS O PRIMEIRO LOGIN!**

## 🔧 Configuração de Ambiente

### Arquivo .env
O arquivo `.env` é criado automaticamente na raiz do projeto com valores seguros:
- Senhas geradas aleatoriamente
- JWT_SECRET com 64 caracteres
- Configurações para desenvolvimento local

### Variáveis Importantes
- `DATABASE_URL`: Conecta ao PostgreSQL no container Docker via `localhost:5432`
- `REDIS_URL`: Conecta ao Redis no container Docker via `localhost:6379/0`
- `JWT_SECRET`: Chave secreta para tokens JWT (mínimo 32 caracteres)

## 🐛 Solução de Problemas

### API não inicia
1. Verifique se a porta 3001 está disponível
2. Verifique logs: `npm run dev:api` manualmente
3. Verifique se `.env` existe e tem `DATABASE_URL` válido

### Web não inicia
1. Verifique se a porta 3000 está disponível
2. Verifique logs: `npm run dev:web` manualmente
3. Verifique se `.env` tem `VITE_API_URL` configurado

### Banco de dados não conecta
1. Verifique se container PostgreSQL está rodando: `docker ps`
2. Verifique logs: `docker logs openpanel-postgres`
3. Verifique se `DATABASE_URL` no `.env` usa `localhost:5432` (não `openpanel-postgres:5432`)

### Redis não conecta
1. Verifique se container Redis está rodando: `docker ps`
2. Verifique logs: `docker logs openpanel-redis`
3. Verifique se `REDIS_URL` no `.env` inclui `/0` no final

## 📝 Notas Técnicas

### Por que localhost e não nomes de containers?
Quando a API roda localmente (não em container Docker), ela precisa se conectar aos serviços via `localhost` porque:
- Docker Desktop expõe portas dos containers para `localhost`
- A API não está na mesma rede Docker que os containers
- Isso permite desenvolvimento local sem precisar rodar API em container

### Estrutura de Carregamento de .env
```
Open-Panel/
├── .env                    ← Único arquivo de configuração
├── apps/
│   ├── api/
│   │   └── src/
│   │       └── index.ts    ← Carrega .env da raiz (linha 33)
│   └── web/
│       └── vite.config.ts ← Carrega .env da raiz (linha 9)
└── start.js                ← Carrega .env antes de iniciar processos
```

## ✅ Validação Final

Após as correções, o projeto deve:
- ✅ Iniciar corretamente com `npm start`
- ✅ Conectar ao PostgreSQL e Redis
- ✅ API responder em http://localhost:3001/health
- ✅ Web interface carregar em http://localhost:3000
- ✅ Login funcionar com credenciais padrão

## 📚 Referências

- [Manual do Usuário](./MANUAL_DO_USUARIO.md)
- [Manual Técnico](./MANUAL_TECNICO.md)
- [Guia de Desenvolvimento](./GUIA_DE_DESENVOLVIMENTO.md)
