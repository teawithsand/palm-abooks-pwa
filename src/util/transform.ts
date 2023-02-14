/**
 * Transformers transforms T to E.
 */
export interface Transformer<T, E> {
	transform: (input: T) => E
}

export interface Serializer<T, E> {
	readonly serialize: (input: T) => E
	readonly deserialize: (input: E) => T
}