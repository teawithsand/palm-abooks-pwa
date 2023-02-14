import { ErrorBoundary as InnerErrorBoundary } from "@teawithsand/tws-stl-react"
import React, { ReactNode } from "react"

// TODO(teawithsand): implement better, explaining error boundary
export const AppErrorBoundary = (props: { children?: ReactNode }) => {
	return (
		<InnerErrorBoundary fallback={<>An error occurred</>}>
			{props.children}
		</InnerErrorBoundary>
	)
}
