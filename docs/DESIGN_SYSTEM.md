🎨 Sistema de Design (Design System)
I. Fundamentos (Foundations)
A. Cores (Colors)
O sistema de cores utiliza uma paleta funcional clara, associando cores específicas a estados e propósitos, além das cores primárias da marca.
Propósito
Nome (Português)
Nome (Inglês)
Código Hexadecimal
Primária
Azul da Marca
Brand Blue
#007BFF
Secundária
Cinza Azulado
Teal Grey
#4F6B7A
Terciária
Cinza Claro
Light Grey
#E6E6EF
Sucesso
Verde
Success (Green)
#28A745
Erro
Vermelho
Error (Red)
#DC3545
Aviso
Amarelo
Warning (Yellow)
#FFC107
Fundo
Branco Sujo
Background (Off-White)
#F8F9FA
Observação: A cor verde de sucesso (#28A745) é usada, por exemplo, em botões como "Login" e "Salvar", e também para indicar o status de ações concluídas na tela "Ações". A cor vermelha de erro (#DC3545) é usada para ações destrutivas, como o botão "Remover" e na "Zona de Perigo" (Botão "Destruir").
B. Tipografia (Typography)
A fonte utilizada no sistema é a Inter font. A hierarquia de títulos e textos é definida pelos seguintes estilos:
Estilo
Tamanho (Size)
Peso (Weight)
Exemplo de Uso
H1 Heading
48px
Bold (Negrito)
Título principal ("Open Panel Control")
H2 Heading
36px
SemiBold (Semi-Negrito)
Componentes Centrais ("Core Components")
H3 Heading
24px
Medium (Médio)
Título de Seção ("Section Title")
H4 Heading
20px
Medium (Médio)
Subseção ("Subsection")
Body Text
16px
Regular (Regular)
Corpo de texto padrão
Small Text
14px
Regular (Regular)
Legendas e rótulos ("Captions and labels")
II. Componentes (Components)
A. Botões (Buttons)
Existem quatro estados e tipos principais de botões:
1. Primary Button: Botão principal, geralmente preenchido com a cor primária ou de sucesso (visto como verde em "Login" e "Salvar").
2. Secondary Button: Botão secundário.
3. Tertiary Button: Botão terciário (estilo geralmente de link ou contorno mais sutil).
4. Disabled Button: Botão desativado (cinza e inacessível).
Observações sobre Ações: Ações críticas/destrutivas, como "Remover" e "Destruir", são apresentadas em vermelho (cor de Erro).
B. Inputs (Campos de Entrada)
O sistema define vários estados para os campos de entrada de formulário:
• Normal Input: Entrada de texto padrão (Ex: "Enter text...").
• Focused Input: O estado de foco deve ser claramente distinguível.
• Error Input: Indica uma entrada inválida, utilizando uma borda vermelha e texto de erro auxiliar ("Invalid entry," "Required field").
• Checkbox: Caixa de seleção (Exemplo de estado selecionado fornecido).
• Radio Button: Botão de rádio (Exemplo de estado selecionado fornecido).
A interface do Easypanel demonstra o uso de campos de texto, frequentemente rotulados com um asterisco para indicar campos obrigatórios (Ex: "Email *" e "Password *" na tela de login, ou "Nome *" ao criar um Projeto).
C. Cards (Cartões)
Os cartões são usados para agrupar informações relacionadas, como o "Server Status" no guia de estilo.
Na interface de monitoramento do Easypanel, métricas importantes (CPU, Memória, Disco, Rede) são exibidas em cartões proeminentes com cores de status e gráficos embutidos (Laranja para CPU, Azul para Memória, Verde para Disco).
D. Navegação e Barras Laterais (Navigation)
O sistema utiliza tanto a navegação em abas quanto a navegação vertical hierárquica.
1. Navegação Principal (Sidebar):
    ◦ Estrutura: A aplicação Easypanel adota um layout de duas colunas com uma barra lateral de navegação no lado esquerdo.
    ◦ Itens Principais (Painel de Controle): Inclui "Painel," "Ações," "Monitorar," "Domínios," e "Configurações".
    ◦ Itens Secundários/Ajuda: Inclui "Documentação," "Discord," "Feedback" e "Histórico de Alterações".
    ◦ Controles de Base: Controles persistentes na parte inferior incluem "Busca Rápida," o IP do servidor (Ex: 116.203.166.80), um toggle para "Modo Escuro," e "Sair".
2. Navegação de Configurações (Settings Sidebar):
    ◦ Categorias: Divide as configurações em seções "USER" (Ex: Autenticação) e "SERVER" (Ex: Geral, Github, Licença, Análises, Cluster, Marca, Notificações, Certificados, Snapshots, Túnel Cloudflare, Provedores de Armazenamento, Construtores Docker, Middlewares).
    ◦ Hierarquia: Alguns itens podem ter subitens (Ex: Abaixo de "Provedores de Armazenamento," Abaixo de "Construtores Docker" e Abaixo de "Middlewares").
E. Indicadores de Status e Tags (Status Indicators and Tags)
O sistema utiliza tags e cores para indicar o estado de recursos:
• Status de Recursos: Tags como "ADMINISTRADOR", "LOCAL", "RUNNING" (em execução), e "ATUAL" (atual) são usadas.
• Estados de Cluster: Estados como "ready," "active," e "reachable" são observados na seção Cluster.
• Avisos de Desenvolvimento/Funcionalidade: O sistema utiliza a tag "EXPERIMENTAL" (como em Exportar Serviço, Importar Serviço, Migrar Serviço, ou Túnel Cloudflare), ou "BETA" e "ALFA" para indicar o estágio de desenvolvimento de funcionalidades. Mensagens de erro de recurso em desenvolvimento são exibidas em caixas vermelhas (cor de Erro).
F. Modals (Modais)
Modais são janelas flutuantes usadas para capturar a atenção do usuário para tarefas específicas, como:
• Busca Rápida/Comando: Um modal centralizado para digitar um comando ou pesquisa, mostrando itens de navegação rápida (Início, Projetos, Ações, Monitorar, etc.).
• Criação/Edição: Modais são usados para "Criar Projeto" ou "Criar Construtor Docker" e "Editar Provedor de Armazenamento Local".
III. Padrões de Layout e Conteúdo (Patterns)
A. Estrutura de Páginas de Configuração
As páginas de configuração (sob "SERVER" e "USER") geralmente seguem o padrão de formulários agrupados em cartões ou painéis brancos, separando as funcionalidades por título (Ex: "Token do Github", "Alterar Credenciais").
B. Personalização (Marca/Branding)
A seção "Marca" permite a personalização de elementos visuais e funcionais:
• Básico: Opções para ocultar IP, ocultar Notas do Serviço e definir o Nome do Servidor.
• Cor do Servidor: Permite selecionar uma cor para o servidor (mostrando várias opções de quadrados coloridos).
• Logo: Permite o upload de SVG ou HTML para "Logo Claro" e "Logo Escuro," ambos com um botão "Salvar".
• Código Personalizado: Permite a adição de tags HTML, <script> ou <style>.
• Links: Opções para ocultar links específicos (Documentação, Discord, Feedback, Histórico de Alterações, Outros Links).
• Página de Erro: Permite CSS personalizado para páginas de erro e opções para ocultar o Logo e/ou Links.
C. Dados de Monitoramento e Logs
A visualização de dados em "Monitorar" utiliza gráficos e tabelas detalhadas:
• Métricas de Desempenho: Exibe o uso de CPU, Memória, Disco e Rede em gráficos de pizza e gráficos de linha em tempo real na parte superior da tela.
• Tabelas de Dados: Tabelas são utilizadas para listar serviços com métricas de desempenho detalhadas (CPU %, Memória %, Entrada/Saída de Rede), eventos do Docker (Tipo, Ação, Tempo, Detalhes), e alocação de Armazenamento (Projeto, Serviço, Size, Caminho).
• Logs: Logs de serviço são exibidos em uma caixa de texto escura com texto branco, simulando a saída de terminal.
D. Zona de Perigo (Danger Zone)
Para ações irreversíveis, como a destruição de um projeto que contém serviços, o sistema utiliza uma seção dedicada de "Zona de Perigo," que apresenta o botão de ação "Destruir" destacado em vermelho, acompanhado de uma mensagem de aviso explícita.
