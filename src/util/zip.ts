/**
 * @deprecated use zip from tws-stl
 */
export const zip = <T, E>(a: T[], b: E[]): [T, E][] =>
	a.map((k, i) => [k, b[i]])
