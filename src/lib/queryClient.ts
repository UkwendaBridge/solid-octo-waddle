import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,        // data stays fresh for 30 s → no duplicate fetches on navigation
      retry: 1,                 // one retry on network error
      refetchOnWindowFocus: true,
    },
  },
});
