import { useMemo } from "react"

const wrapPromise = <T,>(
	promise: Promise<T>
): {
	read: () => T
} => {
	let status = "pending"
	let result: any | T = null
	const suspender = promise.then(
		(r) => {
			status = "success"
			result = r
		},
		(e) => {
			status = "error"
			result = e
		}
	)

	return {
		read: (): T => {
			if (status === "pending") {
				throw suspender
			} else if (status === "error") {
				throw result
			}

			return result as T
		},
	}
}

export const randomNumber = () => {
	return new Promise((res) => setTimeout(() => res(Math.random()), 3000))
}

export const useSuspenseLoader = <T, A extends Array<any>>(
	loader: () => Promise<T>,
	args: A
): T => {
	const res = useMemo(() => {
		return wrapPromise(loader())
	}, args)

	return res.read()
}
