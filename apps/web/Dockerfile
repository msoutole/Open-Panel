# Dockerfile para OpenPanel Web (Produção)
# Stage 1: Builder
FROM node:20-alpine AS builder

# Criar diretório de trabalho
WORKDIR /app

# Copiar package.json e package-lock.json (se existir)
COPY package*.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# Instalar dependências
RUN npm ci

# Copiar arquivos da aplicação
COPY . .

# Construir a aplicação Web
RUN npm run build:web

# Stage 2: Nginx para servir aplicação estática
FROM nginx:alpine

# Copiar configuração customizada do nginx
COPY --from=builder /app/apps/web/nginx.conf /etc/nginx/conf.d/default.conf 2>/dev/null || \
  echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
      try_files $uri $uri/ /index.html; \
    } \
    location /api { \
      proxy_pass http://openpanel-api:3001; \
      proxy_http_version 1.1; \
      proxy_set_header Upgrade $http_upgrade; \
      proxy_set_header Connection "upgrade"; \
      proxy_set_header Host $host; \
      proxy_set_header X-Real-IP $remote_addr; \
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
      proxy_set_header X-Forwarded-Proto $scheme; \
    } \
  }' > /etc/nginx/conf.d/default.conf

# Copiar build do stage anterior
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Expor porta
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Comando para iniciar nginx
CMD ["nginx", "-g", "daemon off;"]