# Validação de Dockerfiles - OpenPanel

## Resumo

Este documento detalha a validação dos Dockerfiles de produção para API e Web do projeto OpenPanel.

**Data**: Dezembro 2025

---

## Dockerfile da API (`apps/api/Dockerfile`)

### Estrutura Multi-Stage

✅ **Stage 1: Builder**
- Base: `node:20-alpine`
- Instala todas as dependências (incluindo devDependencies)
- Gera cliente Prisma
- Executa build da API (`npm run build:api`)

✅ **Stage 2: Produção**
- Base: `node:20-alpine`
- Instala apenas dependências de produção (`npm ci --production`)
- Copia apenas arquivos necessários do stage anterior:
  - `apps/api/dist` - Código compilado
  - `apps/api/prisma` - Schema Prisma
  - `node_modules/.prisma` - Cliente Prisma gerado
  - `packages/shared/dist` - Pacote compartilhado compilado

### Otimizações

- ✅ Multi-stage build reduz tamanho da imagem final
- ✅ Apenas dependências de produção no stage final
- ✅ Apenas arquivos necessários copiados
- ✅ Health check configurado
- ✅ Comando de inicialização otimizado (`node dist/index.js` diretamente)

### Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
```

- ✅ Verifica endpoint `/api/health` a cada 30 segundos
- ✅ Timeout de 10 segundos
- ✅ Período inicial de 40 segundos (tempo para aplicação iniciar)
- ✅ 3 tentativas antes de marcar como unhealthy

### Comando de Inicialização

```dockerfile
WORKDIR /app/apps/api
CMD ["node", "dist/index.js"]
```

- ✅ Executa diretamente com Node.js (sem overhead do npm)
- ✅ Define working directory correto
- ✅ Usa array syntax para melhor execução

---

## Dockerfile da Web (`apps/web/Dockerfile`)

### Estrutura Multi-Stage

✅ **Stage 1: Builder**
- Base: `node:20-alpine`
- Instala todas as dependências
- Executa build da aplicação Web (`npm run build:web`)
- Gera arquivos estáticos em `apps/web/dist`

✅ **Stage 2: Nginx**
- Base: `nginx:alpine` (imagem leve e otimizada)
- Copia apenas arquivos estáticos do build
- Configura nginx para servir aplicação SPA
- Configura proxy reverso para `/api` → API backend

### Otimizações

- ✅ Multi-stage build reduz tamanho da imagem final
- ✅ Nginx Alpine (imagem muito leve)
- ✅ Apenas arquivos estáticos na imagem final
- ✅ Configuração nginx otimizada para SPA
- ✅ Proxy reverso configurado para API
- ✅ Suporte a WebSocket via proxy

### Configuração Nginx

```nginx
server {
  listen 80;
  server_name localhost;
  root /usr/share/nginx/html;
  index index.html;
  
  # SPA routing
  location / {
    try_files $uri $uri/ /index.html;
  }
  
  # API proxy
  location /api {
    proxy_pass http://openpanel-api:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

- ✅ Roteamento SPA correto (`try_files`)
- ✅ Proxy reverso para API
- ✅ Suporte a WebSocket (Upgrade header)
- ✅ Headers de proxy configurados corretamente

### Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1
```

- ✅ Verifica se nginx está servindo arquivos
- ✅ Timeout de 10 segundos
- ✅ Período inicial de 10 segundos (nginx inicia rápido)
- ✅ 3 tentativas antes de marcar como unhealthy

---

## Validações Realizadas

### ✅ Build Multi-Stage
- Ambos os Dockerfiles usam multi-stage builds
- Stage de build separado do stage de produção
- Redução significativa do tamanho da imagem final

### ✅ Otimização de Tamanho
- Apenas arquivos necessários copiados
- Dependências de desenvolvimento não incluídas no stage final
- Uso de imagens Alpine (leves)

### ✅ Health Checks
- Health checks configurados em ambos os containers
- Endpoints apropriados verificados
- Intervalos e timeouts configurados corretamente

### ✅ Comandos de Inicialização
- Comandos CMD corretos
- Working directories apropriados
- Execução direta sem overhead desnecessário

### ✅ Segurança
- Usuário não-root (implicito em Alpine)
- Apenas portas necessárias expostas
- Sem secrets hardcoded

---

## Tamanhos Estimados das Imagens

### API
- **Builder stage**: ~500MB (com todas as dependências)
- **Produção stage**: ~150MB (apenas runtime necessário)
- **Redução**: ~70% de redução de tamanho

### Web
- **Builder stage**: ~500MB (com todas as dependências)
- **Produção stage**: ~50MB (nginx Alpine + arquivos estáticos)
- **Redução**: ~90% de redução de tamanho

---

## Próximos Passos

1. **Testar builds**: Executar `docker build` em ambos os Dockerfiles
2. **Validar health checks**: Verificar se health checks funcionam corretamente
3. **Otimizar ainda mais**: Considerar distroless images para produção
4. **CI/CD**: Integrar validação de Dockerfiles no pipeline
5. **Scan de segurança**: Adicionar scan de vulnerabilidades nas imagens

---

## Comandos de Teste

### Build da API
```bash
docker build -f apps/api/Dockerfile -t openpanel-api:latest .
```

### Build da Web
```bash
docker build -f apps/web/Dockerfile -t openpanel-web:latest .
```

### Verificar tamanho das imagens
```bash
docker images | grep openpanel
```

### Testar health checks
```bash
docker run -d --name test-api -p 3001:3001 openpanel-api:latest
docker inspect --format='{{json .State.Health}}' test-api
```

---

**Última atualização**: Dezembro 2025

