import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { HTTPException } from 'hono/http-exception'
import { prisma } from '../lib/prisma'
import {
  createProjectSchema,
  updateProjectSchema,
  createEnvVarSchema,
} from '@openpanel/shared'
import type { Variables } from '../types'

const projects = new Hono<{ Variables: Variables }>()

// Get all projects (accessible teams)
projects.get('/', async (c) => {
  const user = c.get('user')

  try {
    const allProjects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: user.userId },
          {
            team: {
              members: {
                some: {
                  userId: user.userId,
                },
              },
            },
          },
        ],
      },
      include: {
        _count: {
          select: {
            envVars: true,
            domains: true,
            deployments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return c.json({ projects: allProjects })
  } catch (error) {
    throw new HTTPException(500, { message: 'Failed to fetch projects' })
  }
})

// Create new project
projects.post('/', zValidator('json', createProjectSchema), async (c) => {
  const user = c.get('user')
  const data = c.req.valid('json')

  try {
    // Check if slug is unique
    const existingProject = await prisma.project.findFirst({
      where: { slug: data.slug },
    })

    if (existingProject) {
      throw new HTTPException(400, { message: 'Project slug already exists' })
    }

    // If teamId provided, verify user is member
    if (data.teamId) {
      const teamMember = await prisma.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId: user.userId,
            teamId: data.teamId,
          },
        },
      })

      if (!teamMember || !['OWNER', 'ADMIN'].includes(teamMember.role)) {
        throw new HTTPException(403, { message: 'Forbidden' })
      }
    }

    const newProject = await prisma.project.create({
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
        ownerId: user.userId,
        teamId: data.teamId,
      },
      include: {
        _count: {
          select: {
            envVars: true,
            domains: true,
            deployments: true,
          },
        },
      },
    })

    return c.json({ project: newProject }, 201)
  } catch (error) {
    if (error instanceof HTTPException) throw error
    throw new HTTPException(500, { message: 'Failed to create project' })
  }
})

// Get single project
projects.get('/:projectId', async (c) => {
  const { projectId } = c.req.param()
  const user = c.get('user')

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        envVars: {
          select: {
            id: true,
            key: true,
            value: true,
            isSecret: true,
            createdAt: true,
          },
        },
        domains: true,
        deployments: {
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            envVars: true,
            domains: true,
            deployments: true,
          },
        },
      },
    })

    if (!project) {
      throw new HTTPException(404, { message: 'Project not found' })
    }

    // Check if user has access
    const hasAccess =
      project.ownerId === user.userId ||
      (project.teamId &&
        (await prisma.teamMember.findUnique({
          where: {
            userId_teamId: {
              userId: user.userId,
              teamId: project.teamId,
            },
          },
        })))

    if (!hasAccess) {
      throw new HTTPException(403, { message: 'Forbidden' })
    }

    return c.json({ project })
  } catch (error) {
    if (error instanceof HTTPException) throw error
    throw new HTTPException(500, { message: 'Failed to fetch project' })
  }
})

// Update project
projects.put('/:projectId', zValidator('json', updateProjectSchema), async (c) => {
  const { projectId } = c.req.param()
  const user = c.get('user')
  const data = c.req.valid('json')

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new HTTPException(404, { message: 'Project not found' })
    }

    // Check if user is owner
    if (project.ownerId !== user.userId) {
      throw new HTTPException(403, { message: 'Forbidden' })
    }

    // Check if new slug is unique
    if (data.slug && data.slug !== project.slug) {
      const existing = await prisma.project.findFirst({
        where: { slug: data.slug },
      })
      if (existing) {
        throw new HTTPException(400, { message: 'Project slug already exists' })
      }
    }

    const updatedProject = await prisma.project.update({
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
        memoryLimit: data.memoryLimit,
      },
      include: {
        _count: {
          select: {
            envVars: true,
            domains: true,
            deployments: true,
          },
        },
      },
    })

    return c.json({ project: updatedProject })
  } catch (error) {
    if (error instanceof HTTPException) throw error
    throw new HTTPException(500, { message: 'Failed to update project' })
  }
})

