import { Footer } from "@app/components/Footer"
import { Navbar } from "@app/components/Navbar"
import { AppErrorBoundary } from "@app/components/boundary/error"
import { AppLoadingBoundary } from "@app/components/boundary/loading"
import { useAppManager } from "@app/domain/managers/app"
import { DialogBoundary, usePromiseSuspense } from "@teawithsand/tws-stl-react"
import React, { ReactNode } from "react"
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

	margin-top: 1em;
	margin-bottom: 1em;
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
	title?: string | null
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
			{props.title === null ? null : (
				<PageTitle>{props.title || ""}</PageTitle>
			)}
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
	NORMAL_NO_TOP_PADDING = 3,
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
	| {
			type: PageContainerType.NORMAL_NO_TOP_PADDING
	  }
)

const DelayTillAppLoadedBoundary = (props: { children?: ReactNode }) => {
	const app = useAppManager()
	const promise = app.initManager.getDonePromise()
	usePromiseSuspense(promise)

	return <>{props.children}</>
}

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
		title = options.title || ""
	} else if (options.type === PageContainerType.NORMAL_NO_TOP_PADDING) {
		title = null
	} else if (options.type === PageContainerType.FIXED_HEIGHT) {
		title = null
		inner = (
			<>
				<FixedBodyGlobalStyle />
				{inner}
			</>
		)
	}

	inner = (
		<AppErrorBoundary>
			<AppLoadingBoundary>
				<DelayTillAppLoadedBoundary>{inner}</DelayTillAppLoadedBoundary>
			</AppLoadingBoundary>
		</AppErrorBoundary>
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
			<DialogBoundary>{inner}</DialogBoundary>
		</>
	)

	return inner
}
