<!-- c40ee9a7-36b0-4502-b71d-93c5889bb746 ebbd90fa-3880-4dc2-a9ad-8056edd12a4f -->
# Plano de Implementação: Open-Panel vs EasyPanel

## Análise Comparativa

### Funcionalidades Implementadas no Open-Panel ✅

1. **Docker Management** - ✅ Completo

   - Gerenciamento de containers via Docker API
   - Operações CRUD completas (create, start, stop, restart, pause, unpause, remove)
   - Health checks e sincronização

2. **GitHub Integration** - ✅ Parcial

   - Webhooks GitHub/GitLab/Bitbucket implementados
   - Push-to-deploy funcional
   - Falta: UI para configurar webhooks

3. **SSL Certificates** - ✅ Implementado

   - Let's Encrypt via Certbot
   - Renovação automática
   - Integração com Traefik

4. **Database Templates** - ✅ Implementado

   - PostgreSQL, MySQL, MariaDB, MongoDB, Redis
   - Deploy automatizado
   - Connection strings geradas

5. **Backups** - ✅ Implementado

   - Sistema de backups automatizados
   - Suporte S3-compatible storage

6. **Multi-user & Teams** - ✅ Implementado

   - RBAC completo
   - Teams e colaboração
   - Permissões granulares

7. **Terminal no Navegador** - ⚠️ Parcial

   - Componente WebTerminal existe mas é mockado
   - Falta integração real com containers via exec

8. **Build System** - ✅ Implementado

   - Dockerfile, Nixpacks, Paketo suportados
   - Detecção automática de tipo de projeto

### Funcionalidades FALTANTES no Open-Panel ❌

1. **Templates de Aplicações (120+ templates)**

   - Open-Panel tem apenas templates de databases
   - EasyPanel tem 120+ templates de aplicações (WordPress, Node.js, Python, PHP, Ruby, Go, Java, etc.)
   - **CRÍTICO**: Implementar sistema completo de templates de aplicações

2. **Zero-Downtime Deployments**

   - Open-Panel não implementa blue-green ou rolling updates
   - EasyPanel garante implantações sem interrupção
   - **CRÍTICO**: Implementar estratégias de deploy sem downtime

3. **2FA (Two-Factor Authentication)**

   - Open-Panel: Planejado mas não implementado
   - EasyPanel: Implementado
   - **ALTA**: Implementar TOTP (Google Authenticator)

4. **Database Client no Navegador**

   - Open-Panel: Não tem cliente web para bancos de dados
   - EasyPanel: Permite executar comandos SQL diretamente na interface
   - **MÉDIA**: Implementar clientes web para PostgreSQL, MySQL, MongoDB, Redis

5. **Terminal Real nos Containers**

   - Open-Panel: Terminal mockado
   - EasyPanel: Terminal real conectado aos containers via exec
   - **ALTA**: Integrar terminal real com Docker exec

6. **Monitoramento Avançado**

   - Open-Panel: Métricas básicas implementadas
   - EasyPanel: Monitoramento avançado com dashboards
   - **MÉDIA**: Melhorar dashboards e métricas

7. **Cloud Native Buildpacks (Heroku Buildpacks)**

   - Open-Panel: Suporta Nixpacks e Paketo
   - EasyPanel: Usa Heroku Buildpacks
   - **BAIXA**: Adicionar suporte a Heroku Buildpacks (opcional)

## Plano de Implementação Prioritizado

### FASE 1: Templates de Aplicações (CRÍTICO) 🔴

**Objetivo**: Implementar sistema completo de templates de aplicações compatível com EasyPanel

**Arquivos a Criar/Modificar**:

- `apps/api/src/services/application-templates.ts` - Novo serviço de templates
- `apps/api/src/routes/templates.ts` - Rotas para templates
- `apps/web/components/TemplateSelector.tsx` - UI para seleção de templates
- `apps/web/components/TemplateDeployModal.tsx` - Modal de deploy de template

