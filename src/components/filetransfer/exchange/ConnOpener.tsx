import { TextAuthCodeSender } from "@app/components/filetransfer/exchange/TextAuthCodeSender"
import { QRAuthCodeReceiver } from "@app/components/filetransfer/exchange/QRAuthCodeReceiver"
import { QRAuthCodeSender } from "@app/components/filetransfer/exchange/QRAuthCodeSender"
import { TextAuthCodeReceiver } from "@app/components/filetransfer/exchange/TextAuthCodeReceiver"
import { FileTransferTokenData } from "@app/domain/filetransfer"
import React, { useRef, useState } from "react"
import { Alert, Form } from "react-bootstrap"
import styled from "styled-components"

enum State {
	PICK = 1,
	SHOW_CODE = 2,
	SHOW_QR = 3,
	ENTER_CODE = 4,
	SCAN_QR = 5,
}

const Container = styled.div``

const DisplayContainer = styled.div`
	margin-top: 1em;
`

export const ConnOpener = (props: {
	disabled?: boolean
	token: FileTransferTokenData
	onToken: (token: FileTransferTokenData) => Promise<void>
}) => {
	const { token, onToken: innerOnToken, disabled } = props
	const [state, setState] = useState<State>(State.PICK)
	const runningCtrRef = useRef(0)
	const [runningCtr, setRunningCtr] = useState(0)
	let innerDisplay = null

	const onToken = (token: FileTransferTokenData) => {
		setState(State.PICK)

		runningCtrRef.current++
		setRunningCtr(runningCtrRef.current)

		innerOnToken(token).finally(() => {
			runningCtrRef.current--
			setRunningCtr(runningCtrRef.current)
		})
	}

	if (state === State.SHOW_QR) {
		innerDisplay = <QRAuthCodeSender token={token} />
	} else if (state === State.SHOW_CODE) {
		innerDisplay = <TextAuthCodeSender token={token} />
	} else if (state === State.ENTER_CODE) {
		innerDisplay = <TextAuthCodeReceiver onToken={onToken} />
	} else if (state === State.SCAN_QR) {
		innerDisplay = <QRAuthCodeReceiver onToken={onToken} />
	} else {
		innerDisplay = (
			<Alert variant="info">
				Pick some code exchange method in order to connect to remote
				device.
			</Alert>
		)
	}

	if (disabled) {
		return (
			<Container>
				<Alert variant="info">
					Please start client using button above before exchanging
					code
				</Alert>
			</Container>
		)
	}

	return (
		<Container>
			<Form.Select
				value={state}
				onChange={(e) => {
					// ignore changes if promise till conn open is pending.
					// TODO(teawithsand): Please note that some info should be shown
					if (runningCtr) return

					setState(parseInt(e.target.value) || State.PICK)
				}}
			>
				<option value={State.PICK}>Pick connect method</option>
				<option value={State.SHOW_CODE}>Show code</option>
				<option value={State.SHOW_QR}>Show QR</option>
				<option value={State.ENTER_CODE}>Enter code</option>
				<option value={State.SCAN_QR}>Scan QR</option>
			</Form.Select>
			<DisplayContainer>{innerDisplay}</DisplayContainer>
		</Container>
	)
}
