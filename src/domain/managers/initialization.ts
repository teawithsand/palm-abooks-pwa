import { throwExpression } from "@teawithsand/tws-stl"

export class InitializationManager {
	private readonly promises: Promise<void>[] = []
	private donePromise: Promise<void> | null = null

	constructor() {}

	addPromise = (p: Promise<void>) => {
		if (this.donePromise) throw new Error(`Already finalized`)
		this.promises.push(p)
	}

	getDonePromise = (): Promise<void> => {
		return (
			this.donePromise ??
			throwExpression(
				new Error(`InitializationManager not finalized yet`)
			)
		)
	}

	finalize = () => {
		if (this.donePromise) throw new Error(`Already finalized`)
		this.donePromise = this.promises.length
			? Promise.all(this.promises).then(() => undefined)
			: Promise.resolve()
	}
}
