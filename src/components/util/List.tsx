import React from "react"
import styled, { css } from "styled-components"

type ParentProps = {
	$spacing: string | undefined
}

export const strippedListStyles = (paddingTopBottom = "") => css`
	> *:nth-child(2n) {
		background-color: rgba(0, 0, 0, 0.125);
	}

	border: 1px solid rgba(0, 0, 0, 0.125);
	border-radius: 5px;

	> * {
		padding-top: ${paddingTopBottom};
		padding-bottom: ${paddingTopBottom};
	}
	> *:first-child {
		padding-top: 0;
	}
	> *:last-child {
		padding-bottom: 0;
	}
`

const Parent = styled.ol<ParentProps>`
	padding: 0;
	margin: 0;
	list-style-type: none;

	display: grid;
	grid-auto-flow: row;
	grid-template-rows: 1fr;

	> *:nth-child(2n) {
		background-color: rgba(0, 0, 0, 0.125);
	}

	border: 1px solid rgba(0, 0, 0, 0.125);
	border-radius: 5px;

	> * {
		padding-top: ${({ $spacing }) => $spacing};
		padding-bottom: ${({ $spacing }) => $spacing};
	}
	> *:first-child {
		padding-top: 0;
	}
	> *:last-child {
		padding-bottom: 0;
	}
`

export const List = (props: {
	children: React.ReactNode
	className?: string
	style?: React.CSSProperties

	rowPaddingTopBottom?: string | undefined
}) => {
	return (
		<Parent
			className={props.className}
			style={props.style}
			$spacing={props.rowPaddingTopBottom}
		>
			{props.children}
		</Parent>
	)
}
