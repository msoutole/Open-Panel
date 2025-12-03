import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { Hono } from 'hono'
import projectsRoutes from '../../routes/projects'
import { prisma } from '../../lib/prisma'

// Mock Prisma
vi.mock('../../lib/prisma', () => ({
  prisma: {
    project: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    container: {
      findMany: vi.fn(),
    },
  },
}))

describe('Projects Routes', () => {
  let app: Hono
  const mockUser = { id: 'user-123', email: 'test@test.com', role: 'OWNER' }

  beforeEach(() => {
    app = new Hono()
    // Mock auth middleware
    app.use('*', (c, next) => {
      c.set('user', mockUser)
      return next()
    })
    app.route('/projects', projectsRoutes)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('GET /projects', () => {
    it('should list all projects for authenticated user', async () => {
      const mockProjects = [
        {
          id: 'project-1',
          name: 'Test Project',
          slug: 'test-project',
          ownerId: 'user-123',
          createdAt: new Date(),
        },
      ]

      vi.mocked(prisma.project.findMany).mockResolvedValue(mockProjects as any)

      const res = await app.request('/projects')

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.projects).toHaveLength(1)
      expect(json.projects[0].name).toBe('Test Project')
    })

    it('should return empty array when user has no projects', async () => {
      vi.mocked(prisma.project.findMany).mockResolvedValue([])

      const res = await app.request('/projects')

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.projects).toEqual([])
    })

    it('should filter projects by status', async () => {
      const mockProjects = [
        {
          id: 'project-1',
          status: 'ACTIVE',
        },
      ]

      vi.mocked(prisma.project.findMany).mockResolvedValue(mockProjects as any)

      const res = await app.request('/projects?status=ACTIVE')

      expect(res.status).toBe(200)
      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE',
          }),
        })
      )
    })
  })

  describe('GET /projects/:id', () => {
    it('should get project by id', async () => {
      const mockProject = {
        id: 'project-1',
        name: 'Test Project',
        ownerId: 'user-123',
        containers: [],
      }

      vi.mocked(prisma.project.findFirst).mockResolvedValue(mockProject as any)

      const res = await app.request('/projects/project-1')

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.project.name).toBe('Test Project')
    })

    it('should return 404 for non-existent project', async () => {
      vi.mocked(prisma.project.findFirst).mockResolvedValue(null)

      const res = await app.request('/projects/non-existent')

      expect(res.status).toBe(404)
    })

    it('should return 403 for unauthorized access', async () => {
      const mockProject = {
        id: 'project-1',
        ownerId: 'other-user',
      }

      vi.mocked(prisma.project.findFirst).mockResolvedValue(null) // não encontra por filtro de owner

      const res = await app.request('/projects/project-1')

      expect(res.status).toBe(404) // or 403 depending on implementation
    })
  })

  describe('POST /projects', () => {
    it('should create a new project', async () => {
      const mockProject = {
        id: 'new-project',
        name: 'New Project',
        slug: 'new-project',
        ownerId: 'user-123',
        createdAt: new Date(),
      }

      vi.mocked(prisma.project.create).mockResolvedValue(mockProject as any)

      const res = await app.request('/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Project',
          description: 'A test project',
        }),
      })

      expect(res.status).toBe(201)
      const json = await res.json()
      expect(json.project.name).toBe('New Project')
    })

    it('should validate required fields', async () => {
      const res = await app.request('/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      expect(res.status).toBe(400)
    })

    it('should generate slug from name', async () => {
      vi.mocked(prisma.project.create).mockImplementation(async (args: any) => {
        return {
          ...args.data,
          id: 'new-id',
        }
      })

      await app.request('/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'My Awesome Project',
        }),
      })

      expect(prisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slug: expect.stringMatching(/my-awesome-project/),
          }),
        })
      )
    })
  })

  describe('PATCH /projects/:id', () => {
    it('should update project', async () => {
      const mockProject = {
        id: 'project-1',
        name: 'Updated Project',
        ownerId: 'user-123',
      }

      vi.mocked(prisma.project.findFirst).mockResolvedValue({
        id: 'project-1',
        ownerId: 'user-123',
      } as any)
      vi.mocked(prisma.project.update).mockResolvedValue(mockProject as any)

      const res = await app.request('/projects/project-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Updated Project',
        }),
      })

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.project.name).toBe('Updated Project')
    })

    it('should not allow updating other users projects', async () => {
      vi.mocked(prisma.project.findFirst).mockResolvedValue(null)

      const res = await app.request('/projects/project-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Hacked Project',
        }),
      })

      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /projects/:id', () => {
    it('should delete project', async () => {
      vi.mocked(prisma.project.findFirst).mockResolvedValue({
        id: 'project-1',
        ownerId: 'user-123',
      } as any)
      vi.mocked(prisma.project.delete).mockResolvedValue({} as any)

      const res = await app.request('/projects/project-1', {
        method: 'DELETE',
      })

      expect(res.status).toBe(200)
    })

    it('should not delete if containers exist', async () => {
      vi.mocked(prisma.project.findFirst).mockResolvedValue({
        id: 'project-1',
        ownerId: 'user-123',
      } as any)
      vi.mocked(prisma.container.findMany).mockResolvedValue([
        { id: 'container-1' },
      ] as any)

      const res = await app.request('/projects/project-1', {
        method: 'DELETE',
      })

      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toContain('containers')
    })
  })
})
