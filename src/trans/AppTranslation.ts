import { FileEntryDisposition } from "@app/domain/defines/abookFile"
import AppTranslationEN_US from "@app/trans/AppTranslationEN_US"
import {
	CommonConfig,
	createTranslatorContext,
	Language,
	makeTranslationHooks,
	Translator,
} from "@teawithsand/tws-trans"

export interface CommonTranslationInfo {
	autorPageUrl: string
	authorContactUrl: string
}

export interface AppTranslation {
	config: CommonConfig
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
			sendFiles: string
			receiveFiles: string
		}

		playerDropdown: {
			title: string
			playLocal: string
			playerUi: string
			playlist: string
			options: string
		}

		miscHelpDropdown: {
			title: string
			storageInfo: string
			versionAuthorInfo: string
		}
	}
}

const translations = new Map<Language, () => AppTranslation>()

translations.set("en-US", () => AppTranslationEN_US)

export const TranslatorContext = createTranslatorContext<AppTranslation, void>(
	new Translator(translations, "en-US")
)

const hooks = makeTranslationHooks(TranslatorContext, () => undefined)

export const useAppTranslation = hooks.useTranslation
export const useAppTranslationSelector = hooks.useTranslationSelector
export const useTranslator = hooks.useTranslator
