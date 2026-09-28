import { QueryClient } from "@tanstack/react-query";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 5 * 60_000, gcTime: 30 * 60_000, retry: 2, refetchOnWindowFocus: false },
      mutations: { retry: 0 },
    },
  });
}
