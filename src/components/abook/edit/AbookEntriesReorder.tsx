import { AbookFileList } from "@app/components/abook/view/AbookFileList"
import { Abook } from "@app/domain/defines/abook"
import { FileEntry } from "@app/domain/defines/abookFile"
import { useAppManager } from "@app/domain/managers/app"
import { useAppPaths } from "@app/paths"
import { useNavigate } from "@app/util/navigate"
import React, { useRef, useState } from "react"
import { Button, Form } from "react-bootstrap"
import { Form as FinalForm } from "react-final-form"
import styled from "styled-components"

const Grid = styled.div`
	display: grid;
	grid-auto-flow: row;
	gap: 1em;
`

const MyForm = styled(Form)`
	display: grid;
	grid-auto-flow: row;
	gap: 1em;
`

export const AbookEntriesReorder = (props: { abook: Abook }) => {
	// TODO(teawithsand): prevent concurrent modification of same abook.
	//  add some kind of barrier component, which utilizes web locks

	const { abook } = props
	const { abookShowPath } = useAppPaths()
	const navigate = useNavigate()
	const app = useAppManager()

	const submitted = useRef(false)

	const [reorderedEntries, setReorderedEntries] = useState<
		FileEntry[] | null
	>(null)

	return (
		<Grid>
			<FinalForm
				onSubmit={async (values: any) => {
					if (
						!reorderedEntries ||
						reorderedEntries.length !== abook.entries.length
					)
						return

					const access = await app.abookDb.abookWriteAccess(abook.id)
					try {
						await access.update((draft) => {
							draft.entries = reorderedEntries
						})
					} finally {
						access.release()
					}

					navigate(abookShowPath(abook.id))
				}}
				render={({ handleSubmit }) => (
					<MyForm onSubmit={handleSubmit}>
						<AbookFileList
							entries={reorderedEntries ?? abook.entries}
							onEntriesReorder={setReorderedEntries}
						/>
						<Button
							disabled={
								!reorderedEntries ||
								reorderedEntries.length === 0
							}
							type="submit"
						>
							Submit
						</Button>
					</MyForm>
				)}
			/>
		</Grid>
	)
}
