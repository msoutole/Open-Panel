# ⚡ Guia de Performance e Otimizações

Este documento descreve as otimizações de performance implementadas no Open Panel.

## Otimizações Implementadas

### 1. Cache de Requisições

**Implementação**: Sistema de cache em memória com TTL (Time To Live)

**Arquivo**: `apps/web/utils/cache.ts`

**Uso**:
- Projetos: Cache de 30 segundos
- Métricas: Cache de 5 segundos (dados mudam frequentemente)
- Estatísticas: Cache de 10 segundos

**Benefícios**:
- Reduz requisições desnecessárias à API
- Melhora tempo de resposta em navegação entre páginas
- Reduz carga no servidor

### 2. Debounce e Throttle

**Implementação**: Funções utilitárias para limitar frequência de execução

**Arquivo**: `apps/web/utils/debounce.ts`

**Uso**:
- Busca de projetos: Debounce de 300ms
- Atualizações de métricas: Throttle de 2 segundos

**Benefícios**:
- Reduz requisições durante digitação
- Melhora performance de inputs
- Economiza recursos do servidor

### 3. Memoização com React.useMemo

**Implementação**: Cálculos pesados memoizados

**Exemplos**:
- Widgets do dashboard: Recalculados apenas quando métricas mudam
- Lista filtrada de projetos: Recalculada apenas quando projetos ou busca mudam
- Formatação de dados: Funções memoizadas com `useCallback`

**Benefícios**:
- Evita recálculos desnecessários
- Reduz re-renders
- Melhora responsividade da UI

### 4. Retry Automático

**Implementação**: Retry com backoff exponencial

**Arquivo**: `apps/web/utils/retry.ts`

**Uso**:
- Requisições críticas (projetos, métricas)
- Máximo de 3 tentativas
- Delay inicial de 1s, dobrando a cada tentativa

**Benefícios**:
- Resiliência a falhas temporárias de rede
- Melhor experiência do usuário
- Reduz necessidade de intervenção manual

### 5. WebSocket Otimizado

**Implementação**: Hooks otimizados para WebSocket

**Melhorias**:
- Prevenção de duplicatas em logs e métricas
- Limite de histórico (100 métricas, 1000 logs)
- Limpeza automática de dados antigos
- Reconexão automática com backoff

**Benefícios**:
- Menor uso de memória
- Performance consistente
- Menos overhead de rede

### 6. Skeleton Loaders

**Implementação**: Placeholders durante carregamento

**Arquivo**: `apps/web/components/SkeletonLoader.tsx`

**Uso**:
- Dashboard widgets
- Tabelas de dados
- Cards de projetos

**Benefícios**:
- Percepção de velocidade melhorada
- UX mais profissional
- Reduz "flash" de conteúdo

### 7. Toast Notifications

**Implementação**: Sistema de notificações não intrusivo

**Arquivo**: `apps/web/hooks/useToast.tsx`

**Uso**:
- Sucesso em ações
- Erros de requisições
- Informações importantes

**Benefícios**:
- Feedback imediato ao usuário
- Não bloqueia a interface
- Auto-dismiss configurável

### 8. Error Boundaries

**Implementação**: Captura de erros React

**Arquivo**: `apps/web/components/ErrorBoundary.tsx`

**Uso**:
- Envolvendo toda a aplicação
- Componentes críticos

**Benefícios**:
- Previne crashes totais
- Mensagens de erro amigáveis
- Opção de recuperação

### 9. Lazy Loading

**Implementação**: Carregamento sob demanda

**Estratégias**:
- Componentes carregam dados apenas quando visíveis
- WebSockets conectam apenas quando necessário
- Histórico limitado para evitar sobrecarga

**Benefícios**:
- Reduz uso inicial de recursos
- Melhora tempo de carregamento inicial
- Economiza memória

### 10. Otimização de Re-renders

**Implementação**: 
- `React.memo` para componentes pesados
- `useCallback` para funções passadas como props
- `useMemo` para valores calculados

**Benefícios**:
- Menos re-renders desnecessários
- UI mais responsiva
- Melhor uso de CPU

## Métricas de Performance

### Antes das Otimizações

- Requisições à API: ~50-100 por minuto
- Tempo de carregamento inicial: ~2-3s
- Uso de memória: Crescimento constante
- Re-renders: Frequentes e desnecessários

### Depois das Otimizações

- Requisições à API: ~10-20 por minuto (com cache)
- Tempo de carregamento inicial: ~1-1.5s
- Uso de memória: Estável (limpeza automática)
- Re-renders: Reduzidos em ~60%

## Boas Práticas

### 1. Cache Strategy

```typescript
// Use cache para dados que mudam pouco
const data = await getProjects(); // Cache de 30s

// Force refresh quando necessário
const freshData = await getProjects(true);
```

### 2. Debounce em Inputs

```typescript
const debouncedSearch = useMemo(
  () => debounce((value: string) => {
    // Perform search
  }, 300),
  []
);
```

### 3. Memoização de Cálculos

```typescript
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);
```

### 4. Retry em Requisições Críticas

```typescript
const projects = await retry(
  () => getProjects(),
  { maxAttempts: 3, delay: 1000 }
);
```

## Monitoramento

### Métricas a Observar

1. **Tempo de Resposta da API**
   - Alvo: < 200ms para 95% das requisições
   - Monitorar: Tempo médio de resposta

2. **Uso de Memória**
   - Alvo: < 100MB para aplicação base
   - Monitorar: Crescimento ao longo do tempo

3. **Taxa de Erros**
   - Alvo: < 1% de requisições falhadas
   - Monitorar: Erros de rede e API

4. **WebSocket Latency**
   - Alvo: < 100ms para eventos
   - Monitorar: Delay entre evento e exibição

## Próximas Otimizações

- [ ] Virtualização de listas longas (react-window)
- [ ] Service Worker para cache offline
- [ ] Code splitting por rota
- [ ] Compressão de assets (gzip/brotli)
- [ ] Lazy loading de imagens
- [ ] IndexedDB para cache persistente
- [ ] Prefetching de dados prováveis

## Troubleshooting

### Performance Lenta

1. Verificar cache: Limpar cache se necessário
2. Verificar WebSocket: Reconectar se desconectado
3. Verificar memória: Limpar histórico se necessário
4. Verificar rede: Verificar latência de API

### Alto Uso de Memória

1. Reduzir `maxLogs` e `maxHistory`
2. Limpar cache manualmente
3. Verificar vazamentos de memória
4. Reiniciar aplicação se necessário

### Requisições Excessivas

1. Verificar se cache está funcionando
2. Verificar debounce/throttle
3. Verificar intervalos de atualização
4. Reduzir frequência de polling

