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

export const Navbar = () => {
	const translations = useAppTranslationSelector((s) => s.navbar)

	const navigate = useNavigate()
	const {
		homePath,
		abookListPath: listABookPath,
		abookAddLocalPath: localAddABookPath,
		playerPath,
	} = useAppPaths()

	return (
		<Bar collapseOnSelect expand="lg" bg="dark" variant="dark">
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
						</NavDropdown>

						<NavDropdown
							title={translations.playerDropdown.title}
							align={"end"}
						>
							<LinkContainer to={playerPath}>
								<NavDropdown.Item>
									{translations.playerDropdown.showPlayerUi}
								</NavDropdown.Item>
							</LinkContainer>

							<NavDropdown.Item
								onClick={() => {
									// TODO(teawithsand): maybe apply some more actions here
									navigate(playerPath)
								}}
							>
								{translations.playerDropdown.playLocal}
							</NavDropdown.Item>
						</NavDropdown>
					</Nav>
				</Bar.Collapse>
			</Container>
		</Bar>
	)
}
