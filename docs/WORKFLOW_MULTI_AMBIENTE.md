# 🔄 OpenPanel - Workflow Multi-Ambiente

Este documento descreve o workflow de desenvolvimento e deploy entre os ambientes dev, pre e prod.

## 🎯 Visão Geral

O OpenPanel utiliza um workflow de 3 ambientes:

```
DEV → PRE → PROD
```

Cada ambiente tem um propósito específico:
- **DEV**: Desenvolvimento ativo com hot reload
- **PRE**: Staging/Preview para testes antes de produção
- **PROD**: Produção com código validado e testado

## 📊 Fluxo de Trabalho

### 1. Desenvolvimento (DEV)

**Objetivo**: Desenvolvimento ativo com feedback imediato

**Características**:
- Hot reload habilitado
- Logs verbosos (debug)
- Volumes montados para código fonte
- Banco de dados pode ser resetado facilmente
- Sem otimizações de build

**Workflow**:

```bash
# 1. Iniciar ambiente DEV
./scripts/server/start-dev.sh

# 2. Desenvolver (editar código)
# Mudanças são refletidas automaticamente via hot reload

# 3. Testar localmente
# Acessar http://dev.openpanel.local

# 4. Commitar mudanças
git add .
git commit -m "feat: nova feature"
git push origin main
```

**Quando usar DEV**:
- Desenvolvimento de novas features
- Correção de bugs
- Experimentação
- Testes rápidos

### 2. Staging/Preview (PRE)

**Objetivo**: Validar código antes de produção

**Características**:
- Build otimizado (sem debug)
- Logs em nível info
- Dados de teste persistentes
- SSL opcional
- Ambiente similar à produção

**Workflow**:

```bash
# 1. Deploy de DEV para PRE
./scripts/server/deploy-pre.sh

# 2. Testar em PRE
# Acessar http://pre.openpanel.local

# 3. Validar funcionalidades
# - Testes manuais
# - Testes de integração
# - Validação de performance

# 4. Se tudo OK, prosseguir para PROD
# Se houver problemas, corrigir em DEV e repetir
```

**Quando usar PRE**:
- Validação antes de produção
- Testes de integração
- Demonstrações para stakeholders
- Testes de performance

### 3. Produção (PROD)

**Objetivo**: Sistema em produção

**Características**:
- Build totalmente otimizado
- Logs em nível warn/error
- SSL obrigatório (HTTPS)
- Restart automático sempre
- Monitoramento ativo
- Backups automáticos

**Workflow**:

```bash
# 1. Deploy de PRE para PROD
./scripts/server/deploy-prod.sh

# 2. Monitorar deploy
# O script verifica saúde dos serviços automaticamente

# 3. Validar produção
# Acessar https://openpanel.local

# 4. Monitorar logs
./scripts/server/logs-prod.sh -f
```

**Quando usar PROD**:
- Código validado e testado
- Apenas após aprovação em PRE
- Deploy em horários de baixo tráfego (quando possível)

## 🔄 Processo de Deploy

### Deploy DEV → PRE

```bash
./scripts/server/deploy-pre.sh
```

**O que acontece**:
1. ✅ Rebuilda containers PRE (sem cache)
2. ✅ Para serviços PRE
3. ✅ Atualiza containers PRE
4. ✅ Reinicia serviços PRE
5. ✅ Aguarda serviços estarem prontos
6. ✅ Verifica saúde dos serviços

**Tempo estimado**: 2-5 minutos

**Rollback**: Se algo der errado, simplesmente faça deploy novamente de DEV

### Deploy PRE → PROD

```bash
./scripts/server/deploy-prod.sh
```

**O que acontece**:
1. ✅ Confirmação do usuário (digite 'sim')
2. ✅ Cria backup do ambiente PROD atual
3. ✅ Rebuilda containers PROD (sem cache)
4. ✅ Para serviços PROD
5. ✅ Atualiza containers PROD
6. ✅ Reinicia serviços PROD
7. ✅ Aguarda serviços estarem prontos
8. ✅ Verifica saúde dos serviços
9. ✅ Rollback automático se houver falha

**Tempo estimado**: 3-7 minutos

**Rollback**: Automático se serviços não ficarem saudáveis

## 📋 Checklist de Deploy

### Antes de Deploy para PRE

- [ ] Código testado em DEV
- [ ] Commits feitos e push realizado
- [ ] Logs de DEV verificados (sem erros críticos)
- [ ] Funcionalidades básicas testadas

