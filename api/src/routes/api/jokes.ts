import { registerApiRoute } from '@mastra/core/server';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { jokes } from '../../db/schema.js';
import { authMiddleware } from '../../middleware/auth.js';

const createJokeSchema = z.object({
  text: z.string().min(1).max(1000),
});

export const jokesApiRoutes = [
  registerApiRoute('/jokes', {
    method: 'GET',
    middleware: [authMiddleware],
    handler: async (c) => {
      const user = c.get('user');
      
      const userJokes = await db
        .select()
        .from(jokes)
        .where(eq(jokes.userId, user.id))
        .orderBy(desc(jokes.createdAt));
      
      return c.json({ jokes: userJokes });
    },
  }),

  registerApiRoute('/jokes', {
    method: 'POST',
    middleware: [authMiddleware],
    handler: async (c) => {
      const user = c.get('user');
      const body = await c.req.json();
      const { text } = createJokeSchema.parse(body);
      
      const [joke] = await db
        .insert(jokes)
        .values({
          userId: user.id,
          text,
        })
        .returning();
      
      return c.json({ joke });
    },
  }),

  // Commented out workflow handler for now
  registerApiRoute('/jokes/generate', {
    method: 'POST',
    middleware: [authMiddleware],
    handler: async (ctx) => {
      const user = ctx.get('user');
      const body = await ctx.req.json().catch(() => ({}));
      
      // Get the Mastra instance from the context
      const mastra = ctx.get('mastra');

      const run = await mastra.getWorkflow('generateJoke').createRunAsync();


      const result = await run.start({
        inputData: {
          userId: user.id,
          prompt: body.prompt,
        },
      });

      console.log(result);

      
      // Use the workflow handler
      return ctx.json({
        status: 'success',
      });
    },
  }),
];