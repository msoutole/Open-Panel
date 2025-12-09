import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { DockerService } from '../../services/docker'
import { DockerConnectionError, ContainerOperationError } from '../../errors/docker.errors'
import Dockerode from 'dockerode' // Import Dockerode for its types

// Define a mock type for PrismaClient that only includes methods actually used by DockerService
type MockPrismaClient = {
  container: {
    create: typeof vi.fn;
    update: typeof vi.fn;
    delete: typeof vi.fn;
    findUnique: typeof vi.fn;
  };
};

// Define a mock type for Dockerode that only includes methods actually used by DockerService
type MockDockerode = {
  listContainers: typeof vi.fn;
  createContainer: typeof vi.fn;
  getContainer: typeof vi.fn;
  listImages: typeof vi.fn;
  pull: typeof vi.fn;
  ping: typeof vi.fn;
  info: typeof vi.fn;
  getImage: typeof vi.fn;
  modem: {
    followProgress: typeof vi.fn;
  };
};

// Mock Prisma lib BEFORE importing docker service to avoid initialization error
vi.mock('../../lib/prisma', () => ({
  prisma: {
    container: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    }
  }
}))


const mockDockerode: MockDockerode = {
  listContainers: vi.fn(),
  createContainer: vi.fn(),
  getContainer: vi.fn(),
  listImages: vi.fn(),
  pull: vi.fn(),
  ping: vi.fn(),
  info: vi.fn(),
  getImage: vi.fn(),
  modem: {
    followProgress: vi.fn((stream, onFinished) => onFinished(null, {}))
  }
}

describe('Docker Service', () => {
  let dockerService: DockerService
  let mockPrismaInstance: MockPrismaClient;

  beforeEach(() => {
    vi.clearAllMocks()
    // Explicitly create mock Prisma instance
    mockPrismaInstance = {
      container: {
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        findUnique: vi.fn(),
      }
    };
    // Instantiate DockerService with mocks, using casts where the mock is not a full implementation
    dockerService = new DockerService(mockDockerode as unknown as Docker, mockPrismaInstance as any)
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

      mockDockerode.listContainers.mockResolvedValue(mockContainers)

      const result = await dockerService.listContainers()

      expect(mockDockerode.listContainers).toHaveBeenCalledWith({ all: true })
      expect(result).toEqual(mockContainers)
    })

    it('should handle errors when listing containers', async () => {
      const mockError = new Error('Docker daemon not running')
      mockDockerode.listContainers.mockRejectedValue(mockError)

      await expect(dockerService.listContainers()).rejects.toThrow(DockerConnectionError)
    })
  })

  describe('getContainerStats', () => {
    it('should return container statistics', async () => {
      const mockStats: Dockerode.ContainerStats = { // Use Dockerode's type for stats
        read: new Date().toISOString(),
        preread: new Date().toISOString(),
        precpu_stats: {
            cpu_usage: {
                total_usage: 1000,
                system_cpu_usage: 1000,
            },
            system_cpu_usage: 1000,
            online_cpus: 1,
            throttling_data: { periods: 0, throttled_periods: 0, throttled_time: 0 }
        },
        cpu_stats: {
            cpu_usage: {
                total_usage: 2000,
                usage_in_kernelmode: 1000,
                usage_in_usermode: 1000,
            },
            system_cpu_usage: 2000,
            online_cpus: 1,
            throttling_data: { periods: 0, throttled_periods: 0, throttled_time: 0 }
        },
        memory_stats: {
            usage: 1000,
            max_usage: 1000,
            stats: {},
            limit: 2000,
        },
        networks: {
            eth0: { rx_bytes: 1000, tx_bytes: 1000 }
        },
        blkio_stats: {
            io_service_bytes_recursive: [
                { op: 'read', value: 100 },
                { op: 'write', value: 100 },
            ]
        }
      }

      const mockContainer = {
        stats: vi.fn().mockResolvedValue(mockStats),
      }

      mockDockerode.getContainer.mockReturnValue(mockContainer as any) // Need cast here for partial mock
      
      mockPrismaInstance.container.update.mockResolvedValue({})

      const result = await dockerService.getContainerStats('container-1')

      expect(result).toBeDefined()
      expect(result.cpuPercent).toBeDefined()
      expect(result.memoryUsage).toBe(1000)
      expect(result.memoryLimit).toBe(2000)
      expect(result.memoryPercent).toBe(50)
    })
  })

  describe('healthCheck', () => {
    it('should return true when Docker is running', async () => {
      mockDockerode.ping.mockResolvedValue(Buffer.from('OK'))

      const result = await dockerService.healthCheck()

      expect(result).toBe(true)
      expect(mockDockerode.ping).toHaveBeenCalled()
    })

    it('should return false when Docker is not running', async () => {
      mockDockerode.ping.mockRejectedValue(new Error('Cannot connect'))

      const result = await dockerService.healthCheck()

      expect(result).toBe(false)
    })
  })

  describe('createContainer', () => {
    it('should create a new container with correct options', async () => {
      const mockContainer = {
        id: 'new-container-id',
        inspect: vi.fn().mockResolvedValue({
            Id: 'new-container-id',
            Name: '/test-container',
            State: {
                Running: true,
                StartedAt: new Date().toISOString()
            },
            Config: {
                Image: 'nginx:latest',
                Cmd: ['nginx']
            }
        }),
      }

      mockDockerode.createContainer.mockResolvedValue(mockContainer)
      mockDockerode.pull.mockImplementation((image, cb) => {
        cb(null, { pipe: vi.fn() })
      })
      mockDockerode.modem.followProgress.mockImplementation((stream, cb) => cb(null, []))
      
      mockPrismaInstance.container.create.mockResolvedValue({ id: 'db-id' })

      const options = {
        name: 'test-container',
        image: 'nginx',
        tag: 'latest',
        projectId: 'project-1',
        env: { NODE_ENV: 'production' },
      }

      const result = await dockerService.createContainer(options)

      expect(mockDockerode.createContainer).toHaveBeenCalled()
      expect(result).toBeDefined()
    })

    it('should throw error when image pull fails', async () => {
        const mockError = new Error('Image not found')
        mockDockerode.pull.mockImplementation((image, cb) => cb(mockError))
  
        const options = {
          name: 'test-container',
          image: 'nonexistent',
          tag: 'latest',
          projectId: 'project-1',
        }
  
        await expect(dockerService.createContainer(options)).rejects.toThrow(ContainerOperationError)
      })
  })

  describe('stopContainer', () => {
    it('should stop a running container gracefully', async () => {
      const mockStop = vi.fn().mockResolvedValue(undefined)
      const mockInspect = vi.fn().mockResolvedValue({ State: { Running: false } })
      const mockContainer = { 
        stop: mockStop,
        inspect: mockInspect
      }

      mockDockerode.getContainer.mockReturnValue(mockContainer as any)

      mockPrismaInstance.container.update.mockResolvedValue({})

      await dockerService.stopContainer('container-1', 10)

      expect(mockStop).toHaveBeenCalledWith({ t: 10 })
    })
  })

  describe('removeContainer', () => {
    it('should remove a container successfully', async () => {
      const mockRemove = vi.fn().mockResolvedValue(undefined)
      const mockContainer = { remove: mockRemove }

      mockDockerode.getContainer.mockReturnValue(mockContainer as any)
      mockPrismaInstance.container.delete.mockResolvedValue({})

      await dockerService.removeContainer('container-1', true)

      expect(mockRemove).toHaveBeenCalledWith({ force: true })
    })
  })
})
