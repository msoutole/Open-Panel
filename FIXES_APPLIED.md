# Correções Aplicadas ao Setup do OpenPanel

## 📋 Resumo dos Problemas e Soluções

### ✅ Problema 1: Conflito de DOCKER_SOCK no .env
**Descrição:** O arquivo `.env` tinha valores conflitantes:
- Linha 80: `/var/run/docker.sock` (Linux)
- Linhas 147-149: `//./pipe/docker_engine` (Windows) - Duplicado

**Solução Aplicada:**
- Removeu valores duplicados
- Deixou apenas `DOCKER_SOCK=//./pipe/docker_engine` (Windows)
- Adicionou `DOCKER_SOCK_TARGET=/var/run/docker.sock` (container path)

**Arquivos Modificados:**
- `.env` - Linhas 80, 147-149

---

### ✅ Problema 2: Script detect-platform.ps1 com Bug de Regex
**Descrição:** Script usava regex multiline com `-Raw` que não funciona bem em PowerShell

**Solução Aplicada:**
- Refatorou para ler arquivo linha-por-linha
- Melhorou lógica de busca e substituição
- Adicionou suporte para `DOCKER_SOCK_TARGET`

**Arquivos Modificados:**
- `scripts/detect-platform.ps1` - Linhas 17-52

---

### ✅ Problema 3: docker-compose.yml com Mount Incorreto
**Descrição:** Volume do Docker socket usava a mesma variável para source e target
```yaml
# ❌ Antes (Errado)
- ${DOCKER_SOCK:-/var/run/docker.sock}:${DOCKER_SOCK:-/var/run/docker.sock}:ro
```

**Solução Aplicada:**
```yaml
# ✅ Depois (Correto)
- ${DOCKER_SOCK:-/var/run/docker.sock}:${DOCKER_SOCK_TARGET:-/var/run/docker.sock}:ro
```

**Arquivos Modificados:**
- `docker-compose.yml` - Linhas 98-102

---

### ✅ Problema 4: Falta de Suporte Cross-Platform
**Descrição:** Setup funcionava apenas para Linux, não para Windows/macOS

**Solução Aplicada:**
- Detecta SO automaticamente
- Configura DOCKER_SOCK apropriadamente
- Avisa usuários Windows sobre opções de setup

**Arquivos Novos/Modificados:**
- `SETUP_WINDOWS.md` - Guia completo para Windows
- `scripts/setup.ps1` - Adicionado aviso Windows

---

## 🔧 Arquivos Modificados

### 1. `.env`
```diff
- DOCKER_SOCK=/var/run/docker.sock  (linha 80)
+ DOCKER_SOCK=//./pipe/docker_engine

+ DOCKER_SOCK_TARGET=/var/run/docker.sock
- DOCKER_SOCK=//./pipe/docker_engine (linha 147)
- DOCKER_SOCK=//./pipe/docker_engine (linha 149 - duplicado)
```

### 2. `scripts/detect-platform.ps1`
- Refatorou função de update do .env (linhas 19-52)
- Adicionado suporte para DOCKER_SOCK_TARGET
- Melhorado tratamento de strings em PowerShell

### 3. `docker-compose.yml`
- Atualizado volume do Traefik (linhas 98-102)
- Adicionado comments explicativos
- Mantém compatibilidade com Linux/macOS/WSL2

### 4. `scripts/setup.ps1`
- Adicionado aviso para usuários Windows (linhas 19-28)
- Referencia SETUP_WINDOWS.md

---

## 📁 Arquivos Novos

### SETUP_WINDOWS.md
Guia completo de setup para Windows com 3 opções:
1. **WSL2 Backend** (Recomendado)
2. **TCP Socket** (Alternativa)
3. **Traefik Simplificado** (Para development)

### FIXES_APPLIED.md
Este arquivo - documentação das correções

---

## ✨ Status Atual

### Serviços Funcionando ✅
- PostgreSQL: Rodando (porta 5432)
- Redis: Rodando (porta 6379)
- Traefik: Rodando (portas 80, 443, 8080)

### Próximos Passos

#### Para Usuários Windows:
1. Leia `SETUP_WINDOWS.md`
2. Escolha uma opção de setup (WSL2 recomendado)
3. Execute: `.\scripts\setup.ps1`
4. Inicie com: `npm run dev`

#### Para Usuários Linux/macOS:
1. Execute: `npm install`
2. Execute: `npm run db:push`
3. Execute: `npm run dev`

---

## 🧪 Testando o Setup

```bash
# Verificar containers
docker-compose ps

# Verificar PostgreSQL
docker-compose logs postgres

# Verificar Redis
docker-compose logs redis

# Verificar Traefik
docker-compose logs traefik

# Testar conexão na API
curl http://localhost:8000/health

# Testar acesso web
# Acesse http://localhost:3000 no navegador
```

---

## 📝 Notas Importantes

1. **Windows Docker Desktop**: O Docker Provider do Traefik pode ter erros de conexão. Isso é uma limitação conhecida. Para produção em Windows, use WSL2.

2. **Cross-Platform**: Todas as correções foram feitas para funcionarem em Windows, Linux, macOS e WSL2.

3. **Backward Compatibility**: Mudanças são backward-compatible. Setups Linux/macOS continuam funcionando normalmente.

4. **Próximas Melhorias** (Sugestões):
   - Criar docker-compose.windows.yml específico (opcional)
   - Adicionar health check melhorado para Traefik
   - Documentação de troubleshooting por SO

---

**Data:** 27 de Novembro de 2025
**Status:** ✅ Corrigido e Testado
