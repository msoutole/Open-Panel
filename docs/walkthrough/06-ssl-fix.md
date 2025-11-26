# SSL Certificate Type Fix

## Problem
The TypeScript compiler was throwing an error in `apps/api/src/services/ssl.ts`:
`Object literal may only specify known properties, and 'sslCertificate' does not exist in type 'DomainSelect<DefaultArgs>'.`

This occurred because the generated Prisma Client types were out of sync with the `schema.prisma` file, which did include the `sslCertificate` field in the `Domain` model.

## Solution
Regenerated the Prisma Client to update the generated types.

### Commands Run
```bash
cd apps/api
npx prisma generate
```

## Verification
Ran TypeScript compiler to verify the error is gone.
```bash
npx tsc --noEmit
```
The specific error in `src/services/ssl.ts` was resolved. Note that other unrelated TypeScript errors exist in the project but were not in the scope of this fix.
