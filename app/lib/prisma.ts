// import { PrismaClient } from '@prisma/client';


// let prisma: PrismaClient;

// export const getPrismaClient = (): PrismaClient => {
//   if (!prisma) {
//     prisma = new PrismaClient({
//       datasources: {
//         db: {
//           url: process.env.NODE_ENV === 'production' ? process.env.POSTGRES_PRISMA_URL : process.env.DATABASE_URL_LOCAL,
//         },
//       },
//     });
//   }
//   return prisma;
// };

import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

// Optional configuration for idle connection timeout (check adapter docs)
const idleConnectionTimeout = process.env.PRISMA_IDLE_CONNECTION_TIMEOUT ? parseInt(process.env.PRISMA_IDLE_CONNECTION_TIMEOUT, 10) : undefined; // In seconds

export const getPrismaClient = (): PrismaClient => {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.NODE_ENV === 'production' ? process.env.POSTGRES_PRISMA_URL : process.env.DATABASE_URL_LOCAL,
        },
      },
      // Add connection pool configuration if supported by your adapter
      ...(idleConnectionTimeout ? { pool: { idleTimeoutMillis: idleConnectionTimeout * 2000 } } : {}), // Convert seconds to milliseconds
    });
  }
  return prisma;
};

