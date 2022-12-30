import {
	PlayerSeekAction,
	PlayerSeekActionType,
} from "@app/domain/defines/player/action"
import styled from "styled-components"
import React from "react"
import { Form } from "react-bootstrap"
import { isTimeNumber } from "@teawithsand/tws-player"
const Container = styled.div``

export const PlayerSeekActionPicker = (props: {
	value: PlayerSeekAction
	onChange?: (value: PlayerSeekAction) => void
	defaultSeekTimeMillis?: number
}) => {
	const { value, onChange, defaultSeekTimeMillis = 10000 } = props
	return (
		<Container>
			<Form.Select
				className="mb-3"
				value={value.type}
				onChange={(e) => {
					if (onChange) {
						if (
							parseInt(e.target.value) ==
							PlayerSeekActionType.JUMP_FILE
						) {
							onChange({
								type: PlayerSeekActionType.JUMP_FILE,
							})
						} else if (
							parseInt(e.target.value) ==
							PlayerSeekActionType.SEEK_RELATIVE
						) {
							onChange({
								type: PlayerSeekActionType.SEEK_RELATIVE,
								offsetMillis: defaultSeekTimeMillis,
							})
						}
					}
				}}
			>
				<option value={PlayerSeekActionType.JUMP_FILE}>
					Switch file
				</option>
				<option value={PlayerSeekActionType.SEEK_RELATIVE}>
					Execute jump
				</option>
			</Form.Select>
			{value.type === PlayerSeekActionType.SEEK_RELATIVE ? (
				<Form.Label>
					Jump time in seconds
					<Form.Control
						value={value.offsetMillis / 1000}
						type="number"
						onChange={(e) => {
							if (onChange) {
								const value = parseInt(e.target.value)
								if (value < 0 || !isTimeNumber(value)) return

								onChange({
									type: PlayerSeekActionType.SEEK_RELATIVE,
									offsetMillis: value * 1000,
								})
							}
						}}
					/>
				</Form.Label>
			) : null}
		</Container>
	)
}
