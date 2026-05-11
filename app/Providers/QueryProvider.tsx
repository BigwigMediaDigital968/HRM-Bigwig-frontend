'use client'

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export default function QueryProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: 2,

                retryDelay: (attemptIndex) =>
                    Math.min(1000 * 2 ** attemptIndex, 30000),

                staleTime: 1000 * 60 * 5,
                gcTime: 1000 * 60 * 10,
                refetchOnWindowFocus: false,
                refetchOnReconnect: true,
                refetchOnMount: false,
            },

            mutations: {
                retry: 1,
            },
        },
    });

    return (
        <>
            <QueryClientProvider client={queryClient} >
                {children}
            </QueryClientProvider>
        </>
    )
}