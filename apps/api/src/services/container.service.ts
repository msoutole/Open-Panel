/**
 * @fileoverview Service para lógica de negócio de containers
 * 
 * Este módulo contém toda a lógica de negócio relacionada a containers,
 * separada da camada de roteamento HTTP.
 * 
 * @module services/container.service
 */

import { prisma } from '../lib/prisma'
import { dockerService } from './docker'
import { HTTPException } from 'hono/http-exception'

/**
 * Service para operações relacionadas a containers
 */
export class ContainerService {
  /**
   * Lista todos os containers do banco de dados.
   * 
   * @returns Lista de containers com informações do projeto relacionado
   */
  static async listContainers() {
    return await prisma.container.findMany({
      include: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  }

  /**
   * Sincroniza containers do Docker daemon com o banco de dados.
   * 
   * @returns Resultado da sincronização com número de containers sincronizados
   */
  static async syncContainers() {
    return await dockerService.syncContainers()
  }

  /**
   * Busca um container por ID, incluindo dados do Docker.
   * 
   * @param containerId - ID do container no banco de dados
   * @returns Container com dados do banco e do Docker
   * 
   * @throws {HTTPException} 404 - Container não encontrado
   */
  static async findById(containerId: string) {
    const dbContainer = await prisma.container.findUnique({
      where: { id: containerId },
      include: {
        project: true
      }
    })

    if (!dbContainer) {
      throw new HTTPException(404, { message: 'Container not found' })
    }

    // Buscar dados do Docker
    const dockerContainer = await dockerService.getContainer(dbContainer.dockerId)

    return {
      ...dbContainer,
      docker: dockerContainer
    }
  }

  /**
   * Cria um novo container usando DockerService.
   * 
   * @param data - Dados do container a ser criado
   * @returns Container criado
   */
  static async createContainer(data: {
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
    return await dockerService.createContainer(data)
  }

  /**
   * Inicia um container.
   * 
   * @param containerId - ID do container no banco de dados
   * @returns Container iniciado
   * 
   * @throws {HTTPException} 404 - Container não encontrado
   */
  static async startContainer(containerId: string) {
    const dbContainer = await prisma.container.findUnique({
      where: { id: containerId }
    })

    if (!dbContainer) {
      throw new HTTPException(404, { message: 'Container not found' })
    }

    return await dockerService.startContainer(dbContainer.dockerId)
  }

  /**
   * Para um container.
   * 
   * @param containerId - ID do container no banco de dados
   * @param timeout - Timeout em segundos (padrão: 10)
   * @returns Container parado
   * 
   * @throws {HTTPException} 404 - Container não encontrado
   */
  static async stopContainer(containerId: string, timeout: number = 10) {
    const dbContainer = await prisma.container.findUnique({
      where: { id: containerId }
    })

    if (!dbContainer) {
      throw new HTTPException(404, { message: 'Container not found' })
    }

    return await dockerService.stopContainer(dbContainer.dockerId, timeout)
  }

  /**
   * Reinicia um container.
   * 
   * @param containerId - ID do container no banco de dados
   * @param timeout - Timeout em segundos (padrão: 10)
   * @returns Container reiniciado
   * 
   * @throws {HTTPException} 404 - Container não encontrado
   */
  static async restartContainer(containerId: string, timeout: number = 10) {
    const dbContainer = await prisma.container.findUnique({
      where: { id: containerId }
    })

    if (!dbContainer) {
      throw new HTTPException(404, { message: 'Container not found' })
    }

    return await dockerService.restartContainer(dbContainer.dockerId, timeout)
  }

  /**
   * Pausa um container.
   * 
   * @param containerId - ID do container no banco de dados
   * @returns Container pausado
   * 
   * @throws {HTTPException} 404 - Container não encontrado
   */
  static async pauseContainer(containerId: string) {
    const dbContainer = await prisma.container.findUnique({
      where: { id: containerId }
    })

    if (!dbContainer) {
      throw new HTTPException(404, { message: 'Container not found' })
    }

    return await dockerService.pauseContainer(dbContainer.dockerId)
  }

  /**
   * Despausa um container.
   * 
   * @param containerId - ID do container no banco de dados
   * @returns Container despausado
   * 
   * @throws {HTTPException} 404 - Container não encontrado
   */
  static async unpauseContainer(containerId: string) {
    const dbContainer = await prisma.container.findUnique({
      where: { id: containerId }
    })

    if (!dbContainer) {
      throw new HTTPException(404, { message: 'Container not found' })
    }

    return await dockerService.unpauseContainer(dbContainer.dockerId)
  }

  /**
   * Remove um container.
   * 
   * @param containerId - ID do container no banco de dados
   * @param force - Forçar remoção mesmo se estiver rodando
   * 
   * @throws {HTTPException} 404 - Container não encontrado
   */
  static async removeContainer(containerId: string, force: boolean = false) {
    const dbContainer = await prisma.container.findUnique({
      where: { id: containerId }
    })

    if (!dbContainer) {
      throw new HTTPException(404, { message: 'Container not found' })
    }

    await dockerService.removeContainer(dbContainer.dockerId, force)
  }

  /**
   * Obtém logs de um container.
   * 
   * @param containerId - ID do container no banco de dados
   * @param options - Opções de logs
   * @returns Logs do container
   * 
   * @throws {HTTPException} 404 - Container não encontrado
   */
  static async getContainerLogs(
    containerId: string,
    options: {
      stdout?: boolean
      stderr?: boolean
      tail?: number
      since?: number
      until?: number
      timestamps?: boolean
    }
  ) {
    const dbContainer = await prisma.container.findUnique({
      where: { id: containerId }
    })

    if (!dbContainer) {
      throw new HTTPException(404, { message: 'Container not found' })
    }

    return await dockerService.getContainerLogs(dbContainer.dockerId, options)
  }

  /**
   * Obtém estatísticas de um container.
   * 
   * @param containerId - ID do container no banco de dados
   * @returns Estatísticas do container
   * 
   * @throws {HTTPException} 404 - Container não encontrado
   */
  static async getContainerStats(containerId: string): Promise<unknown> {
    const dbContainer = await prisma.container.findUnique({
      where: { id: containerId }
    })

    if (!dbContainer) {
      throw new HTTPException(404, { message: 'Container not found' })
    }

    return await dockerService.getContainerStats(dbContainer.dockerId)
  }

  /**
   * Verifica saúde do Docker daemon.
   * 
   * @returns true se Docker está saudável, false caso contrário
   */
  static async checkDockerHealth(): Promise<boolean> {
    return await dockerService.healthCheck()
  }

  /**
   * Obtém informações do sistema Docker.
   * 
   * @returns Informações do sistema Docker
   */
  static async getDockerInfo() {
    return await dockerService.getSystemInfo()
  }
}

