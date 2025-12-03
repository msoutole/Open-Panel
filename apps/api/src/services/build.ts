import Docker from 'dockerode'
import { prisma } from '../lib/prisma'
import { dockerService } from './docker'
import fsp from 'fs/promises'
import path from 'path'
import { spawn } from 'child_process'
import * as tar from 'tar-fs'
import { logInfo, logError, logWarn } from '../lib/logger'

interface BuildOptions {
  projectId: string
  source: 'dockerfile' | 'nixpacks' | 'paketo' | 'heroku' | 'image'
  context?: string // Path to build context
  dockerfile?: string // Path to Dockerfile (relative to context)
  image?: string // For source='image', pull from registry
  tag?: string
  buildArgs?: Record<string, string>
  envVars?: Record<string, string>
  gitUrl?: string
  gitBranch?: string
  gitCommitHash?: string
}

interface BuildResult {
  success: boolean
  imageId?: string
  imageTag?: string
  logs: string
  duration: number
  error?: string
}

/**
 * BuildService - Gerencia builds de aplicações usando vários buildpacks
 * 
 * **Buildpacks Suportados**:
 * - Dockerfile: Build customizado usando Dockerfile
 * - Nixpacks: Build automático para 14+ linguagens (Node.js, Python, Go, Rust, PHP, Ruby, etc.)
 * - Paketo: Buildpacks enterprise para Java, .NET, Node.js
 * - Image: Pull direto de registry Docker
 * 
 * **Fluxo de Build**:
 * 1. Detecta tipo de projeto automaticamente
 * 2. Escolhe buildpack apropriado
 * 3. Executa build gerando imagem Docker
 * 4. Cria deployment record no banco
 * 5. Deploy automático do container
 */
export class BuildService {
  private docker: Docker
  private static instance: BuildService

  private constructor() {
    this.docker = new Docker({ socketPath: '/var/run/docker.sock' })
  }

  /**
   * Obtém instância singleton do BuildService
   * 
   * @returns Instância singleton do BuildService
   * 
   * @example
   * ```typescript
   * const buildService = BuildService.getInstance()
   * ```
   */
  public static getInstance(): BuildService {
    if (!BuildService.instance) {
      BuildService.instance = new BuildService()
    }
    return BuildService.instance
  }

