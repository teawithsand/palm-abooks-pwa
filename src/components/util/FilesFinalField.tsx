import { useAppManager } from "@app/domain/managers/app"
import { formatFileSize } from "@teawithsand/tws-stl"
import { useStickySubscribable } from "@teawithsand/tws-stl-react"
import React from "react"
import { Button, Form, Table } from "react-bootstrap"
import { Field as FinalField } from "react-final-form"
import { FieldArray } from "react-final-form-arrays"

const abookFilesMimesAndExtensions = [
	".mp3",
	"audio/mpeg",

	".jpg",
	".jpeg",
	"image/jpeg",
	".png",
	"image/png",
	".gif",
	"image/gif",
	".webp",
	"image/webp",
]

export const FilesFinalField = (props: {
	label?: string
	name: string
	disabled?: boolean
	accept?: string | string[]
}) => {
	const { name, label, disabled = false, accept: rawTypeSpec } = props
	const app = useAppManager()
	const stats = useStickySubscribable(app.storageSizeManager.storageStatsBus)

	const typeSpec: string =
		(typeof rawTypeSpec === "string" ? rawTypeSpec : rawTypeSpec?.join(",")) ??
		abookFilesMimesAndExtensions.join(",")

	return (
		<>
			<Form.Group className="mb-3">
				<Form.Label>
					{label ??
						"ABook files(you can drag-and-drop them onto field)"}
				</Form.Label>

				{
					// Note: DnD area is not needed that much, since user can DnD files onto file field
					// TODO(teawithsand): check directory support, as it should be there
				}
				<FinalField<File[]> name={name}>
					{({ input }) => {
						return (
							<Form.Control
								accept={typeSpec || undefined}
								type="file"
								disabled={disabled}
								{...{
									...input,

									value: undefined,

									// instead of the default target.value
									onChange: (e: any) => {
										if (disabled) return

										// TODO(teawithsand): check if it works on older browsers, works on state-of-art ff
										const files = [
											...(e.target.files || []),
										]
										files.sort((a, b) =>
											a.name.localeCompare(b.name)
										)
										return input.onChange(files)
									},
								}}
								multiple
							/>
						)
					}}
				</FinalField>
			</Form.Group>
			<FieldArray<File> name={name}>
				{({ fields }) => {
					return (
						<>
							{
								// TODO(teawithsand): make entries in this table draggable
								//  so user can determine order of files as well.
								// This is critical for ABooks.
							}
							<Table hover striped bordered>
								<thead>
									<tr>
										<td>No.</td>
										<td>Name</td>
										<td>Size</td>
										<td>Operations</td>
									</tr>
								</thead>
								<tbody>
									{fields.value.map((f, i) => (
										<tr key={i}>
											<td>{i + 1}</td>
											<td>{f.name}</td>
											<td>{formatFileSize(f.size)}</td>
											<td>
												<Button
													disabled={disabled}
													variant="danger"
													onClick={() => {
														if (disabled) return
														fields.remove(i)
													}}
												>
													Remove file
												</Button>
											</td>
										</tr>
									))}
								</tbody>
							</Table>
							<h5>
								Total{" "}
								{formatFileSize(
									fields.value
										.map((v) => v.size)
										.reduce((pv, cv) => pv + cv, 0)
								)}
							</h5>
							{stats.usageData ? (
								<div>
									Current space left:{" "}
									{formatFileSize(
										stats.usageData.max -
											stats.usageData.used
									)}
								</div>
							) : null}
						</>
					)
				}}
			</FieldArray>
		</>
	)
}
