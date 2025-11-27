# Dockerfile para OpenPanel API (Produção)
FROM node:20-alpine AS builder

# Criar diretório de trabalho
WORKDIR /app

# Copiar package.json e package-lock.json (se existir)
COPY package*.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# Instalar todas as dependências (incluindo devDependencies para build)
RUN npm ci

# Copiar arquivos da aplicação
COPY . .

# Gerar o cliente Prisma
RUN npm run db:generate

# Build da aplicação API
RUN npm run build:api

# Stage 2: Imagem de produção
FROM node:20-alpine

WORKDIR /app

# Copiar package.json
COPY package*.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# Instalar apenas dependências de produção
RUN npm ci --production

# Copiar build do stage anterior
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

# Expor porta
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando para iniciar a aplicação em produção
CMD ["npm", "run", "start"]