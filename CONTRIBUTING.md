# Contribuindo para o OpenPanel

Obrigado por considerar contribuir para o OpenPanel! 🎉

Este documento fornece diretrizes para contribuir com o projeto. Por favor, leia-o antes de fazer sua contribuição.

## 📋 Índice

- [Código de Conduta](#código-de-conduta)
- [Como Posso Contribuir?](#como-posso-contribuir)
- [Primeiros Passos](#primeiros-passos)
- [Processo de Desenvolvimento](#processo-de-desenvolvimento)
- [Padrões de Código](#padrões-de-código)
- [Processo de Pull Request](#processo-de-pull-request)
- [Reportando Bugs](#reportando-bugs)
- [Sugerindo Melhorias](#sugerindo-melhorias)

## 📜 Código de Conduta

Este projeto adere ao [Código de Conduta do Contribuidor](CODE_OF_CONDUCT.md). Ao participar, você deve seguir este código. Por favor, reporte comportamentos inaceitáveis para msoutole@hotmail.com.

## 🤝 Como Posso Contribuir?

Existem várias formas de contribuir com o OpenPanel:

### 1. Reportar Bugs
- Use a seção de [Issues](https://github.com/msoutole/openpanel/issues)
- Verifique se o bug já não foi reportado
- Use o template de issue para bugs
- Forneça o máximo de detalhes possível

### 2. Sugerir Melhorias
- Abra uma issue com sua sugestão
- Descreva claramente o problema que sua sugestão resolve
- Explique como sua sugestão beneficiaria o projeto

### 3. Contribuir com Código
- Corrija bugs
- Implemente novas funcionalidades
- Melhore a documentação
- Otimize o desempenho
- Adicione testes

### 4. Melhorar Documentação
- Corrija erros de digitação
- Melhore explicações
- Adicione exemplos
- Traduza documentação

## 🚀 Primeiros Passos

### Configuração do Ambiente de Desenvolvimento

1. **Fork o repositório**
   ```bash
   # Clique no botão "Fork" no GitHub
   ```

2. **Clone seu fork**
   ```bash
   git clone https://github.com/SEU-USUARIO/openpanel.git
   cd openpanel
   ```

3. **Adicione o repositório upstream**
   ```bash
   git remote add upstream https://github.com/msoutole/openpanel.git
   ```

4. **Instale as dependências**
   ```bash
   npm install
   ```

5. **Configure o ambiente**
   ```bash
   cp .env.example .env
   # Edite o .env com suas configurações
   ```

6. **Inicie os serviços**
   ```bash
   npm start
   ```

### Pré-requisitos

- Node.js >= 18.0.0
- npm >= 10.0.0
- Docker >= 20.10.0
- Git

## 🔧 Processo de Desenvolvimento

### Estrutura de Branches

- `main` - Branch principal (produção)
- `develop` - Branch de desenvolvimento
- `feature/*` - Novas funcionalidades
- `fix/*` - Correções de bugs
- `docs/*` - Atualizações de documentação
- `refactor/*` - Refatorações de código

### Workflow de Desenvolvimento

1. **Crie uma branch a partir da `develop`**
   ```bash
   git checkout develop
   git pull upstream develop
   git checkout -b feature/minha-funcionalidade
   ```

2. **Faça suas alterações**
   - Escreva código limpo e bem documentado
   - Adicione testes quando apropriado
   - Siga os padrões de código do projeto

3. **Teste suas alterações**
   ```bash
   npm run type-check
   npm run lint
   npm test
   npm run build
   ```

4. **Commit suas alterações**
   ```bash
   git add .
   git commit -m "feat: adiciona funcionalidade X"
   ```

### Convenções de Commit

Seguimos o [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Alterações na documentação
- `style:` - Formatação, ponto e vírgula faltando, etc.
- `refactor:` - Refatoração de código
- `test:` - Adição ou correção de testes
- `chore:` - Tarefas de manutenção, build, etc.
- `perf:` - Melhorias de performance

**Exemplos:**
```
feat: adiciona suporte para deploy de containers Docker
fix: corrige erro de autenticação no login
docs: atualiza guia de instalação
refactor: reorganiza estrutura de serviços
```

## 📝 Padrões de Código

### TypeScript

- Use TypeScript strict mode
- Evite `any` - use tipos específicos
- Prefira interfaces sobre types para objetos
- Use destructuring quando apropriado

### Backend (Hono + Prisma)

- Handlers devem ser pequenos e chamar services
- Use Zod para validação de entrada
- Sempre trate erros com `HTTPException` ou `AppError`
- Use o logger do Winston para logs
- Acesse variáveis de ambiente via `lib/env.ts`

### Frontend (React + Vite)

- Use functional components com hooks
- Componentes devem ter uma única responsabilidade
- Use TypeScript para props
- Prefira composição sobre herança
- Centralize chamadas API em `services/api.ts`

### Estilo de Código

```bash
# Formatação automática
npm run format

# Verificar formatação
npm run format:check

# Lint
npm run lint

# Fix automático de lint
npm run lint:fix
```

## 🔄 Processo de Pull Request

1. **Atualize sua branch com a develop**
   ```bash
   git checkout develop
   git pull upstream develop
   git checkout feature/minha-funcionalidade
   git rebase develop
   ```

2. **Push para seu fork**
   ```bash
   git push origin feature/minha-funcionalidade
   ```

3. **Abra um Pull Request**
   - Vá para o repositório no GitHub
   - Clique em "New Pull Request"
   - Selecione sua branch
   - Preencha o template de PR

4. **Aguarde a revisão**
   - Mantenedores revisarão seu código
   - Responda aos comentários
   - Faça alterações solicitadas

5. **Merge**
   - Após aprovação, seu PR será mergeado
   - Sua contribuição estará no projeto! 🎉

### Checklist do Pull Request

- [ ] Código segue os padrões do projeto
- [ ] Testes foram adicionados/atualizados
- [ ] Documentação foi atualizada
- [ ] Build passa sem erros
- [ ] Lint passa sem warnings
- [ ] Type-check passa sem erros
- [ ] Commits seguem o padrão Conventional Commits
- [ ] PR tem uma descrição clara

## 🐛 Reportando Bugs

Ao reportar um bug, inclua:

- **Descrição clara** do problema
- **Passos para reproduzir** o bug
- **Comportamento esperado** vs **comportamento atual**
- **Screenshots** (se aplicável)
- **Informações do ambiente**:
  - Versão do Node.js
  - Versão do OpenPanel
  - Sistema operacional
  - Versão do Docker
- **Logs relevantes**

## 💡 Sugerindo Melhorias

Ao sugerir melhorias:

- **Descreva o problema** que a melhoria resolve
- **Explique a solução proposta**
- **Liste alternativas consideradas**
- **Impacto esperado** da melhoria
- **Exemplos de uso** (se aplicável)

## 📚 Recursos Adicionais

- [Guia de Desenvolvimento](docs/GUIA_DE_DESENVOLVIMENTO.md)
- [Manual Técnico](docs/MANUAL_TECNICO.md)
- [Documentação da API](docs/API_REST.md)
- [Arquitetura do Sistema](docs/MANUAL_TECNICO.md)

## 🎓 Precisa de Ajuda?

- Abra uma [issue](https://github.com/msoutole/openpanel/issues) com a tag `question`
- Entre em contato: msoutole@hotmail.com
- Consulte a [documentação](docs/README.md)

## 🙏 Agradecimentos

Agradecemos a todos os contribuidores que ajudam a tornar o OpenPanel melhor!

---

**Lembre-se:** Contribuições não são apenas código! Documentação, design, testes, feedback e suporte à comunidade são igualmente valiosos. 💙
