'use client';

/**
 * Root client provider wrapping the application with TanStack Query.
 *
 * Implements client defaults per docs/TANSTACK_QUERY.md §4:
 * - Single QueryClient created once per browser session
 * - staleTime configured (60s default)
 * - retry off for 4xx errors (client/validation/auth failures)
 * - refetchOnWindowFocus enabled
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { ApiError } from '@shared/lib/api-client';

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: true,
        retry: (failureCount, error) => {
          if (error instanceof ApiError) {
            return false;
          }
          return failureCount < 3;
        },
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    return makeQueryClient();
  }
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

/**
 * Client-side provider wrapping child trees in QueryClientProvider.
 */
export function Providers({ children }: { readonly children: ReactNode }) {
  const [queryClient] = useState(() => getQueryClient());

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
