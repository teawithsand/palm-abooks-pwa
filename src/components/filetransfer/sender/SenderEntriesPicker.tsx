import { AppLoadingBoundary } from "@app/components/boundary/loading"
import { FilesFinalField } from "@app/components/util/FilesFinalField"
import {
	useFileTransferStateManager,
	useSenderStateManager,
} from "@app/domain/filetransfer"
import { useQueryAbookList } from "@app/domain/storage/queries/abook"
import { useStickySubscribableSelector } from "@teawithsand/tws-stl-react"
import arrayMutators from "final-form-arrays"
import React, { useEffect, useMemo, useState } from "react"
import { Button, ButtonGroup, Form } from "react-bootstrap"
import { Form as FinalForm, useForm, useFormState } from "react-final-form"
import styled from "styled-components"

const Container = styled.div`
	display: grid;
	grid-auto-flow: row;
	gap: 1em;
`

type AbookFormAddFilesData = {
	files: File[]
}

// HACK: submits form each time it's value changes, so user always has latest
// files pushed to senderStateManager
const Hook = () => {
	const form = useForm()
	const state = useFormState()

	useEffect(() => {
		form.submit()
	}, [state?.values, form])

	return <></>
}

const LocalFSEntriesPicker = () => {
	const senderStateManager = useSenderStateManager()
	const initialValues: AbookFormAddFilesData = useMemo(
		() => ({
			files: [],
		}),
		[]
	)

	return (
		<div>
			<FinalForm<AbookFormAddFilesData>
				onSubmit={(values: AbookFormAddFilesData) => {
					senderStateManager.setFileTransferData({
						entries: (values?.files ?? [])?.map((v) => ({
							file: v,
							publicName: v.name,
						})),
						untypedHeader: undefined,
					})
				}}
				mutators={{
					...arrayMutators,
				}}
				initialValues={initialValues}
				render={({ handleSubmit, submitting, pristine }) => (
					<Form onSubmit={handleSubmit}>
						<Hook />
						<FilesFinalField name="files" />
					</Form>
				)}
			/>
		</div>
	)
}

const ABookEntriesPicker = () => {
	const abooks = useQueryAbookList()

	return <div>NIY ABook entries picker here</div>
}

const SourcePickerRow = styled.div`
	display: flex;
	flex-flow: row wrap;
	align-items: center;
	gap: 1em;
`

const PickSourceInfo = styled.div`
	align-self: center;
	font-size: 1.15em;
`

export const SenderEntriesPicker = () => {
	const [pickerId, setPickerId] = useState(0)

	return (
		<Container>
			<SourcePickerRow>
				<PickSourceInfo>Source:</PickSourceInfo>
				<ButtonGroup>
					<Button
						onClick={() => {
							setPickerId(0)
						}}
					>
						Local device
					</Button>
					{/*
					// Hidden till implemented
				<Button
					onClick={() => {
						setPickerId(1)
					}}
				>
					From ABook
				</Button>
				*/}
				</ButtonGroup>
			</SourcePickerRow>
			<AppLoadingBoundary>
				{!pickerId ? <LocalFSEntriesPicker /> : <ABookEntriesPicker />}
			</AppLoadingBoundary>
		</Container>
	)
}
