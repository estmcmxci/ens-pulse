"use client";

import * as Tooltip from "@radix-ui/react-tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SWRConfig } from "swr";
import { useState, type ReactNode } from "react";

/**
 * Global providers for React Query, SWR, and Radix (e.g. Tooltip)
 * SWR config optimizes request deduplication and caching
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <Tooltip.Provider delayDuration={400} skipDelayDuration={0}>
      <SWRConfig
        value={{
          // Dedupe requests within 2 seconds
          dedupingInterval: 2000,
          // Throttle focus revalidation to every 5 seconds
          focusThrottleInterval: 5000,
          // Revalidate on window focus
          revalidateOnFocus: true,
          // Revalidate when network reconnects
          revalidateOnReconnect: true,
          // Retry failed requests up to 3 times
          errorRetryCount: 3,
          // Keep previous data while revalidating
          keepPreviousData: true,
        }}
      >
        {children}
      </SWRConfig>
      </Tooltip.Provider>
    </QueryClientProvider>
  );
}
