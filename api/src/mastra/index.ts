
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { PostgresStore } from '@mastra/pg';
import { generateJokeWorkflow } from './workflows/jokes-workflow.js';
import { authApiRoutes } from '../routes/api/auth.js';
import { jokesApiRoutes } from '../routes/api/jokes.js';
import { miscApiRoutes } from '../routes/api/misc.js';
import { env } from '../lib/env.js';

export const mastra = new Mastra({
  storage: new PostgresStore({
    connectionString: env.DATABASE_URL, // Use the same PostgreSQL database
  }),
  logger: new PinoLogger({
    name: "Froemic-API",
    level: "info",
  }),
  workflows: {
    generateJoke: generateJokeWorkflow,
  },
  agents: {}, // 
  server: {
    apiRoutes: [...miscApiRoutes, ...authApiRoutes, ...jokesApiRoutes],
    cors: {
      origin: (origin) => origin || "", // Echo back any origin
      credentials: true,
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: [
        "Content-Type",
        "Authorization",
        "x-mastra-client-type",
        "Cookie",
      ],
      exposeHeaders: ["Content-Length", "X-Requested-With", "Set-Cookie"],
    },
  },
});

