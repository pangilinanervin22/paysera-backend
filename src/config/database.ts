import { PrismaClient } from '@prisma/client'
import { configEnv } from './dotenv'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export let prisma: PrismaClient

try {
    prisma = globalForPrisma.prisma || new PrismaClient()
} catch (error) {

    process.exit(1);
}

if (configEnv.NODE_ENV !== 'production') globalForPrisma.prisma = prisma