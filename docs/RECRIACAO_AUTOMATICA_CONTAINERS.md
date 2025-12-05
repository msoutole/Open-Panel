# 🔄 Recriação Automática de Containers

**Data:** 2025-12-05  
**Status:** ✅ Implementado

---

## 📋 Resumo

Todos os scripts do OpenPanel foram atualizados para recriar automaticamente os containers Docker usando `--build --force-recreate` em todas as operações de inicialização e reinicialização. Isso garante que:

1. ✅ Containers sempre usam a versão mais recente do código
2. ✅ Configurações e variáveis de ambiente são atualizadas
3. ✅ Problemas de credenciais são detectados e tratados automaticamente
4. ✅ Builds são executados automaticamente quando necessário

---

## 🔧 Funcionalidades Implementadas

### 1. Função Auxiliar `docker_compose_recreate`

Uma nova função foi adicionada em `scripts/lib/common.sh` para padronizar a recriação de containers:

```bash
docker_compose_recreate [profile] [env_file] [services]
```

**Características:**
- Usa `--build --force-recreate` automaticamente
- Detecta falhas de credenciais
- Regenera senhas automaticamente quando necessário
- Tenta múltiplas vezes com fallback

**Exemplo de uso:**
```bash
# Recriar ambiente dev
docker_compose_recreate "dev" ".env.dev"

# Recriar apenas infraestrutura
docker_compose_recreate "" "" "postgres redis traefik"
```

### 2. Tratamento de Falhas de Credenciais

Quando detectada falha de autenticação, o sistema:
1. Identifica o problema nos logs
2. Gera novas senhas automaticamente
3. Atualiza o arquivo `.env`
4. Tenta recriar containers novamente

---

## 📝 Scripts Atualizados

### Scripts Principais

#### ✅ `install-server.sh`
- Infraestrutura recriada com `--build --force-recreate`
- Tailscale recriado automaticamente

#### ✅ `restart.sh`
- Usa função `docker_compose_recreate` quando disponível
- Fallback para `docker compose up -d --build --force-recreate`

#### ✅ `start.js`
- Comandos docker compose atualizados
- Suporte para docker compose e docker-compose

#### ✅ `setup/setup.sh`
- Recria containers durante setup inicial

#### ✅ `install.sh`
- Recria containers durante instalação

### Scripts de Servidor

#### ✅ `server/start-dev.sh`
- Infraestrutura recriada
- Ambiente dev recriado com build

#### ✅ `server/start-prod.sh`
- Infraestrutura recriada
- Ambiente prod recriado com build e force-recreate

#### ✅ `server/start-pre.sh`
- Infraestrutura recriada
- Ambiente pre recriado com build e force-recreate

#### ✅ `server/start-all.sh`
- Todos os ambientes recriados automaticamente
- Infraestrutura compartilhada recriada

#### ✅ `server/restart-dev.sh`
- Faz `down` e depois `up -d --build --force-recreate`

#### ✅ `server/restart-prod.sh`
- Faz `down` e depois `up -d --build --force-recreate`

#### ✅ `server/restart-pre.sh`
- Faz `down` e depois `up -d --build --force-recreate`

#### ✅ `server/deploy-prod.sh`
- Build sem cache + recriação completa
- Verifica saúde após deploy

#### ✅ `server/deploy-pre.sh`
- Build sem cache + recriação completa

#### ✅ `server/start-adguard.sh`
- AdGuard recriado com build

### Outros Scripts

#### ✅ `deploy-ai-stack.sh`
- AI stack recriado com build e force-recreate

#### ✅ `setup/install-adguard.sh`
- AdGuard instalado com recriação

#### ✅ `utils/docker.js`
- Função `startDockerServices` atualizada
- Usa `--build --force-recreate`

---

## 🎯 Comportamento dos Comandos

### Antes
```bash
docker compose up -d
```

### Depois
```bash
docker compose up -d --build --force-recreate
```

### Com Profile e Env File
```bash
docker compose --profile dev --env-file .env.dev up -d --build --force-recreate
```

### Com Serviços Específicos
```bash
docker compose up -d --build --force-recreate postgres redis traefik
```

---

## 🔍 Detecção de Problemas de Credenciais

A função `docker_compose_recreate` detecta automaticamente problemas de autenticação:

1. **Detecção:** Verifica logs para palavras-chave:
   - "authentication"
   - "credential"
   - "password"
   - "unauthorized"

2. **Correção Automática:**
   - Gera novas senhas para PostgreSQL e Redis
   - Atualiza arquivo `.env`
   - Tenta novamente sem `--force-recreate` como fallback

3. **Fallback:**
   - Se ainda falhar, tenta apenas `up -d --build`
   - Logs detalhados para diagnóstico

---

## 📊 Fluxo de Recriação

```
1. docker compose down (parar containers existentes)
   ↓
2. docker compose up -d --build --force-recreate
   ↓
3. Se falhar → Verificar logs
   ↓
4. Se erro de credenciais → Regenerar senhas → Tentar novamente
   ↓
5. Se ainda falhar → Fallback para up -d --build
```

---

## ⚠️ Considerações Importantes

### Performance
- `--build` pode demorar mais na primeira execução
- `--force-recreate` recria containers mesmo sem mudanças
- Use apenas quando necessário para desenvolvimento/teste

### Produção
- Em produção, considere usar `--build` apenas quando houver mudanças no código
- `--force-recreate` é seguro e garante configurações atualizadas

### Volumes Persistentes
- Dados em volumes não são afetados pela recriação
- Apenas containers são recriados, volumes são mantidos

---

## 🧪 Como Testar

### Testar Recriação Manual
```bash
# Recriar ambiente dev
cd /opt/openpanel
./scripts/server/restart-dev.sh

# Verificar que containers foram recriados
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.CreatedAt}}"
```

### Testar Tratamento de Credenciais
```bash
# Simular erro de credenciais (alterar senha no .env)
sed -i 's/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=wrong_password/' .env

# Tentar iniciar (deve detectar e corrigir)
./scripts/server/start-dev.sh
```

---

## 📚 Referências

- [docker-compose.yml](../docker-compose.yml) - Configuração dos serviços
- [lib/common.sh](../scripts/lib/common.sh) - Função `docker_compose_recreate`
- [MAPEAMENTO_PORTAS.md](./MAPEAMENTO_PORTAS.md) - Portas dos serviços

---

## ✅ Checklist de Implementação

- [x] Função `docker_compose_recreate` criada
- [x] Scripts principais atualizados
- [x] Scripts de servidor atualizados
- [x] Scripts de deploy atualizados
- [x] Tratamento de credenciais implementado
- [x] Documentação criada
- [x] Testes básicos realizados

---

**Nota:** Todos os scripts agora garantem que containers sempre usem as versões mais recentes do código e configurações.

---

_Documento criado em 2025-12-05_

