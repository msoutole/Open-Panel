# 🔒 Guia de Segurança - OpenPanel

## ⚠️ CRÍTICO: Credenciais Expostas no Histórico do Git

### 🚨 Problema Identificado

**STATUS ATUAL**: O arquivo `apps/api/.env` contém credenciais reais de produção:
- `POSTGRES_PASSWORD`: `f2AgzjjK2jyni0IpviJZJRmb85pylpmA`
- `REDIS_PASSWORD`: `wCdpMQXhnVQjAGaiQmymJXY58y1Vst2Y`
- `JWT_SECRET`: `a3a0cc602d8712fe8541c1d935993f31722047667dfc465aaf80ae2e29a1f0ad`
- `GEMINI_API_KEY`: `your-gemini-api-key` (parece conter uma chave real)

**⚠️ CRÍTICO**: Se este arquivo foi commitado no Git, TODAS estas credenciais estão COMPROMETIDAS!

Se este arquivo (ou qualquer arquivo `.env`) foi commitado anteriormente com credenciais reais, essas credenciais estão **permanentemente no histórico do Git**, mesmo que o arquivo tenha sido removido ou adicionado ao `.gitignore` posteriormente.

**⚠️ AÇÃO IMEDIATA NECESSÁRIA**: Estas credenciais estão COMPROMETIDAS e devem ser rotacionadas IMEDIATAMENTE!

**Credenciais que podem ter sido expostas:**
- `POSTGRES_PASSWORD` - Senha do banco de dados PostgreSQL
- `REDIS_PASSWORD` - Senha do Redis
- `JWT_SECRET` - Chave secreta para tokens JWT
- `DATABASE_URL` - URL completa com senha do banco de dados
- `REDIS_URL` - URL completa com senha do Redis

### ✅ Verificação Automática

Execute o script de verificação para detectar credenciais expostas:

```bash
# Linux/macOS
npm run check-secrets
# ou
bash scripts/check-secrets.sh

# Windows
npm run check-secrets:win
# ou
powershell scripts/check-secrets.ps1
```

### 🚨 Ação Imediata Necessária

**Se credenciais foram commitadas, você DEVE:**

1. **Rotacionar TODAS as credenciais expostas IMEDIATAMENTE:**
   ```bash
   # Linux/macOS - Script automatizado
   bash scripts/rotate-credentials.sh
   
   # Ou manualmente:
   # 1. Gere novas senhas
   # 2. Atualize o .env da raiz
   # 3. Execute: docker-compose down -v && docker-compose up -d
   # 4. Execute: npm start para sincronizar
   ```
   
   **Credenciais que DEVEM ser rotacionadas:**
   - `POSTGRES_PASSWORD` - Senha do PostgreSQL
   - `REDIS_PASSWORD` - Senha do Redis  
   - `JWT_SECRET` - Chave secreta JWT (todos os tokens serão invalidados)
   - `DATABASE_URL` - Contém a senha do PostgreSQL
   - `REDIS_URL` - Contém a senha do Redis
   - `GEMINI_API_KEY` - Se presente, chave da API do Google Gemini

2. **Limpar o histórico do Git** (se o repositório for privado ou você tiver controle total):
   ```bash
   # Script automatizado (Linux/macOS)
   bash scripts/remove-secrets-from-history.sh
   
   # OU manualmente usando git-filter-repo:
   git filter-repo --path apps/api/.env --invert-paths
   git filter-repo --path apps/web/.env.local --invert-paths
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   ```
   
   ⚠️ **AVISO**: Limpar o histórico reescreve o Git e requer force push!

3. **Se o repositório for público:**
   - ⚠️ **Considere o repositório como COMPROMETIDO**
   - Rotacione TODAS as credenciais IMEDIATAMENTE
   - Notifique todos os usuários sobre a exposição
   - Considere criar um novo repositório
   - Revise logs de acesso para atividade suspeita

### ✅ Prevenção

**NUNCA commite arquivos `.env` com credenciais reais:**

- ✅ Use apenas `.env.example` com placeholders
- ✅ Garanta que `.env` está no `.gitignore`
- ✅ Verifique `git status` antes de commitar
- ✅ Use `git-secrets` ou similar para prevenir commits acidentais

### 📋 Checklist de Segurança

Antes de fazer commit, verifique:

- [ ] Nenhum arquivo `.env` está sendo commitado
- [ ] Apenas `.env.example` com placeholders está no repositório
- [ ] Nenhuma senha, token ou chave secreta está hardcoded no código
- [ ] Credenciais de produção nunca são commitadas

### 🔄 Rotação de Credenciais

Se credenciais foram expostas:

1. **PostgreSQL:**
   ```bash
   # No .env da raiz, altere POSTGRES_PASSWORD
   # Execute: docker-compose down -v && docker-compose up -d
   ```

2. **Redis:**
   ```bash
   # No .env da raiz, altere REDIS_PASSWORD
   # Execute: docker-compose down -v && docker-compose up -d
   ```

3. **JWT:**
   ```bash
   # No .env da raiz, gere nova JWT_SECRET:
   # node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   # Todos os tokens JWT existentes serão invalidados
   ```

### 📖 Recursos

- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [Git: Rewriting History](https://git-scm.com/book/en/v2/Git-Tools-Rewriting-History)

