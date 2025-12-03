# Zero-Downtime Deployments

## Visão Geral

O OpenPanel implementa estratégias de deployment sem interrupção usando a técnica Blue-Green Deployment, garantindo que os usuários não experimentem downtime durante atualizações.

## Blue-Green Deployment

### Como Funciona

1. **Criação do Container Green**: Um novo container é criado com a nova versão da aplicação
2. **Health Check**: O sistema verifica se o novo container está saudável
3. **Troca de Roteamento**: O tráfego é redirecionado do container antigo (blue) para o novo (green)
4. **Aguardo**: Aguarda um período configurável para garantir estabilidade
5. **Limpeza**: O container antigo é parado e removido (opcional)

### Vantagens

- ✅ **Zero Downtime**: Usuários não experimentam interrupção
- ✅ **Rollback Rápido**: Pode voltar ao container antigo rapidamente
- ✅ **Teste Antes de Trocar**: Permite validar nova versão antes de trocar tráfego
- ✅ **Isolamento**: Containers antigo e novo rodam simultaneamente durante transição

## Uso da API

### Executar Blue-Green Deployment

```bash
POST /api/builds/blue-green
```

**Body**:
```json
{
  "projectId": "proj_123",
  "newImage": "openpanel/my-app",
  "newTag": "v2.0.0",
  "envVars": {
    "NODE_ENV": "production"
  },
  "ports": [
    {
      "host": 3000,
      "container": 3000,
      "protocol": "HTTP"
    }
  ],
  "healthCheckUrl": "http://localhost:3000/health",
  "healthCheckTimeout": 30,
  "switchoverDelay": 10,
  "keepOldContainer": true
}
```

**Resposta**:
```json
{
  "message": "Blue-green deployment completed successfully",
  "deployment": {
    "success": true,
    "newContainerId": "abc123def456",
    "oldContainerId": "xyz789ghi012",
    "switchedAt": "2025-01-27T12:00:00Z"
  }
}
```

### Rollback

```bash
POST /api/builds/rollback
```

**Body**:
```json
{
  "projectId": "proj_123",
  "oldContainerId": "xyz789ghi012"
}
```

**Resposta**:
```json
{
  "message": "Rollback completed successfully",
  "rollback": {
    "success": true,
    "projectId": "proj_123",
    "oldContainerId": "xyz789ghi012"
  }
}
```

## Parâmetros de Configuração

### healthCheckUrl
URL para verificar saúde do novo container antes de trocar tráfego.

### healthCheckTimeout
Tempo máximo (em segundos) para aguardar health check passar. Padrão: 30s.

### switchoverDelay
Tempo (em segundos) para aguardar após trocar tráfego antes de parar container antigo. Padrão: 10s.

### keepOldContainer
Se `true`, mantém container antigo parado para rollback rápido. Se `false`, remove imediatamente.

## Fluxo Completo

```
1. [Blue Container] ← Tráfego atual
   ↓
2. Criar [Green Container] com nova versão
   ↓
3. Health check do Green Container
   ↓
4. Trocar roteamento: [Green Container] ← Tráfego novo
   ↓
5. Aguardar switchoverDelay segundos
   ↓
6. Parar [Blue Container]
   ↓
7. (Opcional) Remover [Blue Container]
```

## Integração com Traefik

O sistema atualiza automaticamente as configurações do Traefik para rotear tráfego para o novo container. Isso é feito através de labels Docker que o Traefik monitora.

## Limitações Atuais

- Suporta apenas um container por projeto (não suporta múltiplas réplicas ainda)
- Rolling updates requer suporte a múltiplos containers (futuro)

## Próximas Melhorias

- [ ] Rolling Updates para múltiplas réplicas
- [ ] Canary Deployments
- [ ] A/B Testing deployments
- [ ] Integração com Kubernetes (futuro)

