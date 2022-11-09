import { WhatToPlayManager } from "@app/domain/managers/whatToPlayManager"
import { AbookDb } from "@app/domain/storage/db"

export class AppManager {
	/**
	 * Note: This field is quite hacky and should not be used.
	 * Use `useAppManager` hook instead.
	 */
	public static readonly instance: AppManager = new AppManager()

	public readonly whatToPlayManager = new WhatToPlayManager()
	public readonly abookDb: AbookDb = new AbookDb()

	private constructor() {}
}

export const useAppManager = () => AppManager.instance
