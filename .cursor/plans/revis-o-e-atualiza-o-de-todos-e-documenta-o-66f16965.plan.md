<!-- 66f16965-e7e5-4acc-b7c0-b60991845987 12b3d02f-334f-4cd9-93a5-c01a5be328da -->
# Revisão Final de TODOs ESLint e Atualização de Documentação

## Objetivo

Revisar o status de implementação dos TODOs de correção ESLint, verificar se todas as correções foram aplicadas, atualizar a documentação em `docs/` e criar commit com push.

## Situação Atual

### Correções Já Realizadas

- ✅ `middlewares/audit.ts` - Corrigido (tipos ajustados)
- ✅ `routes/audit.ts` - Corrigido (tipos Prisma aplicados)
- ✅ `middlewares/error-handler.ts` - Corrigido (tipos específicos)
- ✅ `routes/builds/handlers/blue-green.ts` - Corrigido
- ✅ `routes/onboarding.ts` - Corrigido (import removido)
- ✅ `services/build.ts` - Corrigido (import removido)
- ✅ Configuração ESLint ajustada (regras menos restritivas)

### Arquivos a Verificar

#### Backend

1. `routes/auth.ts` - Verificar se há erros ESLint pendentes
2. `routes/builds/handlers/detect.ts` - Verificar status
3. `routes/containers/handlers/actions.ts` - Verificar status
4. `routes/projects/handlers/*` - Verificar todos os handlers
5. `routes/templates.ts` - Verificar status
6. `routes/webhooks.ts` - Verificar status
7. `services/*` - Verificar outros serviços
8. `websocket/*` - Verificar gateways

#### Frontend

1. `hooks/useLogs.ts` - Verificar erros
2. `hooks/useMetrics.ts` - Verificar erros
3. `hooks/useIntersectionObserver.ts` - Verificar erros
4. `i18n/formatters.ts` - Verificar erros
5. `components/CreateServiceModal.tsx` - Verificar erros
6. `components/ErrorBoundary.tsx` - Verificar erros
7. `components/TemplateDeployModal.tsx` - Verificar erros
8. `components/RedisConsole.tsx` - Verificar erros (65 mencionados)
9. `components/ServiceDetailView.tsx` - Verificar erros (107 mencionados)
10. `types.ts` - Verificar erros

## Plano de Execução

### Fase 1: Verificação Detalhada

1. Executar lint em cada arquivo mencionado nos TODOs
2. Identificar erros críticos vs warnings
3. Verificar se correções anteriores foram aplicadas

### Fase 2: Implementação de Correções (se necessário)

1. Corrigir erros críticos em arquivos de produção
2. Aplicar correções de tipos e imports não utilizados
3. Validar com type-check

### Fase 3: Atualização da Documentação

1. Atualizar `docs/ERRORS_FOUND.md` com status final
2. Atualizar `docs/RESUMO_CORRECOES_2025-12-03.md` se necessário
3. Criar resumo executivo das correções

### Fase 4: Commit e Push

1. Criar resumo das alterações
2. Gerar commit descritivo
3. Executar push

## Critérios de Sucesso

- ✅ Todos os arquivos de produção verificados
- ✅ Erros críticos corrigidos ou documentados
- ✅ Documentação atualizada
- ✅ Commit criado e push realizado

### To-dos

- [ ] Verificar erros ESLint em routes/auth.ts, detect.ts, actions.ts, projects handlers, templates.ts, webhooks.ts
- [ ] Verificar erros ESLint em services/*
- [ ] Verificar erros ESLint em websocket gateways
- [ ] Verificar erros ESLint em hooks (useLogs, useMetrics, useIntersectionObserver)
- [ ] Verificar erros ESLint em componentes (CreateServiceModal, ErrorBoundary, TemplateDeployModal, RedisConsole, ServiceDetailView)
- [ ] Verificar erros ESLint em i18n/formatters.ts e types.ts
- [ ] Corrigir erros críticos encontrados (se houver)
- [ ] Executar type-check completo para validar correções
- [ ] Atualizar documentação em docs/ com status final
- [ ] Criar resumo executivo das correções
- [ ] Criar commit e fazer push das alterações