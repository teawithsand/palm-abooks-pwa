import { PageContainer } from "@app/components/PageContainer"
import { SenderContextProvider } from "@app/components/filetransfer/sender/SenderContextProvider"
import { useAbookId } from "@app/components/util/useAbookId"
import { Abook } from "@app/domain/defines/abook"
import { FileEntryType } from "@app/domain/defines/abookFile"
import { FileTransferEntry } from "@app/domain/filetransfer"
import { useAppManager } from "@app/domain/managers/app"
import { wrapLocationProvider } from "@app/util/useLocation"
import { useQuery } from "@tanstack/react-query"
import { generateUUID, throwExpression } from "@teawithsand/tws-stl"
import { wrapNoSSR } from "@teawithsand/tws-stl-react"
import React, { useMemo } from "react"

type Res = {
	abook: Readonly<Abook>
	files: Blob[]
}

const InnerPage = () => {
	const app = useAppManager()
	const abookId = useAbookId()
	const result = useQuery(["abook", abookId], async () => {
		const access = await app.abookDb.abookWriteAccess(abookId)
		try {
			const abook = access.getAbook()

			// TODO(teawithsand): fix lack of sending non-local-stored files
			let files: (File | Blob)[] = []
			for (const e of abook.entries) {
				if (e.data.dataType === FileEntryType.INTERNAL_FILE) {
					const file = await app.abookDb.getInternalFileBlob(
						e.data.internalFileId
					)
					if (file) {
						files.push(file)
					}
				}
			}

			return {
				abook,
				files,
			}
		} finally {
			access.release()
		}
	})

	const { files }: Res =
		result.data ??
		throwExpression(new Error("unreachable code; uses suspense"))

	const entries: FileTransferEntry[] = useMemo(
		() =>
			files.map((f) => ({
				publicName:
					f instanceof File ? f.name : "File #" + generateUUID(),
				file: f,
			})),
		[files]
	)

	return (
		<SenderContextProvider entries={entries}>
			{/* TODO(teawithsand): show some summary here of files that are about to be sent */}
		</SenderContextProvider>
	)
}

const AbookRemoteSendFilesPage = () => {
	return (
		<PageContainer title="Send ABook's files to remote device">
			<InnerPage />
		</PageContainer>
	)
}

export default wrapNoSSR(wrapLocationProvider(AbookRemoteSendFilesPage))
