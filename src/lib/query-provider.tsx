'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { CACHE_DURATIONS } from '@/lib/smart-cache'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Default: static data stays fresh for a while
            // Dynamic data (stock, orders) is handled by real-time push
            staleTime: CACHE_DURATIONS.SHOP_DATA, // 5 minutes default
            gcTime: CACHE_DURATIONS.SETTINGS, // 10 minutes garbage collection
            refetchOnWindowFocus: false, // Don't refetch on focus - use SSE instead
            refetchOnMount: true, // Refetch on mount for fresh data
            refetchOnReconnect: true, // Refetch on network reconnect
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
