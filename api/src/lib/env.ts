import { z } from 'zod';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from root .env file
const currentFilename = fileURLToPath(import.meta.url);
const currentDirname = dirname(currentFilename);
dotenv.config({ path: join(currentDirname, '../../../.env') });


// Define environment variable schema
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),

  // Authentication
  JWT_SECRET: z.string().min(32, 'JWT_SECRET should be at least 32 characters long'),
  
  // OpenAI
  OPENAI_API_KEY: z.string().min(20, 'OPENAI_API_KEY is required'),

  // Server
  PORT: z.string().transform((val) => parseInt(val, 10)).default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // CORS (optional with defaults)
  CORS_ORIGIN: z.string().default('*'),
});

// Parse and validate environment variables
const parseEnvVars = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((err) => {
        return `${err.path.join('.')}: ${err.message}`;
      });
      throw new Error(`❌ Invalid or missing environment variables:\n${missingVars.join('\n')}`);
    }
    throw error;
  }
};

// Export validated environment variables
export const env = parseEnvVars();

// Type definition for validated env vars
export type Env = z.infer<typeof envSchema>;
