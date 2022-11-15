import { ConstSizeNumber } from "@app/components/util/ConstSizeNumber"
import { List } from "@app/components/util/List"
import { FileEntry } from "@app/domain/defines/abookFile"
import { makeFileEntryShowData } from "@app/domain/defines/fileEntryShowData"
import { useAppTranslationSelector } from "@app/trans/AppTranslation"
import {
	formatDurationSeconds,
	formatFileSize,
	generateUUID,
} from "@teawithsand/tws-stl"
import { Sortable } from "@teawithsand/tws-ui"
import React, { useMemo } from "react"
import styled from "styled-components"

const Parent = styled(List)``

const OuterContainer = styled.li`
	display: grid;
	grid-template-columns: min-content auto;
	grid-template-rows: 1fr 1fr;
	grid-auto-flow: row;

	column-gap: 1ex;
`

const OrdinalNumber = styled.div`
	word-break: keep-all;
	white-space: nowrap;

	height: 100%;
	width: 100%;

	grid-row: 1 / 3;

	display: grid;
	justify-items: center;
	align-items: center;
	padding-left: 0.3em;
`

const TopInfo = styled.div`
	grid-row: 1;
	grid-column: 2;
`

const BottomInfo = styled.div`
	font-size: 0.9em;
	opacity: 0.75;

	grid-row: 2;
	grid-column: 2;
`

const AbookFileEntryDisplay = (props: {
	entry: FileEntry
	index: number
	length: number
	onRef?: any
	isDragging?: boolean
}) => {
	const { entry } = props

	const showData = makeFileEntryShowData(entry)
	const trans = useAppTranslationSelector((s) => s.abook)

	return (
		<OuterContainer
			ref={props.onRef}
			style={{
				filter: props.isDragging ? "blur(5px)" : "none",
			}}
		>
			<OrdinalNumber>
				<ConstSizeNumber n={props.index + 1} maxNumber={props.length} />
			</OrdinalNumber>
			<TopInfo>{showData.name}</TopInfo>
			<BottomInfo>
				{trans.formatFileEntryDisposition(showData.fileDisposition)}{" "}
				{showData.size !== null && showData.size >= 0
					? formatFileSize(showData.size)
					: null}{" "}
				{(showData.musicMetadata?.duration ?? -1) >= 0
					? formatDurationSeconds(
							showData.musicMetadata?.duration ?? -1
					  )
					: null}
			</BottomInfo>
		</OuterContainer>
	)
}

export const AbookFileList = (props: {
	entries: FileEntry[]
	onEntriesReorder?: undefined | ((newEntries: FileEntry[]) => void)
	onEntryDeleteConfirmed?: (e: FileEntry, i: number) => void
}) => {
	const { entries, onEntriesReorder } = props

	const id = useMemo(
		() => "palm-abooks-pwa/abook-file-list-dnd/" + generateUUID(),
		[]
	)

	if (onEntriesReorder) {
		return (
			<Sortable
				elements={entries}
				onElementsChange={(newElements) => {
					onEntriesReorder(newElements)
				}}
				dragAndDropDataIdentifier={id}
				renderParent={(props) => {
					return <Parent {...props} />
				}}
				renderElement={(props) => {
					const { item, index, isDragging, onRef } = props
					return (
						<AbookFileEntryDisplay
							onRef={onRef}
							entry={item}
							index={index}
							isDragging={isDragging}
							length={entries.length}
						/>
					)
				}}
			/>
		)
	} else {
		return (
			<Parent>
				{entries.map((item, index) => (
					<AbookFileEntryDisplay
						entry={item}
						index={index}
						length={entries.length}
					/>
				))}
			</Parent>
		)
	}
}
