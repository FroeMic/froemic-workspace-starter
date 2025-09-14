import { createCollection } from '@tanstack/react-db';
import { queryCollectionOptions } from '@tanstack/query-db-collection';
import { queryClient } from '@/lib/query-client';
import { apiClient } from '@/lib/api';

export interface Joke {
  id: string;
  userId: string;
  text: string | null;
  status: 'loading' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export const jokesCollection = createCollection(
  queryCollectionOptions<Joke>({
    queryKey: ['jokes'],
    queryFn: async () => {
      const { jokes } = await apiClient.getJokes();
      return jokes as Joke[];
    },
    queryClient,
    getKey: (item) => item.id,
    onInsert: async ({ transaction }) => {
      const mutation = transaction.mutations[0];
      const pending = mutation.modified as Joke;

      // Create placeholder on server, then trigger generation to complete it
      await apiClient.request(`/jokes/pending`, {
        method: 'POST',
        body: JSON.stringify({ id: pending.id }),
      } as any);

      await apiClient.request(`/jokes/generate/${pending.id}`, {
        method: 'POST',
      } as any);

      return { refetch: true };
    },
    onUpdate: async ({ transaction }) => {
      const { modified } = transaction.mutations[0] as any;
      if (modified?.id && typeof modified?.text === 'string') {
        await apiClient.request(`/jokes/${modified.id}/complete`, {
          method: 'PUT',
          body: JSON.stringify({ text: modified.text }),
        } as any);
        return { refetch: true };
      }
    },
  })
);