**Templates a Implementar** (prioridade):

1. **Node.js** (Express, Next.js, NestJS)
2. **Python** (Django, Flask, FastAPI)
3. **PHP** (Laravel, WordPress, Drupal)
4. **Ruby** (Rails, Sinatra)
5. **Go** (Gin, Echo, Fiber)
6. **Java** (Spring Boot, Quarkus)
7. **WordPress** (completo com MySQL)
8. **Static Sites** (React, Vue, Angular)
9. **Databases** (já implementado, manter)

**Estrutura de Template**:

```typescript
interface ApplicationTemplate {
  id: string
  name: string
  description: string
  category: 'framework' | 'cms' | 'database' | 'static'
  language: string
  buildpack: 'dockerfile' | 'nixpacks' | 'paketo' | 'heroku'
  dockerfile?: string
  envVars: Record<string, string>
  ports: Array<{container: number, protocol: 'HTTP' | 'HTTPS' | 'TCP'}>
  volumes?: Array<{source: string, target: string}>
  healthCheck?: HealthCheckConfig
  dependencies?: string[] // IDs de templates de dependências (ex: PostgreSQL)
}
```

**Estimativa**: 16-20 horas

---

### FASE 2: Zero-Downtime Deployments (CRÍTICO) 🔴

**Objetivo**: Implementar estratégias de deploy sem interrupção

**Arquivos a Criar/Modificar**:

- `apps/api/src/services/deployment-strategy.ts` - Novo serviço de estratégias
- `apps/api/src/services/docker.ts` - Adicionar métodos para blue-green
- `apps/api/src/routes/deployments.ts` - Adicionar endpoint para estratégias

**Estratégias a Implementar**:

1. **Blue-Green Deployment**

   - Criar novo container com nova versão
   - Health check do novo container
   - Trocar roteamento (Traefik) para novo container
   - Manter container antigo por X minutos
   - Remover container antigo após confirmação

2. **Rolling Updates** (futuro)

   - Deploy gradual com múltiplas réplicas
   - Requer suporte a múltiplos containers por projeto

**Fluxo Blue-Green**:

```
1. Criar container "green" com nova versão
2. Health check do container green
3. Atualizar Traefik labels para rotear para green
4. Aguardar X segundos (configurável)
5. Parar container "blue" (antigo)
6. Remover container blue após confirmação
```

**Estimativa**: 12-16 horas

---

### FASE 3: 2FA Authentication (ALTA) 🟡

**Objetivo**: Implementar autenticação de dois fatores com TOTP

**Arquivos a Criar/Modificar**:

- `apps/api/prisma/schema.prisma` - Adicionar campos 2FA ao User
- `apps/api/src/services/totp.ts` - Novo serviço TOTP
- `apps/api/src/routes/auth.ts` - Adicionar endpoints 2FA
- `apps/web/components/TwoFactorSetup.tsx` - UI para configurar 2FA
- `apps/web/pages/Login.tsx` - Adicionar campo de código 2FA

**Implementação**:

- Usar biblioteca `otplib` para TOTP
- QR Code para Google Authenticator
- Backup codes para recuperação
- Middleware para validar 2FA em rotas protegidas

**Estimativa**: 8-10 horas

---

### FASE 4: Terminal Real nos Containers (ALTA) 🟡

**Objetivo**: Integrar terminal real conectado aos containers via Docker exec

**Arquivos a Modificar**:

- `apps/api/src/websocket/terminal-gateway.ts` - Novo gateway WebSocket para terminal
- `apps/web/components/WebTerminal.tsx` - Conectar com WebSocket real
- `apps/api/src/services/docker.ts` - Adicionar método exec para containers

**Implementação**:

- WebSocket gateway para terminal
- Docker exec para executar comandos
- Stream de stdout/stderr em tempo real
- Suporte a múltiplas sessões simultâneas

**Estimativa**: 10-12 horas

---

