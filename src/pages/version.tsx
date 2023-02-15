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
const Author = styled.div`
	margin-left: auto;
	margin-right: auto;
	text-align: center;
	font-size: 2.5em;
	font-size: 1.25em;
`

const AppInfoPage = () => {
	const info = useAppTranslationSelector((trans) => trans.info)
	return (
		<PageContainer>
			<Title>PalmABooks PWA</Title>
			<Version>Version: 0.0.1-alpha</Version>
			<Author>
				By <a href={info.autorPageUrl}>Teawithsand</a>
			</Author>
			<hr />
			<div>
				<h3>Bug reports</h3>
				<p>
					In order to report a bug contact me through any channel:{" "}
					<a href={info.authorContactUrl}>{info.authorContactUrl}</a>
				</p>
			</div>
			<div>
				<h3>About me & project</h3>
				<p>
					Long story short, they call me Teawithsand. I have a blog at{" "}
					<a href={info.autorPageUrl}>teawithsand.com</a>.
				</p>
				<p>
					For contact info go to{" "}
					<a href={info.authorContactUrl}>
						https://teawithsand.com/contact
					</a>
					.
				</p>
				<p>
					Right now this app is free and ad free, so please enjoy
					using it.
				</p>
			</div>
		</PageContainer>
	)
}

export default wrapNoSSR(wrapLocationProvider(AppInfoPage))
