import {
	FileTransferTokenData,
	decodeFileTransferTokenData,
} from "@app/domain/filetransfer"
import { QRCodeScanner } from "@teawithsand/tws-peer-react"
import React, { useCallback, useMemo, useState } from "react"
import styled from "styled-components"

const Container = styled.div``

export const QRAuthCodeReceiver = (props: {
	onToken: (token: FileTransferTokenData) => void
}) => {
	const { onToken } = props
	const [lastResultText, setLastResultText] = useState("")

	const onSuccess = useCallback(
		(text: string): void => {
			let token: FileTransferTokenData | null = null
			try {
				token = decodeFileTransferTokenData(text)
			} catch (e) {
				setLastResultText("Not a token!")
			}

			if (token) {
				onToken(token)
			}
		},
		[onToken, setLastResultText]
	)

	const config = useMemo(() => ({
		fps: 30,
	}), [])

	const onFailure = useCallback((errorMessage: string) => {
		setLastResultText(errorMessage)
	}, [setLastResultText])

	return (
		<Container>
			<QRCodeScanner
				onScanSuccess={onSuccess}
				onScanFailure={onFailure}
				config={config}
			/>
			{lastResultText ? <p>{lastResultText}</p> : null}
		</Container>
	)
}
