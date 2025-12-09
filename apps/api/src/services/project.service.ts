/**
 * @fileoverview Service para lógica de negócio de projetos
 * 
 * Este módulo contém toda a lógica de negócio relacionada a projetos,
 * separada da camada de roteamento HTTP.
 * 
 * @module services/project.service
 */

import { prisma } from '../lib/prisma'
import { HTTPException } from 'hono/http-exception'
import type { PrismaClient, ProjectType } from '@prisma/client'

/**
 * Dados necessários para criar um projeto
 */
export interface CreateProjectData {
  /** Nome do projeto (obrigatório) */
  name: string
  /** Slug do projeto (obrigatório, único) */
  slug: string
  /** Descrição do projeto (opcional) */
  description?: string | null
  /** Tipo do projeto */
  type: ProjectType
  /** Imagem Docker (opcional) */
  dockerImage?: string | null
  /** Tag Docker (opcional) */
  dockerTag?: string | null
  /** URL do repositório Git (opcional) */
  gitUrl?: string | null
  /** Branch Git (opcional) */
  gitBranch?: string | null
  /** Número de réplicas (opcional) */
  replicas?: number
  /** Limite de CPU (opcional) */
  cpuLimit?: string | null
  /** Limite de memória (opcional) */
  memoryLimit?: string | null
  /** ID do usuário proprietário */
  ownerId: string
  /** ID do team (opcional) */
  teamId?: string | null
}

/**
 * Dados necessários para atualizar um projeto
 */
export interface UpdateProjectData {
  /** Nome do projeto (opcional) */
  name?: string
  /** Slug do projeto (opcional) */
  slug?: string
  /** Descrição do projeto (opcional) */
  description?: string | null
  /** Tipo do projeto (opcional) */
  type?: ProjectType
  /** Imagem Docker (opcional) */
  dockerImage?: string | null
  /** Tag Docker (opcional) */
  dockerTag?: string | null
  /** URL do repositório Git (opcional) */
  gitUrl?: string | null
  /** Branch Git (opcional) */
  gitBranch?: string | null
  /** Número de réplicas (opcional) */
  replicas?: number
  /** Limite de CPU (opcional) */
  cpuLimit?: string | null
  /** Limite de memória (opcional) */
  memoryLimit?: string | null
}

/**
 * Service para operações relacionadas a projetos
 */
export class ProjectService {
  private prisma: PrismaClient
  private static instance: ProjectService

