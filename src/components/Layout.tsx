import React, { ReactNode } from "react"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { wrapNoSSR } from "@teawithsand/tws-stl-react"
import { SSRProvider } from "react-bootstrap"

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			cacheTime: 0,
			suspense: true,
			useErrorBoundary: true,
			retry: false,
		},
		mutations: {
			useErrorBoundary: true,
		},
	},
})

const InnerLayout = (props: { children: ReactNode }) => {
	return (
		<SSRProvider>
			<QueryClientProvider client={queryClient}>
				{props.children}
			</QueryClientProvider>
		</SSRProvider>
	)
}

export const Layout = wrapNoSSR(InnerLayout)
