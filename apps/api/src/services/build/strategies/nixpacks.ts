import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs'
import Docker from 'dockerode'
import { BuildOptions, BuildResult, BuildStrategy } from './types'

const execAsync = promisify(exec)

export class NixpacksBuildStrategy implements BuildStrategy {
  private docker: Docker

  constructor() {
    this.docker = new Docker({ socketPath: '/var/run/docker.sock' })
  }

  async detect(context: string): Promise<boolean> {
    try {
      // Nixpacks can build many types of projects
      // Check for common indicators like package.json, requirements.txt, etc.
      const indicators = [
        'package.json',
        'requirements.txt',
        'go.mod',
        'Cargo.toml',
        'pom.xml',
        'build.gradle',
      ]

      for (const indicator of indicators) {
        const filePath = `${context}/${indicator}`
        if (fs.existsSync(filePath)) {
          return true
        }
      }

      return false
    } catch {
      return false
    }
  }

  async build(options: BuildOptions): Promise<BuildResult> {
    const startTime = Date.now()
    let logs = ''

    try {
      const { context = '.', tag = 'latest' } = options

      if (!context) {
        throw new Error('Build context is required')
      }

      // Check if nixpacks is installed
      try {
        await execAsync('nixpacks --version')
      } catch {
        throw new Error('Nixpacks is not installed. Please install it with: curl -sSL https://nixpacks.com/install.sh | bash')
      }

      logs = `Building with Nixpacks from ${context}...\n`

      const imageName = options.image || `app-${Date.now()}`
      const fullImageName = `${imageName}:${tag}`

      // Build with nixpacks
      const buildArgs = options.buildArgs ? Object.entries(options.buildArgs).map(([k, v]) => `--build-arg ${k}=${v}`).join(' ') : ''
      const nixpacksCmd = `nixpacks build ${context} --name ${fullImageName} ${buildArgs}`

      logs += `Running: ${nixpacksCmd}\n`

      const { stdout, stderr } = await execAsync(nixpacksCmd)
      logs += stdout
      if (stderr) {
        logs += `\nStderr: ${stderr}`
      }

      // Verify the image was created
      const dockerImage = this.docker.getImage(fullImageName)
      const imageInfo = await dockerImage.inspect()

      const duration = Date.now() - startTime

      return {
        success: true,
        imageId: imageInfo.Id,
        imageTag: fullImageName,
        logs,
        duration,
      }
    } catch (error: unknown) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logs += `\nError: ${errorMessage}`

      return {
        success: false,
        logs,
        duration,
        error: errorMessage,
      }
    }
  }
}
