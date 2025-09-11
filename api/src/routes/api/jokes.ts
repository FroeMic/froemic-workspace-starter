import { registerApiRoute } from '@mastra/core/server';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { jokes } from '../../db/schema.js';
import { authMiddleware } from '../../middleware/auth.js';
import { workflows } from '../../mastra/index.js';

const createJokeSchema = z.object({
  text: z.string().min(1).max(1000),
});

export const jokesApiRoutes = [
  registerApiRoute('/jokes', {
    method: 'GET',
    middleware: [ authMiddleware],
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
    middleware: [ authMiddleware],
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

  registerApiRoute('/jokes/generate', {
    method: 'POST',
    middleware: [authMiddleware],
    handler: async (c) => {
      const user = c.get('user');
      const body = await c.req.json().catch(() => ({}));
      
      // Start the joke generation workflow
      const result = await workflows.generateJoke.createRunAsync().then(run => run.start({
        userId: user.id,
        prompt: body.prompt,  // Optional prompt from request body
      }));
      
      return c.json({ 
        success: true,
        joke: {
          id: result.jokeId,
          text: result.joke,
          createdAt: result.createdAt,
        }
      });
    },
  }),
];