
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { PostgresStore } from '@mastra/pg';
import { generateJokeWorkflow } from './workflows/jokes-workflow.js';
import { authApiRoutes } from '../routes/api/auth.js';
import { jokesApiRoutes } from '../routes/api/jokes.js';
import { miscApiRoutes } from '../routes/api/misc.js';

// Load environment variables from root .env file
const currentFilename = fileURLToPath(import.meta.url);
const currentDirname = dirname(currentFilename);
dotenv.config({ path: join(currentDirname, '../../../.env') });

const mastraInstance = new Mastra({
  workflows: {
    generateJoke: generateJokeWorkflow,
  },
  agents: {},     // Remove default agents for now
  storage: new PostgresStore({
    connectionString: process.env.DATABASE_URL,  // Use the same PostgreSQL database
  }),
  logger: new PinoLogger({
    name: 'Froemic-API',
    level: 'info',
  }),
  server: {
    apiRoutes: [
      ...miscApiRoutes, 
      ...authApiRoutes,
      ...jokesApiRoutes,
    ],
    cors: {
      origin: (origin) => origin || '', // Echo back any origin
      credentials: true,
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'x-mastra-client-type', 'Cookie'],
      exposeHeaders: ['Content-Length', 'X-Requested-With', 'Set-Cookie'],
    },
  },
});

// Export both the instance and the workflows for direct usage
export const mastra = mastraInstance;
export const workflows = {
  generateJoke: mastraInstance.getWorkflow('generateJoke'),
};
