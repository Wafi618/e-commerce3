# Prisma Client Optimization

## Problem
Previously, every API route was creating a new `PrismaClient` instance on each request:
```typescript
const prisma = new PrismaClient();
```

This is an anti-pattern that:
- Exhausts database connection limits
- Severely impacts performance
- Causes connection pooling issues
- Can lead to "Too many connections" errors

## Solution
Implemented a **singleton Prisma client pattern** following Next.js best practices.

### Implementation

1. **Created singleton instance** ([lib/prisma.ts](lib/prisma.ts)):
   ```typescript
   import { PrismaClient } from '@prisma/client';

   const globalForPrisma = global as unknown as { prisma: PrismaClient };

   export const prisma =
     globalForPrisma.prisma ||
     new PrismaClient({
       log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
     });

   if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
   ```

2. **Updated all API routes** (25 files):
   - Removed `import { PrismaClient } from '@prisma/client'`
   - Removed `const prisma = new PrismaClient()`
   - Added `import { prisma } from '@/lib/prisma'`
   - Removed `finally { await prisma.$disconnect() }` blocks

### Files Updated
- pages/api/auth/* (6 files)
- pages/api/cart/* (1 file)
- pages/api/messages/* (3 files)
- pages/api/products/* (2 files)
- pages/api/orders/* (5 files)
- pages/api/admin/* (2 files)
- pages/api/profile/* (2 files)
- pages/api/users/* (3 files)
- pages/api/bkash/* (1 file)

## Benefits
✅ Single database connection pool shared across all requests
✅ Prevents connection exhaustion
✅ Better performance and resource utilization
✅ Follows Next.js + Prisma best practices
✅ No more `$disconnect()` needed (connection pooling handles this)

## References
- [Prisma Best Practices for Next.js](https://pris.ly/d/help/next-js-best-practices)
- [Next.js Database Best Practices](https://nextjs.org/docs/pages/building-your-application/data-fetching/database)
