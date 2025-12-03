import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { prisma } from '../lib/prisma'
import { logInfo, logError, logWarn } from '../lib/logger'

interface GitCloneOptions {
  url: string
  branch?: string
  targetDir?: string
  depth?: number // Shallow clone depth
}

interface WebhookPayload {
  repository: {
    url: string
    fullName: string
  }
  ref: string // refs/heads/main
  commits: Array<{
    id: string
    message: string
    author: {
      name: string
      email: string
    }
    timestamp: string
  }>
  pusher: {
    name: string
    email: string
  }
}

/**
 * GitService - Gerencia operações Git e processamento de webhooks
 * 
 * **Funcionalidades**:
 * - Clone de repositórios Git
 * - Pull de atualizações
 * - Processamento de webhooks (GitHub, GitLab, Bitbucket)
 * - Verificação de assinaturas de webhook
 * - Trigger automático de deployments
 * 
 * **Workspace**:
 * - Repositórios são clonados em diretório temporário
 * - Limpeza automática de repositórios antigos
 * - Suporte a shallow clone para economia de espaço
 */
export class GitService {
  private static instance: GitService
  private workspacePath: string

  private constructor() {
    // Create workspace directory for cloning repos
    this.workspacePath = process.env.GIT_WORKSPACE_PATH || '/tmp/openpanel/git'
    if (!fs.existsSync(this.workspacePath)) {
      fs.mkdirSync(this.workspacePath, { recursive: true })
    }
  }

  /**
   * Obtém instância singleton do GitService
   * 
   * @returns Instância singleton do GitService
   * 
   * @example
   * ```typescript
   * const gitService = GitService.getInstance()
   * ```
   */
  public static getInstance(): GitService {
    if (!GitService.instance) {
      GitService.instance = new GitService()
    }
    return GitService.instance
  }

  /**
   * Clona um repositório Git
   * 
   * **Fluxo de Execução**:
   * 1. Gera nome único para diretório de destino
   * 2. Executa git clone com shallow clone (depth=1 por padrão)
   * 3. Clona apenas branch especificada
   * 4. Retorna caminho do repositório clonado
   * 5. Limpa diretório em caso de erro
   * 
   * **Comportamento**:
   * - Shallow clone por padrão (apenas último commit)
   * - Clone apenas da branch especificada
   * - Limpeza automática em caso de falha
   * 
   * @param options - Opções de clone
   * @param options.url - URL do repositório Git (HTTPS ou SSH)
   * @param options.branch - Branch a clonar (padrão: 'main')
   * @param options.targetDir - Nome do diretório de destino (opcional, gera único se não fornecido)
   * @param options.depth - Profundidade do shallow clone (padrão: 1)
   * @returns Promise que resolve para caminho do repositório clonado
   * 
   * @throws {Error} Se URL do repositório for inválida
   * @throws {Error} Se branch não existir
   * @throws {Error} Se não tiver permissão para acessar repositório
   * 
   * @example
   * ```typescript
   * const repoPath = await gitService.clone({
   *   url: 'https://github.com/user/repo.git',
   *   branch: 'main',
   *   depth: 1
   * })
   * ```
   */
  async clone(options: GitCloneOptions): Promise<string> {
    const { url, branch = 'main', targetDir, depth = 1 } = options

    // Generate unique directory name if not provided
    const dirName = targetDir || `repo-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`
    const clonePath = path.join(this.workspacePath, dirName)

    // Prepare git clone command
    const args = [
      'clone',
      '--depth',
      depth.toString(),
      '--branch',
      branch,
      '--single-branch',
      url,
      clonePath,
    ]

    try {
      await this.runGitCommand(args)
      return clonePath
    } catch (error: unknown) {
      // Clean up failed clone
      if (fs.existsSync(clonePath)) {
        fs.rmSync(clonePath, { recursive: true, force: true })
      }
      throw error
    }
  }

