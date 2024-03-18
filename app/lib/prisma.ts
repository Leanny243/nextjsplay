import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  const dbUrl = process.env.POSTGRES_PRISMA_URL;
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });
} else {
  const dbUrl = process.env.DATABASE_URL_LOCAL;
  // Create a global PrismaClient instance if it doesn't exist
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
    });
  }
  // Use the global PrismaClient instance for subsequent calls
  prisma = global.prisma;
}

export default prisma;
