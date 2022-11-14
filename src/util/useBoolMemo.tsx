import { useRef } from "react"

/**
 * Returns value if isValid is true. Otherwise returns memorized value.
 * Returns invalid value(but never memorizes it) if no valid value was provided.
 */
export const useValidValue = <T,>(value: T, isValid: boolean) => {
	const prevValueRef = useRef<{ value: T | null }>()

	if (isValid) {
		prevValueRef.current = { value }
		return value
	} else {
		return prevValueRef.current?.value ?? value
	}
}
