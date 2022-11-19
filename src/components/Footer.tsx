import React from "react"
import styled from "styled-components"

const FooterBar = styled.footer`
	padding-top: 3em;
	padding-bottom: 3em;
`

export const Footer = (props: {
	className?: string
	style?: React.CSSProperties
}) => {
	return <FooterBar {...props}></FooterBar>
}
