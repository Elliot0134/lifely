"use client"

import { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // With SSR, we usually want to set some default staleTime
            // above 0 to avoid refetching immediately on the client
            staleTime: 60 * 1000, // 1 minute (surchargé à 30s pour les transactions)
            retry: (failureCount, error: unknown) => {
              const status = (error as { status?: number } | null)?.status ?? 0
              // Ne pas retry sur les erreurs d'auth/permission
              if (status === 401 || status === 403) return false
              // Ni sur les autres 4xx (bad request, not found)
              if (status >= 400 && status < 500) return false
              return failureCount < 3
            },
            // Backoff exponentiel plafonné à 30s
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}