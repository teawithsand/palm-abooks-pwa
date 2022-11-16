import { strippedListStyles } from "@app/components/util/List"
import { Abook } from "@app/domain/defines/abook"
import { useAppManager } from "@app/domain/managers/app"
import { useAppPaths } from "@app/paths"
import { navigate } from "gatsby"
import produce from "immer"
import React, { useMemo } from "react"
import { Button, Form } from "react-bootstrap"
import { Field as FinalField, Form as FinalForm } from "react-final-form"
import styled from "styled-components"

const List = styled.div`
	display: grid;
	grid-auto-flow: row;
	grid-template-columns: min-content auto;

	${strippedListStyles(".3em")}
`

const Row = styled.div`
	display: grid;

	grid-template-columns: auto auto;
	grid-template-columns: subgrid;
	grid-template-rows: auto;
	grid-column: span 2;

	gap: 0;

	> *:nth-child(1) {
		grid-column: 1;
		padding: 0.3em;
	}

	> *:nth-child(2) {
		grid-column: 2;
		padding: 0.3em;
	}
`

export const AbookEntriesDelete = (props: { abook: Abook }) => {
	// TODO(teawithsand): prevent concurrent modification of same abook.
	//  add some kind of barrier component, which utilizes weblocks

	const { abook } = props
	const app = useAppManager()
	const { abookShowPath } = useAppPaths()

	const initialValues = useMemo(
		() => abook.entries.map((v) => false),
		[abook.entries.length]
	)

	return (
		<FinalForm<{
			entriesDeletion: boolean[]
		}>
			initialValues={{
				entriesDeletion: initialValues,
			}}
			onSubmit={async (values) => {
				if (values.entriesDeletion.length !== abook.entries.length)
					return

				const access = await app.abookDb.abookWriteAccess(abook.id)
				try {
					const indexes = values.entriesDeletion
						.map((v, i) => ({
							v,
							i,
						}))
						.filter(({ v }) => v)
						.map(({ i }) => i)

					await access.dropFileEntries(...indexes)
				} finally {
					access.release()
				}

				navigate(abookShowPath(abook.id))
			}}
			render={({ handleSubmit }) => (
				<Form onSubmit={handleSubmit}>
					<List>
						<FinalField<boolean[]> name={"entriesDeletion"}>
							{({ input }) => {
								return input.value.map((v, i) => {
									const entry = abook.entries[i]
									return (
										<Row key={i}>
											<Form.Check
												checked={!!v}
												{...{
													...input,
													value: undefined,
													type: undefined,

													onChange: (v) => {
														input.onChange(
															produce(
																input.value,
																(draft) => {
																	draft[i] =
																		v.target.checked
																}
															)
														)
													},
												}}
											/>
											<div>{entry.metadata.name}</div>
										</Row>
									)
								})
							}}
						</FinalField>
					</List>
					<Button
						variant="danger"
						type="submit"
						className="mt-3 w-100"
					>
						Delete checked entries
					</Button>
				</Form>
			)}
		/>
	)
}
