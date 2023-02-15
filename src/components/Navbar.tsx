import { useAppPaths } from "@app/paths"
import { useAppTranslationSelector } from "@app/trans/AppTranslation"
import { LinkContainer } from "@app/util/LinkContainer"
import { useNavigate } from "@app/util/navigate"
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

	const navigate = useNavigate()
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
				<LinkContainer to={"/"}>
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
							<NavDropdown.Item
								onClick={() => {
									navigate(playerOptionsPath)
								}}
							>
								{translations.playerDropdown.options}
							</NavDropdown.Item>
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
