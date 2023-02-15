import { PageContainer } from "@app/components/PageContainer"
import { useAppTranslationSelector } from "@app/trans/AppTranslation"
import { wrapLocationProvider } from "@app/util/useLocation"
import { wrapNoSSR } from "@teawithsand/tws-stl-react"
import React from "react"
import styled from "styled-components"

const Title = styled.h2`
	margin-left: auto;
	margin-right: auto;
	text-align: center;
	font-size: 2.5em;
`
const Version = styled.h3`
	margin-left: auto;
	margin-right: auto;
	text-align: center;
	font-size: 1.25em;
`
const Author = styled.div``

const AppInfoPage = () => {
	const info = useAppTranslationSelector((trans) => trans.info)
	return (
		<PageContainer>
			<Title>PalmABooks PWA</Title>
			<Version>0.0.1-alpha</Version>
			<hr />
			<Author>
				<p>
					Long story short, they call me Teawithsand. I have a blog at{" "}
					<a href={info.autorPageUrl}>teawithsand.com</a>.
				</p>
				<p>
					For contact info go to{" "}
					<a href={info.authorContactUrl}>https://teawithsand.com/contact</a>.
				</p>
			</Author>
		</PageContainer>
	)
}

export default wrapNoSSR(wrapLocationProvider(AppInfoPage))
