import {
	FileTransferTokenData,
	decodeFileTransferTokenData,
} from "@app/domain/filetransfer"
import React, { useState } from "react"
import { Button, FloatingLabel, Form } from "react-bootstrap"
import styled from "styled-components"

const Container = styled.div``

export const TextAuthCodeReceiver = (props: {
	onToken: (token: FileTransferTokenData) => void
}) => {
	const { onToken } = props
	const [lastResultText, setLastResultText] = useState("")
	const [value, setValue] = useState("")

	return (
		<Container>
			<FloatingLabel label="Enter token from remote device">
				<Form.Control
					type="input"
					value={value}
					onChange={(e) => {
						const newValue = e.target.value.replace(/[ \s]*/g, "")
						setValue(newValue)

						try {
							decodeFileTransferTokenData(newValue)
						} catch (e) {
							setLastResultText("Token provided is not valid")
							return
						}
						setLastResultText("Provided token is valid")
					}}
				/>
			</FloatingLabel>
			<p>{lastResultText}</p>
			<Button
				onClick={() => {
					let tokenData: FileTransferTokenData | null = null

					try {
						tokenData = decodeFileTransferTokenData(value)
					} catch (e) {
						return
					}
					if (onToken) onToken(tokenData)
					setValue("")
				}}
			>
				Connect
			</Button>
		</Container>
	)
}
