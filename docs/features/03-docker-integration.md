# Módulo: Containers e Docker

> **Status**: ✅ Estável
> **Versão**: 1.0
> **Última Atualização**: 2025-11-25

## 1. Contexto

O OpenPanel utiliza Docker como engine de orquestração. Este módulo gerencia o ciclo de vida dos containers, coleta de métricas e streaming de logs.

## 2. Modelo de Dados

```prisma
model Container {
  id              String          @id @default(cuid())
  dockerId        String          @unique
  name            String
  image           String
  status          ContainerStatus @default(CREATED)
  
  // Resources
  cpuLimit        String?
  memoryLimit     String?
  
  // Stats (Cached)
  cpuUsage        Float?
  memoryUsage     BigInt?
  
  projectId       String?
}
```

## 3. Funcionalidades

| ID              | História                   | Status   | Descrição                                           |
| --------------- | -------------------------- | -------- | --------------------------------------------------- |
| **US-CONT-001** | **Listar Containers**      | ✅ Pronto | Visualizar todos os containers gerenciados.         |
| **US-CONT-002** | **Ações de Ciclo de Vida** | ✅ Pronto | Start, Stop, Restart, Kill.                         |
| **US-CONT-003** | **Logs em Tempo Real**     | ✅ Pronto | Streaming de logs via WebSocket.                    |
| **US-CONT-004** | **Métricas**               | ✅ Pronto | Visualizar uso de CPU e RAM em tempo real.          |
| **US-CONT-005** | **Terminal Web**           | ✅ Pronto | Acesso shell ao container via navegador (xterm.js). |

## 4. Implementação Técnica

### Dockerode
O backend utiliza a biblioteca `dockerode` para comunicar com o socket do Docker (`/var/run/docker.sock` ou npipe no Windows).

### WebSockets
Logs e estatísticas são transmitidos via WebSocket para evitar polling excessivo.
- Endpoint: `/api/containers/:id/logs` (Upgrade para WS)

### Monitoramento
Um job em background (BullMQ) coleta estatísticas dos containers a cada 5 segundos e atualiza o cache (Redis/DB).
