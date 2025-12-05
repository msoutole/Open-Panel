import { Hono } from 'hono'
import type { Variables } from '../types'
import {
  ApplicationTemplatesService,
  TemplateCategory,
  type ApplicationTemplate,
} from '../services/application-templates'
import { logInfo, logError } from '../lib/logger'
import { logAudit, AuditActions } from '../middlewares/audit'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

const templates = new Hono<{ Variables: Variables }>()

/**
 * List all application templates
 * GET /templates
 */
templates.get('/', (c) => {
  try {
    const category = c.req.query('category') as TemplateCategory | undefined
    const language = c.req.query('language')
    const search = c.req.query('search')

    let templateList: ApplicationTemplate[]

    if (search) {
      templateList = ApplicationTemplatesService.searchTemplates(search)
    } else if (category) {
      templateList = ApplicationTemplatesService.getTemplatesByCategory(category)
    } else if (language) {
      templateList = ApplicationTemplatesService.getTemplatesByLanguage(language)
    } else {
      templateList = ApplicationTemplatesService.listTemplates()
    }

    return c.json({
      templates: templateList.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        category: t.category,
        language: t.language,
        buildpack: t.buildpack,
        icon: t.icon,
        tags: t.tags,
        minCpu: t.minCpu,
        minMemory: t.minMemory,
        ports: t.ports,
        dependencies: t.dependencies,
      })),
      total: templateList.length,
    })
  } catch (error: unknown) {
    logError('Failed to list templates', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: message }, 500)
  }
})

/**
 * Get specific template by ID
 * GET /templates/:id
 */
templates.get('/:id', (c) => {
  try {
    const id = c.req.param('id')

    const template = ApplicationTemplatesService.getTemplate(id)

    if (!template) {
      return c.json({ error: 'Template not found' }, 404)
    }

    return c.json({ template })
  } catch (error: unknown) {
    logError('Failed to get template', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: message }, 500)
  }
})

/**
 * Create project from template
 * POST /templates/:id/deploy
 */
const deploySchema = z.object({
  projectName: z.string().min(1).max(100),
  gitUrl: z.string().url().optional(),
  gitBranch: z.string().optional().default('main'),
  customEnv: z.record(z.string(), z.string()).optional(),
  customPort: z.number().min(1).max(65535).optional(),
  cpuLimit: z.string().optional(),
  memoryLimit: z.string().optional(),
  teamId: z.string().optional(),
})

templates.post('/:id/deploy', zValidator('json', deploySchema), async (c) => {
  try {
    const templateId = c.req.param('id')
    const { projectName, gitUrl, gitBranch, customEnv, customPort, cpuLimit, memoryLimit, teamId } = c.req.valid('json')
    const user = c.get('user')

    if (!user?.userId) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    logInfo(`Deploying project from template ${templateId}`, {
      templateId,
      projectName,
      userId: user.userId,
    })

    // Create project from template
    const result = await ApplicationTemplatesService.createProjectFromTemplate({
      templateId,
      projectName,
      ownerId: user.userId,
      gitUrl,
      gitBranch,
      customEnv,
      customPort,
      cpuLimit,
      memoryLimit,
      teamId,
    })

    // Log audit
    await logAudit(c, {
      action: AuditActions.PROJECT_CREATE,
      resourceType: 'project',
      resourceId: result.project.id,
      metadata: {
        templateId,
        templateName: result.template.name,
        projectName,
        buildpack: result.template.buildpack,
      },
    })

    return c.json(
      {
        message: 'Project created successfully from template',
        project: {
          id: result.project.id,
          name: result.project.name,
          slug: result.project.slug,
          status: result.project.status,
          type: result.project.type,
        },
        template: {
          id: result.template.id,
          name: result.template.name,
          buildpack: result.template.buildpack,
        },
        port: result.port,
        nextSteps: gitUrl
          ? {
              message: 'Project created. Build will be triggered automatically on git push.',
              buildUrl: `/api/builds?projectId=${result.project.id}`,
            }
          : {
              message: 'Project created. Please configure Git URL or upload code to build.',
              buildUrl: `/api/builds?projectId=${result.project.id}`,
            },
      },
      201
    )
  } catch (error: unknown) {
    logError('Failed to deploy from template', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: message }, 500)
  }
})

/**
 * Get templates by category
 * GET /templates/category/:category
 */
templates.get('/category/:category', (c) => {
  try {
    const category = c.req.param('category') as TemplateCategory

    const templateList = ApplicationTemplatesService.getTemplatesByCategory(category)

    return c.json({
      templates: templateList,
      total: templateList.length,
      category,
    })
  } catch (error: unknown) {
    logError('Failed to get templates by category', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: message }, 500)
  }
})

/**
 * Get templates by language
 * GET /templates/language/:language
 */
templates.get('/language/:language', (c) => {
  try {
    const language = c.req.param('language')

    const templateList = ApplicationTemplatesService.getTemplatesByLanguage(language)

    return c.json({
      templates: templateList,
      total: templateList.length,
      language,
    })
  } catch (error: unknown) {
    logError('Failed to get templates by language', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: message }, 500)
  }
})

export default templates