  /**
   * Atualiza repositório com últimas mudanças do remote
   * 
   * **Fluxo de Execução**:
   * 1. Faz checkout para branch especificada
   * 2. Executa git pull da branch
   * 3. Atualiza código local com mudanças remotas
   * 
   * **Comportamento**:
   * - Atualiza branch local com remote
   * - Mantém histórico de commits
   * - Pode causar conflitos se houver mudanças locais
   * 
   * @param repoPath - Caminho do repositório Git local
   * @param branch - Branch a atualizar (padrão: 'main')
   * @returns Promise que resolve quando pull completo
   * 
   * @throws {Error} Se repositório não existir
   * @throws {Error} Se branch não existir
   * @throws {Error} Se houver conflitos de merge
   * 
   * @example
   * ```typescript
   * await gitService.pull('/path/to/repo', 'main')
   * ```
   */
  async pull(repoPath: string, branch = 'main'): Promise<void> {
    // Checkout branch
    await this.runGitCommand(['checkout', branch], repoPath)
    // Pull changes
    await this.runGitCommand(['pull', 'origin', branch], repoPath)
  }

  /**
   * Obtém informações do último commit do repositório
   * 
   * **Fluxo de Execução**:
   * 1. Executa git log para obter último commit
   * 2. Extrai hash, mensagem, autor e data
   * 3. Retorna informações formatadas
   * 
   * **Informações Retornadas**:
   * - `hash`: Hash completo do commit (SHA)
   * - `message`: Mensagem do commit
   * - `author`: Nome do autor
   * - `date`: Data do commit (formato ISO)
   * 
   * @param repoPath - Caminho do repositório Git local
   * @returns Promise que resolve para objeto com informações do commit
   * 
   * @throws {Error} Se repositório não existir
   * @throws {Error} Se não houver commits no repositório
   * 
   * @example
   * ```typescript
   * const commitInfo = await gitService.getCommitInfo('/path/to/repo')
   * console.log(`Último commit: ${commitInfo.hash}`)
   * console.log(`Mensagem: ${commitInfo.message}`)
   * ```
   */
  async getCommitInfo(repoPath: string): Promise<{
    hash: string
    message: string
    author: string
    date: string
  }> {
    const output = await this.runGitCommand(
      ['log', '-1', '--pretty=format:%H|%s|%an|%ai'],
      repoPath
    )

    const [hash, message, author, date] = output.trim().split('|')

    return { hash, message, author, date }
  }

  /**
   * Remove repositórios antigos do workspace
   * 
   * **Fluxo de Execução**:
   * 1. Lista todos os diretórios no workspace
   * 2. Verifica data de modificação de cada diretório
   * 3. Remove diretórios mais antigos que threshold
   * 4. Retorna número de diretórios removidos
   * 
   * **Comportamento**:
   * - Remove apenas diretórios (não arquivos)
   * - Baseado em data de modificação (mtime)
   * - Ignora erros de remoção individual
   * 
   * @param olderThanDays - Número de dias para considerar antigo (padrão: 7)
   * @returns Promise que resolve para número de repositórios removidos
   * 
   * @example
   * ```typescript
   * const removed = await gitService.cleanup(7) // Remove com mais de 7 dias
   * console.log(`${removed} repositórios removidos`)
   * ```
   */
  async cleanup(olderThanDays = 7): Promise<number> {
    let cleaned = 0
    const cutoffTime = Date.now() - olderThanDays * 24 * 60 * 60 * 1000

    const entries = fs.readdirSync(this.workspacePath)

    for (const entry of entries) {
      const entryPath = path.join(this.workspacePath, entry)
      const stats = fs.statSync(entryPath)

      if (stats.isDirectory() && stats.mtimeMs < cutoffTime) {
        try {
          fs.rmSync(entryPath, { recursive: true, force: true })
          cleaned++
        } catch (error) {
          logError(`Failed to cleanup ${entryPath}`, error)
        }
      }
    }

    return cleaned
  }

