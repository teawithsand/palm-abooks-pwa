import { Footer } from "@app/components/Footer"
import { Navbar } from "@app/components/Navbar"
import {
	DialogBoundary,
	ErrorBoundary,
	LoadingSpinner,
} from "@teawithsand/tws-stl-react"
import { ProvideFixedLanguage } from "@teawithsand/tws-trans"
import React, { ReactNode, Suspense } from "react"
import { Container } from "react-bootstrap"
import styled, { createGlobalStyle, css } from "styled-components"

type OutermostContainerProps = {
	$isFixedHeight: boolean
	$hasTitle: boolean
}

const OuterPageContainer = styled.div<OutermostContainerProps>`
	display: grid;
	grid-auto-flow: row;
	grid-template-rows:
		[r-navbar] auto [r-title] auto [r-content] ${({ $isFixedHeight }) =>
			$isFixedHeight ? "minmax(0, auto)" : "auto"}
		[r-footer] auto;

	${({ $isFixedHeight }) =>
		$isFixedHeight
			? css`
					height: 100vh;
					width: 100vw;
					overflow: hidden;
			  `
			: ""}
`

const PageNavbar = styled(Navbar)`
	grid-row: r-navbar;
`

const PageTitle = styled.h1`
	grid-row: r-title;

	margin-top: 1.5em;
	text-align: center;
`

const PageFooter = styled(Footer)`
	grid-row: r-footer;

	height: min-content;
`

const InnerPageContainer = styled(Container)`
	grid-row: r-content;
`

const PageBody = (props: {
	children?: ReactNode
	title?: string
	hasContainer?: boolean
	isFixedHeight?: boolean
	hasFooter?: boolean
	hasNavbar?: boolean
}) => {
	return (
		<OuterPageContainer
			$isFixedHeight={!!props.isFixedHeight}
			$hasTitle={!!props.title}
		>
			{props.hasNavbar ? <PageNavbar /> : null}
			{!!props.title ? <PageTitle>{props.title}</PageTitle> : null}
			{props.hasContainer ? (
				<InnerPageContainer>{props.children}</InnerPageContainer>
			) : (
				props.children
			)}
			{props.hasFooter ? <PageFooter /> : null}
		</OuterPageContainer>
	)
}

const GlobalStyle = createGlobalStyle`
	html, body {
		min-height: 100vh;
	}
`

const FixedBodyGlobalStyle = createGlobalStyle`
	body {
		height: 100vh;
		width: 100vw;
		overflow: hidden;
	}
`

export enum PageContainerType {
	NORMAL = 0,
	FIXED_HEIGHT = 1,
	RAW = 2,
}

export type PageContainerProps = {
	hasNavbar?: boolean
	hasFooter?: boolean
} & (
	| {
			type?: PageContainerType.NORMAL | undefined // normal is default
			title?: string
	  }
	| {
			type: PageContainerType.FIXED_HEIGHT
	  }
	| {
			type: PageContainerType.RAW
	  }
)

export const PageContainer = (
	props: PageContainerProps & {
		children?: ReactNode
	}
) => {
	const options = {
		...props,
	}
	if (!options.type) options.type = PageContainerType.NORMAL

	let inner = options.children
	let title = undefined
	if (options.type === PageContainerType.NORMAL) {
		title = options.title
	} else if (options.type === PageContainerType.FIXED_HEIGHT) {
		inner = (
			<>
				<FixedBodyGlobalStyle />
				{inner}
			</>
		)
	}

	inner = (
		<ErrorBoundary fallback={<>An error occurred</>}>
			<Suspense fallback={<LoadingSpinner />}>{inner}</Suspense>
		</ErrorBoundary>
	)

	if (options.type !== PageContainerType.RAW)
		inner = (
			<PageBody
				title={title}
				hasContainer={true}
				isFixedHeight={options.type === PageContainerType.FIXED_HEIGHT}
				hasNavbar={props.hasNavbar ?? true}
				hasFooter={props.hasFooter ?? true}
			>
				{inner}
			</PageBody>
		)

	inner = (
		<>
			<GlobalStyle />
			<ProvideFixedLanguage language="en-US">
				<DialogBoundary>{inner}</DialogBoundary>
			</ProvideFixedLanguage>
		</>
	)

	return inner
}
