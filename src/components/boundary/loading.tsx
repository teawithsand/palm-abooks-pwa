import { LoadingSpinner } from "@teawithsand/tws-stl-react"
import React, { ReactNode, Suspense } from "react"

export const AppLoadingBoundary = (props: { children?: ReactNode }) => {
	return <Suspense fallback={<LoadingSpinner />}>{props.children}</Suspense>
}
