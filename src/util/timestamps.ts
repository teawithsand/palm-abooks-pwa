import {
	getNowPerformanceTimestamp,
	getNowTimestamp,
	PerformanceTimestampMs,
	TimestampMs,
} from "@teawithsand/tws-stl"

export type Timestamps = {
	perf: PerformanceTimestampMs
	ts: TimestampMs
}

export const getTimestamps = (): Timestamps => ({
	perf: getNowPerformanceTimestamp(),
	ts: getNowTimestamp(),
})
