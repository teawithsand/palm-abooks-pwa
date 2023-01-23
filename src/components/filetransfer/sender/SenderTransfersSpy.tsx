import { FileSender } from "@app/domain/filetransfer"
import { useStickySubscribable } from "@teawithsand/tws-stl-react"
import React, { useMemo } from "react"
import styled from "styled-components"

const Container = styled.ul``

export const SenderTransfersSpy = (props: { sender: FileSender }) => {
	const { sender } = props
	const transfers = useStickySubscribable(sender.stateBus).transfers

	const transfersArray = useMemo(
		() => [...Object.values(transfers)],
		[transfers]
	)

	return (
		<Container>
			{transfersArray.map((v, i) => (
				<li key={i}>
					Pending transfer:
					<br />
					Id: {v.id} Closed: {v.isClosed}
					Progress: {v.totalFraction}
				</li>
			))}
		</Container>
	)
}