// Delete project
projects.delete('/:projectId', async (c) => {
  const { projectId } = c.req.param()
  const user = c.get('user')

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new HTTPException(404, { message: 'Project not found' })
    }

    // Check if user is owner
    if (project.ownerId !== user.userId) {
      throw new HTTPException(403, { message: 'Forbidden' })
    }

    await prisma.project.delete({
      where: { id: projectId },
    })

    return c.json({ message: 'Project deleted successfully' }, 200)
  } catch (error) {
    if (error instanceof HTTPException) throw error
    throw new HTTPException(500, { message: 'Failed to delete project' })
  }
})

// Get project environment variables
projects.get('/:projectId/env-vars', async (c) => {
  const { projectId } = c.req.param()
  const user = c.get('user')

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new HTTPException(404, { message: 'Project not found' })
    }

    // Check access
    if (project.ownerId !== user.userId) {
      throw new HTTPException(403, { message: 'Forbidden' })
    }

    const envVars = await prisma.envVar.findMany({
      where: { projectId },
      select: {
        id: true,
        key: true,
        value: true,
        isSecret: true,
        createdAt: true,
      },
    })

    return c.json({ envVars })
  } catch (error) {
    if (error instanceof HTTPException) throw error
    throw new HTTPException(500, { message: 'Failed to fetch env vars' })
  }
})

// Create environment variable
projects.post('/:projectId/env-vars', zValidator('json', createEnvVarSchema), async (c) => {
  const { projectId } = c.req.param()
  const user = c.get('user')
  const data = c.req.valid('json')

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new HTTPException(404, { message: 'Project not found' })
    }

    // Check access
    if (project.ownerId !== user.userId) {
      throw new HTTPException(403, { message: 'Forbidden' })
    }

    // Check if key already exists
    const existing = await prisma.envVar.findUnique({
      where: {
        projectId_key: {
          projectId,
          key: data.key,
        },
      },
    })

    if (existing) {
      throw new HTTPException(400, { message: 'Environment variable already exists' })
    }

    const envVar = await prisma.envVar.create({
      data: {
        projectId,
        key: data.key,
        value: data.value,
        isSecret: data.isSecret,
      },
      select: {
        id: true,
        key: true,
        isSecret: true,
        createdAt: true,
      },
    })

    return c.json({ envVar }, 201)
  } catch (error) {
    if (error instanceof HTTPException) throw error
    throw new HTTPException(500, { message: 'Failed to create env var' })
  }
})

// Update environment variable
projects.put('/:projectId/env-vars/:envVarId', zValidator('json', createEnvVarSchema), async (c) => {
  const { projectId, envVarId } = c.req.param()
  const user = c.get('user')
  const data = c.req.valid('json')

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new HTTPException(404, { message: 'Project not found' })
    }

    // Check access
    if (project.ownerId !== user.userId) {
      throw new HTTPException(403, { message: 'Forbidden' })
    }

    const envVar = await prisma.envVar.update({
      where: { id: envVarId },
      data: {
        key: data.key,
        value: data.value,
        isSecret: data.isSecret,
      },
      select: {
        id: true,
        key: true,
        isSecret: true,
        createdAt: true,
      },
    })

    return c.json({ envVar })
  } catch (error) {
    if (error instanceof HTTPException) throw error
    throw new HTTPException(500, { message: 'Failed to update env var' })
  }
})

// Delete environment variable
projects.delete('/:projectId/env-vars/:envVarId', async (c) => {
  const { projectId, envVarId } = c.req.param()
  const user = c.get('user')

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new HTTPException(404, { message: 'Project not found' })
    }

    // Check access
    if (project.ownerId !== user.userId) {
      throw new HTTPException(403, { message: 'Forbidden' })
    }

    await prisma.envVar.delete({
      where: { id: envVarId },
    })

    return c.json({ message: 'Environment variable deleted' }, 200)
  } catch (error) {
    if (error instanceof HTTPException) throw error
    throw new HTTPException(500, { message: 'Failed to delete env var' })
  }
})

export default projects
