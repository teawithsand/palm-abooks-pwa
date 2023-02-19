import { latePromise } from "@teawithsand/tws-stl"

export class InitializationManager {
	private readonly promises: Promise<void>[] = []
	private innerFinalize: () => void

	constructor() {
		const [promise, resolve] = latePromise<void>()
		this.innerFinalize = resolve
		this.promises.push(promise)
	}

	addPromise = (p: Promise<void>) => {
		this.promises.push(p)
	}

	getDonePromise = async (): Promise<void> => {
		await Promise.all(this.promises)
	}

	finalize = () => {
		this.innerFinalize()
	}
}
