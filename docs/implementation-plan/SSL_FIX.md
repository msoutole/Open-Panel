# SSL Certificate Type Fix

## Goal
Fix the TypeScript error regarding `sslCertificate` not existing in `DomainSelect` type.

## Analysis
The field `sslCertificate` exists in `schema.prisma` but is missing from the generated client types.

## Changes
- [x] Run `npx prisma generate` in `apps/api`

## Verification
- [x] Run `npx tsc --noEmit` and confirm `src/services/ssl.ts` has no errors.