### Antes de Deploy para PROD

- [ ] Código validado em PRE
- [ ] Testes de integração passaram
- [ ] Performance aceitável
- [ ] Backup do PROD atual verificado
- [ ] Horário apropriado para deploy
- [ ] Equipe notificada sobre deploy
- [ ] Plano de rollback preparado

### Após Deploy em PROD

- [ ] Serviços estão saudáveis
- [ ] Aplicação acessível
- [ ] Funcionalidades críticas testadas
- [ ] Logs monitorados (sem erros)
- [ ] Equipe notificada sobre sucesso

## 🔙 Rollback

### Rollback Automático

O script `deploy-prod.sh` faz rollback automático se:
- Serviços não ficarem saudáveis após deploy
- Health checks falharem

### Rollback Manual

Se precisar fazer rollback manual:

```bash
# 1. Parar ambiente PROD
./scripts/server/stop-prod.sh

# 2. Restaurar backup do banco (se necessário)
docker exec -i openpanel-postgres psql -U openpanel openpanel_prod < backup.sql

# 3. Rebuildar versão anterior
git checkout <commit-anterior>
./scripts/server/start-prod.sh

# 4. Verificar
./scripts/server/status.sh
```

## 🧪 Estratégia de Testes

### DEV (Desenvolvimento)

- ✅ Testes unitários rápidos
- ✅ Testes manuais básicos
- ✅ Validação visual

### PRE (Staging)

- ✅ Testes de integração completos
- ✅ Testes end-to-end
- ✅ Testes de performance
- ✅ Validação de funcionalidades completas

### PROD (Produção)

- ✅ Smoke tests básicos
- ✅ Monitoramento contínuo
- ✅ Alertas configurados

## 📊 Monitoramento

### Logs por Ambiente

```bash
# DEV - Logs verbosos
./scripts/server/logs-dev.sh -f

# PRE - Logs informativos
./scripts/server/logs-pre.sh -f

# PROD - Logs de erro/warn
./scripts/server/logs-prod.sh -f
```

### Health Checks

```bash
# Verificar status de todos os ambientes
./scripts/server/status.sh

# Verificar saúde específica
docker ps --format "table {{.Names}}\t{{.Status}}"
```

### Métricas

- **Uptime**: Monitorar disponibilidade
- **Response Time**: Tempo de resposta da API
- **Error Rate**: Taxa de erros
- **Resource Usage**: Uso de CPU/RAM

## 🔐 Segurança

### Por Ambiente

| Ambiente | SSL | Autenticação | Acesso |
|----------|-----|--------------|--------|
| DEV | Não | Básica | Local/SSH |
| PRE | Opcional | Básica | Restrito |
| PROD | Obrigatório | Completa | Público |

### Boas Práticas

1. **DEV**: Desenvolvimento local, sem exposição pública
2. **PRE**: Acesso restrito, pode ter SSL
3. **PROD**: SSL obrigatório, firewall configurado, monitoramento ativo

## 📅 Agendamento de Deploys

### Horários Recomendados

- **DEV → PRE**: Qualquer horário (desenvolvimento contínuo)
- **PRE → PROD**: Horários de baixo tráfego (madrugada, se possível)

### Frequência

- **DEV**: Múltiplas vezes por dia (desenvolvimento ativo)
- **PRE**: Algumas vezes por semana (validação)
- **PROD**: Conforme necessário (após validação completa)

## 🚨 Troubleshooting

### Deploy Falhou

```bash
# Verificar logs
./scripts/server/logs-prod.sh

# Verificar status
./scripts/server/status.sh

# Verificar saúde dos containers
docker ps -a
```

### Serviços Não Ficam Saudáveis

```bash
# Ver logs detalhados
docker logs openpanel-api-prod

# Verificar configuração
docker compose --profile prod config

# Verificar recursos
docker stats
```

### Rollback Necessário

Siga o processo de rollback manual descrito acima.

## 📚 Recursos Adicionais

- [Guia de Instalação](./INSTALACAO_SERVIDOR.md)
- [Desenvolvimento Remoto](./DESENVOLVIMENTO_REMOTO.md)
- [Manual Técnico](./MANUAL_TECNICO.md)

## 💡 Dicas

1. **Sempre teste em PRE antes de PROD**
2. **Faça backups antes de deploys em PROD**
3. **Monitore logs após cada deploy**
4. **Tenha um plano de rollback sempre pronto**
5. **Comunique a equipe sobre deploys importantes**

