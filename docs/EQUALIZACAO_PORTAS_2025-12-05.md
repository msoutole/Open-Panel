# ⚖️ Equalização de Portas - 2025-12-05

**Data:** 2025-12-05  
**Objetivo:** Verificar e ajustar mapeamento de portas do servidor

---

## 📊 Status Atual das Portas

### ✅ Portas Configuradas Corretamente

| Porta | Serviço | Container | Status |
|-------|---------|-----------|--------|
| 80 | Traefik HTTP | openpanel-traefik | ✅ OK |
| 443 | Traefik HTTPS | openpanel-traefik | ✅ OK |
| 8080 | Traefik Dashboard | openpanel-traefik | ✅ OK |
| 3001 | API Dev | openpanel-api-dev | ✅ OK |
| 5432 | PostgreSQL | openpanel-postgres | ✅ OK |
| 6379 | Redis | openpanel-redis | ✅ OK |

### ⚠️ Portas com Conflitos ou Observações

| Porta | Serviço Esperado | Serviço Atual | Status |
|-------|------------------|---------------|--------|
| 3000 | Web Dev (OpenPanel) | RocketChat Server | ⚠️ Conflito |
| 27017 | MongoDB (OpenPanel) | MongoDB (Host) | ⚠️ Conflito |
| 53, 3030, 853, 784 | AdGuard | Container sem portas expostas | ⚠️ Verificar |

---

## 🔍 Análise Detalhada

### 1. Porta 3000 - RocketChat vs Web Dev

**Situação:**
- RocketChat Server está rodando na porta 3000 via snap
- OpenPanel Web Dev está configurado para usar porta 3000
- Conflito potencial se Web Dev for iniciado

**Soluções Possíveis:**

#### Opção A: Manter RocketChat na 3000, mover Web Dev
```yaml
# docker-compose.yml - web-dev
ports:
  - "3010:3000"  # Usar porta 3010 no host
```

#### Opção B: Parar RocketChat, usar 3000 para Web Dev
```bash
sudo snap stop rocketchat-server
# Ou desabilitar completamente
sudo snap disable rocketchat-server
```

#### Opção C: Usar Traefik para roteamento
- RocketChat continua na 3000
- Web Dev usa Traefik para acesso via domínio
- Sem conflito direto

**Recomendação:** Opção C (usar Traefik) - Mais flexível e não quebra RocketChat

### 2. Porta 27017 - MongoDB Host vs Docker

**Situação:**
- MongoDB rodando no host (provavelmente usado pelo RocketChat)
- OpenPanel configurado para usar MongoDB via Docker
- Conflito se container MongoDB for iniciado

**Soluções Possíveis:**

#### Opção A: Manter MongoDB no host, usar no OpenPanel
```bash
# Atualizar DATABASE_URL no .env para usar host
DATABASE_URL=mongodb://admin:password@localhost:27017/openpanel
```

#### Opção B: Parar MongoDB do host, usar Docker
```bash
# Parar MongoDB do host
sudo systemctl stop mongod  # Se usar systemd
# Ou
sudo pkill mongod

# Iniciar container MongoDB
docker compose up -d mongo
```

#### Opção C: Usar porta diferente para MongoDB Docker
```yaml
# docker-compose.yml - mongo
ports:
  - "27018:27017"  # Usar 27018 no host
```

**Recomendação:** Opção C (porta diferente) - Mantém ambos funcionando

### 3. AdGuard - Portas Não Expostas

**Situação:**
- Container `openpanel-adguard` está rodando
- Portas não aparecem no `docker ps`
- Possível problema de configuração

**Verificação:**
```bash
# Verificar se container está realmente usando portas
docker inspect openpanel-adguard | grep -A 10 Ports

# Verificar logs
docker logs openpanel-adguard

# Recriar com portas
docker compose --profile adguard down
docker compose --profile adguard up -d --build --force-recreate adguard
```

---

## ✅ Equalização Aplicada

### Ajustes no docker-compose.yml

#### 1. MongoDB - Porta Alternativa (se necessário)
```yaml
mongo:
  ports:
    - "${MONGO_PORT:-27018}:27017"  # Mudança: 27017 -> 27018 no host
```

#### 2. Web Dev - Usar Traefik (recomendado)
```yaml
web-dev:
  # Não expor porta diretamente, usar apenas Traefik
  # Remover linha: ports: - "3000:3000"
  labels:
    - "traefik.http.routers.web-dev.rule=Host(`dev.openpanel.local`)"
```

#### 3. Verificar AdGuard
```bash
# Script de verificação
./scripts/server/start-adguard.sh
docker port openpanel-adguard
```

---

## 📋 Checklist de Equalização

### Verificações Realizadas
- [x] Portas em uso mapeadas (netstat/ss)
- [x] Containers Docker verificados
- [x] Conflitos identificados
- [x] Documentação criada

### Ajustes Recomendados
- [ ] Decidir sobre porta 3000 (RocketChat vs Web Dev)
- [ ] Decidir sobre MongoDB (host vs Docker vs porta diferente)
- [ ] Verificar e corrigir AdGuard
- [ ] Testar configurações após ajustes

### Testes Necessários
- [ ] Iniciar Web Dev e verificar conflitos
- [ ] Iniciar MongoDB Docker e verificar conflitos
- [ ] Testar AdGuard após correção
- [ ] Verificar Traefik roteando corretamente

---

## 🎯 Próximos Passos

1. **Imediato:** Documentar decisões sobre portas 3000 e 27017
2. **Curto Prazo:** Ajustar docker-compose.yml conforme decisões
3. **Médio Prazo:** Criar script de validação de portas
4. **Longo Prazo:** Automatizar detecção e resolução de conflitos

---

## 📚 Referências

- [MAPEAMENTO_PORTAS_SERVIDOR.md](./MAPEAMENTO_PORTAS_SERVIDOR.md) - Mapeamento real do servidor
- [MAPEAMENTO_PORTAS.md](./MAPEAMENTO_PORTAS.md) - Mapeamento teórico
- [docker-compose.yml](../docker-compose.yml) - Configuração atual

---

_Documento criado em 2025-12-05 após verificação completa_

