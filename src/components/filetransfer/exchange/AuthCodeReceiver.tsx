import {
	FileTransferTokenData,
	decodeFileTransferTokenData,
	encodeFileTransferTokenData,
} from "@app/domain/filetransfer"
import { QRCodeDisplay, QRCodeScanner } from "@teawithsand/tws-peer-react"
import React, { useCallback, useMemo, useState } from "react"
import styled from "styled-components"

const Container = styled.div``

export const AuthCodeReceiver = (props: {
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

	return (
		<Container>
			<QRCodeScanner
				onScanSuccess={onSuccess}
				onScanFailure={(errorMessage, error) => {
					setLastResultText(errorMessage)
				}}
			/>
			{lastResultText ? <p>{lastResultText}</p> : null}
		</Container>
	)
}
