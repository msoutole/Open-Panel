import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { getHostingerMCPService } from '../../services/hostinger-mcp.service';
import { logInfo, logError } from '../../lib/logger';

const hostinger = new Hono();
const service = getHostingerMCPService();

/**
 * GET /api/hostinger/health
 * Verifica conectividade com API Hostinger
 */
hostinger.get('/health', async (c) => {
    try {
        const isHealthy = await service.healthCheck();
        return c.json(
            {
                success: isHealthy,
                service: 'hostinger-mcp',
                status: isHealthy ? 'connected' : 'disconnected'
            },
            isHealthy ? 200 : 503
        );
    } catch (error) {
        logError('Erro ao verificar saúde Hostinger', error);
        throw new HTTPException(500, { message: 'Erro ao verificar saúde' });
    }
});

/**
 * GET /api/hostinger/domains
 * Lista todos os domínios
 */
hostinger.get('/domains', async (c) => {
    try {
        const domains = await service.listDomains();
        return c.json({
            success: true,
            data: domains,
            count: domains.length
        });
    } catch (error) {
        logError('Erro ao listar domínios', error);
        throw new HTTPException(500, { message: 'Erro ao listar domínios' });
    }
});

/**
 * GET /api/hostinger/domains/:domain
 * Obtém detalhes de um domínio específico
 */
hostinger.get('/domains/:domain', async (c) => {
    try {
        const domain = c.req.param('domain');
        const domainData = await service.getDomain(domain);

        if (!domainData) {
            throw new HTTPException(404, { message: `Domínio não encontrado: ${domain}` });
        }

        return c.json({
            success: true,
            data: domainData
        });
    } catch (error) {
        if (error instanceof HTTPException) throw error;
        logError('Erro ao obter domínio', error);
        throw new HTTPException(500, { message: 'Erro ao obter domínio' });
    }
});

/**
 * GET /api/hostinger/domains/:domain/dns
 * Lista registros DNS de um domínio
 */
hostinger.get('/domains/:domain/dns', async (c) => {
    try {
        const domain = c.req.param('domain');
        const records = await service.listDNSRecords(domain);

        return c.json({
            success: true,
            domain,
            data: records,
            count: records.length
        });
    } catch (error) {
        logError('Erro ao listar registros DNS', error);
        throw new HTTPException(500, { message: 'Erro ao listar registros DNS' });
    }
});

/**
 * POST /api/hostinger/domains/:domain/dns
 * Cria um novo registro DNS
 */
hostinger.post('/domains/:domain/dns', async (c) => {
    try {
        const domain = c.req.param('domain');
        const body = await c.req.json() as Record<string, unknown>;

        if (!body.type || !body.value) {
            throw new HTTPException(400, {
                message: 'type e value são obrigatórios'
            });
        }

        const record = await service.createDNSRecord(domain, body as any);

        return c.json(
            {
                success: true,
                data: record,
                message: `Registro DNS criado com sucesso`
            },
            201
        );
    } catch (error) {
        if (error instanceof HTTPException) throw error;
        logError('Erro ao criar registro DNS', error);
        throw new HTTPException(500, { message: 'Erro ao criar registro DNS' });
    }
});

/**
 * PUT /api/hostinger/domains/:domain/dns/:recordId
 * Atualiza um registro DNS existente
 */
hostinger.put('/domains/:domain/dns/:recordId', async (c) => {
    try {
        const domain = c.req.param('domain');
        const recordId = c.req.param('recordId');
        const updates = await c.req.json() as Record<string, unknown>;

        const record = await service.updateDNSRecord(domain, recordId, updates as any);

        return c.json({
            success: true,
            data: record,
            message: 'Registro DNS atualizado com sucesso'
        });
    } catch (error) {
        if (error instanceof HTTPException) throw error;
        logError('Erro ao atualizar registro DNS', error);
        throw new HTTPException(500, { message: 'Erro ao atualizar registro DNS' });
    }
});

/**
 * DELETE /api/hostinger/domains/:domain/dns/:recordId
 * Deleta um registro DNS
 */
