# 💻 OpenPanel - Guia de Desenvolvimento Remoto

Este guia explica como desenvolver o OpenPanel diretamente no servidor Ubuntu usando SSH e ferramentas de desenvolvimento remoto.

## 🎯 Visão Geral

O OpenPanel suporta desenvolvimento remoto completo no servidor, permitindo:
- Desenvolvimento direto no servidor via SSH
- Hot reload automático no ambiente DEV
- Debug remoto
- Acesso a logs em tempo real
- Desenvolvimento de outros projetos no mesmo servidor

## 🔌 Configuração SSH

### Conectar ao Servidor

```bash
ssh usuario@seu-servidor
```

### Configurar Chave SSH (Opcional)

Para evitar digitar senha toda vez:

```bash
# No seu computador local
ssh-keygen -t ed25519 -C "seu-email@exemplo.com"
ssh-copy-id usuario@seu-servidor

# Agora você pode conectar sem senha
ssh usuario@seu-servidor
```

### Configurar SSH Config (Opcional)

Crie/edite `~/.ssh/config` no seu computador local:

```
Host openpanel-server
    HostName seu-servidor
    User usuario
    Port 22
    IdentityFile ~/.ssh/id_ed25519
```

Agora você pode conectar com:
```bash
ssh openpanel-server
```

## 🛠️ VS Code Remote SSH

### Instalação

1. Instale a extensão **Remote - SSH** no VS Code
2. Abra a paleta de comandos (Ctrl+Shift+P)
3. Digite "Remote-SSH: Connect to Host"
4. Selecione seu servidor ou adicione um novo

### Configuração

1. Conecte ao servidor via Remote SSH
2. Abra a pasta do projeto: `/opt/openpanel` (ou onde você clonou)
3. VS Code instalará automaticamente o servidor remoto

### Extensões Recomendadas

Instale as seguintes extensões no VS Code (elas serão instaladas no servidor remoto):

- **ESLint**: Linting de código
- **Prettier**: Formatação de código
- **TypeScript**: Suporte TypeScript
- **Docker**: Gerenciamento de containers
- **GitLens**: Visualização Git

### Desenvolvimento com VS Code Remote

1. **Abrir Terminal**: Terminal integrado do VS Code conecta diretamente ao servidor
2. **Editar Código**: Edições são feitas diretamente no servidor
3. **Hot Reload**: Mudanças são refletidas automaticamente no ambiente DEV
4. **Debug**: Configure breakpoints e debug remotamente

## 🔥 Workflow de Desenvolvimento

### 1. Iniciar Ambiente DEV

```bash
# No servidor
cd /opt/openpanel
./scripts/server/start-dev.sh
```

O ambiente DEV tem hot reload habilitado, então mudanças no código são refletidas automaticamente.

### 2. Desenvolver

```bash
# Editar código (via VS Code Remote ou editor de sua escolha)
nano apps/api/src/routes/example.ts

# Ou usar VS Code Remote para editar visualmente
```

### 3. Ver Logs em Tempo Real

```bash
# Terminal 1: Logs da API
./scripts/server/logs-dev.sh -f | grep api-dev

# Terminal 2: Logs do Web
./scripts/server/logs-dev.sh -f | grep web-dev
```

### 4. Testar Mudanças

Acesse http://dev.openpanel.local e teste suas mudanças. O hot reload atualiza automaticamente.

### 5. Commitar Mudanças

```bash
# Verificar mudanças
git status

# Adicionar arquivos
git add .

# Commitar
git commit -m "feat: descrição da mudança"

# Push (se tiver repositório remoto configurado)
git push origin main
```

## 🐛 Debug Remoto

### Debug da API

1. **Configurar VS Code**: Crie `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "attach",
      "name": "Attach to API",
      "address": "localhost",
      "port": 9229,
      "localRoot": "${workspaceFolder}",
      "remoteRoot": "/app",
      "protocol": "inspector"
    }
  ]
}
```

2. **Modificar Dockerfile.dev** para habilitar debug:

```dockerfile
CMD ["node", "--inspect=0.0.0.0:9229", "node_modules/.bin/tsx", "watch", "apps/api/src/index.ts"]
```

3. **Expor porta de debug** no docker-compose.yml:

```yaml
api-dev:
  ports:
    - "9229:9229"  # Porta de debug
```

4. **Iniciar debug** no VS Code: F5

### Debug do Web (Frontend)

O Vite já tem suporte a debug nativo. Use as DevTools do navegador.

## 📊 Acessar Logs

### Logs por Ambiente

```bash
# DEV
./scripts/server/logs-dev.sh

# PRE
./scripts/server/logs-pre.sh

# PROD
./scripts/server/logs-prod.sh
```

