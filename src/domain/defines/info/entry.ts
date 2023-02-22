export enum PlayableEntryPlaybackInfoType {
	NONE = 0,
	MUSIC = 1,
	ABOOK_FILE = 2,
}

export type PlayableEntryPlaybackInfo =
	| {
			type: PlayableEntryPlaybackInfoType.NONE
	  }
	| {
			type: PlayableEntryPlaybackInfoType.MUSIC
			fileName: string | null
			title: string | null
			artist: string | null
			album: string | null
			artwork: {
				src: string
				sizes: string
				type: string
			}[]
	  }
	| {
			type: PlayableEntryPlaybackInfoType.ABOOK_FILE
			fileName: string | null
			abookTitle: string | null
			abookName: string | null
            artwork: {
				src: string
				sizes: string
				type: string
			}[]
	  }
