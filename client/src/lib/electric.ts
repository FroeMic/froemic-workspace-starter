import { ShapeStream } from '@electric-sql/client';

const ELECTRIC_URL = '/api/electric'; // Goes through our backend proxy

export interface Joke {
  id: string;
  user_id: string;
  text: string;
  created_at: string;
  updated_at: string;
}

export class ElectricClient {
  private shapeStreams: Map<string, ShapeStream> = new Map();

  async getJokesShape(): Promise<ShapeStream> {
    const key = 'jokes';
    
    if (this.shapeStreams.has(key)) {
      return this.shapeStreams.get(key)!;
    }

    const stream = new ShapeStream({
      url: `${ELECTRIC_URL}/v1/shape`,
      params: {
        table: 'jokes',
      },
      headers: {
        'Content-Type': 'application/json',
      },
      fetchClient: fetch.bind(globalThis),
    });

    this.shapeStreams.set(key, stream);
    return stream;
  }

  async subscribeToJokes(
    onData: (jokes: Joke[]) => void,
    onError?: (error: Error) => void
  ): Promise<() => void> {
    try {
      const stream = await this.getJokesShape();
      
      const unsubscribe = stream.subscribe(
        (messages) => {
          // Process the messages and extract joke data
          const jokes: Joke[] = [];
          
          for (const message of messages) {
            if (message.headers?.operation === 'insert' || message.headers?.operation === 'update') {
              jokes.push(message.value as Joke);
            }
          }
          
          if (jokes.length > 0) {
            onData(jokes);
          }
        },
        (error) => {
          console.error('Electric stream error:', error);
          if (onError) {
            onError(new Error('Failed to sync jokes'));
          }
        }
      );

      return () => {
        unsubscribe();
        this.shapeStreams.delete('jokes');
      };
    } catch (error) {
      console.error('Failed to subscribe to jokes:', error);
      if (onError) {
        onError(error instanceof Error ? error : new Error('Subscription failed'));
      }
      return () => {};
    }
  }

  async getInitialJokes(): Promise<Joke[]> {
    try {
      const stream = await this.getJokesShape();
      const snapshot = await stream.snapshot();
      
      return Array.from(snapshot.values()) as Joke[];
    } catch (error) {
      console.error('Failed to get initial jokes:', error);
      return [];
    }
  }
}

export const electricClient = new ElectricClient();