# 📚 OpenPanel - Documentação

Bem-vindo à documentação oficial do OpenPanel.

**Última atualização**: 05 de Dezembro de 2025

A documentação foi organizada para facilitar o acesso e reduzir a fragmentação.

## 🚀 Manuais Principais

### [🏠 Guia de Infraestrutura e Instalação](./GUIA_INFRAESTRUTURA.md)
**Para quem:** Quem vai instalar ou manter o servidor.
**Conteúdo:**
- Instalação em Servidor Ubuntu/Debian.
- Configuração Homelab (IP Estático).
- Acesso Remoto (Tailscale, Domínios).
- Serviços (AdGuard, Traefik).
- Troubleshooting.

### [📘 Manual do Usuário](./MANUAL_DO_USUARIO.md)
**Para quem:** Usuários finais e administradores.
**Conteúdo:**
- Primeiros passos e Login.
- Autenticação de Dois Fatores (2FA).
- Uso de Templates e Marketplace.
- Terminal Web e Consoles de Banco.

### [🌐 Guia de Integração Hostinger](./GUIA_INTEGRACAO_HOSTINGER.md)
**Para quem:** Quem usa Hostinger para Domínios/VPS.
**Conteúdo:**
- Configuração de DDNS (IP Dinâmico).
- Automação via Hostinger-MCP.
- Gestão de DNS e VPS via API.

### [👨‍💻 Manual de Desenvolvimento](./MANUAL_DESENVOLVIMENTO.md)
**Para quem:** Desenvolvedores e Contribuidores.
**Conteúdo:**
- Setup de Ambiente (Local e Remoto).
- Workflow Multi-Ambiente (Dev/Pre/Prod).
- Padrões de Código e UI.
- Testes e Qualidade.

### [🛠️ Manual Técnico](./MANUAL_TECNICO.md)
**Para quem:** Arquitetos e Engenheiros.
**Conteúdo:**
- Arquitetura do Sistema (Monorepo, Docker).
- Referência da API REST e WebSockets.
- Banco de Dados e Segurança.

### [📅 Projeto e Roadmap](./PROJETO.md)

### [🔌 Mapeamento de Portas](./MAPEAMENTO_PORTAS.md)
**Para quem:** Administradores de sistema e desenvolvedores.
**Conteúdo:**
- Lista completa de todas as portas utilizadas
- Mapeamento por ambiente (Dev/Pre/Prod)
- Variáveis de ambiente para configuração
- Resolução de conflitos de portas

### [🗺️ Mapeamento Real do Servidor](./MAPEAMENTO_PORTAS_SERVIDOR.md)
**Para quem:** Administradores verificando estado atual do servidor.
**Conteúdo:**
- Portas realmente em uso no servidor
- Containers Docker em execução
- Processos do host utilizando portas
- Conflitos e observações identificados

### [⚖️ Equalização de Portas](./EQUALIZACAO_PORTAS_2025-12-05.md)
**Para quem:** Administradores ajustando configurações.
**Conteúdo:**
- Análise de conflitos de portas
- Soluções recomendadas
- Ajustes no docker-compose.yml
- Checklist de equalização

### [✅ Implementação da Equalização](./IMPLEMENTACAO_EQUALIZACAO_2025-12-05.md)
**Para quem:** Administradores verificando mudanças aplicadas.
**Conteúdo:**
- Ajustes implementados
- Web Dev via Traefik
- MongoDB porta 27018
- AdGuard network_mode: host
- Instruções de aplicação

### [🔄 Recriação Automática de Containers](./RECRIACAO_AUTOMATICA_CONTAINERS.md)
**Para quem:** Desenvolvedores e administradores de sistema.
**Conteúdo:**
- Recriação automática com `--build --force-recreate`
- Tratamento automático de falhas de credenciais
- Função auxiliar `docker_compose_recreate`
- Scripts atualizados

### [🔄 Instalação de Servidor (2025-12-05)](./INSTALACAO_SERVIDOR_2025-12-05.md)
**Para quem:** Administradores de sistema realizando instalação completa.
**Conteúdo:**
- Execução do script `install-server.sh`
- Resolução de problemas durante instalação
- Validação e verificação de serviços
- Troubleshooting específico de instalação

### [📅 Projeto e Roadmap](./PROJETO.md)
**Para quem:** Todos interessados no futuro do projeto.
**Conteúdo:**
- Status atual.
- Roadmap para versão 1.0.0.
- Histórico de melhorias.

---

## 📋 Referências de API

- **[API REST](./API_REST.md)**: Documentação completa dos endpoints.
- **[API WebSocket](./API_WEBSOCKET.md)**: Protocolos de comunicação em tempo real.

---

> *A documentação foi consolidada em Dezembro de 2025 para simplificar a manutenção e leitura.*