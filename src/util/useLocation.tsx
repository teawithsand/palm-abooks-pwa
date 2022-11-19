import { throwExpression } from "@teawithsand/tws-stl"
import React, { createContext, useContext, useMemo } from "react"

export type Location = {
	pathname: string
	search: URLSearchParams
	hash: string
}

export type RawLocation = {
	pathname: string
	search: string
	hash: string
}

const LocationContext = createContext<Location | null>(null)

export const wrapLocationProvider = <
	T extends {
		location: RawLocation
	}
>(
	Component: React.FC<T>
) => {
	return (props: T) => {
		const location = useMemo(() => { // is it redundant to useMemo? Is URLSearchParams parsing expensive?
			return {
				pathname: props.location.pathname,
				search: new URLSearchParams(props.location.search),
				hash: props.location.hash.replace("^#", ""),
			}
		}, [props.location])

		return (
			<LocationContext.Provider value={location}>
				<Component {...props} />
			</LocationContext.Provider>
		)
	}
}

export const useLocation = () => {
	return (
		useContext(LocationContext) ??
		throwExpression(new Error(`Location was not provided`))
	)
}
