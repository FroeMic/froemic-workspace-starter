import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { createOpenAI } from "@ai-sdk/openai";
import { db } from '../../db/index.js';
import { jokes } from '../../db/schema.js';
import { env } from '../../lib/env.js';
import { generateText } from "ai";


// Initialize OpenAI client
const openai = createOpenAI({
  apiKey: env.OPENAI_API_KEY,
});

const jokeResponseSchema = z.object({
  jokeId: z.string(),
  joke: z.string(),
  createdAt: z.date(),
});

const generateJokeStep = createStep({
  id: 'generate-joke',
  description: 'Generates a joke using OpenAI GPT-3.5',
  inputSchema: z.object({
    userId: z.string().describe('The user ID to associate the joke with'),
    prompt: z.string().optional().describe('Optional topic for the joke'),
  }),
  outputSchema: z.object({
    userId: z.string(),
    jokeText: z.string(),
  }),
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error('Input data not found');
    }

    const { userId, prompt } = inputData;
    
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
    
    return {
      userId,
      jokeText,
    };
  },
});

const saveJokeStep = createStep({
  id: 'save-joke',
  description: 'Saves the generated joke to the database',
  inputSchema: z.object({
    userId: z.string().describe('The user ID to associate the joke with'),
    jokeText: z.string().describe('The generated joke text'),
  }),
  outputSchema: jokeResponseSchema,
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error('Input data not found');
    }

    const { userId, jokeText } = inputData;
    
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

const generateJokeWorkflow = createWorkflow({
  id: 'generate-joke-workflow',
  description: 'Generates and saves a joke for a user',
  inputSchema: z.object({
    userId: z.string().describe('The user ID to associate the joke with'),
    prompt: z.string().optional().describe('Optional topic for the joke'),
  }),
  outputSchema: jokeResponseSchema,
})
  .then(generateJokeStep)
  .then(saveJokeStep);

generateJokeWorkflow.commit();

export { generateJokeWorkflow };