  /**
   * Verifica assinatura de webhook do GitHub usando HMAC SHA-256
   * 
   * **Fluxo de Execução**:
   * 1. Calcula HMAC SHA-256 do payload com secret
   * 2. Compara com assinatura fornecida usando timing-safe comparison
   * 3. Retorna true se assinaturas correspondem
   * 
   * **Segurança**:
   * - Usa timing-safe comparison para prevenir timing attacks
   * - Formato GitHub: 'sha256=' + hex digest
   * 
   * @param payload - Payload do webhook como string
   * @param signature - Assinatura do header 'X-Hub-Signature-256'
   * @param secret - Secret configurado no GitHub
   * @returns true se assinatura for válida, false caso contrário
   * 
   * @example
   * ```typescript
   * const isValid = gitService.verifyGitHubSignature(
   *   requestBody,
   *   request.headers['x-hub-signature-256'],
   *   githubSecret
   * )
   * if (!isValid) {
   *   throw new Error('Invalid signature')
   * }
   * ```
   */
  verifyGitHubSignature(payload: string, signature: string, secret: string): boolean {
    const hmac = crypto.createHmac('sha256', secret)
    const digest = 'sha256=' + hmac.update(payload).digest('hex')
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
  }

  /**
   * Verifica token de webhook do GitLab
   * 
   * **Fluxo de Execução**:
   * 1. Compara token do header com secret configurado
   * 2. Retorna true se correspondem
   * 
   * **Nota**: GitLab usa comparação simples de token (não HMAC)
   * 
   * @param token - Token do header 'X-Gitlab-Token'
   * @param secret - Secret configurado no GitLab
   * @returns true se token for válido, false caso contrário
   * 
   * @example
   * ```typescript
   * const isValid = gitService.verifyGitLabSignature(
   *   request.headers['x-gitlab-token'],
   *   gitlabSecret
   * )
   * ```
   */
  verifyGitLabSignature(token: string, secret: string): boolean {
    return token === secret
  }

  /**
   * Parseia payload de webhook do GitHub para formato padronizado
   * 
   * **Fluxo de Execução**:
   * 1. Valida estrutura do payload GitHub
   * 2. Extrai informações do repositório, branch e commits
   * 3. Mapeia para formato WebhookPayload padronizado
   * 4. Retorna null se payload inválido
   * 
   * **Estrutura Esperada**:
   * - `payload.ref`: Branch (ex: 'refs/heads/main')
   * - `payload.repository`: Informações do repositório
   * - `payload.commits`: Array de commits
   * 
   * @param payload - Payload JSON do webhook GitHub
   * @returns WebhookPayload padronizado ou null se inválido
   * 
   * @example
   * ```typescript
   * const webhookPayload = gitService.parseGitHubWebhook(githubPayload)
   * if (webhookPayload) {
   *   await gitService.handleWebhookEvent(webhookPayload)
   * }
   * ```
   */
  parseGitHubWebhook(payload: {
    ref?: string
    repository?: {
      clone_url?: string
      url?: string
      full_name?: string
    }
    commits?: Array<{
      id?: string
      message?: string
      author?: {
        name?: string
        email?: string
      }
      timestamp?: string
    }>
    pusher?: {
      name?: string
      email?: string
    }
  }): WebhookPayload | null {
    try {
      // GitHub push event
      if (!payload.ref || !payload.repository) {
        return null
      }

      return {
        repository: {
          url: payload.repository.clone_url || payload.repository.url || '',
          fullName: payload.repository.full_name || '',
        },
        ref: payload.ref,
        commits: (payload.commits || []).map((commit: { id?: string; message?: string; author?: { name?: string; email?: string }; timestamp?: string }) => ({
          id: commit.id,
          message: commit.message,
          author: {
            name: commit.author.name,
            email: commit.author.email,
          },
          timestamp: commit.timestamp,
        })),
        pusher: {
          name: payload.pusher?.name || '',
          email: payload.pusher?.email || '',
        },
      }
    } catch (error) {
      logError('Failed to parse GitHub webhook', error)
      return null
    }
  }

