# Módulo: Infraestrutura e Arquitetura

> **Status**: ✅ Estável
> **Versão**: 1.0
> **Última Atualização**: 2025-11-25

## 1. Visão Geral da Infraestrutura

O OpenPanel é projetado para ser **Self-Hosted** e **Single-Node** (inicialmente), com capacidade de escalar via Workers.

### Componentes Core
1. **Traefik (Reverse Proxy)**: Gerencia entrada HTTP/HTTPS, roteamento automático para containers e SSL (Let's Encrypt).
2. **PostgreSQL**: Banco de dados principal (Dados relacionais).
3. **Redis**: Cache, Sessões e Filas (BullMQ).
4. **API (Bun + Hono)**: Backend central.
5. **Frontend (React + Vite)**: Interface do usuário.
6. **Docker Engine**: Runtime para execução dos projetos dos usuários.

## 2. Backups & Recovery

### Modelo de Dados
```prisma
model Backup {
  id          String       @id @default(cuid())
  filename    String
  size        BigInt
  status      BackupStatus
  s3Key       String?      // Suporte a S3
  projectId   String
}
```

### Funcionalidades
- **Backups de Banco de Dados**: Dumps automáticos de containers de banco (Postgres, MySQL, Mongo).
- **Armazenamento**: Local (inicialmente) e S3-Compatible (MinIO, AWS, R2).
- **Restore**: Capacidade de restaurar um backup para um novo container ou sobrescrever o atual.

## 3. Auditoria (Audit Logs)

Todas as ações críticas são registradas para segurança e compliance.

```prisma
model AuditLog {
  id          String      @id @default(cuid())
  action      AuditAction // LOGIN, DEPLOY, DELETE_PROJECT...
  userId      String
  ipAddress   String?
  metadata    Json?
  createdAt   DateTime    @default(now())
}
```

## 4. Networking (Traefik)

O Traefik escuta no socket do Docker. Quando um container é iniciado com labels específicos (`traefik.enable=true`, `traefik.http.routers...`), o Traefik configura automaticamente o roteamento e solicita certificados SSL se necessário.
