import { AbookFormCreate } from "@app/components/abook/form/create"
import {
	FileEntryDisposition,
	FileEntryType,
} from "@app/domain/defines/abookFile"
import { AbookEntity, AbookEntityData } from "@app/domain/defines/entity/abook"
import {
	FileEntryEntity,
	FileEntryEntityData,
} from "@app/domain/defines/entity/fileEntry"
import { useAppManager } from "@app/domain/managers/app"
import { guessFileDisposition } from "@app/domain/storage/disposition"
import { useMutationAbookAddFiles } from "@app/domain/storage/mutations/abookAddFiles"
import { useAppPaths } from "@app/paths"
import { useNavigate } from "@app/util/navigate"
import {
	DefaultMetadataLoader,
	MetadataLoadingResult,
	MetadataLoadingResultType,
} from "@teawithsand/tws-player"
import {
	TimestampMs,
	generateUUID,
	getNowTimestamp,
} from "@teawithsand/tws-stl"
import React from "react"

// TODO(teawithsand): unify that creation procedure; make it part of abook write access maybe

export const AbookLocalCreate = () => {
	const navigate = useNavigate()
	const { abookShowPath } = useAppPaths()
	const app = useAppManager()

	const mutation = useMutationAbookAddFiles()

	return (
		<AbookFormCreate
			onSubmit={async (data) => {
				const id = generateUUID()

				const abook: AbookEntityData = {
					id,
					position: null,

					addedAt: getNowTimestamp(),
					authorName: data.author,
					title: data.title,
					description: data.description,
					lastPlayedAt: 0 as TimestampMs,
					publishedYear: 0,

					entries: [],
				}

				const entity = new AbookEntity(abook)
				await app.abookDb.createAbook(entity)
				await mutation.mutateAsync({
					abook: entity,
					files: data.files,
				})

				navigate(abookShowPath(id))
			}}
		/>
	)
}
