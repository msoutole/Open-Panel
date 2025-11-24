# Walkthrough: Gerenciamento de Serviços

Este guia detalha como gerenciar serviços individuais no OpenPanel, cobrindo todas as funcionalidades disponíveis na visualização de detalhes do serviço (`ServiceDetailView`).

## 📚 Visão Geral

A página de detalhes do serviço é o centro de controle para sua aplicação ou banco de dados. A partir daqui, você pode monitorar o status, visualizar logs, gerenciar configurações e executar ações administrativas.

## 🖥️ Interface Principal

Ao selecionar um serviço no dashboard ou na lista de projetos, você verá:

1.  **Header**: Nome do serviço, status (Running/Stopped), e controles principais (Start, Stop, Restart, Deploy, Console).
2.  **Sidebar**: Navegação entre as diferentes abas de configuração.
3.  **Content Area**: Área principal onde as configurações são exibidas.

## 🛠️ Funcionalidades por Aba

### 1. Overview

Visão geral da saúde do serviço.
- **Stats Grid**: Uso de CPU, Memória e Network I/O em tempo real.
- **Logs Preview**: As últimas linhas de log do container.
- **Console**: Botão para abrir um terminal web interativo direto no container.

### 2. Environment (Variáveis de Ambiente)

Gerencie as variáveis de ambiente (`.env`) do seu serviço.

- **Modo Simples**: Interface visual para adicionar/editar chaves e valores.
- **Modo Raw**: Editor de texto para colar arquivos `.env` inteiros.
- **Segurança**: Marque variáveis como "Secret" (ícone de cadeado) para ocultá-las na interface.
- **Persistência**: As alterações são salvas no banco de dados e aplicadas no próximo deploy/restart.

### 3. Networking (Rede e Domínios)

Configure como seu serviço é acessado externamente.

- **Domains**: Adicione domínios customizados (ex: `api.meuapp.com`). O OpenPanel gerencia automaticamente o certificado SSL (HTTPS).
- **Redirects**: Crie regras de redirecionamento (ex: `/old-path` -> `/new-path`).
- **Exposed Ports**: Para bancos de dados, configure a porta externa mapeada.

### 4. Source (Código Fonte)

Configure a origem do código do seu serviço.

- **Docker Image**: Use uma imagem Docker pública ou privada (ex: `nginx:latest`).
- **Git Repository**: Conecte um repositório Git.
    - Configure URL, Branch e Credenciais (se privado).
    - **Auto Deploy**: Ative para fazer deploy automático a cada push no branch configurado (via Webhook).

### 5. Resources (Recursos do Sistema)

Defina limites de CPU e Memória para garantir a estabilidade do host.

- **Reservation**: O mínimo garantido para o serviço.
- **Limit**: O máximo que o serviço pode usar antes de ser throttled (CPU) ou morto (OOM Kill - Memória).
- **Visualização**: Sliders interativos mostram o uso em relação à capacidade do host.

### 6. Backups (Apenas Banco de Dados)

Gerencie backups para serviços de banco de dados (PostgreSQL, MySQL, etc.).

- **Create Backup**: Cria um snapshot imediato do banco de dados.
- **List**: Veja todos os backups disponíveis, tamanho e data.
- **Restore**: Restaure o banco de dados para um estado anterior (Cuidado: sobrescreve dados atuais).
- **Delete**: Remova backups antigos para liberar espaço.

### 7. Advanced (Configurações Avançadas)

Configurações sensíveis e ações destrutivas.

- **Command**: Sobrescreva o comando de inicialização do container (CMD).
- **Container User**: Defina o usuário do sistema operacional do container.
- **Danger Zone**:
    - **Force Rebuild**: Reconstrói o container do zero (útil para limpar cache de build).
    - **Delete Service**: Remove permanentemente o serviço e seus dados.

### 8. Deployments (Histórico)

Veja o histórico de deploys do serviço.

- **Status**: Sucesso, Falha ou Em Progresso.
- **Detalhes**: Commit hash, mensagem, autor e data.
- **Logs**: Clique para ver os logs de build de um deploy específico.

## 🚀 Fluxos Comuns

### Atualizar Variáveis de Ambiente
1. Vá para a aba **Environment**.
2. Adicione ou edite as variáveis.
3. Clique em **Save Variables**.
4. O serviço **não** reinicia automaticamente. Clique em **Deploy** ou **Restart** no header para aplicar.

### Conectar um Domínio
1. Vá para a aba **Networking**.
2. Clique em **Add Domain**.
3. Digite o domínio (ex: `app.com`).
4. Aponte o DNS (A Record) para o IP do seu servidor OpenPanel.
5. O sistema configurará o roteamento e SSL em alguns segundos.

### Restaurar um Backup
1. Vá para a aba **Backups**.
2. Localize o backup desejado na lista.
3. Clique em **Restore**.
4. Confirme a ação. O banco de dados ficará indisponível durante a restauração.
