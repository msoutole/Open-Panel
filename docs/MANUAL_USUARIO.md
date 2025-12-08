# 📘 Manual do Usuário

Guia conciso para acesso, segurança e operações diárias no painel.

## Acesso inicial
- Painel: `http://localhost:3000` (ou domínio configurado).
- API: `http://localhost:3001`.
- Credencial padrão: `admin@admin.com.br` / `admin123` (altere no primeiro login).

## Segurança: 2FA e senhas
- Ative 2FA em **Perfil > Segurança** (QR Code + código de 6 dígitos).
- Guarde códigos de recuperação; cada um é válido uma vez.
- Para desativar 2FA, use um código atual ou de backup.

## Uso do painel
- **Templates/Marketplace:** escolha um template, preencha variáveis e confirme o deploy.
- **Serviços:** start/stop/restart direto na lista; health check indica status.
- **Terminal Web:** acesse pela aba Terminal de cada serviço; funciona como SSH embutido.
- **Bancos de dados:** abas de Console/Query para Postgres, MySQL, MongoDB e Redis.
- **Logs:** disponíveis por serviço; use filtros por período.

## Operação rápida
- Criar usuário admin extra: `npm run create:admin`.
- Reiniciar stack Docker: `docker compose restart`.
- Atualizar stack: `docker compose pull && docker compose up -d`.

## Troubleshooting rápido
- Docker não sobe: `systemctl status docker` (Linux) ou abra Docker Desktop.
- Porta em uso: ajuste 3000/3001/8080 no `.env`.
- Erro de login: confirme credenciais padrão ou redefina senha via banco (ver Manual Técnico).
- 2FA inválido: sincronize horário do celular; use código de backup.

## Onde seguir
- Infraestrutura e portas: `INFRA_HOMELAB.md`.
- Protocolos e endpoints: `API_REST.md` e `API_WEBSOCKET.md`.
- Arquitetura e fluxos técnicos: `MANUAL_TECNICO.md`.
