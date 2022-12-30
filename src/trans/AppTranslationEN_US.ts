import { FileEntryDisposition } from "@app/domain/defines/abookFile"
import { AppTranslation } from "@app/trans/AppTranslation"

const AppTranslationEN_US: AppTranslation = {
	info: {
		autorPageLink: "https://teawithsand.com",
	},
	abook: {
		formatFileEntryDisposition: (disposition) => {
			if (disposition === FileEntryDisposition.IMAGE) return "Image file"
			else if (disposition === FileEntryDisposition.MUSIC)
				return "Music file"
			else if (disposition === FileEntryDisposition.DESCRIPTION)
				return "Description file"
			return "Unknown file type"
		},
	},
	navbar: {
		abookLibraryDropdown: {
			title: "ABooks",
			addLocalABook: "Add ABook from local device",
			listABooks: "List ABooks",
			managementPanel: "ABook management panel",
		},
		playerDropdown: {
			title: "Player",
			playLocal: "Play files form this computer",
			playerUi: "Player",
		},
		pageTitle: "PalmABooks PWA",
		homePage: "Home",
	},
	error: {
		unknown: "An unknown error occurred.",
	},
}

export default AppTranslationEN_US
