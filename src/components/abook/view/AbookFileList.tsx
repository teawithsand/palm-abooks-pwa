import { FileEntry } from "@app/domain/defines/abookFile"
import { generateUUID } from "@teawithsand/tws-stl"
import { Sortable } from "@teawithsand/tws-ui"
import React, { useMemo } from "react"
import styled from "styled-components"

const Parent = styled.ul`
	display: grid;
	grid-auto-flow: row;
	gap: 1em;

	padding: 0;
	margin: 0;
	list-style-type: none;
`

const Item = styled.div`
	width: 100%;
	padding: 0.5em;
`

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
						<Item
							ref={onRef}
							style={{
								filter: isDragging ? "blur(5px)" : "none",
							}}
						>
							#{index + 1} - {item.id}
						</Item>
					)
				}}
			/>
		)
	} else {
		return (
			<Parent>
				{entries.map((item, index) => (
					<Item key={index}>
						#{index + 1} - {item.id}
					</Item>
				))}
			</Parent>
		)
	}
}
