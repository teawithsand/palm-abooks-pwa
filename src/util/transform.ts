/**
 * Transformers transforms T to E.
 *
 * @deprecated to be replaced with tws-config serializer framework.
 */
export interface Transformer<T, E> {
	transform: (input: T) => E
}

/**
 * @deprecated to be replaced with tws-config serializer framework.
 */
export interface Serializer<T, E> {
	readonly serialize: (input: T) => E
	readonly deserialize: (input: E) => T
}