### FASE 5: Database Clients no Navegador (MÉDIA) 🟢

**Objetivo**: Implementar clientes web para executar queries nos bancos de dados

**Arquivos a Criar**:

- `apps/api/src/services/database-client.ts` - Serviço para executar queries
- `apps/api/src/routes/databases/query.ts` - Endpoint para executar queries
- `apps/web/components/DatabaseClient.tsx` - UI para cliente de banco
- `apps/web/components/PostgresClient.tsx` - Cliente específico PostgreSQL
- `apps/web/components/MysqlClient.tsx` - Cliente específico MySQL
- `apps/web/components/MongoClient.tsx` - Cliente específico MongoDB
- `apps/web/components/RedisClient.tsx` - Cliente específico Redis

**Bibliotecas Sugeridas**:

- PostgreSQL: `pg` (já disponível via Prisma)
- MySQL: `mysql2`
- MongoDB: `mongodb`
- Redis: `ioredis` (já disponível)

**Segurança**:

- Validação de queries (prevenir SQL injection)
- Rate limiting por usuário
- Timeout de queries
- Logs de auditoria

**Estimativa**: 12-16 horas

---

### FASE 6: Melhorias de Monitoramento (MÉDIA) 🟢

**Objetivo**: Melhorar dashboards e métricas

**Melhorias**:

- Dashboards mais detalhados
- Gráficos históricos de métricas
- Alertas configuráveis
- Exportação de métricas

**Estimativa**: 8-10 horas

---

## Resumo de Prioridades

| Prioridade | Funcionalidade | Esforço | Impacto |

|------------|----------------|---------|---------|

| 🔴 CRÍTICO | Templates de Aplicações | 16-20h | Alto |

| 🔴 CRÍTICO | Zero-Downtime Deployments | 12-16h | Alto |

| 🟡 ALTA | 2FA Authentication | 8-10h | Médio |

| 🟡 ALTA | Terminal Real | 10-12h | Médio |

| 🟢 MÉDIA | Database Clients | 12-16h | Médio |

| 🟢 MÉDIA | Monitoramento Avançado | 8-10h | Baixo |

**Total Estimado**: 66-84 horas

---

## Compatibilidade com Templates EasyPanel

Para garantir compatibilidade total, será necessário:

1. **Mapear templates EasyPanel** → Templates Open-Panel
2. **Criar migração/import** de projetos EasyPanel para Open-Panel
3. **Documentar diferenças** e melhorias do Open-Panel

---

## Próximos Passos Imediatos

1. Criar estrutura base de templates de aplicações
2. Implementar primeiro template (Node.js Express)
3. Testar deploy completo com template
4. Iterar e adicionar mais templates
5. Implementar zero-downtime deployment
6. Adicionar 2FA
7. Implementar terminal real
8. Adicionar database clients

---

**Nota**: Todas as implementações devem ser documentadas em `docs/` conforme regras do projeto.

### To-dos

- [ ] Criar sistema base de templates de aplicações (application-templates.ts, routes/templates.ts)
- [ ] Implementar templates Node.js (Express, Next.js, NestJS)
- [ ] Implementar templates Python (Django, Flask, FastAPI)
- [ ] Implementar templates PHP (Laravel, WordPress, Drupal)
- [ ] Implementar templates Ruby, Go, Java, Static Sites
- [ ] Implementar zero-downtime deployments (blue-green strategy)
- [ ] Implementar backend 2FA (TOTP service, endpoints, schema)
- [ ] Implementar frontend 2FA (setup UI, login com código)
- [ ] Implementar terminal real backend (WebSocket gateway, Docker exec)
- [ ] Conectar WebTerminal ao backend real
- [ ] Implementar backend para database clients (query execution service)
- [ ] Implementar UI para database clients (PostgreSQL, MySQL, MongoDB, Redis)
- [ ] Melhorar dashboards e métricas avançadas
- [ ] Atualizar documentação em docs/ com todas as novas funcionalidades