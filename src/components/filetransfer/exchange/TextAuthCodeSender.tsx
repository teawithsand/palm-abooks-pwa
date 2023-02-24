import {
	FileTransferTokenData,
	encodeFileTransferTokenData,
} from "@app/domain/filetransfer"
import { isSsr } from "@teawithsand/tws-stl-react"
import React, { useMemo, useState } from "react"
import { Alert, Button } from "react-bootstrap"
import styled from "styled-components"

const TokenField = styled.div`
	font-weight: bold;
	max-width: 100%;

	white-space: break-all;
	word-break: break-all;

	margin-top: 0.3em;
	margin-bottom: 0.3em;
`

const CopyButton = styled(Button)`
	width: 100%;
`

const CopiedText = styled.div`
	margin-top: 0.5em;
	font-size: 1.2em;
	font-weight: bold;
`

const isClipboardSupported = !isSsr() && "clipboard" in window.navigator

export const TextAuthCodeSender = (props: { token: FileTransferTokenData }) => {
	const { token } = props
	const encodedToken = useMemo(
		() => encodeFileTransferTokenData(token),
		[token]
	)

	const [copiedText, setCopiedText] = useState("")

	return (
		<Alert variant="info">
			<h4>Copy the following token onto receiving device:</h4>
			<TokenField>{encodedToken}</TokenField>
			{isClipboardSupported ? (
				<CopyButton
					onClick={() => {
						navigator.clipboard
							.writeText(encodedToken)
							.then(() => {
								setCopiedText(
									"Token copied! Now paste it on other device."
								)
							})
							.catch(() => {
								// ignore
							})
					}}
				>
					Copy code
				</CopyButton>
			) : null}
			<CopiedText>{copiedText}</CopiedText>
		</Alert>
	)
}
