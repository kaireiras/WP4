import { QueryClient } from '@tanstack/react-query'

export function getContext() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60, // 1 minute default stale time
        gcTime: 1000 * 60 * 10, // 10 minutes cache garbage collection
        refetchOnWindowFocus: false, // Prevent refetch on window focus
        retry: 1,
      },
    },
  })

  return {
    queryClient,
  }
}
export default function TanstackQueryProvider() {}
