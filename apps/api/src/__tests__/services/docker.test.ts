import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { dockerService } from '../../services/docker'
import Dockerode from 'dockerode'

// Mock do Dockerode
vi.mock('dockerode', () => {
  return {
    default: vi.fn(() => ({
      listContainers: vi.fn(),
      createContainer: vi.fn(),
      getContainer: vi.fn(),
      listImages: vi.fn(),
      pull: vi.fn(),
    })),
  }
})

describe('Docker Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('listContainers', () => {
    it('should list all containers', async () => {
      const mockContainers = [
        {
          Id: 'container-1',
          Names: ['/test-container'],
          State: 'running',
          Status: 'Up 2 hours',
        },
      ]

      // Mock implementation
      const mockListContainers = vi.fn().mockResolvedValue(mockContainers)
      vi.spyOn(dockerService as any, 'docker', 'get').mockReturnValue({
        listContainers: mockListContainers,
      })

      const result = await dockerService.listContainers()

      expect(mockListContainers).toHaveBeenCalledWith({ all: true })
      expect(result).toEqual(mockContainers)
    })

    it('should handle errors when listing containers', async () => {
      const mockError = new Error('Docker daemon not running')
      const mockListContainers = vi.fn().mockRejectedValue(mockError)
      vi.spyOn(dockerService as any, 'docker', 'get').mockReturnValue({
        listContainers: mockListContainers,
      })

      await expect(dockerService.listContainers()).rejects.toThrow(
        'Docker daemon not running'
      )
    })
  })

  describe('getContainerStats', () => {
    it('should return container statistics', async () => {
      const mockStats = {
        memory_stats: { usage: 1024000, limit: 2048000 },
        cpu_stats: { cpu_usage: { total_usage: 5000000 } },
      }

      const mockStatsStream = {
        on: vi.fn((event, callback) => {
          if (event === 'data') {
            callback(Buffer.from(JSON.stringify(mockStats)))
          }
          return mockStatsStream
        }),
      }

      const mockContainer = {
        stats: vi.fn().mockResolvedValue(mockStatsStream),
      }

      vi.spyOn(dockerService as any, 'docker', 'get').mockReturnValue({
        getContainer: vi.fn().mockReturnValue(mockContainer),
      })

      const result = await dockerService.getContainerStats('container-1')

      expect(result).toBeDefined()
      expect(result.memory_stats).toBeDefined()
      expect(result.cpu_stats).toBeDefined()
    })
  })

  describe('isDockerRunning', () => {
    it('should return true when Docker is running', async () => {
      const mockPing = vi.fn().mockResolvedValue('OK')
      vi.spyOn(dockerService as any, 'docker', 'get').mockReturnValue({
        ping: mockPing,
      })

      const result = await dockerService.isDockerRunning()

      expect(result).toBe(true)
      expect(mockPing).toHaveBeenCalled()
    })

    it('should return false when Docker is not running', async () => {
      const mockPing = vi.fn().mockRejectedValue(new Error('Cannot connect'))
      vi.spyOn(dockerService as any, 'docker', 'get').mockReturnValue({
        ping: mockPing,
      })

      const result = await dockerService.isDockerRunning()

      expect(result).toBe(false)
    })
  })

  describe('createContainer', () => {
    it('should create a new container with correct options', async () => {
      const mockContainer = {
        id: 'new-container-id',
        start: vi.fn().mockResolvedValue(undefined),
      }

      const mockCreateContainer = vi.fn().mockResolvedValue(mockContainer)
      vi.spyOn(dockerService as any, 'docker', 'get').mockReturnValue({
        createContainer: mockCreateContainer,
      })

      const options = {
        name: 'test-container',
        image: 'nginx:latest',
        tag: 'latest',
        projectId: 'project-1',
        env: { NODE_ENV: 'production' },
      }

      const result = await dockerService.createContainer(options)

      expect(mockCreateContainer).toHaveBeenCalled()
      expect(result).toBeDefined()
      expect(result.id).toBe('new-container-id')
    })

    it('should throw error when image is not available', async () => {
      const mockError = new Error('Image not found')
      const mockCreateContainer = vi.fn().mockRejectedValue(mockError)
      vi.spyOn(dockerService as any, 'docker', 'get').mockReturnValue({
        createContainer: mockCreateContainer,
      })

      const options = {
        name: 'test-container',
        image: 'nonexistent:latest',
        tag: 'latest',
        projectId: 'project-1',
      }

      await expect(dockerService.createContainer(options)).rejects.toThrow(
        'Image not found'
      )
    })
  })

  describe('stopContainer', () => {
    it('should stop a running container gracefully', async () => {
      const mockStop = vi.fn().mockResolvedValue(undefined)
      const mockContainer = { stop: mockStop }

      vi.spyOn(dockerService as any, 'docker', 'get').mockReturnValue({
        getContainer: vi.fn().mockReturnValue(mockContainer),
      })

      await dockerService.stopContainer('container-1', 10)

      expect(mockStop).toHaveBeenCalledWith({ t: 10 })
    })

    it('should handle already stopped containers', async () => {
      const mockError = new Error('Container already stopped')
      const mockStop = vi.fn().mockRejectedValue(mockError)
      const mockContainer = { stop: mockStop }

      vi.spyOn(dockerService as any, 'docker', 'get').mockReturnValue({
        getContainer: vi.fn().mockReturnValue(mockContainer),
      })

      // Should not throw, just log the error
      await expect(
        dockerService.stopContainer('container-1')
      ).rejects.toThrow()
    })
  })

  describe('removeContainer', () => {
    it('should remove a container successfully', async () => {
      const mockRemove = vi.fn().mockResolvedValue(undefined)
      const mockContainer = { remove: mockRemove }

      vi.spyOn(dockerService as any, 'docker', 'get').mockReturnValue({
        getContainer: vi.fn().mockReturnValue(mockContainer),
      })

      await dockerService.removeContainer('container-1', true)

      expect(mockRemove).toHaveBeenCalledWith({ force: true, v: true })
    })
  })
})
