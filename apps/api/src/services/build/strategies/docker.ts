import Docker from 'dockerode'
import * as fs from 'fs'
import * as path from 'path'
import { BuildOptions, BuildResult, BuildStrategy } from './types'

export class DockerBuildStrategy implements BuildStrategy {
  private docker: Docker

  constructor() {
    this.docker = new Docker({ socketPath: '/var/run/docker.sock' })
  }

  async detect(context: string): Promise<boolean> {
    try {
      const dockerfilePath = path.join(context, 'Dockerfile')
      return fs.existsSync(dockerfilePath)
    } catch {
      return false
    }
  }

  async build(options: BuildOptions): Promise<BuildResult> {
    const startTime = Date.now()
    let logs = ''

    try {
      const { context = '.', dockerfile = 'Dockerfile', buildArgs = {}, tag = 'latest' } = options

      if (!context) {
        throw new Error('Build context is required')
      }

      logs = `Building Docker image from ${dockerfile}...\n`

      const imageName = options.image || `app-${Date.now()}`
      const fullImageName = `${imageName}:${tag}`

      const stream = await this.docker.buildImage(
        {
          context,
          src: ['.'],
        },
        {
          dockerfile,
          t: fullImageName,
          buildargs: buildArgs,
        }
      )

      await new Promise<void>((resolve, reject) => {
        this.docker.modem.followProgress(
          stream,
          (err: Error | null, res: unknown[]) => (err ? reject(err) : resolve()),
          (event: { stream?: string; error?: string }) => {
            if (event.stream) {
              logs += event.stream
            }
            if (event.error) {
              logs += `Error: ${event.error}\n`
            }
          }
        )
      })

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
