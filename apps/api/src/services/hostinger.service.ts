import { logInfo, logError, logWarn } from '../lib/logger';
import { env } from '../lib/env';

interface DNSRecord {
    id?: string;
    type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'SRV';
    name: string;
    value: string;
    ttl?: number;
    priority?: number;
}

interface HostingerDomain {
    id: string;
    name: string;
    status: string;
    expirationDate: string;
    registrationDate: string;
}

interface HostingerVPS {
    id: string;
    hostname: string;
    ipv4: string;
    status: string;
}

export class HostingerService {
    private apiToken: string;
    private apiUrl: string;
    private timeout: number;

    constructor() {
        this.apiToken = env.HOSTINGER_API_TOKEN || '';
        this.apiUrl = env.HOSTINGER_API_URL || 'https://api.hostinger.com/v1';
        this.timeout = env.HOSTINGER_API_TIMEOUT || 10000;

        if (!this.apiToken) {
            logWarn('HOSTINGER_API_TOKEN não configurado. Funcionalidades desabilitadas.');
        }
    }

    /**
     * Faz requisição HTTP para Hostinger API
     */
    private async makeRequest<T>(
        method: string,
        endpoint: string,
        body?: unknown
    ): Promise<T> {
        const url = `${this.apiUrl}${endpoint}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`,
                    'Content-Type': 'application/json'
                },
                body: body ? JSON.stringify(body) : undefined,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(
                    `API Error: ${response.status} - ${errorData}`
                );
            }

            const data = await response.json() as { data?: T };
            return data.data as T;
        } catch (error) {
            clearTimeout(timeoutId);

            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    throw new Error('Request timeout');
                }
                throw error;
            }

            throw new Error('Unknown error');
        }
    }

    /**
     * Lista todos os domínios da conta
     */
    async listDomains(): Promise<HostingerDomain[]> {
        try {
            const records = await this.makeRequest<HostingerDomain[]>(
                'GET',
                '/domains'
            );
            logInfo(`Domínios listados: ${records?.length || 0}`);
            return records || [];
        } catch (error) {
            logError('Erro ao listar domínios', error);
            throw error;
        }
    }

    /**
     * Obtém detalhes de um domínio específico
     */
    async getDomain(domain: string): Promise<HostingerDomain | null> {
        try {
            const result = await this.makeRequest<HostingerDomain>(
                'GET',
                `/domains/${domain}`
            );
            return result || null;
        } catch (error) {
            if (error instanceof Error && error.message.includes('404')) {
                logWarn(`Domínio não encontrado: ${domain}`);
                return null;
            }
            logError(`Erro ao obter domínio ${domain}`, error);
            throw error;
        }
    }

    /**
     * Lista registros DNS de um domínio
     */
    async listDNSRecords(domain: string): Promise<DNSRecord[]> {
        try {
            const records = await this.makeRequest<DNSRecord[]>(
                'GET',
                `/domains/${domain}/dns-records`
            );
            logInfo(`Registros DNS listados para ${domain}: ${records?.length || 0}`);
            return records || [];
        } catch (error) {
            logError(`Erro ao listar registros DNS para ${domain}`, error);
            throw error;
        }
    }

    /**
     * Cria um novo registro DNS
     */
    async createDNSRecord(
        domain: string,
        record: DNSRecord
    ): Promise<DNSRecord> {
        try {
            const payload = {
                type: record.type,
                name: record.name || '@',
                value: record.value,
                ttl: record.ttl || 3600,
                ...(record.priority && { priority: record.priority })
            };

            const result = await this.makeRequest<DNSRecord>(
                'POST',
                `/domains/${domain}/dns-records`,
                payload
            );

            logInfo(
                `Registro DNS criado: ${record.name || '@'}.${domain} → ${record.value}`
            );
            return result;
        } catch (error) {
            logError(`Erro ao criar registro DNS para ${domain}`, error);
            throw error;
        }
    }

    /**
     * Atualiza um registro DNS existente
     */
    async updateDNSRecord(
        domain: string,
        recordId: string,
        updates: Partial<DNSRecord>
    ): Promise<DNSRecord> {
        try {
            const payload = {
                type: updates.type,
                name: updates.name,
                value: updates.value,
                ttl: updates.ttl,
                ...(updates.priority && { priority: updates.priority })
            };

            const result = await this.makeRequest<DNSRecord>(
                'PUT',
                `/domains/${domain}/dns-records/${recordId}`,
                payload
            );

            logInfo(`Registro DNS atualizado: ${recordId} em ${domain}`);
            return result;
        } catch (error) {
            logError(`Erro ao atualizar registro DNS ${recordId}`, error);
            throw error;
        }
    }

    /**
     * Deleta um registro DNS
     */
    async deleteDNSRecord(domain: string, recordId: string): Promise<void> {
        try {
            await this.makeRequest<void>(
                'DELETE',
                `/domains/${domain}/dns-records/${recordId}`
            );

            logInfo(`Registro DNS deletado: ${recordId} em ${domain}`);
        } catch (error) {
            logError(`Erro ao deletar registro DNS ${recordId}`, error);
            throw error;
        }
    }

    /**
     * Encontra um registro DNS por nome e tipo
     */
    async findDNSRecord(
        domain: string,
        name: string,
        type: string
    ): Promise<DNSRecord | null> {
        try {
            const records = await this.listDNSRecords(domain);
            return (
                records.find(
                    r => r.name === (name || '@') && r.type === type
                ) || null
            );
        } catch (error) {
            logError(
                `Erro ao procurar registro DNS ${name}.${domain}`,
                error
            );
            return null;
        }
    }

    /**
     * Atualiza ou cria um registro DNS (UPSERT)
     */
    async upsertDNSRecord(
        domain: string,
        record: DNSRecord
    ): Promise<DNSRecord> {
        try {
            const existing = await this.findDNSRecord(
                domain,
                record.name,
                record.type
            );

            if (existing && existing.id) {
                return this.updateDNSRecord(domain, existing.id, record);
            }

            return this.createDNSRecord(domain, record);
        } catch (error) {
            logError(
                `Erro ao fazer UPSERT do registro DNS ${record.name}.${domain}`,
                error
            );
            throw error;
        }
    }

    /**
     * Atualiza o IP de um registro A (usado para DDNS)
     */
    async updateDDNSIP(
        domain: string,
        subdomain: string,
        newIP: string
    ): Promise<boolean> {
        try {
            const recordName = subdomain ? subdomain : '@';
            const existing = await this.findDNSRecord(domain, recordName, 'A');

            if (!existing || !existing.id) {
                logWarn(`Registro A não encontrado: ${recordName}.${domain}`);
                return false;
            }

            if (existing.value === newIP) {
                logInfo(`IP já atualizado: ${recordName}.${domain} = ${newIP}`);
                return true;
            }

            await this.updateDNSRecord(domain, existing.id, {
                value: newIP
            });

            logInfo(
                `IP DDNS atualizado: ${recordName}.${domain} → ${newIP}`
            );
            return true;
        } catch (error) {
            logError(
                `Erro ao atualizar DDNS IP para ${subdomain}.${domain}`,
                error
            );
            return false;
        }
    }

    /**
     * Lista VPS disponíveis
     */
    async listVirtualMachines(): Promise<HostingerVPS[]> {
        try {
            const vms = await this.makeRequest<HostingerVPS[]>(
                'GET',
                '/virtual-machines'
            );
            logInfo(`VPS listadas: ${vms?.length || 0}`);
            return vms || [];
        } catch (error) {
            logError('Erro ao listar VPS', error);
            throw error;
        }
    }

    /**
     * Obtém detalhes de uma VPS
     */
    async getVirtualMachine(vmId: string): Promise<HostingerVPS | null> {
        try {
            const result = await this.makeRequest<HostingerVPS>(
                'GET',
                `/virtual-machines/${vmId}`
            );
            return result || null;
        } catch (error) {
            if (error instanceof Error && error.message.includes('404')) {
                logWarn(`VPS não encontrada: ${vmId}`);
                return null;
            }
            logError(`Erro ao obter VPS ${vmId}`, error);
            throw error;
        }
    }

    /**
     * Define hostname de uma VPS
     */
    async setVirtualMachineHostname(
        vmId: string,
        hostname: string
    ): Promise<boolean> {
        try {
            await this.makeRequest<void>(
                'PATCH',
                `/virtual-machines/${vmId}`,
                { hostname }
            );

            logInfo(`Hostname definido na VPS ${vmId}: ${hostname}`);
            return true;
        } catch (error) {
            logError(`Erro ao definir hostname na VPS ${vmId}`, error);
            return false;
        }
    }

    /**
     * Verifica conectividade com a API Hostinger
     */
    async healthCheck(): Promise<boolean> {
        try {
            await this.makeRequest<unknown>('GET', '/account');
            logInfo('Hostinger API: OK');
            return true;
        } catch (error) {
            logError('Hostinger API: Falha na verificação de saúde', error);
            return false;
        }
    }
}

// Singleton
let instance: HostingerService | null = null;

export function getHostingerService(): HostingerService {
    if (!instance) {
        instance = new HostingerService();
    }
    return instance;
}
