import { FileEntryDisposition } from "@app/domain/defines/abookFile"
import { AppTranslation } from "@app/trans/AppTranslation"
import { readCommonConfig } from "@teawithsand/tws-trans"

const AppTranslationEN_US: AppTranslation = {
	config: readCommonConfig(),
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
			sendFiles: "Send ABook / files",
			receiveFiles: "Receive ABook / files",
		},
		playerDropdown: {
			title: "Player",
			playLocal: "Play files form this computer",
			playerUi: "Player",
			options: "Player options",
			playlist: "List of files / Playlist",
		},
		miscHelpDropdown: {
			title: "Help/Misc",
			storageInfo: "Storage info",
		},
		pageTitle: "PalmABooks PWA",
		homePage: "Home",
	},
	error: {
		unknown: "An unknown error occurred.",
	},
}

export default AppTranslationEN_US
