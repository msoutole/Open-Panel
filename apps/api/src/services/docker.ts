import Docker from 'dockerode'
import { prisma } from '../lib/prisma'
import type { ContainerStatus } from '@prisma/client'
import { logWarn, logError, logInfo } from '../lib/logger'

/**
 * DockerService - Manages Docker daemon integration
 * Provides methods for container lifecycle management, monitoring, and logging
 */
export class DockerService {
  private docker: Docker
  private static instance: DockerService

  private constructor() {
    // Initialize Docker connection
    // Try socket first (Unix/Linux), fallback to TCP (Windows/Remote)
    const isWindows = process.platform === 'win32'
    const defaultSocketPath = isWindows ? '//./pipe/docker_engine' : '/var/run/docker.sock'
    const socketPath = process.env.DOCKER_SOCKET_PATH || defaultSocketPath

    try {
      this.docker = new Docker({ socketPath })
    } catch (error) {
      logWarn('Failed to connect via socket, trying TCP...')
      this.docker = new Docker({
        host: process.env.DOCKER_HOST || 'localhost',
        port: parseInt(process.env.DOCKER_PORT || '2375'),
      })
    }
  }

  /**
   * Get singleton instance of DockerService
   * 
   * **Fluxo de Execução**:
   * 1. Verifica se já existe uma instância
   * 2. Cria nova instância se não existir
   * 3. Retorna a instância singleton
   * 
   * @returns Instância singleton do DockerService
   * 
   * @example
   * ```typescript
   * const dockerService = DockerService.getInstance()
   * ```
   */
  public static getInstance(): DockerService {
    if (!DockerService.instance) {
      DockerService.instance = new DockerService()
    }
    return DockerService.instance
  }

  /**
   * Verifica a saúde do daemon Docker
   * 
   * **Fluxo de Execução**:
   * 1. Envia ping para o daemon Docker
   * 2. Retorna true se o daemon responder
   * 3. Retorna false e registra erro se falhar
   * 
   * **Uso**:
   * - Health checks do sistema
   * - Validação antes de operações críticas
   * 
   * @returns Promise que resolve para true se o Docker está saudável, false caso contrário
   * 
   * @throws Não lança exceções, apenas retorna false em caso de erro
   * 
   * @example
   * ```typescript
   * const isHealthy = await dockerService.healthCheck()
   * if (!isHealthy) {
   *   console.error('Docker daemon não está respondendo')
   * }
   * ```
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.docker.ping()
      return true
    } catch (error) {
      logError('Docker health check failed', error)
      return false
    }
  }

  /**
   * Obtém informações do sistema Docker
   * 
   * **Fluxo de Execução**:
   * 1. Consulta informações do daemon Docker
   * 2. Retorna dados sobre CPU, memória, containers, imagens, etc.
   * 
   * **Informações Retornadas**:
   * - Número de containers, imagens, volumes
   * - Uso de CPU e memória do host
   * - Versão do Docker
   * - Sistema operacional
   * 
   * @returns Promise que resolve para objeto com informações do sistema Docker
   * 
   * @throws {Error} Se não conseguir conectar ao daemon Docker
   * 
   * @example
   * ```typescript
   * const info = await dockerService.getSystemInfo()
   * console.log(`Docker version: ${info.ServerVersion}`)
   * console.log(`Containers: ${info.Containers}`)
   * ```
   */
  async getSystemInfo() {
    return await this.docker.info()
  }

  /**
   * Lista todos os containers (rodando e parados)
   * 
   * **Fluxo de Execução**:
   * 1. Consulta containers no Docker
   * 2. Aplica filtros se fornecidos
   * 3. Retorna lista de containers
   * 
   * **Filtros Disponíveis**:
   * - `status`: ['running', 'exited', 'paused']
   * - `label`: ['key=value']
   * - `name`: ['container-name']
   * 
   * @param options - Opções de listagem
   * @param options.all - Se true, inclui containers parados (padrão: true)
   * @param options.filters - Filtros Docker no formato Record<string, string[]>
   * @returns Promise que resolve para array de containers Docker
   * 
   * @throws {Error} Se não conseguir conectar ao daemon Docker
   * 
   * @example
   * ```typescript
   * // Listar todos os containers
   * const all = await dockerService.listContainers()
   * 
   * // Listar apenas containers rodando
   * const running = await dockerService.listContainers({
   *   filters: { status: ['running'] }
   * })
   * ```
   */
  async listContainers(options?: { all?: boolean; filters?: Record<string, string[]> }) {
    const containers = await this.docker.listContainers({
      all: options?.all ?? true,
      filters: options?.filters,
    })

    return containers
  }

