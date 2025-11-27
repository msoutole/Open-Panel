# Domain: Storage & Backups

> **Single-File Context**: Sistema de backups automáticos, databases e armazenamento.

---

## 1. Overview

**O que é?** Backup automático de containers, databases e configurações. Suporte a storage local e S3-compatible.

**Componentes**:
- **Backups**: Snapshots de volumes e databases
- **Storage Providers**: Local, S3, B2
- **Scheduled Backups**: Cronjobs automáticos

---

## 2. Data Models

`prisma
enum BackupStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
}

model Backup {
  id          String       @id @default(cuid())
  name        String
  size        BigInt?      // Bytes
  status      BackupStatus @default(PENDING)
  path        String?      // Storage path
  s3Key       String?      // S3 object key

  // Project relation
  projectId   String
  project     Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)

  // Metadata
  createdAt   DateTime     @default(now())
  completedAt DateTime?

  @@index([projectId])
  @@index([status])
  @@map("backups")
}

model Database {
  id          String   @id @default(cuid())
  name        String
  type        String   // "postgresql", "mysql", "mongodb"
  version     String   // "16", "8.0", "7.0"
  port        Int
  username    String
  password    String   // Encrypted
  dbName      String

  // Container relation
  containerId String   @unique
  container   Container @relation(fields: [containerId], references: [id])

  // Project relation
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id])

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([projectId])
  @@map("databases")
}
`

---

## 3. API Endpoints

### POST /api/backups
Cria backup manual

### GET /api/backups
Lista backups do projeto

### POST /api/backups/:id/restore
Restaura backup

### DELETE /api/backups/:id
Deleta backup

### POST /api/databases
Cria database managed

### GET /api/databases
Lista databases

---

## 4. Implementation

`typescript
// apps/api/src/services/backup.service.ts
import { exec } from 'child_process'
import { promisify } from 'util'
import { S3 } from '@aws-sdk/client-s3'

const execAsync = promisify(exec)

export class BackupService {
  private s3 = new S3({ /* config */ })

  async createBackup(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { containers: true, databases: true }
    })

    const backup = await prisma.backup.create({
      data: {
        name: `backup-${Date.now()}`,
        projectId,
        status: 'RUNNING'
      }
    })

    try {
      // Backup container volumes
      for (const container of project.containers) {
        await this.backupContainerVolumes(container.dockerId, backup.id)
      }

      // Backup databases
      for (const db of project.databases) {
        await this.backupDatabase(db, backup.id)
      }

      // Upload to S3 if configured
      if (process.env.S3_ENABLED) {
        await this.uploadToS3(backup.id)
      }

      await prisma.backup.update({
        where: { id: backup.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      })
    } catch (error) {
      await prisma.backup.update({
        where: { id: backup.id },
        data: {
          status: 'FAILED'
        }
      })
    }
  }

  private async backupContainerVolumes(dockerId: string, backupId: string) {
    const tarPath = `/backups/${backupId}/volumes.tar.gz`
    await execAsync(`docker run --rm --volumes-from ${dockerId} -v /backups:/backup alpine tar czf /backup/${backupId}/volumes.tar.gz /data`)
    return tarPath
  }

  private async backupDatabase(db: Database, backupId: string) {
    if (db.type === 'postgresql') {
      await execAsync(`pg_dump -h localhost -U ${db.username} ${db.dbName} > /backups/${backupId}/db.sql`)
    } else if (db.type === 'mysql') {
      await execAsync(`mysqldump -u ${db.username} -p${db.password} ${db.dbName} > /backups/${backupId}/db.sql`)
    }
  }

  private async uploadToS3(backupId: string) {
    const tarPath = `/backups/${backupId}/`
    // Compress entire backup folder
    await execAsync(`tar czf /tmp/${backupId}.tar.gz -C /backups ${backupId}`)

    // Upload to S3
    const fileStream = fs.createReadStream(`/tmp/${backupId}.tar.gz`)
    await this.s3.putObject({
      Bucket: process.env.S3_BUCKET,
      Key: `backups/${backupId}.tar.gz`,
      Body: fileStream
    })
  }
}
`

---

**Última Atualização**: 2025-11-26
**Status**: ✅ Implementado (75%)

