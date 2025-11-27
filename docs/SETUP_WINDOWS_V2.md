# OpenPanel Setup para Windows

## Problema Identificado

No Docker Desktop para Windows, o mount direto do Docker socket (`/var/run/docker.sock`) dentro de containers pode não funcionar perfeitamente, especialmente para Docker Providers como o Traefik.

## Soluções

### Opção 1: Usar WSL2 Backend (Recomendado)

A forma mais confiável é usar o **WSL2 backend** do Docker Desktop:

1. **Abrir Docker Desktop Settings**
   - Clique em Settings (engrenagem)
   - Vá para **Resources → WSL Integration**
   - Certifique-se de que WSL2 está ativado

2. **Usar WSL2 Terminal**
   ```bash
   # Abrir terminal WSL2
   wsl

   # Dentro do WSL2:
   cd /mnt/d/Open-Panel
   npm install
   npm run db:push
   npm run dev
   ```

3. **Por que funciona?**
   - WSL2 é um ambiente Linux real
   - Docker socket nativo disponível em `/var/run/docker.sock`
   - Traefik e outros serviços funcionam normalmente

### Opção 2: Habilitar TCP Socket no Docker Desktop

Se preferir usar o Windows natively:

1. **Abrir Docker Settings**
   - Settings → General
   - ✓ Marque "Expose daemon on tcp://localhost:2375"

2. **Adicionar ao `.env`**
   ```bash
   DOCKER_HOST=tcp://docker.host.internal:2375
   ```

3. **Modificar docker-compose.yml para Traefik**
   ```yaml
   traefik:
     environment:
       - DOCKER_HOST=tcp://docker.host.internal:2375
   ```

### Opção 3: Traefik Simplificado para Development

Para development local no Windows, você pode desabilitar o Docker Provider do Traefik:

```bash
# Adicionar ao .env
TRAEFIK_DOCKER_ENABLED=false
```

Depois atualizar o docker-compose.yml conforme necessário.

## Próximos Passos

1. **Escolha uma opção acima** (WSL2 é a mais robusta)
2. **Execute o setup**
   ```bash
   .\scripts\setup.ps1
   ```
3. **Inicie o desenvolvimento**
   ```bash
   npm run dev
   ```

## Verificar Setup

```bash
# Verificar Docker
docker ps
docker-compose ps

# Verificar PostgreSQL
docker-compose logs postgres

# Verificar Redis
docker-compose logs redis

# Verificar Traefik (se habilitado)
docker-compose logs traefik
```

## Troubleshooting

**Problema:** "Cannot connect to Docker daemon"
- **Solução:** Use WSL2 ou habilite TCP Socket (Opção 1 ou 2)

**Problema:** Traefik não consegue acessar Docker
- **Solução:** Desabilite Docker Provider ou use TCP Socket

**Problema:** Permissões negadas em volumes**
- **Solução:** Verifique WSL2 permissions ou use WSL2 backend

---

**Para suporte:** Abra uma issue no GitHub descrevendo seu setup