  /**
   * Obtém informações detalhadas de um container pelo Docker ID
   * 
   * **Fluxo de Execução**:
   * 1. Busca container pelo Docker ID
   * 2. Executa inspect para obter detalhes completos
   * 3. Retorna informações ou null se não encontrado
   * 
   * **Informações Retornadas**:
   * - Estado atual (running, exited, paused)
   * - Configuração (imagem, comandos, variáveis de ambiente)
   * - Recursos (CPU, memória, portas, volumes)
   * - Timestamps (criado, iniciado, finalizado)
   * 
   * @param dockerId - ID do container Docker (hash completo ou prefixo)
   * @returns Promise que resolve para objeto de inspeção do container ou null se não encontrado
   * 
   * @throws {Error} Se ocorrer erro diferente de 404 (container não encontrado)
   * 
   * @example
   * ```typescript
   * const container = await dockerService.getContainer('abc123def456')
   * if (container) {
   *   console.log(`Status: ${container.State.Status}`)
   *   console.log(`Image: ${container.Config.Image}`)
   * }
   * ```
   */
  async getContainer(dockerId: string) {
    try {
      const container = this.docker.getContainer(dockerId)
      const inspect = await container.inspect()
      return inspect
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 404) {
        return null
      }
      throw error
    }
  }

  /**
   * Cria um novo container Docker
   * 
   * **Fluxo de Execução**:
   * 1. Valida opções fornecidas
   * 2. Faz pull da imagem se necessário
   * 3. Prepara configurações de portas, volumes e variáveis de ambiente
   * 4. Cria container no Docker
   * 5. Salva informações no banco de dados
   * 
   * **Recursos Configuráveis**:
   * - Limites de CPU (formato: "1000m" = 1 CPU)
   * - Limites de memória (formato: "512m", "1g")
   * - Portas (mapeamento host:container)
   * - Volumes (bind mounts)
   * - Variáveis de ambiente
   * 
   * @param options - Opções de criação do container
   * @param options.name - Nome único do container
   * @param options.image - Nome da imagem Docker (sem tag)
   * @param options.tag - Tag da imagem (padrão: 'latest')
   * @param options.cmd - Comando a executar no container
   * @param options.env - Variáveis de ambiente (chave-valor)
   * @param options.ports - Array de mapeamentos de porta {host, container, protocol}
   * @param options.volumes - Array de volumes {source, target, mode}
   * @param options.cpuLimit - Limite de CPU (ex: "1000m")
   * @param options.memoryLimit - Limite de memória (ex: "512m")
   * @param options.projectId - ID do projeto associado (opcional)
   * @returns Promise que resolve para container criado no banco de dados
   * 
   * @throws {Error} Se a imagem não existir e não conseguir fazer pull
   * @throws {Error} Se o nome do container já estiver em uso
   * @throws {Error} Se houver erro ao criar o container
   * 
   * @example
   * ```typescript
   * const container = await dockerService.createContainer({
   *   name: 'my-app',
   *   image: 'node',
   *   tag: '20-alpine',
   *   cmd: ['node', 'server.js'],
   *   env: { NODE_ENV: 'production' },
   *   ports: [{ host: 3000, container: 3000 }],
   *   cpuLimit: '1000m',
   *   memoryLimit: '512m',
   *   projectId: 'proj_123'
   * })
   * ```
   */
  async createContainer(options: {
    name: string
    image: string
    tag?: string
    cmd?: string[]
    env?: Record<string, string>
    ports?: Array<{ host: number; container: number; protocol?: string }>
    volumes?: Array<{ source: string; target: string; mode?: string }>
    cpuLimit?: string
    memoryLimit?: string
    projectId?: string
  }) {
    const {
      name,
      image,
      tag = 'latest',
      cmd,
      env,
      ports,
      volumes,
      cpuLimit,
      memoryLimit,
      projectId,
    } = options

    const fullImage = `${image}:${tag}`

    // Pull image if not exists
    await this.pullImage(fullImage)

    // Prepare port bindings
    const portBindings: any = {}
    const exposedPorts: any = {}
    if (ports) {
      ports.forEach((port) => {
        const containerPort = `${port.container}/${port.protocol || 'tcp'}`
        exposedPorts[containerPort] = {}
        portBindings[containerPort] = [{ HostPort: port.host.toString() }]
      })
    }

    // Prepare volume bindings
    const binds: string[] = []
    if (volumes) {
      volumes.forEach((vol) => {
        binds.push(`${vol.source}:${vol.target}:${vol.mode || 'rw'}`)
      })
    }

    // Prepare environment variables
    const envVars: string[] = []
    if (env) {
      Object.entries(env).forEach(([key, value]) => {
        envVars.push(`${key}=${value}`)
      })
    }

    // Create container
    const container = await this.docker.createContainer({
      name,
      Image: fullImage,
      Cmd: cmd,
      Env: envVars,
      ExposedPorts: exposedPorts,
      HostConfig: {
        PortBindings: portBindings,
        Binds: binds,
        Memory: this.parseMemoryLimit(memoryLimit),
        NanoCpus: this.parseCpuLimit(cpuLimit),
      },
    })

    const inspect = await container.inspect()

    // Save to database
    const dbContainer = await prisma.container.create({
      data: {
        dockerId: inspect.Id,
        name: inspect.Name.replace('/', ''),
        image,
        imageTag: tag,
        status: this.mapDockerStatus(inspect.State),
        command: cmd?.join(' '),
        cpuLimit,
        memoryLimit,
        ports: ports ? JSON.parse(JSON.stringify(ports)) : undefined,
        volumes: volumes ? JSON.parse(JSON.stringify(volumes)) : undefined,
        envVars: env ? JSON.parse(JSON.stringify(env)) : undefined,
        projectId,
        startedAt: inspect.State.StartedAt ? new Date(inspect.State.StartedAt) : null,
        finishedAt: inspect.State.FinishedAt ? new Date(inspect.State.FinishedAt) : null,
        exitCode: inspect.State.ExitCode ?? null,
      },
    })

    return dbContainer
  }

  /**
   * Inicia um container Docker parado
   * 
   * **Fluxo de Execução**:
   * 1. Busca container pelo Docker ID
   * 2. Inicia o container no Docker
   * 3. Atualiza status no banco de dados para 'RUNNING'
   * 4. Atualiza timestamp de início
   * 
   * **Comportamento**:
   * - Container deve estar em estado 'CREATED' ou 'EXITED'
   * - Se já estiver rodando, não faz nada
   * - Atualiza automaticamente o banco de dados
   * 
   * @param dockerId - ID do container Docker a iniciar
   * @returns Promise que resolve para informações atualizadas do container
   * 
   * @throws {Error} Se o container não existir
   * @throws {Error} Se houver erro ao iniciar o container
   * 
   * @example
   * ```typescript
   * const container = await dockerService.startContainer('abc123def456')
   * console.log(`Container iniciado: ${container.State.Status}`)
   * ```
   */
  async startContainer(dockerId: string) {
    const container = this.docker.getContainer(dockerId)
    await container.start()

    // Update database
    await prisma.container.update({
      where: { dockerId },
      data: {
        status: 'RUNNING',
        startedAt: new Date(),
      },
    })

    return await container.inspect()
  }

  /**
   * Para um container Docker em execução
   * 
   * **Fluxo de Execução**:
   * 1. Busca container pelo Docker ID
   * 2. Envia sinal SIGTERM para parar graciosamente
   * 3. Aguarda timeout (padrão: 10s)
   * 4. Se não parar, envia SIGKILL
   * 5. Atualiza status no banco de dados para 'EXITED'
   * 
   * **Comportamento**:
   * - Tenta parada graciosa primeiro (SIGTERM)
   * - Força parada após timeout se necessário (SIGKILL)
   * - Atualiza timestamp de finalização no banco
   * 
   * @param dockerId - ID do container Docker a parar
   * @param timeout - Tempo em segundos para aguardar parada graciosa (padrão: 10)
   * @returns Promise que resolve para informações atualizadas do container
   * 
   * @throws {Error} Se o container não existir
   * @throws {Error} Se houver erro ao parar o container
   * 
   * @example
   * ```typescript
   * // Parar com timeout padrão (10s)
   * await dockerService.stopContainer('abc123def456')
   * 
   * // Parar com timeout customizado (5s)
   * await dockerService.stopContainer('abc123def456', 5)
   * ```
   */
  async stopContainer(dockerId: string, timeout = 10) {
    const container = this.docker.getContainer(dockerId)
    await container.stop({ t: timeout })

    // Update database
    await prisma.container.update({
      where: { dockerId },
      data: {
        status: 'EXITED',
        finishedAt: new Date(),
      },
    })

    return await container.inspect()
  }

  /**
   * Reinicia um container Docker
   * 
   * **Fluxo de Execução**:
   * 1. Para o container (se estiver rodando)
   * 2. Inicia o container novamente
   * 3. Atualiza status no banco de dados para 'RUNNING'
   * 
   * **Comportamento**:
   * - Funciona mesmo se o container já estiver parado
   * - Reinicia com as mesmas configurações originais
   * - Atualiza timestamp de início no banco
   * 
   * @param dockerId - ID do container Docker a reiniciar
   * @param timeout - Tempo em segundos para aguardar parada antes de reiniciar (padrão: 10)
   * @returns Promise que resolve para informações atualizadas do container
   * 
   * @throws {Error} Se o container não existir
   * @throws {Error} Se houver erro ao reiniciar o container
   * 
   * @example
   * ```typescript
   * const container = await dockerService.restartContainer('abc123def456')
   * console.log(`Container reiniciado: ${container.State.Status}`)
   * ```
   */
  async restartContainer(dockerId: string, timeout = 10) {
    const container = this.docker.getContainer(dockerId)
    await container.restart({ t: timeout })

    // Update database
    await prisma.container.update({
      where: { dockerId },
      data: {
        status: 'RUNNING',
        startedAt: new Date(),
      },
    })

    return await container.inspect()
  }

  /**
   * Pausa um container Docker em execução
   * 
   * **Fluxo de Execução**:
   * 1. Busca container pelo Docker ID
   * 2. Pausa o container (congela processos)
   * 3. Atualiza status no banco de dados para 'PAUSED'
   * 
   * **Comportamento**:
   * - Container deve estar em estado 'RUNNING'
   * - Processos são congelados (não consomem CPU)
   * - Memória permanece alocada
   * - Pode ser retomado com unpauseContainer()
   * 
   * @param dockerId - ID do container Docker a pausar
   * @returns Promise que resolve para informações atualizadas do container
   * 
   * @throws {Error} Se o container não existir
   * @throws {Error} Se o container não estiver rodando
   * @throws {Error} Se houver erro ao pausar o container
   * 
   * @example
   * ```typescript
   * await dockerService.pauseContainer('abc123def456')
   * ```
   */
  async pauseContainer(dockerId: string) {
    const container = this.docker.getContainer(dockerId)
    await container.pause()

    await prisma.container.update({
      where: { dockerId },
      data: { status: 'PAUSED' },
    })

    return await container.inspect()
  }

  /**
   * Retoma um container Docker pausado
   * 
   * **Fluxo de Execução**:
   * 1. Busca container pelo Docker ID
   * 2. Retoma o container (descongela processos)
   * 3. Atualiza status no banco de dados para 'RUNNING'
   * 
   * **Comportamento**:
   * - Container deve estar em estado 'PAUSED'
   * - Processos são descongelados e continuam execução
   * - Restaura estado anterior à pausa
   * 
   * @param dockerId - ID do container Docker a retomar
   * @returns Promise que resolve para informações atualizadas do container
   * 
   * @throws {Error} Se o container não existir
   * @throws {Error} Se o container não estiver pausado
   * @throws {Error} Se houver erro ao retomar o container
   * 
   * @example
   * ```typescript
   * await dockerService.unpauseContainer('abc123def456')
   * ```
   */
  async unpauseContainer(dockerId: string) {
    const container = this.docker.getContainer(dockerId)
    await container.unpause()

    await prisma.container.update({
      where: { dockerId },
      data: { status: 'RUNNING' },
    })

    return await container.inspect()
  }

  /**
   * Remove um container Docker
   * 
   * **Fluxo de Execução**:
   * 1. Busca container pelo Docker ID
   * 2. Para o container se estiver rodando (se force=true)
   * 3. Remove o container do Docker
   * 4. Remove registro do banco de dados
   * 
   * **Comportamento**:
   * - Por padrão, só remove containers parados
   * - Com force=true, para e remove containers rodando
   * - Remove completamente do Docker e banco de dados
   * 
   * @param dockerId - ID do container Docker a remover
   * @param force - Se true, força remoção mesmo se container estiver rodando (padrão: false)
   * @returns Promise que resolve para objeto {success: true}
   * 
   * @throws {Error} Se o container não existir
   * @throws {Error} Se container estiver rodando e force=false
   * @throws {Error} Se houver erro ao remover o container
   * 
   * @example
   * ```typescript
   * // Remover container parado
   * await dockerService.removeContainer('abc123def456')
   * 
   * // Forçar remoção de container rodando
   * await dockerService.removeContainer('abc123def456', true)
   * ```
   */
  async removeContainer(dockerId: string, force = false) {
    const container = this.docker.getContainer(dockerId)
    await container.remove({ force })

    // Remove from database
    await prisma.container.delete({
      where: { dockerId },
    })

    return { success: true }
  }

  /**
   * Obtém logs de um container Docker
   * 
   * **Fluxo de Execução**:
   * 1. Busca container pelo Docker ID
   * 2. Consulta logs com opções especificadas
   * 3. Retorna logs como string UTF-8
   * 
   * **Opções de Filtro**:
   * - `tail`: Número de linhas do final (padrão: 100)
   * - `since`: Timestamp Unix para logs desde (opcional)
   * - `until`: Timestamp Unix para logs até (opcional)
   * - `stdout`: Incluir stdout (padrão: true)
   * - `stderr`: Incluir stderr (padrão: true)
   * - `timestamps`: Incluir timestamps (padrão: true)
   * 
   * @param dockerId - ID do container Docker
   * @param options - Opções de consulta de logs
   * @param options.stdout - Incluir stdout (padrão: true)
   * @param options.stderr - Incluir stderr (padrão: true)
   * @param options.tail - Número de linhas do final (padrão: 100)
   * @param options.since - Timestamp Unix para logs desde
   * @param options.until - Timestamp Unix para logs até
   * @param options.timestamps - Incluir timestamps (padrão: true)
   * @returns Promise que resolve para string com logs do container
   * 
   * @throws {Error} Se o container não existir
   * @throws {Error} Se houver erro ao consultar logs
   * 
   * @example
   * ```typescript
   * // Obter últimas 100 linhas
   * const logs = await dockerService.getContainerLogs('abc123def456')
   * 
   * // Obter últimas 50 linhas sem timestamps
   * const logs = await dockerService.getContainerLogs('abc123def456', {
   *   tail: 50,
   *   timestamps: false
   * })
   * ```
   */
  async getContainerLogs(
    dockerId: string,
    options?: {
      stdout?: boolean
      stderr?: boolean
      tail?: number
      since?: number
      until?: number
      timestamps?: boolean
    }
  ) {
    const container = this.docker.getContainer(dockerId)
    const logs = await container.logs({
      stdout: options?.stdout ?? true,
      stderr: options?.stderr ?? true,
      tail: options?.tail ?? 100,
      since: options?.since,
      until: options?.until,
      timestamps: options?.timestamps ?? true,
    })

    return logs.toString('utf-8')
  }

  /**
   * Transmite logs de um container em tempo real (para WebSocket)
   * 
   * **Fluxo de Execução**:
   * 1. Busca container pelo Docker ID
   * 2. Inicia stream de logs com follow=true
   * 3. Registra callback para cada chunk recebido
   * 4. Retorna stream para controle externo
   * 
   * **Comportamento**:
   * - Stream continua até ser interrompido
   * - Callback é chamado para cada linha de log
   * - Útil para WebSocket ou Server-Sent Events
   * - Stream deve ser fechado manualmente quando não precisar mais
   * 
   * @param dockerId - ID do container Docker
   * @param callback - Função chamada para cada chunk de log recebido
   * @param options - Opções de stream
   * @param options.stdout - Incluir stdout (padrão: true)
   * @param options.stderr - Incluir stderr (padrão: true)
   * @param options.follow - Seguir logs em tempo real (padrão: true)
   * @param options.timestamps - Incluir timestamps (padrão: true)
   * @returns Promise que resolve para stream de logs (pode ser fechado)
   * 
   * @throws {Error} Se o container não existir
   * @throws {Error} Se houver erro ao iniciar stream
   * 
   * @example
   * ```typescript
   * const stream = await dockerService.streamContainerLogs(
   *   'abc123def456',
   *   (chunk) => {
   *     console.log('Log:', chunk)
   *   }
   * )
   * 
   * // Fechar stream quando não precisar mais
   * stream.destroy()
   * ```
   */
  async streamContainerLogs(
    dockerId: string,
    callback: (chunk: string) => void,
    options?: {
      stdout?: boolean
      stderr?: boolean
      follow?: boolean
      timestamps?: boolean
    }
  ) {
    const container = this.docker.getContainer(dockerId)
    const stream = await container.logs({
      stdout: options?.stdout ?? true,
      stderr: options?.stderr ?? true,
      follow: options?.follow ?? true,
      timestamps: options?.timestamps ?? true,
    } as any) as any

    stream.on('data', (chunk: any) => {
      callback(chunk.toString('utf-8'))
    })

    return stream
  }

  /**
   * Obtém estatísticas de uso de recursos de um container
   * 
   * **Fluxo de Execução**:
   * 1. Busca container pelo Docker ID
   * 2. Consulta estatísticas do Docker
   * 3. Calcula percentuais de CPU e memória
   * 4. Agrega estatísticas de rede e I/O
   * 5. Atualiza cache no banco de dados
   * 
   * **Estatísticas Retornadas**:
   * - `cpuPercent`: Percentual de uso de CPU (0-100)
   * - `memoryUsage`: Uso de memória em bytes
   * - `memoryLimit`: Limite de memória em bytes
   * - `memoryPercent`: Percentual de uso de memória (0-100)
   * - `networkRx`: Bytes recebidos pela rede
   * - `networkTx`: Bytes enviados pela rede
   * - `blockRead`: Bytes lidos do disco
   * - `blockWrite`: Bytes escritos no disco
   * 
   * **Nota**: Estatísticas são calculadas como snapshot único (não streaming)
   * 
   * @param dockerId - ID do container Docker
   * @returns Promise que resolve para objeto com estatísticas do container
   * 
   * @throws {Error} Se o container não existir
   * @throws {Error} Se houver erro ao consultar estatísticas
   * 
   * @example
   * ```typescript
   * const stats = await dockerService.getContainerStats('abc123def456')
   * console.log(`CPU: ${stats.cpuPercent}%`)
   * console.log(`Memória: ${stats.memoryPercent}%`)
   * console.log(`Rede: ${stats.networkRx} bytes recebidos`)
   * ```
   */
  async getContainerStats(dockerId: string) {
    const container = this.docker.getContainer(dockerId)
    const stats = await container.stats({ stream: false })

    // Calculate CPU percentage
    const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage
    const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage
    const cpuPercent = (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100

    // Memory usage
    const memoryUsage = stats.memory_stats.usage || 0
    const memoryLimit = stats.memory_stats.limit || 0
    const memoryPercent = (memoryUsage / memoryLimit) * 100

    // Network I/O
    let networkRx = 0
    let networkTx = 0
    if (stats.networks) {
      Object.values(stats.networks).forEach((net: { rx_bytes?: number; tx_bytes?: number }) => {
        networkRx += net.rx_bytes || 0
        networkTx += net.tx_bytes || 0
      })
    }

    // Block I/O
    let blockRead = 0
    let blockWrite = 0
    if (stats.blkio_stats?.io_service_bytes_recursive) {
      stats.blkio_stats.io_service_bytes_recursive.forEach((item: { op: string; value: number }) => {
        if (item.op === 'read') blockRead += item.value
        if (item.op === 'write') blockWrite += item.value
      })
    }

    const result = {
      cpuPercent: parseFloat(cpuPercent.toFixed(2)),
      memoryUsage,
      memoryLimit,
      memoryPercent: parseFloat(memoryPercent.toFixed(2)),
      networkRx,
      networkTx,
      blockRead,
      blockWrite,
    }

    // Update database with cached stats
    await prisma.container.update({
      where: { dockerId },
      data: {
        cpuUsage: result.cpuPercent,
        memoryUsage: BigInt(result.memoryUsage),
        networkRx: BigInt(result.networkRx),
        networkTx: BigInt(result.networkTx),
      },
    })

    return result
  }

  /**
   * Faz pull de uma imagem Docker do registry
   * 
   * **Fluxo de Execução**:
   * 1. Inicia pull da imagem do registry (Docker Hub, etc.)
   * 2. Monitora progresso do download
   * 3. Chama callback de progresso se fornecido
   * 4. Retorna quando download completo
   * 
   * **Comportamento**:
   * - Se imagem já existe localmente, verifica atualizações
   * - Suporta imagens de registries públicos e privados
   * - Callback de progresso recebe informações de download
   * 
   * @param image - Nome completo da imagem (ex: 'node:20-alpine' ou 'registry.com/image:tag')
   * @param onProgress - Callback opcional chamado durante o download com informações de progresso
   * @returns Promise que resolve quando pull completo
   * 
   * @throws {Error} Se a imagem não existir no registry
   * @throws {Error} Se não tiver permissão para acessar a imagem
   * @throws {Error} Se houver erro de rede durante o download
   * 
   * @example
   * ```typescript
   * // Pull simples
   * await dockerService.pullImage('node:20-alpine')
   * 
   * // Pull com callback de progresso
   * await dockerService.pullImage('node:20-alpine', (progress) => {
   *   console.log('Progresso:', progress)
   * })
   * ```
   */
  async pullImage(image: string, onProgress?: (progress: unknown) => void) {
    return new Promise((resolve, reject) => {
      this.docker.pull(image, (err: unknown, stream: NodeJS.ReadableStream) => {
        if (err) {
          reject(err)
          return
        }

        this.docker.modem.followProgress(
          stream,
          (progressErr: unknown, output: unknown) => {
            if (progressErr) {
              reject(progressErr)
            } else {
              resolve(output)
            }
          },
          onProgress
        )
      })
    })
  }

  /**
   * Lista todas as imagens Docker disponíveis localmente
   * 
   * **Fluxo de Execução**:
   * 1. Consulta imagens no Docker
   * 2. Retorna lista completa de imagens
   * 
   * **Informações Retornadas**:
   * - ID da imagem
   * - Tags e repositórios
   * - Tamanho da imagem
   * - Data de criação
   * 
   * @returns Promise que resolve para array de imagens Docker
   * 
   * @throws {Error} Se não conseguir conectar ao daemon Docker
   * 
   * @example
   * ```typescript
   * const images = await dockerService.listImages()
   * images.forEach(img => {
   *   console.log(`Imagem: ${img.RepoTags?.join(', ')}`)
   *   console.log(`Tamanho: ${img.Size} bytes`)
   * })
   * ```
   */
  async listImages() {
    return await this.docker.listImages()
  }

  /**
   * Remove uma imagem Docker local
   * 
   * **Fluxo de Execução**:
   * 1. Busca imagem pelo ID
   * 2. Remove a imagem do Docker
   * 3. Retorna resultado da remoção
   * 
   * **Comportamento**:
   * - Por padrão, só remove se não houver containers usando
   * - Com force=true, força remoção mesmo com containers dependentes
   * - Remove todas as tags associadas à imagem
   * 
   * @param imageId - ID da imagem Docker a remover
   * @param force - Se true, força remoção mesmo com dependências (padrão: false)
   * @returns Promise que resolve para resultado da remoção
   * 
   * @throws {Error} Se a imagem não existir
   * @throws {Error} Se houver containers usando a imagem e force=false
   * @throws {Error} Se houver erro ao remover a imagem
   * 
   * @example
   * ```typescript
   * // Remover imagem sem dependências
   * await dockerService.removeImage('abc123def456')
   * 
   * // Forçar remoção mesmo com dependências
   * await dockerService.removeImage('abc123def456', true)
   * ```
   */
  async removeImage(imageId: string, force = false) {
    const image = this.docker.getImage(imageId)
    return await image.remove({ force })
  }

  /**
   * Sincroniza containers do Docker para o banco de dados
   * 
   * **Fluxo de Execução**:
   * 1. Lista todos os containers no Docker
   * 2. Para cada container, consulta informações detalhadas
   * 3. Verifica se já existe no banco de dados
   * 4. Atualiza existentes ou cria novos registros
   * 5. Retorna número de containers sincronizados
   * 
   * **Uso**:
   * - Sincronização inicial após instalação
   * - Recuperação após problemas no banco
   * - Manutenção periódica de consistência
   * 
   * **Comportamento**:
   * - Containers existentes são atualizados com status atual
   * - Containers novos são criados no banco
   * - Não remove containers do banco que não existem no Docker
   * 
   * @returns Promise que resolve para objeto {synced: number} com quantidade sincronizada
   * 
   * @throws {Error} Se não conseguir conectar ao Docker
   * @throws {Error} Se houver erro ao consultar containers
   * 
   * @example
   * ```typescript
   * const result = await dockerService.syncContainers()
   * console.log(`${result.synced} containers sincronizados`)
   * ```
   */
  async syncContainers() {
    const dockerContainers = await this.listContainers({ all: true })
    const synced = []

    for (const container of dockerContainers) {
      const inspect = await this.getContainer(container.Id)
      if (!inspect) continue

      const existing = await prisma.container.findUnique({
        where: { dockerId: container.Id },
      })

      if (existing) {
        // Update existing
        await prisma.container.update({
          where: { dockerId: container.Id },
          data: {
            status: this.mapDockerStatus(inspect.State),
            startedAt: inspect.State.StartedAt ? new Date(inspect.State.StartedAt) : null,
            finishedAt: inspect.State.FinishedAt ? new Date(inspect.State.FinishedAt) : null,
            exitCode: inspect.State.ExitCode ?? null,
          },
        })
      } else {
        // Create new
        await prisma.container.create({
          data: {
            dockerId: inspect.Id,
            name: inspect.Name.replace('/', ''),
            image: inspect.Config.Image.split(':')[0],
            imageTag: inspect.Config.Image.split(':')[1] || 'latest',
            status: this.mapDockerStatus(inspect.State),
            command: inspect.Config.Cmd?.join(' '),
            startedAt: inspect.State.StartedAt ? new Date(inspect.State.StartedAt) : null,
            finishedAt: inspect.State.FinishedAt ? new Date(inspect.State.FinishedAt) : null,
            exitCode: inspect.State.ExitCode ?? null,
          },
        })
      }

      synced.push(container.Id)
    }

    return { synced: synced.length }
  }

  /**
   * Mapeia estado do Docker para enum ContainerStatus do Prisma
   * 
   * **Fluxo de Execução**:
   * 1. Verifica propriedades do estado Docker
   * 2. Retorna status correspondente no enum
   * 
   * **Mapeamento**:
   * - `Running: true` → 'RUNNING'
   * - `Paused: true` → 'PAUSED'
   * - `Restarting: true` → 'RESTARTING'
   * - `Dead: true` → 'DEAD'
   * - `Status: 'created'` → 'CREATED'
   * - `Status: 'removing'` → 'REMOVING'
   * - Outros → 'EXITED'
   * 
   * @param state - Objeto de estado do Docker (de container.inspect())
   * @returns Status correspondente no enum ContainerStatus
   * 
   * @example
   * ```typescript
   * const dockerState = { Running: true, Paused: false }
   * const status = this.mapDockerStatus(dockerState) // 'RUNNING'
   * ```
   */
  private mapDockerStatus(state: { Running?: boolean; Paused?: boolean; Restarting?: boolean; Dead?: boolean; Status?: string }): ContainerStatus {
    if (state.Running) return 'RUNNING'
    if (state.Paused) return 'PAUSED'
    if (state.Restarting) return 'RESTARTING'
    if (state.Dead) return 'DEAD'
    if (state.Status === 'created') return 'CREATED'
    if (state.Status === 'removing') return 'REMOVING'
    return 'EXITED'
  }

  /**
   * Converte string de limite de memória para bytes
   * 
   * **Formato Suportado**:
   * - "512" ou "512b" → 512 bytes
   * - "512k" → 512 * 1024 bytes
   * - "512m" → 512 * 1024 * 1024 bytes
   * - "1g" → 1 * 1024 * 1024 * 1024 bytes
   * 
   * **Fluxo de Execução**:
   * 1. Valida formato da string
   * 2. Extrai valor numérico e unidade
   * 3. Converte para bytes usando multiplicador apropriado
   * 
   * @param limit - String de limite (ex: "512m", "1g")
   * @returns Número de bytes ou undefined se formato inválido
   * 
   * @example
   * ```typescript
   * const bytes = this.parseMemoryLimit('512m') // 536870912
   * const bytes = this.parseMemoryLimit('1g')   // 1073741824
   * ```
   */
  private parseMemoryLimit(limit?: string): number | undefined {
    if (!limit) return undefined

    const units: Record<string, number> = {
      b: 1,
      k: 1024,
      m: 1024 * 1024,
      g: 1024 * 1024 * 1024,
    }

    const match = limit.toLowerCase().match(/^(\d+)([bkmg])?/)
    if (!match) return undefined

    const value = parseInt(match[1])
    const unit = match[2] || 'b'

    return value * units[unit]
  }

  /**
   * Converte string de limite de CPU para NanoCPUs
   * 
   * **Formato Suportado**:
   * - "1000" ou "1000m" → 1 CPU (1e9 NanoCPUs)
   * - "500m" → 0.5 CPU (5e8 NanoCPUs)
   * - "2000m" → 2 CPUs (2e9 NanoCPUs)
   * 
   * **Fluxo de Execução**:
   * 1. Valida formato da string (número + opcional 'm')
   * 2. Extrai valor numérico
   * 3. Converte milicores para NanoCPUs (valor / 1000 * 1e9)
   * 
   * **Nota**: Docker usa NanoCPUs onde 1 CPU = 1e9 NanoCPUs
   * 
   * @param limit - String de limite (ex: "1000m", "500m")
   * @returns Número de NanoCPUs ou undefined se formato inválido
   * 
   * @example
   * ```typescript
   * const nanoCpus = this.parseCpuLimit('1000m') // 1000000000
   * const nanoCpus = this.parseCpuLimit('500m')  // 500000000
   * ```
   */
  private parseCpuLimit(limit?: string): number | undefined {
    if (!limit) return undefined

    // Format: "1000m" = 1 CPU, "500m" = 0.5 CPU
    const match = limit.match(/^(\d+)m?$/)
    if (!match) return undefined

    const value = parseInt(match[1])
    return (value / 1000) * 1e9 // Convert to NanoCPUs
  }

  /**
   * Executa comando em um container Docker
   * 
   * **Fluxo de Execução**:
   * 1. Busca container pelo Docker ID
   * 2. Cria exec instance no Docker
   * 3. Inicia exec com stream de stdout/stderr
   * 4. Retorna stream para controle externo
   * 
   * **Uso**:
   * - Terminal interativo no navegador
   * - Execução de comandos administrativos
   * - Debugging de containers
   * 
   * @param dockerId - ID do container Docker
   * @param command - Comando a executar (ex: ['/bin/sh', '-c', 'ls -la'])
   * @param options - Opções de execução
   * @param options.tty - Alocar pseudo-TTY (padrão: true)
   * @param options.stdin - Habilitar stdin (padrão: true)
   * @param options.detach - Executar em background (padrão: false)
   * @param options.user - Usuário para executar (opcional)
   * @param options.env - Variáveis de ambiente adicionais (opcional)
   * @returns Promise que resolve para objeto com exec instance e stream
   * 
   * @throws {Error} Se o container não existir
   * @throws {Error} Se houver erro ao criar exec
   * 
   * @example
   * ```typescript
   * const exec = await dockerService.execContainer('abc123def456', ['/bin/sh'])
   * exec.stream.on('data', (chunk) => {
   *   console.log('Output:', chunk.toString())
   * })
   * ```
   */
  async execContainer(
    dockerId: string,
    command: string[],
    options: {
      tty?: boolean
      stdin?: boolean
      detach?: boolean
      user?: string
      env?: string[]
    } = {}
  ) {
    try {
      const container = this.docker.getContainer(dockerId)

      // Verify container exists
      await container.inspect()

      const execOptions = {
        Cmd: command,
        AttachStdout: true,
        AttachStderr: true,
        AttachStdin: options.stdin !== false,
        Tty: options.tty !== false,
        Detach: options.detach || false,
        User: options.user,
        Env: options.env,
      }

      // Create exec instance
      const exec = await container.exec(execOptions)

      // Start exec and get stream
      const stream = await exec.start({
        hijack: true,
        stdin: options.stdin !== false,
      })

      logInfo('Container exec started', {
        dockerId,
        command: command.join(' '),
      })

      return {
        exec,
        stream,
      }
    } catch (error) {
      logError(`Failed to exec in container ${dockerId}`, error)
      throw error
    }
  }
}

// Export singleton instance
export const dockerService = DockerService.getInstance()
