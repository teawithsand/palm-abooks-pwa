import React, { ReactNode } from "react"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { wrapNoSSR } from "@teawithsand/tws-stl-react"
import { SSRProvider } from "react-bootstrap"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"

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
			<DndProvider backend={HTML5Backend}>
				<QueryClientProvider client={queryClient}>
					{props.children}
				</QueryClientProvider>
			</DndProvider>
		</SSRProvider>
	)
}

export const Layout = wrapNoSSR(InnerLayout)