  /**
   * Parseia payload de webhook do GitLab para formato padronizado
   * 
   * **Fluxo de Execução**:
   * 1. Valida estrutura do payload GitLab
   * 2. Extrai informações do projeto, branch e commits
   * 3. Mapeia para formato WebhookPayload padronizado
   * 4. Retorna null se payload inválido
   * 
   * **Estrutura Esperada**:
   * - `payload.ref`: Branch (ex: 'refs/heads/main')
   * - `payload.project`: Informações do projeto
   * - `payload.commits`: Array de commits
   * 
   * @param payload - Payload JSON do webhook GitLab
   * @returns WebhookPayload padronizado ou null se inválido
   * 
   * @example
   * ```typescript
   * const webhookPayload = gitService.parseGitLabWebhook(gitlabPayload)
   * ```
   */
  parseGitLabWebhook(payload: {
    ref?: string
    project?: {
      git_http_url?: string
      path_with_namespace?: string
    }
    commits?: Array<{
      id?: string
      message?: string
      author?: {
        name?: string
        email?: string
      }
      timestamp?: string
    }>
    user_name?: string
    user_email?: string
  }): WebhookPayload | null {
    try {
      // GitLab push event
      if (!payload.ref || !payload.project) {
        return null
      }

      return {
        repository: {
          url: payload.project.git_http_url || '',
          fullName: payload.project.path_with_namespace || '',
        },
        ref: payload.ref,
        commits: (payload.commits || []).map((commit: { id?: string; message?: string; author?: { name?: string; email?: string }; timestamp?: string }) => ({
          id: commit.id,
          message: commit.message,
          author: {
            name: commit.author.name,
            email: commit.author.email,
          },
          timestamp: commit.timestamp,
        })),
        pusher: {
          name: payload.user_name || '',
          email: payload.user_email || '',
        },
      }
    } catch (error) {
      logError('Failed to parse GitLab webhook', error)
      return null
    }
  }

  /**
   * Parseia payload de webhook do Bitbucket para formato padronizado
   * 
   * **Fluxo de Execução**:
   * 1. Valida estrutura do payload Bitbucket
   * 2. Extrai informações do repositório e mudanças
   * 3. Mapeia para formato WebhookPayload padronizado
   * 4. Retorna null se payload inválido
   * 
   * **Estrutura Esperada**:
   * - `payload.push.changes[0]`: Primeira mudança (branch)
   * - `payload.repository`: Informações do repositório
   * - `payload.push.changes[0].commits`: Array de commits
   * 
   * @param payload - Payload JSON do webhook Bitbucket
   * @returns WebhookPayload padronizado ou null se inválido
   * 
   * @example
   * ```typescript
   * const webhookPayload = gitService.parseBitbucketWebhook(bitbucketPayload)
   * ```
   */
  parseBitbucketWebhook(payload: {
    push?: {
      changes?: Array<{
        new?: {
          name?: string
        }
        commits?: Array<{
          hash?: string
          message?: string
          author?: {
            raw?: string
          }
          date?: string
        }>
      }>
    }
    repository?: {
      links?: {
        html?: {
          href?: string
        }
      }
      full_name?: string
    }
    actor?: {
      display_name?: string
    }
  }): WebhookPayload | null {
    try {
      // Bitbucket push event
      if (!payload.push || !payload.repository) {
        return null
      }

      const change = payload.push?.changes?.[0]
      if (!change) {
        return null
      }

      return {
        repository: {
          url: payload.repository?.links?.html?.href || '',
          fullName: payload.repository?.full_name || '',
        },
        ref: `refs/heads/${change.new?.name || 'main'}`,
        commits: (change.commits || []).map((commit: {
          hash?: string
          message?: string
          author?: {
            raw?: string
          }
          date?: string
        }) => ({
          id: commit.hash || '',
          message: commit.message || '',
          author: {
            name: commit.author?.raw?.split('<')[0].trim() || '',
            email: commit.author?.raw?.match(/<(.+)>/)?.[1] || '',
          },
          timestamp: commit.date || '',
        })),
        pusher: {
          name: payload.actor?.display_name || '',
          email: '',
        },
      }
    } catch (error) {
      logError('Failed to parse Bitbucket webhook', error)
      return null
    }
  }

