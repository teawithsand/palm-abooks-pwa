import {
	FileTransferTokenData,
	encodeFileTransferTokenData,
} from "@app/domain/filetransfer"
import { QRCodeDisplay } from "@teawithsand/tws-peer-react"
import React, { useMemo } from "react"
import styled from "styled-components"

const Container = styled.div``

export const AuthCodeSender = (props: { token: FileTransferTokenData }) => {
	const { token } = props
	const encoded = useMemo(() => encodeFileTransferTokenData(token), [token])

	return (
		<Container>
			<QRCodeDisplay data={encoded} width={200} height={200} />
		</Container>
	)
}