  public constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || prisma
  }

  public static getInstance(): ProjectService {
    if (!ProjectService.instance) {
      ProjectService.instance = new ProjectService()
    }
    return ProjectService.instance
  }

  /**
   * Verifica se um usuário tem acesso a um projeto.
   * 
   * Um usuário tem acesso se:
   * - É o owner do projeto, OU
   * - É membro do team que possui o projeto
   * 
   * @param projectId - ID do projeto
   * @param userId - ID do usuário
   * @returns true se o usuário tem acesso, false caso contrário
   */
  async hasAccess(projectId: string, userId: string): Promise<boolean> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        team: {
          include: {
            members: {
              where: { userId }
            }
          }
        }
      }
    })

    if (!project) {
      return false
    }

    // Owner tem acesso direto
    if (project.ownerId === userId) {
      return true
    }

    // Membro do team tem acesso
    if (project.teamId && (project.team?.members?.length ?? 0) > 0) {
      return true
    }

    return false
  }

  /**
   * Lista todos os projetos acessíveis por um usuário.
   * 
   * Retorna projetos onde o usuário é:
   * - Owner do projeto, OU
   * - Membro do team que possui o projeto
   * 
   * @param userId - ID do usuário
   * @returns Lista de projetos com contadores de recursos relacionados
   */
  async listAccessibleProjects(userId: string) {
    return await this.prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          {
            team: {
              members: {
                some: {
                  userId
                }
              }
            }
          }
        ]
      },
      include: {
        _count: {
          select: {
            envVars: true,
            domains: true,
            deployments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  }

  /**
   * Busca um projeto por ID, verificando acesso do usuário.
   * 
   * @param projectId - ID do projeto
   * @param userId - ID do usuário solicitante
   * @returns Projeto com recursos relacionados se encontrado e acessível
   * 
   * @throws {HTTPException} 404 - Projeto não encontrado ou sem acesso
   */
  async findById(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        envVars: {
          select: {
            id: true,
            key: true,
            value: true,
            isSecret: true,
            createdAt: true
          }
        },
        domains: true,
        deployments: {
          take: 10,
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            envVars: true,
            domains: true,
            deployments: true
          }
        }
      }
    })

    if (!project) {
      throw new HTTPException(404, { message: 'Project not found' })
    }

    // Verificar acesso
    const hasAccess = await this.hasAccess(projectId, userId)
    if (!hasAccess) {
      throw new HTTPException(403, { message: 'Forbidden' })
    }

    return project
  }

  /**
   * Verifica se um slug de projeto já existe.
   * 
   * @param slug - Slug a verificar
   * @returns true se o slug já existe, false caso contrário
   */
  async slugExists(slug: string): Promise<boolean> {
    const existing = await this.prisma.project.findFirst({
      where: { slug }
    })
    return !!existing
  }

  /**
   * Verifica se um usuário é membro de um team com permissões adequadas.
   * 
   * @param userId - ID do usuário
   * @param teamId - ID do team
   * @returns true se o usuário é OWNER ou ADMIN do team
   */
  async isTeamOwnerOrAdmin(userId: string, teamId: string): Promise<boolean> {
    const teamMember = await this.prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId
        }
      }
    })

    return teamMember ? ['OWNER', 'ADMIN'].includes(teamMember.role) : false
  }

  /**
   * Cria um novo projeto no sistema.
   * 
   * **Regras de Negócio**:
   * - Slug deve ser único
   * - Se teamId fornecido, usuário deve ser OWNER ou ADMIN do team
   * - Projeto é criado com status ACTIVE por padrão
   * 
   * @param data - Dados do projeto a ser criado
   * @returns Projeto criado com contadores de recursos relacionados
   * 
   * @throws {HTTPException} 400 - Slug já existe
   * @throws {HTTPException} 403 - Usuário não tem permissão no team
   */
  async create(data: CreateProjectData) {
    // Verificar unicidade do slug
    const slugExists = await this.slugExists(data.slug)
    if (slugExists) {
      throw new HTTPException(400, { message: 'Project slug already exists' })
    }

    // Se teamId fornecido, verificar permissões
    if (data.teamId) {
      const hasPermission = await this.isTeamOwnerOrAdmin(data.ownerId, data.teamId)
      if (!hasPermission) {
        throw new HTTPException(403, { message: 'Forbidden' })
      }
    }

    // Criar projeto
    const project = await this.prisma.project.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        type: data.type,
        dockerImage: data.dockerImage,
        dockerTag: data.dockerTag,
        gitUrl: data.gitUrl,
        gitBranch: data.gitBranch,
        replicas: data.replicas,
        cpuLimit: data.cpuLimit,
        memoryLimit: data.memoryLimit,
        ownerId: data.ownerId,
        teamId: data.teamId
      },
      include: {
        _count: {
          select: {
            envVars: true,
            domains: true,
            deployments: true
          }
        }
      }
    })

    return project
  }

  /**
   * Atualiza um projeto existente.
   * 
   * **Regras de Negócio**:
   * - Apenas o owner pode atualizar
   * - Se slug mudou, deve ser único
   * 
   * @param projectId - ID do projeto
   * @param userId - ID do usuário solicitante
   * @param data - Dados a atualizar
   * @returns Projeto atualizado
   * 
   * @throws {HTTPException} 404 - Projeto não encontrado
   * @throws {HTTPException} 403 - Usuário não é owner
   * @throws {HTTPException} 400 - Novo slug já existe
   */
  async update(
    projectId: string,
    userId: string,
    data: UpdateProjectData
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      throw new HTTPException(404, { message: 'Project not found' })
    }

    // Apenas owner pode atualizar
    if (project.ownerId !== userId) {
      throw new HTTPException(403, { message: 'Forbidden' })
    }

    // Verificar se novo slug é único
    if (data.slug && data.slug !== project.slug) {
      const slugExists = await this.slugExists(data.slug)
      if (slugExists) {
        throw new HTTPException(400, { message: 'Project slug already exists' })
      }
    }

    // Atualizar projeto
    const updatedProject = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        type: data.type,
        dockerImage: data.dockerImage,
        dockerTag: data.dockerTag,
        gitUrl: data.gitUrl,
        gitBranch: data.gitBranch,
        replicas: data.replicas,
        cpuLimit: data.cpuLimit,
        memoryLimit: data.memoryLimit
      },
      include: {
        _count: {
          select: {
            envVars: true,
            domains: true,
            deployments: true
          }
        }
      }
    })

    return updatedProject
  }

  /**
   * Deleta um projeto.
   * 
   * **Regras de Negócio**:
   * - Apenas o owner pode deletar
   * - Deleta em cascade: env vars, domains, deployments relacionados
   * 
   * @param projectId - ID do projeto
   * @param userId - ID do usuário solicitante
   * 
   * @throws {HTTPException} 404 - Projeto não encontrado
   * @throws {HTTPException} 403 - Usuário não é owner
   */
  async delete(projectId: string, userId: string): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      throw new HTTPException(404, { message: 'Project not found' })
    }

    // Apenas owner pode deletar
    if (project.ownerId !== userId) {
      throw new HTTPException(403, { message: 'Forbidden' })
    }

    // Deletar projeto (cascade delete remove recursos relacionados)
    await this.prisma.project.delete({
      where: { id: projectId }
    })
  }
}

// Export singleton instance
export const projectService = ProjectService.getInstance()