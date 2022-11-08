import { Navbar } from "@app/components/Navbar"
import { DialogBoundary } from "@teawithsand/tws-stl-react"
import { ProvideFixedLanguage } from "@teawithsand/tws-trans"
import React, { ReactNode } from "react"

const PageBody = (props: { children?: ReactNode }) => {
	return (
		<>
			<Navbar />
			{props.children}
		</>
	)
}

export const PageContainer = (props: { children?: ReactNode }) => {
	return (
		<>
			<ProvideFixedLanguage language="en-US">
				<DialogBoundary>
					<PageBody>{props.children}</PageBody>
				</DialogBoundary>
			</ProvideFixedLanguage>
		</>
	)
}
