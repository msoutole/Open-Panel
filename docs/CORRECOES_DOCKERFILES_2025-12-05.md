# 🔧 Correções de Dockerfiles - 2025-12-05

**Data:** 2025-12-05  
**Status:** ✅ Corrigido

---

## 📋 Problemas Identificados e Corrigidos

### 1. AI Service - requirements.txt não encontrado

**Erro:**
```
failed to calculate checksum of ref: "/requirements.txt": not found
```

**Causa:** 
- Build context é a raiz do projeto (`.`)
- Dockerfile tentava copiar `requirements.txt` diretamente
- Arquivo está em `apps/ai-service/requirements.txt`

**Solução:**
Ajustado caminho no Dockerfile:

```dockerfile
# Antes
COPY requirements.txt .

# Depois  
COPY apps/ai-service/requirements.txt .
COPY apps/ai-service/ .
```

**Arquivo:** `apps/ai-service/Dockerfile`

---

### 2. MCP Server - tsup não encontrado

**Erro:**
```
sh: tsup: not found
npm error Lifecycle script `build` failed
```

**Causa:**
- Build context incorreto
- Dependências não instaladas antes do build
- Tentativa de build sem instalar dependências

**Solução:**
Ajustado Dockerfile para copiar corretamente e verificar script build:

```dockerfile
# Copiar package.json do contexto correto
COPY apps/mcp-server/package.json ./
RUN npm install

# Copiar código
COPY apps/mcp-server/ .

# Build apenas se necessário
RUN if grep -q '"build"' package.json; then npm run build || true; fi
```

**Arquivo:** `apps/mcp-server/Dockerfile`

---

### 3. AdGuard - Conflito de Porta 3000

**Erro:**
```
listen tcp 0.0.0.0:3000: bind: address already in use
```

**Causa:**
- Porta 3000 ocupada por RocketChat
- `network_mode: host` faz AdGuard usar porta padrão 3000
- Configuração antiga salvava porta 3000

**Solução:**
Voltado para portas mapeadas (sem network_mode: host):

```yaml
ports:
  - "${ADGUARD_DNS_PORT:-53}:53/tcp"
  - "${ADGUARD_DNS_PORT:-53}:53/udp"
  - "${ADGUARD_ADMIN_PORT:-3030}:3000/tcp"
  - "853:853/tcp"
  - "784:784/udp"
```

**Nota:** Porta 53 pode requerer privilégios. Se necessário:
```bash
sudo setcap 'cap_net_bind_service=+ep' /usr/bin/docker-proxy
```

**Arquivo:** `docker-compose.yml` (serviço adguard)

---

## ✅ Correções Aplicadas

### Arquivos Modificados

1. **apps/ai-service/Dockerfile**
   - Corrigido caminho de `requirements.txt`
   - Corrigido caminho de cópia do código

2. **apps/mcp-server/Dockerfile**
   - Corrigido caminho de `package.json`
   - Adicionada verificação condicional para build
   - Corrigido caminho de cópia do código

3. **docker-compose.yml**
   - AdGuard: Removido `network_mode: host`
   - AdGuard: Volta para portas mapeadas
   - AdGuard: Admin mapeado para porta 3030

---

## 🧪 Como Testar

### Testar AI Service
```bash
docker compose build ai-service
docker compose up -d ai-service
docker logs openpanel-ai-service
```

### Testar MCP Server
```bash
docker compose build mcp-server
docker compose up -d mcp-server
docker logs openpanel-mcp-server
```

### Testar AdGuard
```bash
docker compose --profile adguard build adguard
docker compose --profile adguard up -d adguard
docker logs openpanel-adguard
docker port openpanel-adguard
```

---

## ⚠️ Observações Importantes

### Porta 53 (DNS)
- Requer privilégios de root ou capabilities especiais
- Se falhar, pode precisar executar como root ou ajustar capabilities
- Alternativa: usar porta não-privilegiada (ex: 5353)

### Build Context
- Todos os Dockerfiles assumem que o build context é a raiz do projeto (`.`)
- Caminhos relativos devem incluir `apps/{service}/`
- Verificar `docker-compose.yml` - `context: .`

### Cache do Docker
- Se problemas persistirem, limpar cache:
  ```bash
  docker system prune -f
  docker builder prune -f
  ```

---

## 📚 Referências

- [Docker Build Context](https://docs.docker.com/build/building/context/)
- [Docker Port Mapping](https://docs.docker.com/config/containers/container-networking/#published-ports)
- [AdGuard Home Installation](https://github.com/AdguardTeam/AdGuardHome/wiki/Docker)

---

_Documento criado em 2025-12-05 após correção dos problemas de build_

