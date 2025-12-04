# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Consolidação do projeto para distribuição à comunidade
- Licença MIT oficial
- Código de Conduta (CODE_OF_CONDUCT.md)
- Guia de Contribuição (CONTRIBUTING.md)
- Política de Segurança (SECURITY.md)
- Templates de Issues e Pull Requests no GitHub
- Guia Rápido para Homelab (HOMELAB_QUICKSTART.md)
- docker-compose.prod.yml otimizado para produção
- Comparação com alternativas no README
- Badges adicionais no README

### Changed
- README.md aprimorado com melhor estrutura e navegação
- .gitignore atualizado para ignorar diretórios de IDEs AI
- .dockerignore otimizado para builds mais eficientes

### Removed
- Diretórios específicos de IDEs (.cursor, .claude, .gemini)
- Arquivo de teste test-user.json
- Arquivo .cursorignore

### Security
- Revisão completa das configurações de segurança
- Hardening do docker-compose.prod.yml
- Documentação de melhores práticas de segurança

## [0.3.0] - 2025-12-03

### Added
- Sistema de Autenticação de Dois Fatores (2FA)
- Terminal Web com WebSocket
- Database Clients (PostgreSQL, MySQL, MongoDB, Redis)
- Template Marketplace UI
- Deploy Blue-Green (Zero Downtime)
- Onboarding wizard para novos usuários
- Criptografia AES-256-GCM para API keys
- Rate limiting avançado
- Audit logging

### Changed
- Migração para React 19
- Atualização do Prisma para versão 7.x
- Melhorias significativas de performance
- UI/UX refinado com novos componentes

### Fixed
- Correções de TypeScript em todo o projeto
- Melhorias na estabilidade do WebSocket
- Otimizações de bundle do frontend

## [0.2.0] - 2025-11-15

### Added
- Sistema de backup automatizado
- Integração com Hostinger MCP
- Suporte a DDNS
- Configuração de Tailscale
- AdGuard Home integration (opcional)
- Multi-ambiente (dev, staging, prod)

### Changed
- Reorganização da documentação
- Simplificação do processo de instalação
- Melhoria nos scripts de setup

## [0.1.0] - 2025-11-01

### Added
- Versão inicial do OpenPanel
- Gerenciamento de containers Docker
- Deploy de aplicações via Git
- Sistema de autenticação JWT
- Dashboard com métricas em tempo real
- Integração com Traefik
- Suporte a SSL/TLS via Let's Encrypt
- WebSocket para logs e métricas
- Assistente de IA (Ollama, OpenAI, Google, Anthropic)
- Documentação inicial

[Unreleased]: https://github.com/msoutole/openpanel/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/msoutole/openpanel/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/msoutole/openpanel/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/msoutole/openpanel/releases/tag/v0.1.0
