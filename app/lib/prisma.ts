import { PrismaClient } from '@prisma/client';


let prisma: PrismaClient;

export const getPrismaClient = (): PrismaClient => {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.NODE_ENV === 'production' ? process.env.POSTGRES_PRISMA_URL : process.env.DATABASE_URL_LOCAL,
        },
      },
    });
  }
  return prisma;
};
