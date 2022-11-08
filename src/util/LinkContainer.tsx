// Adopted from
// https://github.com/react-bootstrap/react-router-bootstrap/blob/master/src/LinkContainer.js
// for
// Adopted from
// https://github.com/react-bootstrap/react-router-bootstrap/blob/master/src/LinkContainer.js
import { useNavigate } from "@app/util/navigate"
import React from "react"

const isModifiedEvent = (event: any) =>
	!!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)

export const LinkContainer = (props: {
	children: any
	className?: string
	to: string
	style?: React.CSSProperties
	replace?: boolean
}) => {
	const navigate = useNavigate()

	const { to, style, className, children, replace, ...other } = props
	const child = React.Children.only(children)
	const isActive = false

	const handleClick = (event: React.MouseEvent<HTMLElement>) => {
		if (children.props.onClick) {
			children.props.onClick(event)
		} else {
			if (
				!event.defaultPrevented &&
				event.button === 0 &&
				!isModifiedEvent(event)
			) {
				event.preventDefault()

				navigate(to)
			}
		}
	}

	return React.cloneElement(child, {
		...other,
		className: [className, child.props.className].join(" ").trim(),
		...(style ? { style } : {}), // makes sure styles aren't overridden if they are not set in parent
		href: to,
		onClick: handleClick,
	})
}
