export interface BuildOptions {
  projectId: string
  source: 'dockerfile' | 'nixpacks' | 'image'
  context?: string
  dockerfile?: string
  image?: string
  tag?: string
  buildArgs?: Record<string, string>
  gitCommitHash?: string
  gitUrl?: string
  gitBranch?: string
}

export interface BuildResult {
  success: boolean
  imageId?: string
  imageTag?: string
  logs: string
  duration: number
  error?: string
}

export interface BuildStrategy {
  build(options: BuildOptions): Promise<BuildResult>
  detect(context: string): Promise<boolean>
}