  /**
   * Processa evento de webhook e dispara deployments automáticos
   * 
   * **Fluxo de Execução**:
   * 1. Extrai branch do ref (ex: 'refs/heads/main' → 'main')
   * 2. Busca projetos com Git URL e branch correspondentes
   * 3. Filtra projetos com auto-deploy habilitado
   * 4. Cria registro de deployment para cada projeto
   * 5. Retorna número de deployments disparados
   * 
   * **Condições para Trigger**:
   * - Projeto deve ter `gitUrl` correspondente
   * - Projeto deve ter `gitBranch` correspondente
   * - Projeto deve ter `gitAutoDeployEnabled = true`
   * 
   * **Comportamento**:
   * - Cria deployment com status 'PENDING'
   * - Inclui informações do commit (hash, mensagem, autor)
   * - Logs erros individuais mas continua processando outros projetos
   * 
   * @param payload - Payload padronizado do webhook
   * @returns Promise que resolve para objeto com número de deployments disparados
   * 
   * @example
   * ```typescript
   * const result = await gitService.handleWebhookEvent(webhookPayload)
   * console.log(`${result.triggered} deployments disparados`)
   * ```
   */
  async handleWebhookEvent(
    payload: WebhookPayload
  ): Promise<{
    triggered: number
    deployments?: Array<{
      id: string
      projectId: string
      version: string
      status: string
      gitCommitHash?: string | null
      gitCommitMessage?: string | null
      gitAuthor?: string | null
      createdAt: Date
    }>
  }> {
    // Extract branch from ref
    const branch = payload.ref.replace('refs/heads/', '')

    // Find projects with matching Git URL and auto-deploy enabled
    const projects = await prisma.project.findMany({
      where: {
        gitUrl: payload.repository.url,
        gitBranch: branch,
        gitAutoDeployEnabled: true,
      },
    })

    if (projects.length === 0) {
      logInfo(`No projects found for ${payload.repository.url} (${branch})`)
      return { triggered: 0 }
    }

    const deployments = []

    // Trigger deployment for each matching project
    for (const project of projects) {
      try {
        const latestCommit = payload.commits[payload.commits.length - 1]

        // Create deployment record
        const deployment = await prisma.deployment.create({
          data: {
            projectId: project.id,
            version: `v${Date.now()}`,
            status: 'PENDING',
            gitCommitHash: latestCommit?.id,
            gitCommitMessage: latestCommit?.message,
            gitAuthor: latestCommit?.author.name,
            createdAt: new Date(),
          },
        })

        deployments.push(deployment)

        logInfo(`Triggered deployment ${deployment.id} for project ${project.id}`, {
          deploymentId: deployment.id,
          projectId: project.id,
        })
      } catch (error) {
        logError(`Failed to trigger deployment for project ${project.id}`, error, {
          projectId: project.id,
        })
      }
    }

    return {
      triggered: deployments.length,
      deployments,
    }
  }

  /**
   * Helper: Run git command
   */
  private async runGitCommand(args: string[], cwd?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      let output = ''
      let errorOutput = ''

      const proc = spawn('git', args, {
        cwd: cwd || this.workspacePath,
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
          resolve(output)
        } else {
          reject(new Error(`Git command failed: ${errorOutput || output}`))
        }
      })

      proc.on('error', (error) => {
        reject(error)
      })
    })
  }
}

// Export singleton instance
export const gitService = GitService.getInstance()