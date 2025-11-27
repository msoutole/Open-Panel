import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { buildService, BuildService } from '../../services/build'
import fs from 'fs'
import path from 'path'

// Mock dependencies
vi.mock('dockerode', () => {
  return {
    default: vi.fn(() => ({
      buildImage: vi.fn(),
      getImage: vi.fn(),
      pull: vi.fn(),
    })),
  }
})

vi.mock('fs')
vi.mock('tar-fs', () => ({
  pack: vi.fn(() => ({
    pipe: vi.fn(),
  })),
}))

vi.mock('../../lib/prisma', () => ({
  prisma: {
    deployment: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    container: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('../../services/docker', () => ({
  dockerService: {
    stopContainer: vi.fn(),
    removeContainer: vi.fn(),
    createContainer: vi.fn(),
    startContainer: vi.fn(),
    pullImage: vi.fn(),
  },
}))

describe('BuildService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('detectProjectType', () => {
    it('should detect Dockerfile project', async () => {
      vi.mocked(fs.existsSync).mockImplementation((path) => {
        return (path as string).endsWith('Dockerfile')
      })

      const result = await buildService.detectProjectType('/test/context')

      expect(result).toEqual({
        type: 'docker',
        buildpack: 'dockerfile',
      })
    })

    it('should detect Node.js project', async () => {
      vi.mocked(fs.existsSync).mockImplementation((path) => {
        return (path as string).endsWith('package.json')
      })

      const result = await buildService.detectProjectType('/test/context')

      expect(result).toEqual({
        type: 'nodejs',
        buildpack: 'nixpacks',
      })
    })

    it('should detect Python project', async () => {
      vi.mocked(fs.existsSync).mockImplementation((path) => {
        return (path as string).endsWith('requirements.txt')
      })

      const result = await buildService.detectProjectType('/test/context')

      expect(result).toEqual({
        type: 'python',
        buildpack: 'nixpacks',
      })
    })

    it('should detect Go project', async () => {
      vi.mocked(fs.existsSync).mockImplementation((path) => {
        return (path as string).endsWith('go.mod')
      })

      const result = await buildService.detectProjectType('/test/context')

      expect(result).toEqual({
        type: 'go',
        buildpack: 'nixpacks',
      })
    })

    it('should detect Rust project', async () => {
      vi.mocked(fs.existsSync).mockImplementation((path) => {
        return (path as string).endsWith('Cargo.toml')
      })

      const result = await buildService.detectProjectType('/test/context')

      expect(result).toEqual({
        type: 'rust',
        buildpack: 'nixpacks',
      })
    })

    it('should detect PHP project', async () => {
      vi.mocked(fs.existsSync).mockImplementation((path) => {
        return (path as string).endsWith('composer.json')
      })

      const result = await buildService.detectProjectType('/test/context')

      expect(result).toEqual({
        type: 'php',
        buildpack: 'nixpacks',
      })
    })

    it('should detect Java project with pom.xml', async () => {
      vi.mocked(fs.existsSync).mockImplementation((path) => {
        return (path as string).endsWith('pom.xml')
      })

      const result = await buildService.detectProjectType('/test/context')

      expect(result).toEqual({
        type: 'java',
        buildpack: 'paketo',
      })
    })

    it('should detect Java project with build.gradle', async () => {
      vi.mocked(fs.existsSync).mockImplementation((path) => {
        return (path as string).endsWith('build.gradle')
      })

      const result = await buildService.detectProjectType('/test/context')

      expect(result).toEqual({
        type: 'java',
        buildpack: 'paketo',
      })
    })

    it('should detect .NET project', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false)
      vi.mocked(fs.readdirSync).mockReturnValue(['project.csproj'] as any)

      const result = await buildService.detectProjectType('/test/context')

      expect(result).toEqual({
        type: 'dotnet',
        buildpack: 'paketo',
      })
    })

    it('should default to nixpacks for unknown projects', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false)
      vi.mocked(fs.readdirSync).mockReturnValue([])

      const result = await buildService.detectProjectType('/test/context')

      expect(result).toEqual({
        type: 'unknown',
        buildpack: 'nixpacks',
      })
    })
  })

  describe('buildFromDockerfile', () => {
    it('should fail when context is not provided', async () => {
      const result = await buildService.buildFromDockerfile({
        projectId: 'test-project',
        source: 'dockerfile',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Build context is required')
    })

    it('should fail when context does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false)

      const result = await buildService.buildFromDockerfile({
        projectId: 'test-project',
        source: 'dockerfile',
        context: '/non/existent/path',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Build context not found')
    })

    it('should fail when Dockerfile does not exist', async () => {
      vi.mocked(fs.existsSync).mockImplementation((path) => {
        return !(path as string).endsWith('Dockerfile')
      })

      const result = await buildService.buildFromDockerfile({
        projectId: 'test-project',
        source: 'dockerfile',
        context: '/test/context',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Dockerfile not found')
    })
  })

  describe('pullImage', () => {
    it('should fail when image name is not provided', async () => {
      const result = await buildService.pullImage({
        projectId: 'test-project',
        source: 'image',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Image name is required')
    })
  })

  describe('build', () => {
    it('should route to correct build method based on source', async () => {
      const dockerfileSpy = vi.spyOn(buildService, 'buildFromDockerfile')
      const nixpacksSpy = vi.spyOn(buildService, 'buildWithNixpacks')
      const paketoSpy = vi.spyOn(buildService, 'buildWithPaketo')
      const pullImageSpy = vi.spyOn(buildService, 'pullImage')

      // Mock all methods to avoid actual execution
      dockerfileSpy.mockResolvedValue({
        success: true,
        logs: 'test',
        duration: 0,
      })
      nixpacksSpy.mockResolvedValue({
        success: true,
        logs: 'test',
        duration: 0,
      })
      paketoSpy.mockResolvedValue({
        success: true,
        logs: 'test',
        duration: 0,
      })
      pullImageSpy.mockResolvedValue({
        success: true,
        logs: 'test',
        duration: 0,
      })

      // Test dockerfile
      await buildService.build({
        projectId: 'test',
        source: 'dockerfile',
        context: '/test',
      })
      expect(dockerfileSpy).toHaveBeenCalled()

      // Test nixpacks
      await buildService.build({
        projectId: 'test',
        source: 'nixpacks',
        context: '/test',
      })
      expect(nixpacksSpy).toHaveBeenCalled()

      // Test paketo
      await buildService.build({
        projectId: 'test',
        source: 'paketo',
        context: '/test',
      })
      expect(paketoSpy).toHaveBeenCalled()

      // Test image
      await buildService.build({
        projectId: 'test',
        source: 'image',
        image: 'nginx',
      })
      expect(pullImageSpy).toHaveBeenCalled()
    })

    it('should throw error for unsupported source', async () => {
      await expect(
        buildService.build({
          projectId: 'test',
          source: 'unsupported' as any,
        })
      ).rejects.toThrow('Unsupported build source')
    })
  })

  describe('buildWithNixpacks', () => {
    it('should fail when context is not provided', async () => {
      const result = await buildService.buildWithNixpacks({
        projectId: 'test-project',
        source: 'nixpacks',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Build context is required')
    })
  })

  describe('buildWithPaketo', () => {
    it('should fail when context is not provided', async () => {
      const result = await buildService.buildWithPaketo({
        projectId: 'test-project',
        source: 'paketo',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Build context is required')
    })
  })
})
