import { AbookLocalCreate } from "@app/components/abook/edit/AbookLocalCreate"
import { AbookFormCreate } from "@app/components/abook/form/create"
import { PageContainer } from "@app/components/PageContainer"
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
import { wrapLocationProvider } from "@app/util/useLocation"
import {
	DefaultMetadataLoader,
	MetadataLoadingResult,
	MetadataLoadingResultType,
} from "@teawithsand/tws-player"
import {
	generateUUID,
	getNowTimestamp,
	TimestampMs,
} from "@teawithsand/tws-stl"
import { wrapNoSSR } from "@teawithsand/tws-stl-react"
import React from "react"

const AddLocalAbookPage = () => {
	const navigate = useNavigate()
	const { abookShowPath } = useAppPaths()
	const app = useAppManager()

	return (
		<PageContainer title="Add Abook from local device">
			<AbookLocalCreate />
		</PageContainer>
	)
}

export default wrapNoSSR(wrapLocationProvider(AddLocalAbookPage))
