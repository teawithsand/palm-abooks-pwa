import { useAppManager } from "@app/domain/managers/app"
import { useAppPaths } from "@app/paths"
import { useAppTranslationSelector } from "@app/trans/AppTranslation"
import { LinkContainer } from "@app/util/LinkContainer"
import { useNavigate } from "@app/util/navigate"
import {
	useStickySubscribable,
	useStickySubscribableSelector,
} from "@teawithsand/tws-stl-react"
import React from "react"
import { Navbar as Bar, Container, NavDropdown, Nav } from "react-bootstrap"
import styled from "styled-components"

const ToEndPaginator = styled.span`
	margin-left: auto;
`

export const Navbar = (props: {
	style?: React.CSSProperties
	className?: string
}) => {
	const translations = useAppTranslationSelector((s) => s.navbar)

	const app = useAppManager()
	const isPlayerSet = useStickySubscribableSelector(
		app.playerManager.bus,
		(state) =>
			state.playerEntryListManagerState.listState.entriesBag.length > 0
	)

	const {
		homePath,
		abookListPath: listABookPath,
		abookAddLocalPath: localAddABookPath,
		playerUiPath: playerPath,
		storageInfoPath,
		versionPath,
		playerPlaylistPath,
		playerOptionsPath,
		sendFilesPath: sendLocalFilesPath,
		receiveFilesPath,
		playerPlayLocal,
	} = useAppPaths()

	return (
		<Bar
			sticky="top"
			collapseOnSelect
			expand="lg"
			bg="dark"
			variant="dark"
			style={props.style}
			className={props.className}
		>
			<Container fluid={true}>
				<LinkContainer to={isPlayerSet ? playerPath : homePath}>
					<Bar.Brand href="#">{translations.pageTitle}</Bar.Brand>
				</LinkContainer>

				<Bar.Toggle />

				<Bar.Collapse>
					<ToEndPaginator></ToEndPaginator>
					<Nav>
						<LinkContainer to={homePath}>
							<Nav.Link>{translations.homePage}</Nav.Link>
						</LinkContainer>

						<NavDropdown
							title={translations.abookLibraryDropdown.title}
							align={"end"}
						>
							<LinkContainer to={listABookPath}>
								<NavDropdown.Item>
									{
										translations.abookLibraryDropdown
											.managementPanel
									}
								</NavDropdown.Item>
							</LinkContainer>
							<NavDropdown.Divider />
							<LinkContainer to={localAddABookPath}>
								<NavDropdown.Item>
									{
										translations.abookLibraryDropdown
											.addLocalABook
									}
								</NavDropdown.Item>
							</LinkContainer>
							<LinkContainer to={listABookPath}>
								<NavDropdown.Item>
									{
										translations.abookLibraryDropdown
											.listABooks
									}
								</NavDropdown.Item>
							</LinkContainer>
							<NavDropdown.Divider />
							<LinkContainer to={receiveFilesPath}>
								<NavDropdown.Item>
									{
										translations.abookLibraryDropdown
											.receiveFiles
									}
								</NavDropdown.Item>
							</LinkContainer>
							<LinkContainer to={sendLocalFilesPath}>
								<NavDropdown.Item>
									{
										translations.abookLibraryDropdown
											.sendFiles
									}
								</NavDropdown.Item>
							</LinkContainer>
						</NavDropdown>

						<NavDropdown
							title={translations.playerDropdown.title}
							align={"end"}
						>
							<LinkContainer to={playerPath}>
								<NavDropdown.Item>
									{translations.playerDropdown.playerUi}
								</NavDropdown.Item>
							</LinkContainer>
							<LinkContainer to={playerPlaylistPath}>
								<NavDropdown.Item>
									{translations.playerDropdown.playlist}
								</NavDropdown.Item>
							</LinkContainer>
							<LinkContainer to={playerOptionsPath}>
								<NavDropdown.Item>
									{translations.playerDropdown.options}
								</NavDropdown.Item>
							</LinkContainer>
							<NavDropdown.Divider />
							<LinkContainer to={playerPlayLocal}>
								<NavDropdown.Item>
									{translations.playerDropdown.playLocal}
								</NavDropdown.Item>
							</LinkContainer>
						</NavDropdown>

						<NavDropdown
							title={translations.miscHelpDropdown.title}
							align={"end"}
						>
							<LinkContainer to={storageInfoPath}>
								<NavDropdown.Item>
									{translations.miscHelpDropdown.storageInfo}
								</NavDropdown.Item>
							</LinkContainer>
							<LinkContainer to={versionPath}>
								<NavDropdown.Item>
									{
										translations.miscHelpDropdown
											.versionAuthorInfo
									}
								</NavDropdown.Item>
							</LinkContainer>
						</NavDropdown>
					</Nav>
				</Bar.Collapse>
			</Container>
		</Bar>
	)
}
