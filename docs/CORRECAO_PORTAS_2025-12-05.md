# 🔧 Correção de Portas - OpenPanel

**Data:** 2025-12-05  
**Status:** ✅ Concluído

---

## 📋 Resumo

Foram identificados e corrigidos conflitos de portas no arquivo `docker-compose.yml`. Todas as portas foram mapeadas corretamente e documentadas.

---

## ⚠️ Problemas Identificados

### Conflitos de Portas

1. **Web Pre e API Dev:** Ambos usavam porta 3001
   - Web Pre: `3001:80` ❌
   - API Dev: `3001:3001` ✅

2. **Web Prod e API Pre:** Ambos usavam porta 3002
   - Web Prod: `3002:80` ❌
   - API Pre: `3002:3001` ✅

3. **AdGuard e Web Dev:** Ambos usavam porta 3000
   - AdGuard Admin: `3000:3000` ❌
   - Web Dev: `3000:3000` ✅

4. **MCP Server e Web Prod:** Ambos usavam porta 3005 no host
   - MCP Server: `3005:3005` ❌
   - Web Prod: `3005:80` (após correção) ✅

---

## ✅ Correções Aplicadas

### 1. Web Pre
**Antes:**
```yaml
ports:
  - "3001:80"
```

**Depois:**
```yaml
ports:
  - "3003:80"
```

**Justificativa:** Libera porta 3001 para API Dev, usa 3003 no host.

### 2. API Prod
**Antes:**
```yaml
environment:
  - API_PORT=3003
ports:
  - "3003:3001"
```

**Depois:**
```yaml
environment:
  - API_PORT=3001
ports:
  - "3004:3001"
```

**Justificativa:** 
- Porta interna permanece 3001 (padrão)
- Porta host alterada para 3004 (libera 3003 para Web Pre)

### 3. Web Prod
**Antes:**
```yaml
ports:
  - "3002:80"
```

**Depois:**
```yaml
ports:
  - "3005:80"
```

**Justificativa:** Libera porta 3002 para API Pre, usa 3005 no host.

### 4. AdGuard Admin
**Antes:**
```yaml
ports:
  - "3000:3000/tcp"
```

**Depois:**
```yaml
ports:
  - "${ADGUARD_ADMIN_PORT:-3030}:3000/tcp"
```

**Justificativa:** 
- Usa variável de ambiente `ADGUARD_ADMIN_PORT` com padrão 3030
- Evita conflito com Web Dev na porta 3000
- Porta interna permanece 3000 (AdGuard requer)

### 5. MCP Server
**Antes:**
```yaml
ports:
  - "3005:3005"
```

**Depois:**
```yaml
ports:
  - "${MCP_SERVER_PORT:-3006}:3005"
```

**Justificativa:**
- Usa variável de ambiente `MCP_SERVER_PORT` com padrão 3006
- Evita conflito com Web Prod na porta 3005
- Porta interna permanece 3005

---

## 📊 Mapeamento Final de Portas

| Serviço | Porta Host | Porta Container | Status |
|---------|-----------|-----------------|--------|
| Traefik HTTP | 80 | 80 | ✅ |
| Traefik HTTPS | 443 | 443 | ✅ |
| Traefik Dashboard | 8080 | 8080 | ✅ |
| PostgreSQL | 5432 | 5432 | ✅ |
| Redis | 6379 | 6379 | ✅ |
| **Web Dev** | 3000 | 3000 | ✅ |
| **API Dev** | 3001 | 3001 | ✅ |
| **API Pre** | 3002 | 3001 | ✅ |
| **Web Pre** | 3003 | 80 | ✅ |
| **API Prod** | 3004 | 3001 | ✅ |
| **Web Prod** | 3005 | 80 | ✅ |
| Ollama | 11434 | 11434 | ✅ |
| MongoDB | 27017 | 27017 | ✅ |
| AI Service | 8000 | 8000 | ✅ |
| **MCP Server** | 3006 | 3005 | ✅ |
| AdGuard DNS | 53 | 53 | ✅ |
| **AdGuard Admin** | 3030 | 3000 | ✅ |
| AdGuard DoH | 853 | 853 | ✅ |
| AdGuard DoQ | 784 | 784 | ✅ |

---

## 🔧 Alterações no .env

As seguintes variáveis foram atualizadas no arquivo `.env`:

```bash
# Antes
ADGUARD_ADMIN_PORT=3000

# Depois
ADGUARD_ADMIN_PORT=3030
MCP_SERVER_PORT=3006
```

---

## 📁 Arquivos Modificados

1. **docker-compose.yml**
   - Web Pre: porta 3001 → 3003
   - API Prod: porta 3003 → 3004
   - Web Prod: porta 3002 → 3005
   - AdGuard Admin: porta 3000 → variável ADGUARD_ADMIN_PORT (padrão: 3030)
   - MCP Server: porta 3005 → variável MCP_SERVER_PORT (padrão: 3006)

2. **.env**
   - ADGUARD_ADMIN_PORT: 3000 → 3030
   - Adicionada MCP_SERVER_PORT=3006

3. **docs/MAPEAMENTO_PORTAS.md** (criado)
   - Documentação completa de todas as portas

4. **docs/CORRECAO_PORTAS_2025-12-05.md** (criado)
   - Este documento com detalhes das correções

---

## ✅ Validação

Para validar que não há mais conflitos:

```bash
# Verificar portas em uso
sudo netstat -tulpn | grep LISTEN | grep -E ":(3000|3001|3002|3003|3004|3005|3006|3030)"

# Verificar portas dos containers
sudo docker ps --format "table {{.Names}}\t{{.Ports}}"
```

---

## 📚 Referências

- [MAPEAMENTO_PORTAS.md](./MAPEAMENTO_PORTAS.md) - Mapeamento completo de todas as portas
- [docker-compose.yml](../docker-compose.yml) - Arquivo de configuração corrigido

---

## 🎯 Próximos Passos

1. ✅ Todas as portas corrigidas e documentadas
2. ⏳ Reiniciar containers se necessário para aplicar mudanças:
   ```bash
   sudo docker compose down
   sudo docker compose --profile dev up -d
   ```
3. ⏳ Atualizar documentação de acesso aos serviços se necessário

---

**Nota:** As mudanças nas portas de produção (prod) e preview (pre) não afetam o ambiente de desenvolvimento atual (dev) que está em execução.

---

_Documento criado em 2025-12-05_

