import { registerApiRoute } from '@mastra/core/server';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { jokes } from '../../db/schema.js';
import { authMiddleware } from '../../middleware/auth.js';
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { env } from '../../lib/env.js';

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
          status: 'completed',
        })
        .returning();
      
      return c.json({ joke });
    },
  }),

  // Create placeholder joke with provided id (pending generation)
  registerApiRoute('/jokes/pending', {
    method: 'POST',
    middleware: [authMiddleware],
    handler: async (c) => {
      const user = c.get('user');
      const body = await c.req.json();
      const id = body?.id as string | undefined;
      if (!id) return c.json({ error: 'id required' }, 400);

      const [joke] = await db
        .insert(jokes)
        .values({ id, userId: user.id, text: null, status: 'loading' })
        .returning();

      return c.json({ joke });
    },
  }),

  // Mark joke as completed/updated with generated text
  registerApiRoute('/jokes/:id/complete', {
    method: 'PUT',
    middleware: [authMiddleware],
    handler: async (c) => {
      const user = c.get('user');
      const id = c.req.param('id');
      const body = await c.req.json().catch(() => ({}));
      const text = body?.text as string | undefined;
      if (!text) return c.json({ error: 'text required' }, 400);

      const updated = await db
        .update(jokes)
        .set({ text, status: 'completed', updatedAt: new Date() })
        .where(eq(jokes.id, id))
        .returning();

      const [joke] = updated;
      if (!joke || joke.userId !== user.id) return c.json({ error: 'Not found' }, 404);
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

  // Generate a joke for a specific placeholder id and update it
  registerApiRoute('/jokes/generate/:id', {
    method: 'POST',
    middleware: [authMiddleware],
    handler: async (c) => {
      const user = c.get('user');
      const id = c.req.param('id');
      const body = await c.req.json().catch(() => ({}));
      const prompt: string | undefined = body?.prompt;

      const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY });

      let systemPrompt = "You are a funny comedian. Generate a short, clean, and family-friendly joke.";
      if (prompt) {
        systemPrompt = `Generate a funny joke about ${prompt}. Keep it clean and family-friendly.`;
      }

      const { text } = await generateText({
        model: openai("gpt-3.5-turbo"),
        prompt: systemPrompt,
        maxTokens: 150,
        temperature: 1,
        topP: 1,
      });

      const jokeText = text.trim();

      const updated = await db
        .update(jokes)
        .set({ text: jokeText, status: 'completed', updatedAt: new Date() })
        .where(eq(jokes.id, id))
        .returning();

      const [joke] = updated;
      if (!joke || joke.userId !== user.id) {
        return c.json({ error: 'Not found' }, 404);
      }

      return c.json({ joke });
    },
  }),
];