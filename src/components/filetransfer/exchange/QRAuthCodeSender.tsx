import {
	FileTransferTokenData,
	encodeFileTransferTokenData,
} from "@app/domain/filetransfer"
import { QRCodeDisplay } from "@teawithsand/tws-peer-react"
import React, { useEffect, useMemo, useState } from "react"
import styled from "styled-components"

const Container = styled.div`
	display: grid;
	grid-auto-flow: column;
	align-items: center;
	justify-items: center;
`

const Display = styled(QRCodeDisplay)`
	max-height: 80vh;
	max-width: 80vw;
`

export const QRAuthCodeSender = (props: { token: FileTransferTokenData }) => {
	const { token } = props
	const encoded = useMemo(() => encodeFileTransferTokenData(token), [token])

	// Sets size of QR code displayed on the screen
	const computeDimensions = () =>
		Math.round(Math.min(window.innerHeight, window.innerWidth) * 0.8)

	const [dimension, setDimension] = useState(100)

	useEffect(() => {
		const listener = () => {
			setDimension(computeDimensions())
		}
		listener()
		window.addEventListener("resize", listener)

		return () => {
			window.removeEventListener("resize", listener)
		}
	}, [setDimension])

	return (
		<Container>
			<Display data={encoded} width={dimension} height={dimension} />
		</Container>
	)
}
