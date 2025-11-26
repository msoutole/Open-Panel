# Módulo: Times e Colaboração

> **Status**: ✅ Estável
> **Versão**: 1.0
> **Última Atualização**: 2025-11-25

## 1. Contexto

Permite que múltiplos usuários colaborem em projetos. O sistema é baseado em Times (Organizations), onde usuários têm papéis específicos.

## 2. Modelo de Dados

```prisma
model Team {
  id          String       @id @default(cuid())
  name        String
  slug        String       @unique
  members     TeamMember[]
  projects    Project[]
  invites     TeamInvite[]
}

model TeamMember {
  userId    String
  teamId    String
  role      UserRole    @default(MEMBER)
}

model TeamInvite {
  email     String
  token     String      @unique
  expiresAt DateTime
}
```

## 3. Funcionalidades

| ID              | História             | Status   | Descrição                                                   |
| --------------- | -------------------- | -------- | ----------------------------------------------------------- |
| **US-TEAM-001** | **Criar Time**       | ✅ Pronto | Criar um novo espaço de trabalho isolado.                   |
| **US-TEAM-002** | **Convidar Membros** | ✅ Pronto | Enviar convites por email (link com token).                 |
| **US-TEAM-003** | **Gerenciar Papéis** | ✅ Pronto | Definir quem é Admin, Member ou Viewer.                     |
| **US-TEAM-004** | **Isolamento**       | ✅ Pronto | Projetos pertencem a um time e só são visíveis por membros. |

## 4. Implementação Técnica

### RBAC (Role-Based Access Control)
Middleware verifica se o usuário tem permissão para agir no recurso do time.
- **OWNER**: Controle total, pode deletar o time.
- **ADMIN**: Pode gerenciar membros e projetos.
- **MEMBER**: Pode criar/editar projetos.
- **VIEWER**: Apenas visualização.

### Convites
Os convites geram um token único com validade (ex: 48h). O link de aceitação associa o usuário ao time.