### Logs Específicos

```bash
# Apenas API DEV
docker logs openpanel-api-dev -f

# Apenas Web DEV
docker logs openpanel-web-dev -f

# Apenas PostgreSQL
docker logs openpanel-postgres -f
```

### Logs do Sistema

```bash
# Logs do Docker
sudo journalctl -u docker -f

# Logs do sistema
sudo journalctl -f
```

## 🔄 Hot Reload

### Como Funciona

O ambiente DEV monta volumes com o código fonte:

```yaml
volumes:
  - ./apps/api:/app/apps/api
  - ./packages:/app/packages
```

Quando você edita um arquivo:
1. O arquivo é salvo no servidor
2. O `tsx watch` detecta a mudança
3. A aplicação é recarregada automaticamente
4. Mudanças são refletidas imediatamente

### Verificar Hot Reload

1. Edite um arquivo em `apps/api/src/`
2. Veja os logs: `./scripts/server/logs-dev.sh -f`
3. Você verá mensagens como: `[tsx] watching /app/apps/api/src/...`

## 🗂️ Estrutura de Desenvolvimento

### Organização de Arquivos

```
/opt/openpanel/
├── apps/
│   ├── api/          # Backend - edite aqui
│   └── web/          # Frontend - edite aqui
├── packages/
│   └── shared/       # Código compartilhado
├── scripts/
│   └── server/       # Scripts de gerenciamento
└── docs/             # Documentação
```

### Desenvolvimento de Outros Projetos

O OpenPanel gerencia containers Docker. Você pode desenvolver outros projetos no mesmo servidor:

1. **Criar projeto separado**:
   ```bash
   mkdir -p /opt/meu-projeto
   cd /opt/meu-projeto
   ```

2. **Usar OpenPanel para gerenciar**: O OpenPanel pode gerenciar containers de outros projetos via interface web

3. **Isolamento**: Cada projeto pode ter seus próprios ambientes (dev/pre/prod)

## 🔧 Comandos Úteis

### Desenvolvimento

```bash
# Ver status de todos os ambientes
./scripts/server/status.sh

# Reiniciar apenas API DEV
docker restart openpanel-api-dev

# Rebuildar containers DEV
docker compose --profile dev build --no-cache

# Executar comandos dentro do container
docker exec -it openpanel-api-dev sh
```

### Banco de Dados

```bash
# Acessar Prisma Studio (DEV)
docker exec -it openpanel-api-dev npm run db:studio

# Rodar migrações (DEV)
docker exec -it openpanel-api-dev npm run db:push

# Backup do banco DEV
docker exec openpanel-postgres pg_dump -U openpanel openpanel_dev > backup-dev.sql
```

### Git

```bash
# Verificar status
git status

# Ver diferenças
git diff

# Criar branch
git checkout -b feat/nova-feature

# Commitar
git add .
git commit -m "feat: nova feature"

# Push
git push origin feat/nova-feature
```

## 🚀 Deploy de Mudanças

### Workflow Recomendado

1. **Desenvolver em DEV**: Faça suas mudanças no ambiente DEV
2. **Testar em DEV**: Valide que tudo funciona
3. **Deploy para PRE**: `./scripts/server/deploy-pre.sh`
4. **Testar em PRE**: Valide em ambiente de staging
5. **Deploy para PROD**: `./scripts/server/deploy-prod.sh`

Veja mais detalhes em [WORKFLOW_MULTI_AMBIENTE.md](./WORKFLOW_MULTI_AMBIENTE.md).

## 🐛 Troubleshooting

### Hot Reload não funciona

```bash
# Verificar se volumes estão montados
docker inspect openpanel-api-dev | grep Mounts

# Reiniciar container DEV
./scripts/server/restart-dev.sh
```

### Mudanças não aparecem

```bash
# Verificar se arquivo foi salvo
ls -la apps/api/src/seu-arquivo.ts

# Verificar logs
./scripts/server/logs-dev.sh -f
```

### Erro de permissão

```bash
# Verificar permissões
ls -la apps/api/src/

# Corrigir permissões
sudo chown -R $USER:$USER apps/
```

### Container não inicia

```bash
# Ver logs detalhados
docker logs openpanel-api-dev

# Verificar configuração
docker compose --profile dev config
```

## 📚 Recursos Adicionais

- [Guia de Instalação](./INSTALACAO_SERVIDOR.md)
- [Workflow Multi-Ambiente](./WORKFLOW_MULTI_AMBIENTE.md)
- [Manual Técnico](./MANUAL_TECNICO.md)
- [Guia de Desenvolvimento](./GUIA_DE_DESENVOLVIMENTO.md)

