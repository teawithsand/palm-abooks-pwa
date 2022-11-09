import { Navbar } from "@app/components/Navbar"
import {
	DialogBoundary,
	ErrorBoundary,
	LoadingSpinner,
} from "@teawithsand/tws-stl-react"
import { ProvideFixedLanguage } from "@teawithsand/tws-trans"
import React, { ReactNode, Suspense } from "react"
import { Container } from "react-bootstrap"
import styled from "styled-components"

const PageBody = (props: { children?: ReactNode }) => {
	return (
		<>
			<Navbar />
			{props.children}
		</>
	)
}

export type PageContainerOptions = {
	container?: boolean
	title: string
}

const PageTitle = styled.h1`
	margin-top: 1.5em;
	text-align: center;
`
export const PageContainer = (props: {
	children?: ReactNode
	options?: PageContainerOptions
}) => {
	const { options } = props

	let inner = props.children
	if (options) {
		inner = options.title ? (
			<>
				<PageTitle>{options.title}</PageTitle>
				<div>{inner}</div>
			</>
		) : (
			inner
		)
		inner =
			options.container ?? true ? <Container>{inner}</Container> : inner
	}

	return (
		<>
			<ProvideFixedLanguage language="en-US">
				<DialogBoundary>
					<PageBody>
						<ErrorBoundary fallback={<>An error occurred</>}>
							<Suspense fallback={<>Loading...</>}>
								{inner}
							</Suspense>
						</ErrorBoundary>
					</PageBody>
				</DialogBoundary>
			</ProvideFixedLanguage>
		</>
	)
}
