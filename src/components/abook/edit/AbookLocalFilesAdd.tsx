import { AbookFormAddFiles } from "@app/components/abook/form/addFiles"
import {
	FileEntryDisposition,
	FileEntryType,
} from "@app/domain/defines/abookFile"
import { AbookEntity } from "@app/domain/defines/entity/abook"
import {
	FileEntryEntity,
	FileEntryEntityData,
} from "@app/domain/defines/entity/fileEntry"
import { useAppManager } from "@app/domain/managers/app"
import { FilePlayerSourceResolver } from "@app/domain/managers/resolver"
import { guessFileDisposition } from "@app/domain/storage/disposition"
import { useMutationAbookAddFiles } from "@app/domain/storage/mutations/abookAddFiles"
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

export const AbookLocalFilesAdd = (props: { abook: AbookEntity }) => {
	const { abook } = props
	const { abookShowPath } = useAppPaths()
	const navigate = useNavigate()
	const mutation = useMutationAbookAddFiles()

	return (
		<Grid>
			<AbookFormAddFiles
				onSubmit={async (data) => {
					await mutation.mutateAsync({
						abook,
						files: data.files,
					})

					navigate(abookShowPath(abook.id))
				}}
			/>
		</Grid>
	)
}
