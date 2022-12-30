import { FileEntryDisposition } from "@app/domain/defines/abookFile"
import AppTranslationEN_US from "@app/trans/AppTranslationEN_US"
import {
	createTranslatorContext,
	Language,
	makeTranslationHooks,
	Translator,
} from "@teawithsand/tws-trans"

export interface CommonTranslationInfo {
	autorPageLink: string
}

export interface AppTranslation {
	info: CommonTranslationInfo
	error: {
		unknown: string
	}
	abook: {
		formatFileEntryDisposition: (disposition: FileEntryDisposition) => string
	}
	navbar: {
		pageTitle: string
		homePage: string

		abookLibraryDropdown: {
			title: string
			managementPanel: string
			addLocalABook: string
			listABooks: string
		}

		playerDropdown: {
			title: string
			playLocal: string
			playerUi: string
		}
	}
}

const translations = new Map<Language, AppTranslation>()

translations.set("en-US", AppTranslationEN_US)

export const TranslatorContext = createTranslatorContext<AppTranslation>(
	new Translator(translations, "en-US")
)

const hooks = makeTranslationHooks(TranslatorContext)

export const useAppTranslation = hooks.useTranslation
export const useAppTranslationSelector = hooks.useTranslationSelector
export const useTranslator = hooks.useTranslator
