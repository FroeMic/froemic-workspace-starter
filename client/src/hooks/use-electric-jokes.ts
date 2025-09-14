import { useMemo } from 'react';
import { useLiveQuery } from '@tanstack/react-db';
import { jokesCollection, type Joke } from '@/lib/jokes-collection';
import { useAuth } from '@/contexts/auth-context';

export function useElectricJokes() {
  const { user } = useAuth();

  const { data } = useLiveQuery((q) =>
    user
      ? q
          .from({ joke: jokesCollection })
          .orderBy(({ joke }) => joke.createdAt, 'desc')
      : q.from({ joke: jokesCollection }).where(() => false as unknown as boolean)
  );

  const jokes = useMemo(() => (data as Joke[] | undefined) ?? [], [data]);

  const refresh = async () => {
    await jokesCollection.utils.refetch();
  };

  return {
    jokes,
    loading: !!user && jokes.length === 0,
    error: null,
    connected: !!user,
    refresh,
  };
}