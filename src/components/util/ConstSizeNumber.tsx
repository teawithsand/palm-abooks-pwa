import React from "react"
import styled from "styled-components"

const InvisibleInline = styled.span`
	display: inline;
	visibility: hidden;
	opacity: 0;
`

/**
 * Util, which creates number, which has constant size.
 */
export const ConstSizeNumber = (
	props: {
		n: number
	} & (
		| {
				maxNumber: number
				targetLength?: undefined
		  }
		| {
				maxNumber?: undefined
				targetLength: number
		  }
	)
) => {
	const targetLength = props.targetLength ?? props.maxNumber.toString().length
	// Hack: calculate padding for these entries, so that we
	// do not have to use grid or table to have numbers in list aligned
	const padding = "0".repeat(
		Math.max(targetLength.toString().length - props.n.toString().length, 0)
	)

	return (
		<>
			{props.n}
			<InvisibleInline>{padding}</InvisibleInline>
		</>
	)
}
