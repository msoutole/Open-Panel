FROM node:20-alpine

WORKDIR /app

# Copiar package.json do contexto (apps/mcp-server/)
COPY apps/mcp-server/package.json ./

RUN npm install

# Copiar código do mcp-server
COPY apps/mcp-server/ .

# Build apenas se necessário (verificar se package.json tem script build)
RUN if grep -q '"build"' package.json; then npm run build || true; fi

CMD ["npm", "start"]
