# 📘 OpenPanel - Manual do Usuário

Bem-vindo ao manual do usuário do OpenPanel. Este documento consolida todas as informações necessárias para instalar, configurar e operar o OpenPanel.

---

## 🚀 Instalação e Início Rápido

### Instalação Automática (Recomendado)

O OpenPanel possui um sistema de inicialização unificado que funciona em Windows, Linux e macOS.

**Pré-requisitos:**
- **Node.js**: Versão 18 ou superior
- **Docker**: Docker Desktop (Windows/macOS) ou Docker Engine (Linux)

**Comando Único:**
Abra seu terminal na pasta do projeto e execute:

```bash
npm start
```

**O que este comando faz:**
1. Verifica se você tem Node.js e Docker instalados.
2. Cria automaticamente o arquivo `.env` com configurações seguras.
3. Instala todas as dependências do projeto.
4. Inicia os serviços (Banco de Dados, Redis, Proxy) via Docker.
5. Configura o banco de dados e cria um usuário administrador.
6. Inicia a aplicação Web e API.

### Acesso ao Sistema

Após a instalação, acesse:

- **Painel Web**: [http://localhost:3000](http://localhost:3000)
- **API**: [http://localhost:3001](http://localhost:3001)
- **Traefik Dashboard**: [http://localhost:8080](http://localhost:8080)

**Credenciais Padrão:**
- **Email**: `admin@admin.com.br`
- **Senha**: `admin123`

> ⚠️ **Importante**: Altere sua senha imediatamente após o primeiro login.

---

## 🔐 Autenticação de Dois Fatores (2FA)

Para aumentar a segurança da sua conta, recomendamos ativar a Autenticação de Dois Fatores.

### Como Ativar
1. Acesse **Configurações de Perfil** no menu do usuário.
2. Clique na aba **Segurança**.
3. Clique em **Ativar 2FA**.
4. Escaneie o QR Code com seu aplicativo autenticador (Google Authenticator, Authy, etc.).
5. Digite o código de 6 dígitos gerado pelo app para confirmar.

### Recuperação
Ao ativar o 2FA, você receberá **Códigos de Backup**.
- **Guarde-os em local seguro!**
- Se perder acesso ao seu celular, estes códigos são a única forma de recuperar sua conta.

---

## ⚙️ Operações Avançadas

### Zero Downtime Deployments

O OpenPanel suporta atualizações sem interrupção de serviço (Zero Downtime) para suas aplicações.

**Como funciona:**
1. O sistema sobe o novo container da aplicação.
2. Aguarda o "Health Check" confirmar que a nova versão está saudável.
3. O Traefik (Proxy) redireciona o tráfego para o novo container.
4. O container antigo é desligado graciosamente.

**Requisitos:**
- Sua aplicação deve ter uma rota de health check (ex: `/health`).
- Configure o `HealthCheck` no `docker-compose.yml` ou nas configurações do serviço.

---

## 🔧 Solução de Problemas (Troubleshooting)

### Problemas Comuns na Instalação

**1. Erro: "Docker is not running"**
- Verifique se o Docker Desktop está aberto e rodando.
- No Linux, verifique com `systemctl status docker`.

**2. Erro de Permissão (EACCES)**
- No Linux/Mac, pode ser necessário rodar com `sudo` ou corrigir permissões da pasta.
- No Windows, execute o terminal como Administrador.

**3. Porta em uso (EADDRINUSE)**
- Verifique se as portas 3000, 3001 ou 8080 já estão sendo usadas por outro programa.
- Você pode alterar as portas no arquivo `.env` gerado.

### Problemas no Login

**"Credenciais Inválidas"**
- Se acabou de instalar, use `admin@admin.com.br` / `admin123`.
- Se alterou a senha e esqueceu, você precisará resetar via banco de dados (veja Manual Técnico).

**"Erro ao conectar com o servidor"**
- Verifique se a API está rodando (`npm run logs:api`).
- Verifique se o banco de dados está rodando (`docker ps`).

### Logs
Para ver os logs detalhados em caso de erro:

```bash
# Logs da API
npm run logs:api

# Logs do Frontend
npm run logs:web

# Logs do Banco de Dados
docker logs openpanel-postgres-1
```

---

> Para detalhes técnicos de arquitetura, API e desenvolvimento, consulte o [Manual Técnico](./MANUAL_TECNICO.md) e o [Guia de Desenvolvimento](./GUIA_DE_DESENVOLVIMENTO.md).
