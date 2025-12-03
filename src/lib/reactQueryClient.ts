// src/lib/reactQueryClient.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 10, // 10s
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})
