import { createCollection } from '@tanstack/react-db';
import { queryCollectionOptions } from '@tanstack/query-db-collection';
import { queryClient } from '@/lib/query-client';
import { apiClient } from '@/lib/api';

export interface Joke {
  id: string;
  userId: string;
  text: string;
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
  })
);


