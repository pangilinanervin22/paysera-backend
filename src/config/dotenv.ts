import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables from .env file
if (process.env.NODE_ENV === 'development') dotenv.config({ path: '.env.development' });
else if (process.env.NODE_ENV === 'test') dotenv.config({ path: '.env.test' });
else dotenv.config({ path: '.env' });

// Define a schema for your environment variables
const envSchema = z.object({
    DATABASE_URL: z.string().url(),
    PORT: z.string().regex(/^\d+$/).transform(Number),
    NODE_ENV: z.enum(['development', 'production', 'test']),
    ENABLE_DEV_GENERATORS: z.enum(['true', 'false']),
    JWT_SECRET: z.string(),
    ORIGIN: z.string().url(),
    SALT_ROUNDS: z.string().regex(/^\d+$/).transform(Number),
});

// Parse and validate the environment variables
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error('Invalid environment variables:', parsedEnv.error.format());
    process.exit(1);
}

console.log('Environment profile:', parsedEnv.data.NODE_ENV);

// Export validated environment variables
export const configEnv = parsedEnv.data;
