export const isBlank = (s: string): boolean =>
	s.length === 0 || !!s.match(/^\s+$/)