hostinger.delete('/domains/:domain/dns/:recordId', async (c) => {
    try {
        const domain = c.req.param('domain');
        const recordId = c.req.param('recordId');

        await service.deleteDNSRecord(domain, recordId);

        return c.json({
            success: true,
            message: 'Registro DNS deletado com sucesso'
        });
    } catch (error) {
        if (error instanceof HTTPException) throw error;
        logError('Erro ao deletar registro DNS', error);
        throw new HTTPException(500, { message: 'Erro ao deletar registro DNS' });
    }
});

/**
 * POST /api/hostinger/domains/:domain/dns/upsert
 * Cria ou atualiza um registro DNS
 */
hostinger.post('/domains/:domain/dns/upsert', async (c) => {
    try {
        const domain = c.req.param('domain');
        const record = await c.req.json() as Record<string, unknown>;

        if (!record.type || !record.value) {
            throw new HTTPException(400, {
                message: 'type e value são obrigatórios'
            });
        }

        const result = await service.upsertDNSRecord(domain, record as any);

        return c.json({
            success: true,
            data: result,
            message: 'Registro DNS criado ou atualizado com sucesso'
        });
    } catch (error) {
        if (error instanceof HTTPException) throw error;
        logError('Erro ao fazer UPSERT de registro DNS', error);
        throw new HTTPException(500, { message: 'Erro ao fazer UPSERT' });
    }
});

/**
 * POST /api/hostinger/ddns/update
 * Atualiza o IP de um registro A (DDNS)
 * Body: { domain: string, subdomain?: string, ip: string }
 */
hostinger.post('/ddns/update', async (c) => {
    try {
        const body = await c.req.json() as { domain?: string; subdomain?: string; ip?: string };
        const { domain, subdomain = '', ip } = body;

        if (!domain || !ip) {
            throw new HTTPException(400, {
                message: 'domain e ip são obrigatórios'
            });
        }

        const result = await service.updateDDNSIP(domain, subdomain, ip);

        return c.json({
            success: result.success,
            domain: result.domain,
            ip: result.ip,
            message: result.message
        });
    } catch (error) {
        if (error instanceof HTTPException) throw error;
        logError('Erro ao atualizar DDNS IP', error);
        throw new HTTPException(500, { message: 'Erro ao atualizar DDNS IP' });
    }
});

/**
 * GET /api/hostinger/vms
 * Lista VPS disponíveis
 */
hostinger.get('/vms', async (c) => {
    try {
        const vms = await service.listVirtualMachines();
        return c.json({
            success: true,
            data: vms,
            count: vms.length
        });
    } catch (error) {
        logError('Erro ao listar VPS', error);
        throw new HTTPException(500, { message: 'Erro ao listar VPS' });
    }
});

/**
 * GET /api/hostinger/vms/:vmId
 * Obtém detalhes de uma VPS
 */
hostinger.get('/vms/:vmId', async (c) => {
    try {
        const vmId = c.req.param('vmId');
        const vm = await service.getVirtualMachine(vmId);

        if (!vm) {
            throw new HTTPException(404, { message: `VPS não encontrada: ${vmId}` });
        }

        return c.json({
            success: true,
            data: vm
        });
    } catch (error) {
        if (error instanceof HTTPException) throw error;
        logError('Erro ao obter VPS', error);
        throw new HTTPException(500, { message: 'Erro ao obter VPS' });
    }
});

/**
 * PATCH /api/hostinger/vms/:vmId/hostname
 * Define hostname de uma VPS
 */
hostinger.patch('/vms/:vmId/hostname', async (c) => {
    try {
        const vmId = c.req.param('vmId');
        const body = await c.req.json() as { hostname?: string };
        const { hostname } = body;

        if (!hostname) {
            throw new HTTPException(400, { message: 'hostname é obrigatório' });
        }

        const success = await service.setVirtualMachineHostname(vmId, hostname);

        return c.json({
            success,
            vmId,
            hostname,
            message: success
                ? 'Hostname definido com sucesso'
                : 'Falha ao definir hostname'
        });
    } catch (error) {
        if (error instanceof HTTPException) throw error;
        logError('Erro ao definir hostname', error);
        throw new HTTPException(500, { message: 'Erro ao definir hostname' });
    }
});

export default hostinger;
