import { AbookFormAddFiles } from "@app/components/abook/form/addFiles"
import { Abook } from "@app/domain/defines/abook"
import {
	FileEntry,
	FileEntryDisposition,
	FileEntryType,
} from "@app/domain/defines/abookFile"
import { useAppManager } from "@app/domain/managers/app"
import { FilePlayerSourceResolver } from "@app/domain/managers/resolver"
import { guessFileDisposition } from "@app/domain/storage/disposition"
import { useAppPaths } from "@app/paths"
import { useNavigate } from "@app/util/navigate"
import {
	DefaultMetadataLoader,
	MetadataLoadingResult,
	MetadataLoadingResultType,
} from "@teawithsand/tws-player"
import { generateUUID } from "@teawithsand/tws-stl"
import React from "react"
import styled from "styled-components"

const Grid = styled.div`
	display: grid;
	grid-auto-flow: row;
	gap: 1em;
`

export const AbookLocalFilesAdd = (props: { abook: Abook }) => {
	const { abook } = props
	const { abookShowPath } = useAppPaths()
	const navigate = useNavigate()
	const app = useAppManager()

	return (
		<Grid>
			<AbookFormAddFiles
				onSubmit={async (data) => {
					const loader = new DefaultMetadataLoader(
						new FilePlayerSourceResolver()
					)

					const metadataMap: Map<number, MetadataLoadingResult> =
						new Map()

					let i = 0
					for (const f of data.files) {
						try {
							if (
								guessFileDisposition(f) !==
								FileEntryDisposition.MUSIC
							)
								continue

							let result: MetadataLoadingResult
							try {
								const metadata = await loader.loadMetadata(f)
								result = {
									type: MetadataLoadingResultType.OK,
									metadata,
								}
							} catch (e) {
								result = {
									type: MetadataLoadingResultType.ERROR,
									error: String(e) || "Unknown error",
								}
							}

							metadataMap.set(i, result)
						} finally {
							i++
						}
					}

					const abookAccess = await app.abookDb.abookWriteAccess(
						abook.id
					)

					try {
						let i = 0
						for (const f of data.files) {
							try {
								await abookAccess.addInternalFile(
									f,
									(draft, newFileId) => {
										const entry: FileEntry = {
											id: generateUUID(),
											metadata: {
												name: f.name,
												mime: f.type,
												size: f.size,
												disposition: null, // this is for overrides, by default use dynamic disposition
												musicMetadata:
													metadataMap.get(i) ?? null,
											},
											data: {
												dataType:
													FileEntryType.INTERNAL_FILE,
												internalFileId: newFileId,
											},
										}

										draft.entries.push(entry)
									}
								)
							} finally {
								i++
							}
						}
					} finally {
						abookAccess.release()
					}false

					navigate(abookShowPath(abook.id))
				}}
			/>
		</Grid>
	)
}
