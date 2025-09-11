import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { db } from '../../db/index.js';
import { jokes } from '../../db/schema.js';

const generateJokeSchema = z.object({
  userId: z.string(),
  prompt: z.string().optional(),
});

const saveJokeStep = createStep({
  id: 'save-joke',
  inputSchema: z.object({
    userId: z.string(),
    jokeText: z.string(),
  }),
  execute: async ({ context }) => {
    const { userId, jokeText } = context.machineContext!;
    
    const [joke] = await db.insert(jokes).values({
      userId,
      text: jokeText,
    }).returning();
    
    return {
      jokeId: joke.id,
      joke: joke.text,
      createdAt: joke.createdAt,
    };
  },
});

const generateJokeStep = createStep({
  id: 'generate-joke',
  inputSchema: z.object({
    userId: z.string(),
    prompt: z.string().optional(),
  }),
  execute: async ({ context }) => {
    const { userId, prompt } = context.machineContext!;
    
    // Simple joke generation for now
    // In a real implementation, you'd use an LLM or joke API
    const jokes = [
      "Why don't scientists trust atoms? Because they make up everything!",
      "Why did the scarecrow win an award? He was outstanding in his field!",
      "Why don't eggs tell jokes? They'd crack each other up!",
      "What do you call a fake noodle? An impasta!",
      "Why did the math book look so sad? Because it had too many problems!",
    ];
    
    let selectedJoke;
    if (prompt) {
      // If there's a prompt, try to generate a contextual response
      selectedJoke = `Here's a joke about ${prompt}: ${jokes[Math.floor(Math.random() * jokes.length)]}`;
    } else {
      selectedJoke = jokes[Math.floor(Math.random() * jokes.length)];
    }
    
    return {
      userId,
      jokeText: selectedJoke,
    };
  },
});

export const generateJokeWorkflow = createWorkflow({
  name: 'generateJoke',  // Must match the key in mastra config
  inputSchema: generateJokeSchema,
})
  .then(generateJokeStep)
  .then(saveJokeStep)
  .commit();