  /**
   * Constrói imagem Docker a partir de Dockerfile
   * 
   * **Fluxo de Execução**:
   * 1. Valida contexto de build e Dockerfile
   * 2. Cria tar stream do contexto (ignorando arquivos desnecessários)
   * 3. Executa build Docker com argumentos fornecidos
   * 4. Coleta logs do processo de build
   * 5. Retorna resultado com ID da imagem criada
   * 
   * **Arquivos Ignorados**:
   * - `.git`, `node_modules`, `.env`, `.DS_Store`, `dist`, `build`
   * 
   * @param options - Opções de build
   * @param options.projectId - ID do projeto
   * @param options.context - Caminho para o contexto de build (diretório com código)
   * @param options.dockerfile - Caminho relativo ao contexto do Dockerfile (padrão: 'Dockerfile')
   * @param options.tag - Tag para a imagem (padrão: 'build-{timestamp}')
   * @param options.buildArgs - Argumentos de build para passar ao Docker (opcional)
   * @returns Promise que resolve para resultado do build com logs e duração
   * 
   * @throws {Error} Se contexto não existir
   * @throws {Error} Se Dockerfile não existir
   * @throws {Error} Se build falhar
   * 
   * @example
   * ```typescript
   * const result = await buildService.buildFromDockerfile({
   *   projectId: 'proj_123',
   *   context: '/path/to/app',
   *   dockerfile: 'Dockerfile.prod',
   *   tag: 'v1.0.0',
   *   buildArgs: { NODE_ENV: 'production' }
   * })
   * 
   * if (result.success) {
   *   console.log(`Imagem criada: ${result.imageTag}`)
   * } else {
   *   console.error(`Build falhou: ${result.error}`)
   * }
   * ```
   */
  async buildFromDockerfile(options: BuildOptions): Promise<BuildResult> {
    const startTime = Date.now()
    let logs = ''

    try {
      const { projectId, context, dockerfile = 'Dockerfile', tag, buildArgs } = options

      if (!context) {
        throw new Error('Build context is required for Dockerfile builds')
      }

      // Verify context exists
      if (!await this.fileExists(context)) {
        throw new Error(`Build context not found: ${context}`)
      }

      // Verify Dockerfile exists
      const dockerfilePath = path.join(context, dockerfile)
      if (!await this.fileExists(dockerfilePath)) {
        throw new Error(`Dockerfile not found: ${dockerfilePath}`)
      }

      // Create tar stream from context
      const tarStream = tar.pack(context, {
        ignore: (name: string) => {
          // Ignore common unnecessary files
          const ignored = ['.git', 'node_modules', '.env', '.DS_Store', 'dist', 'build']
          return ignored.some((pattern) => name.includes(pattern))
        },
      })

      // Prepare build options
      const imageName = `openpanel/${projectId}`
      const imageTag = tag || `build-${Date.now()}`
      const fullImageName = `${imageName}:${imageTag}`

      // Build image
      const stream = await this.docker.buildImage(tarStream, {
        t: fullImageName,
        dockerfile: dockerfile,
        buildargs: buildArgs,
        nocache: false,
      })

      // Collect logs
      logs = await this.collectBuildLogs(stream)

      // Get image info
      const image = this.docker.getImage(fullImageName)
      const imageInfo = await image.inspect()

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

  /**
   * Constrói imagem usando Nixpacks buildpack
   * 
   * **Fluxo de Execução**:
   * 1. Verifica se Nixpacks está instalado
   * 2. Prepara variáveis de ambiente se fornecidas
   * 3. Executa comando nixpacks build
   * 4. Verifica se imagem foi criada
   * 5. Retorna resultado com logs
   * 
   * **Linguagens Suportadas** (14+):
   * - Node.js, Python, Go, Rust, PHP, Ruby, Java, Elixir, Crystal, etc.
   * 
   * **Vantagens**:
   * - Detecção automática de linguagem
   * - Build otimizado para cada linguagem
   * - Suporte a múltiplas versões
   * 
   * @param options - Opções de build
   * @param options.projectId - ID do projeto
   * @param options.context - Caminho para o contexto de build
   * @param options.tag - Tag para a imagem (padrão: 'nixpacks-{timestamp}')
   * @param options.envVars - Variáveis de ambiente para o build (opcional)
   * @returns Promise que resolve para resultado do build
   * 
   * @throws {Error} Se Nixpacks não estiver instalado
   * @throws {Error} Se contexto não existir
   * @throws {Error} Se build falhar
   * 
   * @example
   * ```typescript
   * const result = await buildService.buildWithNixpacks({
   *   projectId: 'proj_123',
   *   context: '/path/to/nodejs-app',
   *   tag: 'v1.0.0',
   *   envVars: { NODE_ENV: 'production' }
   * })
   * ```
   */
  async buildWithNixpacks(options: BuildOptions): Promise<BuildResult> {
    const startTime = Date.now()
    let logs = ''

    try {
      const { projectId, context, tag, envVars } = options

      if (!context) {
        throw new Error('Build context is required for Nixpacks builds')
      }

      // Check if nixpacks is installed
      const nixpacksInstalled = await this.checkNixpacksInstalled()
      if (!nixpacksInstalled) {
        throw new Error(
          'Nixpacks is not installed. Install with: curl -sSL https://nixpacks.com/install.sh | bash'
        )
      }

      const imageName = `openpanel/${projectId}`
      const imageTag = tag || `nixpacks-${Date.now()}`
      const fullImageName = `${imageName}:${imageTag}`

      // Prepare environment variables
      const envArgs: string[] = []
      if (envVars) {
        Object.entries(envVars).forEach(([key, value]) => {
          envArgs.push('--env', `${key}=${value}`)
        })
      }

      // Build with Nixpacks
      const nixpacksArgs = [
        'build',
        context,
        '--name',
        fullImageName,
        ...envArgs,
      ]

      logs = await this.runCommand('nixpacks', nixpacksArgs)

      // Verify image was created
      const image = this.docker.getImage(fullImageName)
      const imageInfo = await image.inspect()

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

  /**
   * Constrói imagem usando Paketo Buildpacks
   * 
   * **Fluxo de Execução**:
   * 1. Verifica se Pack CLI está instalado
   * 2. Prepara variáveis de ambiente se fornecidas
   * 3. Executa comando pack build com builder Paketo
   * 4. Verifica se imagem foi criada
   * 5. Retorna resultado com logs
   * 
   * **Linguagens Suportadas**:
   * - Java (Maven, Gradle)
   * - .NET (C#)
   * - Node.js
   * - Go
   * - PHP
   * 
   * **Vantagens**:
   * - Buildpacks enterprise-grade
   * - Otimizações avançadas
   * - Suporte a frameworks complexos
   * 
   * @param options - Opções de build
   * @param options.projectId - ID do projeto
   * @param options.context - Caminho para o contexto de build
   * @param options.tag - Tag para a imagem (padrão: 'paketo-{timestamp}')
   * @param options.envVars - Variáveis de ambiente para o build (opcional)
   * @returns Promise que resolve para resultado do build
   * 
   * @throws {Error} Se Pack CLI não estiver instalado
   * @throws {Error} Se contexto não existir
   * @throws {Error} Se build falhar
   * 
   * @example
   * ```typescript
   * const result = await buildService.buildWithPaketo({
   *   projectId: 'proj_123',
   *   context: '/path/to/java-app',
   *   tag: 'v1.0.0'
   * })
   * ```
   */
  async buildWithPaketo(options: BuildOptions): Promise<BuildResult> {
    const startTime = Date.now()
    let logs = ''

    try {
      const { projectId, context, tag, envVars } = options

      if (!context) {
        throw new Error('Build context is required for Paketo builds')
      }

      // Check if pack CLI is installed
      const packInstalled = await this.checkPackInstalled()
      if (!packInstalled) {
        throw new Error(
          'Pack CLI is not installed. Install from: https://buildpacks.io/docs/tools/pack/'
        )
      }

      const imageName = `openpanel/${projectId}`
      const imageTag = tag || `paketo-${Date.now()}`
      const fullImageName = `${imageName}:${imageTag}`

      // Prepare environment variables
      const envArgs: string[] = []
      if (envVars) {
        Object.entries(envVars).forEach(([key, value]) => {
          envArgs.push('--env', `${key}=${value}`)
        })
      }

      // Build with Pack using Paketo buildpacks
      const packArgs = [
        'build',
        fullImageName,
        '--path',
        context,
        '--builder',
        'paketobuildpacks/builder:base',
        ...envArgs,
      ]

      logs = await this.runCommand('pack', packArgs)

      // Verify image was created
      const image = this.docker.getImage(fullImageName)
      const imageInfo = await image.inspect()

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

  /**
   * Faz pull de imagem Docker de um registry
   * 
   * **Fluxo de Execução**:
   * 1. Valida nome da imagem
   * 2. Faz pull da imagem usando DockerService
   * 3. Monitora progresso do download
   * 4. Coleta logs do processo
   * 5. Retorna informações da imagem
   * 
   * **Uso**:
   * - Quando projeto usa imagem pré-construída
   * - Para imagens de registries públicos ou privados
   * - Quando não há necessidade de build customizado
   * 
   * @param options - Opções de pull
   * @param options.image - Nome da imagem (sem tag)
   * @param options.tag - Tag da imagem (padrão: 'latest')
   * @returns Promise que resolve para resultado com informações da imagem
   * 
   * @throws {Error} Se nome da imagem não for fornecido
   * @throws {Error} Se imagem não existir no registry
   * @throws {Error} Se houver erro de rede durante pull
   * 
   * @example
   * ```typescript
   * const result = await buildService.pullImage({
   *   image: 'nginx',
   *   tag: 'alpine'
   * })
   * ```
   */
  async pullImage(options: BuildOptions): Promise<BuildResult> {
    const startTime = Date.now()
    let logs = ''

    try {
      const { image, tag = 'latest' } = options

      if (!image) {
        throw new Error('Image name is required')
      }

      const fullImageName = `${image}:${tag}`

      logs = `Pulling image ${fullImageName}...\n`

      await dockerService.pullImage(fullImageName, (progress: unknown) => {
        const progressData = progress as { status?: string }
        if (progressData.status) {
          logs += `${progressData.status}\n`
        }
      })

      // Get image info
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

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fsp.access(filePath)
      return true
    } catch {
      return false
    }
  }

  /**
   * Detecta automaticamente o tipo de projeto e escolhe buildpack apropriado
   * 
   * **Fluxo de Execução**:
   * 1. Verifica arquivos de configuração no contexto
   * 2. Identifica linguagem/framework baseado em arquivos encontrados
   * 3. Retorna tipo detectado e buildpack recomendado
   * 
   * **Detecção por Arquivo**:
   * - `Dockerfile` → docker, buildpack: 'dockerfile'
   * - `package.json` → nodejs, buildpack: 'nixpacks'
   * - `requirements.txt` → python, buildpack: 'nixpacks'
   * - `go.mod` → go, buildpack: 'nixpacks'
   * - `Cargo.toml` → rust, buildpack: 'nixpacks'
   * - `composer.json` → php, buildpack: 'nixpacks'
   * - `pom.xml` ou `build.gradle` → java, buildpack: 'paketo'
   * - `.csproj` → dotnet, buildpack: 'paketo'
   * - Nenhum → unknown, buildpack: 'nixpacks' (padrão)
   * 
   * @param context - Caminho para o contexto do projeto
   * @returns Promise que resolve para objeto com tipo detectado e buildpack recomendado
   * 
   * @example
   * ```typescript
   * const detection = await buildService.detectProjectType('/path/to/app')
   * console.log(`Tipo: ${detection.type}, Buildpack: ${detection.buildpack}`)
   * // Tipo: nodejs, Buildpack: nixpacks
   * ```
   */
  async detectProjectType(context: string): Promise<{
    type: string
    buildpack: 'dockerfile' | 'nixpacks' | 'paketo'
  }> {
    // Check for Dockerfile
    if (await this.fileExists(path.join(context, 'Dockerfile'))) {
      return { type: 'docker', buildpack: 'dockerfile' }
    }

    // Check for package.json (Node.js)
    if (await this.fileExists(path.join(context, 'package.json'))) {
      return { type: 'nodejs', buildpack: 'nixpacks' }
    }

    // Check for requirements.txt (Python)
    if (await this.fileExists(path.join(context, 'requirements.txt'))) {
      return { type: 'python', buildpack: 'nixpacks' }
    }

    // Check for go.mod (Go)
    if (await this.fileExists(path.join(context, 'go.mod'))) {
      return { type: 'go', buildpack: 'nixpacks' }
    }

    // Check for Cargo.toml (Rust)
    if (await this.fileExists(path.join(context, 'Cargo.toml'))) {
      return { type: 'rust', buildpack: 'nixpacks' }
    }

    // Check for composer.json (PHP)
    if (await this.fileExists(path.join(context, 'composer.json'))) {
      return { type: 'php', buildpack: 'nixpacks' }
    }

    // Check for pom.xml or build.gradle (Java)
    if (
      (await this.fileExists(path.join(context, 'pom.xml'))) ||
      (await this.fileExists(path.join(context, 'build.gradle')))
    ) {
      return { type: 'java', buildpack: 'paketo' }
    }

    // Check for .csproj (C#/.NET)
    try {
      const files = await fsp.readdir(context)
      if (files.some((file) => file.endsWith('.csproj'))) {
        return { type: 'dotnet', buildpack: 'paketo' }
      }
    } catch {
      // Ignore error if directory doesn't exist
    }

    // Default to Nixpacks
    return { type: 'unknown', buildpack: 'nixpacks' }
  }

  /**
   * Método principal de build - escolhe buildpack automaticamente baseado em source
   * 
   * **Fluxo de Execução**:
   * 1. Verifica source especificado nas opções
   * 2. Roteia para método de build apropriado
   * 3. Retorna resultado do build
   * 
   * **Sources Suportados**:
   * - `'dockerfile'` → buildFromDockerfile()
   * - `'nixpacks'` → buildWithNixpacks()
   * - `'paketo'` → buildWithPaketo()
   * - `'image'` → pullImage()
   * 
   * @param options - Opções de build incluindo source
   * @param options.source - Tipo de build a executar
   * @returns Promise que resolve para resultado do build
   * 
   * @throws {Error} Se source não for suportado
   * 
   * @example
   * ```typescript
   * const result = await buildService.build({
   *   projectId: 'proj_123',
   *   source: 'nixpacks',
   *   context: '/path/to/app'
   * })
   * ```
   */
  async build(options: BuildOptions): Promise<BuildResult> {
    const { source } = options

    switch (source) {
      case 'dockerfile':
        return this.buildFromDockerfile(options)
      case 'nixpacks':
        return this.buildWithNixpacks(options)
      case 'paketo':
        return this.buildWithPaketo(options)
      case 'image':
        return this.pullImage(options)
      default:
        throw new Error(`Unsupported build source: ${source}`)
    }
  }

  /**
   * Cria registro de deployment e inicia build assíncrono
   * 
   * **Fluxo de Execução**:
   * 1. Cria registro de deployment no banco com status 'BUILDING'
   * 2. Inicia build assíncrono em background
   * 3. Retorna deployment criado imediatamente
   * 4. Build atualiza deployment quando completo
   * 
   * **Estados do Deployment**:
   * - `BUILDING` → Build em progresso
   * - `DEPLOYING` → Build completo, deployando container
   * - `SUCCESS` → Deploy completo com sucesso
   * - `FAILED` → Build ou deploy falhou
   * 
   * **Comportamento**:
   * - Build executa em background (não bloqueia)
   * - Deployment pode ser consultado para status
   * - Logs são salvos no registro de deployment
   * - Container é criado e iniciado automaticamente após build
   * 
   * @param options - Opções de build e deployment
   * @param options.projectId - ID do projeto
   * @param options.gitCommitHash - Hash do commit Git (opcional)
   * @param options.gitUrl - URL do repositório Git (opcional)
   * @param options.gitBranch - Branch do Git (opcional)
   * @returns Promise que resolve para deployment criado
   * 
   * @throws {Error} Se projeto não existir
   * 
   * @example
   * ```typescript
   * const deployment = await buildService.createDeployment({
   *   projectId: 'proj_123',
   *   source: 'nixpacks',
   *   context: '/path/to/app',
   *   gitCommitHash: 'abc123',
   *   gitBranch: 'main'
   * })
   * 
   * // Verificar status depois
   * const updated = await prisma.deployment.findUnique({
   *   where: { id: deployment.id }
   * })
   * console.log(`Status: ${updated.status}`)
   * ```
   */
  async createDeployment(options: BuildOptions): Promise<{
    id: string
    projectId: string
    version: string
    status: string
    gitCommitHash?: string | null
    gitUrl?: string | null
    gitBranch?: string | null
    startedAt: Date | null
  }> {
    const { projectId, gitCommitHash, gitUrl, gitBranch } = options

    // Create deployment record
    const deployment = await prisma.deployment.create({
      data: {
        projectId,
        version: `v${Date.now()}`,
        status: 'BUILDING',
        gitCommitHash,
        gitUrl,
        gitBranch,
        startedAt: new Date(),
      },
    })

    // Start build (async)
    this.executeBuild(deployment.id, options).catch((error) => {
      logError(`Build failed for deployment ${deployment.id}`, error, {
        deploymentId: deployment.id,
      })
    })

    return deployment
  }

  /**
   * Execute build and update deployment record
   */
  private async executeBuild(deploymentId: string, options: BuildOptions) {
    const startTime = Date.now()

    try {
      // Get deployment and project info
      const deployment = await prisma.deployment.findUnique({
        where: { id: deploymentId },
        include: { project: { include: { envVars: true } } },
      })

      if (!deployment || !deployment.project) {
        throw new Error('Deployment or project not found')
      }

      const project = deployment.project

      // Update status to BUILDING
      await prisma.deployment.update({
        where: { id: deploymentId },
        data: { status: 'BUILDING' },
      })

      // Build image
      const result = await this.build(options)

      if (!result.success) {
        throw new Error(result.error || 'Build failed')
      }

      const buildDuration = Date.now() - startTime

      // Extract image info from result
      const imageName = result.imageTag?.split(':')[0] || options.image || `${project.slug}-app`
      const imageTag = result.imageTag?.split(':')[1] || options.tag || 'latest'

      // Update deployment with build results
      await prisma.deployment.update({
        where: { id: deploymentId },
        data: {
          status: 'DEPLOYING',
          buildLogs: result.logs,
          buildDuration,
        },
      })

      // Deploy container
      logInfo(`Deploying container for project ${project.slug}`, {
        projectSlug: project.slug,
        projectId: project.id,
      })

      // Stop existing container if any
      const existingContainers = await prisma.container.findMany({
        where: { projectId: project.id },
      })

      for (const existingContainer of existingContainers) {
        try {
          logInfo(`Stopping existing container: ${existingContainer.dockerId}`, {
            dockerId: existingContainer.dockerId,
          })
          await dockerService.stopContainer(existingContainer.dockerId, 30)
          await dockerService.removeContainer(existingContainer.dockerId, true)
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          logWarn(`Failed to remove existing container: ${errorMessage}`, {
            dockerId: existingContainer.dockerId,
            error: errorMessage,
          })
        }
      }

      // Create and start new container
      const containerName = `${project.slug}-${Date.now()}`
      const containerConfig = {
        name: containerName,
        image: imageName,
        tag: imageTag,
        projectId: project.id,
        env: project.envVars.reduce((acc: Record<string, string>, curr: typeof project.envVars[0]) => ({ ...acc, [curr.key]: curr.value }), {}) as Record<string, string>,
      }

      const newContainer = await dockerService.createContainer(containerConfig)
      await dockerService.startContainer(newContainer.dockerId)

      logInfo(`Container deployed successfully: ${newContainer.dockerId}`, {
        dockerId: newContainer.dockerId,
        projectId: project.id,
      })

      // Mark as SUCCESS
      await prisma.deployment.update({
        where: { id: deploymentId },
        data: {
          status: 'SUCCESS',
          completedAt: new Date(),
        },
      })
    } catch (error: unknown) {
      logError(`Build execution error`, error, {
        deploymentId,
      })

      // Mark as FAILED
      await prisma.deployment.update({
        where: { id: deploymentId },
        data: {
          status: 'FAILED',
          buildLogs: (error as Error).message,
          completedAt: new Date(),
        },
      })
    }
  }

  /**
   * Helper: Collect logs from Docker build stream
   */
  private async collectBuildLogs(stream: NodeJS.ReadableStream): Promise<string> {
    return new Promise((resolve, reject) => {
      let logs = ''

      stream.on('data', (chunk: Buffer | string) => {
        const data = chunk.toString()
        try {
          const json = JSON.parse(data)
          if (json.stream) {
            logs += json.stream
          } else if (json.error) {
            logs += `ERROR: ${json.error}\n`
          }
        } catch {
          logs += data
        }
      })

      stream.on('end', () => {
        resolve(logs)
      })

      stream.on('error', (error: Error) => {
        reject(error)
      })
    })
  }

  /**
   * Helper: Run command and collect output
   */
  private async runCommand(command: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      let output = ''
      let errorOutput = ''

      const proc = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
      })

      proc.stdout.on('data', (data) => {
        output += data.toString()
      })

      proc.stderr.on('data', (data) => {
        errorOutput += data.toString()
      })

      proc.on('close', (code) => {
        if (code === 0) {
          resolve(output + errorOutput)
        } else {
          reject(new Error(`Command failed with code ${code}\n${errorOutput}`))
        }
      })

      proc.on('error', (error) => {
        reject(error)
      })
    })
  }

  /**
   * Helper: Check if Nixpacks is installed
   */
  private async checkNixpacksInstalled(): Promise<boolean> {
    try {
      await this.runCommand('nixpacks', ['--version'])
      return true
    } catch {
      return false
    }
  }

  /**
   * Helper: Check if Pack CLI is installed
   */
  private async checkPackInstalled(): Promise<boolean> {
    try {
      await this.runCommand('pack', ['version'])
      return true
    } catch {
      return false
    }
  }
}

// Export singleton instance
export const buildService = BuildService.getInstance()
