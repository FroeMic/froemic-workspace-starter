import { useState, useEffect, useCallback } from 'react';
import { electricClient, type Joke } from '@/lib/electric';
import { useAuth } from '@/contexts/auth-context';

export function useElectricJokes() {
  const { user } = useAuth();
  const [jokes, setJokes] = useState<Joke[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const handleError = useCallback((error: Error) => {
    console.error('Electric sync error:', error);
    setError(error.message);
    setConnected(false);
  }, []);

  const handleJokesUpdate = useCallback((newJokes: Joke[]) => {
    setJokes(prevJokes => {
      // Merge new jokes with existing ones, avoiding duplicates
      const jokeMap = new Map(prevJokes.map(joke => [joke.id, joke]));
      
      for (const joke of newJokes) {
        jokeMap.set(joke.id, joke);
      }
      
      // Sort by creation date, newest first
      return Array.from(jokeMap.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
    
    setConnected(true);
    setError(null);
  }, []);

  useEffect(() => {
    if (!user) {
      setJokes([]);
      setLoading(false);
      setConnected(false);
      return;
    }

    let unsubscribe: (() => void) | null = null;

    const initElectric = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get initial jokes
        const initialJokes = await electricClient.getInitialJokes();
        setJokes(initialJokes.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ));
        setConnected(true);

        // Subscribe to real-time updates
        unsubscribe = await electricClient.subscribeToJokes(
          handleJokesUpdate,
          handleError
        );
      } catch (error) {
        handleError(error instanceof Error ? error : new Error('Failed to initialize Electric client'));
      } finally {
        setLoading(false);
      }
    };

    initElectric();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, handleJokesUpdate, handleError]);

  const refresh = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const freshJokes = await electricClient.getInitialJokes();
      setJokes(freshJokes.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
      setError(null);
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Failed to refresh jokes'));
    } finally {
      setLoading(false);
    }
  }, [user, handleError]);

  return {
    jokes,
    loading,
    error,
    connected,
    refresh,
  };
}