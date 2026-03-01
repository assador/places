<template>
	<li
		:id="
			(instanceid === 'popupexporttree' ? 'to-export-' : '') +
			'places-menu-folder-' + folder.id
		"
		:srt="folder.srt"
		:title="folder.description"
		class="folder"
		:class="folder.open ? 'folder_open' : 'folder_closed'"
	>
		<div
			:id="folder.virtual && folder.context === 'places'
				? 'places-header'
				: (folder.virtual && folder.context === 'routes'
					? 'routes-header'
					: undefined
				)
			"
			class="folder-subs"
			:class="{
				'folder-editable': foldersEditMode,
				'folder-subs-to-export': folder.virtual && instanceid === 'popupexporttree',
			}"
		>
			<div
				v-if="foldersEditMode"
				class="icon icon-triangle"
				:class="folder.open ? 'icon-triangle_down' : 'icon-triangle_right'"
				@click="mainStore.folderOpenClose({ folder })"
			/>
			<label
				v-if="instanceid === 'popupexporttree'"
				class="tree-item-checkbox-container"
			>
				<input
					:id="'to-export-places-menu-folder-checkbox-' + folder.id"
					name="folderCheckbox"
					type="checkbox"
					class="tree-item-checkbox"
					:checked="foldersCheckedIds.includes(folder.id)"
					@change="e => selectUnselectFolder(folder.id, (e.currentTarget as HTMLInputElement).checked)"
				/>
			</label>
			<div
				v-if="foldersEditMode"
				:id="
					(instanceid === 'popupexporttree' ? 'to-export-' : '') +
					'places-menu-folder-link-' + folder.id
				"
				class="folder-button__content"
			>
				<input
					:value="folder.name"
					:placeholder="mainStore.t.i.captions.name"
					class="folder-button__name fieldwidth_100"
					@change="e => {mainStore.changeFolder({folder: folder, change: {name: (e.currentTarget as HTMLInputElement).value}});}"
					@click.stop
				/>
				<textarea
					:value="folder.description"
					rows="2"
					:placeholder="mainStore.t.i.captions.description"
					class="folder-button__description fieldwidth_100"
					@change="e => {mainStore.changeFolder({folder: folder, change: {description: (e.currentTarget as HTMLInputElement).value}});}"
					@click.stop
				/>
			</div>

<!-- SEC folder-button  -->

			<div
				v-if="!foldersEditMode"
				class="folder-button drag draggable"
				:draggable="!folder.virtual ? true : false"
				:data-entity-id="folder.id === null ? 'null' : folder.id"
				:data-entity-type="folder.type"
				:data-entity-context="what"
				@dragstart="e => handleDragStart(e, folder)"
				@dragenter="handleDragEnter"
				@dragleave="handleDragLeave"
				@dragover.prevent
				@drop.prevent.stop="handleDropExt"
				@click="mainStore.folderOpenClose({ folder })"
			>
				<div
					:id="
						(instanceid === 'popupexporttree' ? 'to-export-' : '') +
						'places-menu-folder-link-' + folder.id
					"
					class="folder-button__content"
				>
					<div
						class="icon icon-triangle"
						:class="folder.open ? 'icon-triangle_down' : 'icon-triangle_right'"
					/>
					<h2
						v-if="folder.virtual"
						class="color-01"
					>
						{{ mainStore.t.i.captions[folder.context] }}
					</h2>
					<div v-else>
						{{ folder.name }}
					</div>
				</div>
				<div
					v-if="!folder.virtual && instanceid !== 'popupexporttree'"
					class="folder-button__controls"
				>
					<span
						class="folder-button__control icon"
						:class="
							'icon-geomark-' +
							(!folder.geomarks
								? '0'
								: (folder.geomarks === 1 ? '1' : '2')
							)
							+ '-circled'
						"
						:title="
							(folder.geomarks === 1
								? mainStore.t.i.hints.hide
								: mainStore.t.i.hints.show
							) + ' ' +
							mainStore.t.i.hints.onMap
						"
						accesskey="a"
						@click.stop="
							mainStore.showHideGeomarks({
								object: (folder.virtual
									? mainStore.trees[what]
									: folder
								),
								show: (folder.geomarks === 1 ? 0 : 1),
							})
						"
					/>
					<span
						class="folder-button__control icon icon-plus-circled"
						:title="mainStore.t.i.hints[(what === 'places' ? 'addPlace' : 'addRoute')]"
						accesskey="a"
						@click.stop="() => {
							switch (what) {
								case 'places':
									mainStore.upsertPlace({
										props: { folderid: folder.id },
									});
									$nextTick(() => currentPlaceNameInputRef.focus());
									break;
								case 'routes':
									mainStore.upsertRoute({
										props: { folderid: folder.id },
									});
									$nextTick(() => currentRouteNameInputRef.focus());
									break;
							}
						}"
					/>
					<span
						class="folder-button__control icon icon-plus-circled-folder"
						:title="mainStore.t.i.hints.addFolderIn"
						accesskey="f"
						@click.stop="router.push({
							name: 'HomeFolder',
							params: {
								parent: folder.id,
								context: folder.context,
							},
						})"
					/>
					<span
						class="folder-button__control icon icon-cross-45-circled-folder"
						:title="mainStore.t.i.buttons.deleteFolder"
						accesskey="f"
						@click.stop="router.push({
							name: 'HomeDeleteFolder',
							params: { id: folder.id, type: what },
						})"
					/>
				</div>
			</div>
			<div
				v-if="
					folder.virtual &&
					instanceid !== 'popupexporttree' &&
					[ 'places', 'routes' ].includes(folder.context)
				"
				class="control-buttons"
			>
				<button
					class="button-iconed icon icon-plus-circled"
					:class="{ 'button-pressed': !Object.keys(mainStore[folder.context]).length }"
					:title="
						folder.context === 'places'
							? mainStore.t.i.hints.addPlace
							: mainStore.t.i.hints.addRoute
					"
					accesskey="a"
					@click="() => {
						if (folder.context === 'places') {
							mainStore.upsertPlace();
							$nextTick(() => currentPlaceNameInputRef.focus());
						} else if (folder.context === 'routes') {
							mainStore.upsertRoute();
							$nextTick(() => currentRouteNameInputRef.focus());
						}
					}"
				/>
				<button
					class="button-iconed icon icon-cross-45-circled"
					:title="
						folder.context === 'places'
							? mainStore.t.i.hints.deletePlace
							: mainStore.t.i.hints.deleteRoute
					"
					:disabled="
						!(mainStore.user && (
							folder.context === 'places' &&
							mainStore.currentPlace &&
							mainStore.currentPlace.userid === mainStore.user.id ||
							folder.context === 'routes' &&
							mainStore.currentRoute &&
							mainStore.currentRoute.userid === mainStore.user.id
						))
					"
					accesskey="d"
					@click.stop="() => {
						if (folder.context === 'places') {
							mainStore.deleteObjects({
								[mainStore.currentPlace.id]: mainStore.currentPlace,
							});
						} else if (folder.context === 'routes') {
							mainStore.deleteObjects({
								[mainStore.currentRoute.id]: mainStore.currentRoute,
							});
						}
					}"
				/>
				<button
					class="button-iconed icon icon-plus-circled-folder"
					:title="mainStore.t.i.hints.addFolder"
					accesskey="f"
					@click="router.push({
						name: 'HomeFolder',
						query: { parent: null, context: folder.context },
					})"
				/>
			</div>
		</div>
		<div class="folder-subfolders">
			<ul
				v-if="folder.children && Object.keys(folder.children).length"
				class="margin_bottom_0"
			>
				<TreeSubfolder
					v-for="child in children"
					:key="child.id"
					:instanceid="instanceid"
					:what="what"
					:folder="child"
					:parent="folder"
				/>
			</ul>
		</div>
		<div
			:id="
				(instanceid === 'popupexporttree' ? 'to-export-folder-' : '') +
				folder.id
			"
			class="folder-places"
		>

<!-- SEC place/route-button  -->

			<label
				v-for="(object, index) in (what === 'places' ? places : routes)"
				:id="
					(instanceid === 'popupexporttree' ? 'to-export-place-' : '') +
					object.id
				"
				:key="object.id"
				:type="object.type"
				:srt="object.srt"
				:title="object.description"
				class="place-button block_01 draggable"
				:class="
					(what === 'places'
						? (
							mainStore.currentPlace &&
							object.id == mainStore.currentPlace.id
								? 'active' : ''
						)
						: (
							mainStore.currentRoute &&
							object.id == mainStore.currentRoute.id
								? 'active' : ''
						)
					) + (
						mainStore.mode === 'measure' &&
						mainStore.measure.points.find(p => p.id === object.id)
							? ' chosen' : ''
					)
				"
				:draggable="true"
				:data-entity-id="object.id"
				:data-entity-type="object.type"
				:data-entity-context="what"
				@dragstart="e => handleDragStart(e, object)"
				@click="() => {
					if (instanceid === 'popupexporttree') return;
					if (what === 'places') {
						mainStore.setCurrentPlace(object as Place);
					} else if (what === 'routes') {
						mainStore.setCurrentRoute(object as Route);
					}
				}"
				@contextmenu.prevent="() => {
					if (what === 'places' && instanceid !== 'popupexporttree') {
						mainStore.addPointToPoints({
							point: mainStore.points[(object as Place).pointid],
						});
					}
				}"
			>
				<span
					v-if="instanceid === 'popupexporttree'"
					class="tree-item-checkbox-container"
					>
					<input
						:id="'to-export-place-checkbox-' + object.id"
						name="placeCheckbox"
						type="checkbox"
						class="to-export-place-checkbox tree-item-checkbox"
						:checked="Object.hasOwn(selectedToExport, object.id)"
						@change="e => {
							if (what === 'places') {
								selectUnselect(
									object as Place,
									(e.currentTarget as HTMLInputElement).checked
								);
							} else {
								selectUnselect(
									object as Route,
									(e.currentTarget as HTMLInputElement).checked
								);
							}
							foldersCheckedIds = formFoldersCheckedIds();
						}"
						@click.stop
					/>
				</span>
				<span class="place-button__content">
					{{ object.name }}
				</span>
				<span
					v-if="instanceid !== 'popupexporttree'"
					class="place-button__controls"
				>
					<span
						v-if="
							Object.hasOwn(object, 'geomark') ||
							Object.hasOwn(object, 'geomarks')
						"
						class="place-button__control icon"
						:class="'icon-geomark-' + (what === 'places'
							? (!object['geomark'] ? '0' : '1')
							: (!object['geomarks'] ? '0' : '1')
						) + '-circled'"
						:title="
							(!object['geomark']
								? mainStore.t.i.hints.show
								: mainStore.t.i.hints.hide
							) + ' ' +
								mainStore.t.i.hints.onMap
						"
						@click.stop="() => {
							if (what === 'places') {
								mainStore.showHideGeomarks({
									object: object,
									show: !(object['geomark']
										? object['geomark']
										: object['geomarks']
									),
								});
							} else if (what === 'routes') {
								(object as Route).geomarks =
									(object as Route).geomarks !== 0 ? 0 : 1
								;
							}
						}"
					/>
					<span
						v-if="what === 'places'"
						class="place-button__control icon icon-plus-circled"
						:title="mainStore.t.i.hints.addPlaceNext"
						@click.stop="() => {
							mainStore.upsertPlace({
								props: {
									folderid: folder.id,
									srt: index === places.length - 1
										? object.srt + 1
										: object.srt + (places[index + 1].srt - object.srt) / 2
									,
								},
							});
							$nextTick(() => currentPlaceNameInputRef.focus());
						}"
					/>
					<span
						v-else-if="what === 'routes'"
						class="place-button__control icon icon-plus-circled"
						:title="mainStore.t.i.hints.addRouteNext"
						@click.stop="() => {
							mainStore.upsertRoute({
								props: {
									folderid: folder.id,
									srt: index === routes.length - 1
										? object.srt + 1
										: object.srt + (routes[index + 1].srt - object.srt) / 2
									,
								},
							});
							$nextTick(() => currentRouteNameInputRef.focus());
						}"
					/>
					<span
						class="place-button__control icon icon-cross-45-circled"
						:title="mainStore.t.i.hints[what === 'places'
							? 'deletePlace'
							: 'deleteRoute'
						]"
						@click.stop="mainStore.deleteObjects({
							[object.id]: object,
						})"
					/>
				</span>
				<span
					:data-entity-id="object.id"
					:data-entity-type="object.type"
					:data-entity-context="what"
					:data-entity-sort-area="'top'"
					class="drag dragenter-area dragenter-area_top"
					@dragover.prevent
					@drop.prevent.stop="handleDropExt"
					@dragenter="handleDragEnter"
					@dragleave="handleDragLeave"
				/>
				<span
					:data-entity-id="object.id"
					:data-entity-type="object.type"
					:data-entity-context="what"
					:data-entity-sort-area="'bottom'"
					class="drag dragenter-area dragenter-area_bottom"
					@dragover.prevent
					@drop.prevent.stop="handleDropExt"
					@dragenter="handleDragEnter"
					@dragleave="handleDragLeave"
				/>
			</label>
		</div>
		<div
			v-if="distance > 0 && folder.open"
			:title="distance + mainStore.t.i.hints.distanceBetweenPointsInFolder"
			class="folder-distances"
		>
			<span class="un_color">{{ mainStore.t.i.captions.total }}: </span>
			<span class="color-01">{{ distance }}</span>
			<span class="un_color"> {{ mainStore.t.i.text.km }}</span>
		</div>
		<div
			v-if="!folder.virtual"
			:data-entity-id="folder.id"
			:data-entity-type="folder.type"
			:data-entity-context="what"
			:data-entity-sort-area="'top'"
			class="drag dragenter-area dragenter-area_top"
			@dragover.prevent
			@drop.prevent.stop="handleDropExt"
			@dragenter="handleDragEnter"
			@dragleave="handleDragLeave"
		/>
		<div
			v-if="!folder.virtual"
			:data-entity-id="folder.id"
			:data-entity-type="folder.type"
			:data-entity-context="what"
			:data-entity-sort-area="'bottom'"
			class="drag dragenter-area dragenter-area_bottom"
			@dragover.prevent
			@drop.prevent.stop="handleDropExt"
			@dragenter="handleDragEnter"
			@dragleave="handleDragLeave"
		/>
	</li>
</template>

<script lang="ts">
export default {
	name: 'TreeSubfolder',
};
</script>

<script setup lang="ts">
import _ from 'lodash';
import { computed, inject } from 'vue';
import { useMainStore } from '@/stores/main';
import { useRouter } from 'vue-router';
import { Place, Route, Folder, DragEntityPayload } from '@/types';
import { formFoldersCheckedIds } from '@/shared';

export interface IPlacesTreeNodeProps {
	instanceid?: string;
	what: 'places' | 'routes';
	folder?: Folder;
	parent?: Folder;
}
const props = withDefaults(defineProps<IPlacesTreeNodeProps>(), {
	instanceid: null,
	what: 'places',
	folder: null,
	parent: null,
});

const mainStore = useMainStore();
const router = useRouter();

const currentPlaceNameInputRef = inject<HTMLElement>('currentPlaceNameInputRef');
const currentRouteNameInputRef = inject<HTMLElement>('currentRouteNameInputRef');

const selectedToExport = inject<typeof selectedToExport>('selectedToExport');
const foldersCheckedIds: string[] = inject('foldersCheckedIds');
const foldersEditMode = inject('foldersEditMode');
const handleDrop = inject<typeof handleDrop>('handleDrop');

const children = computed(() => _.sortBy(props.folder.children, 'srt'));
const places = computed(() =>
	_.chain(mainStore.places)
	.filter(p =>
		p.show && !p.deleted &&
		(p.folderid === props.folder.id || !p.folderid && props.folder.virtual)
	)
	.sortBy('srt')
	.value()
);
const routes = computed(() =>
	_.chain(mainStore.routes)
	.filter(r =>
		r.show && !r.deleted &&
		(r.folderid === props.folder.id || !r.folderid && props.folder.virtual)
	)
	.sortBy('srt')
	.value()
);
const distance = computed(() => {
	switch (props.what) {
		case 'places':
			return Math.round(mainStore.distanceBetweenPoints(
				places.value.map(place => place.pointid)
			) * 1000) / 1000;
		case 'routes':
			const isTotalPath = false; // TODO Implement checkbox: Include distances between routes.
			if (isTotalPath) {
				return Math.round(mainStore.distanceBetweenPoints(
					routes.value.map(route => route.points.map(pn => pn.id)).flat()
				) * 1000) / 1000;
			} else {
				const sum = routes.value.reduce((s, r) => s + mainStore.distanceBetweenPoints(r.points.map(p => p.id)), 0);
				return Math.round(sum * 1000) / 1000;
			}
	}
});

const selectUnselect = (object: Place | Route, checked: boolean): void => {
	if (checked) {
		selectedToExport.value[object.id] = object;
	} else {
		delete selectedToExport.value[object.id];
	}
};
const selectUnselectFolder = (folderid: string, checked: boolean): void => {
	for (const button of
		document.getElementById('to-export-places-menu-folder-' + folderid)!
			.getElementsByClassName('place-button')
	) {
		if (checked != (
			button.getElementsByClassName('to-export-place-checkbox')[0] as HTMLInputElement
		).checked) {
			(button as HTMLElement).click();
		}
	}
	for (const folderCheckbox of
		document.getElementById('to-export-places-menu-folder-' + folderid)!
			.getElementsByClassName('folder-checkbox')
	) {
		(folderCheckbox as HTMLInputElement).checked = checked ? true : false;
	}
};

// SEC DnD

const canAcceptDrop = (target: HTMLElement): boolean => {
	const { currentDrag } = mainStore;
	const { entityId, entityContext, entityType } = target.dataset;
	return !(
		currentDrag.id === entityId ||
		currentDrag.context !== entityContext ||
		(currentDrag.type === 'folder' && ['place', 'route'].includes(entityType))
	);
};
const removeDragClasses = (targets?: HTMLElement[]) => {
	const drags = targets ? targets : document.querySelectorAll('.drag');
	drags.forEach((element: Element) => {
		[
			'highlighted',
			'dragenter-area_top_border',
			'dragenter-area_bottom_border',
		]
			.forEach(cls => element.classList.remove(cls))
		;
	});
};
const handleDropExt = (event: DragEvent) => {
	const target = event.currentTarget as HTMLElement;
	removeDragClasses([ target ]);
	if (!canAcceptDrop(target)) return;
	handleDrop(event);
};
const handleDragStart = (event: DragEvent, entity: Folder | Place | Route) => {
	mainStore.currentDrag = {
		id: entity.id,
		type: entity.type,
		context: props.what,
	};
	const payload: DragEntityPayload = { ...mainStore.currentDrag };
	event.dataTransfer?.setData('application/my-app-dnd', JSON.stringify(payload));
};
const handleDragEnter = (event: DragEvent) => {
	const target = event.currentTarget as HTMLElement;
	if (!canAcceptDrop(target)) return;
	const area = target.dataset.entitySortArea;
	if (!area) {
		target.classList.add('highlighted');
	} else {
		target.classList.add(area === 'top'
			? 'dragenter-area_top_border' : 'dragenter-area_bottom_border'
		);
	}
};
const handleDragLeave = (event: DragEvent) => {
	const target = event.currentTarget as HTMLElement;
	target.classList.remove(
		'highlighted',
		'dragenter-area_top_border',
		'dragenter-area_bottom_border',
	);
};
</script>

<style lang="scss" scoped>
.folder {
	display: flex;
	flex-direction: column;
	position: relative;
	padding-left: 16px;
	&::before {
		display: none;
	}
	& > .folder-subs {
		display: flex;
		z-index: 20;
	}
	&.folder_open:is(
		.points,
		#places-menu-folder-null
	) > .folder-subs:has(~ .folder-subfolders *),
	:is(#places-header, #routes-header):has(~ .folder-places:not(:empty)) {
		margin-bottom: 12px;
	}
	&.folder-root {
		> .folder-subfolders > * > .folder {
			padding: 0;
		}
	}
	&_editable {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 8px;
		align-items: start;
		margin-top: 12px;
		.control-buttons {
			flex: 0 1 auto;
			flex-flow: column wrap;
		}
		.folder-button {
			margin: 0 -8px 8px -1px;
			&__content {
				display: flex;
				flex-direction: column;
				gap: 8px;
			}
			&__controls {
				display: none;
			}
			input, textarea {
				display: block;
			}
		}
		.icon-triangle {
			margin-top: 6px;
			cursor: pointer;
		}
		input, textarea {
			min-width: 0;
		}
		&#places-header, &#routes-header {
			align-items: start;
		}
	}
	.folder-distances {
		margin-top: -6px;
		align-self: end;
		text-align: right;
	}
	& > .dragenter-area_top, & > .dragenter-area_bottom {
		height: 4px;
		z-index: 20;
	}
	& > .dragenter-area_top {
		top: 0; bottom: auto;
	}
	& > .dragenter-area_bottom {
		top: auto; bottom: -1px;
	}
	&:has( > .dragenter-area:hover) > .folder-subs > .folder-button .folder-button__control {
		opacity: 1 !important;
	}
}
.folder_closed {
	> .folder-subfolders {
		display: none;
	}
	> .folder-places {
		display: none !important;
	}
}
.folder_open {
	> .folder-subfolders {
		display: block;
	}
	&::before {
		content: '';
		display: block;
		position: absolute;
		top: 1.5em; bottom: 2px; left: 0;
		width: 1px;
		margin: 0;
		float: none;
	}
}
.place-button, .folder-button {
	display: grid;
	gap: 8px;
	align-items: start;
	justify-content: center;
	cursor: pointer !important;
	&:hover :is(.place-button__control, .folder-button__control) {
		opacity: 1 !important;
	}
	h2 {
		line-height: 1;
	}
	&__content {
		min-height: 1lh;
	}
	&__controls {
		display: flex;
		gap: 8px;
		padding: 2px 0 3px 0;
		flex-wrap: wrap;
		align-items: start;
		justify-content: right;
		z-index: 30;
	}
	&__control {
		width: 14px;
		height: 14px;
		opacity: 0;
		&::before {
			display: flex;
			align-items: center;
			justify-content: center;
			line-height: 0;
		}
	}
}
.place-button {
	grid-template-columns: 1fr auto;
	&[class*="block_"] {
		margin: 7px 0 10px 0;
		padding: 4px 8px;
	}
	&[class*="block_"] .dragenter-area_top {
		top: -6px;
	}
	&[class*="block_"] .dragenter-area_bottom {
		bottom: -7px;
	}
}
.folder-button {
	grid-template-columns: 1fr auto;
	flex: 1 0 auto;
	z-index: 0;
	&__content {
		display: flex;
		gap: 8px;
		align-items: baseline;
	}
}
:not(:is(.folder-root)) > .folder-places {
	display: block;
	margin-left: 18px;
}
.folder-subs {
	display: flex;
	gap: 8px;
	align-items: center;
	&-to-export {
		margin-bottom: 12px;
	}
}
#places-header, #routes-header {
	z-index: 10;
	&.folder-subs {
		z-index: 20;
	}
	.control-buttons {
		justify-content: end;
	}
	.folder-button {
		grid-template-columns: 1fr auto;
		.folder-button__description {
			height: 44px;
		}
	}
}
.icon-triangle {
	flex: 0 0 10px;
	width: 10px; height: 10px;
	min-width: 0; min-height: 0;
	line-height: 0;
	&::before {
		background-color: var(--color-23);
	}
}
.place-button .tree-item-checkbox-container {
	margin-right: 8px;
}
.draggable,
.dragenter-area,
.place-button,
.folder-button,
.control-buttons *,
.place-button__control,
.folder-button__control,
.tree-item-checkbox {
	pointer-events: auto !important;
}
.dragenter-area_top, .dragenter-area_bottom {
	position: absolute;
	right: 0; left: 0;
	z-index: 10;
	cursor: pointer;
}
.dragenter-area_top {
	top: 0; bottom: 50%;
}
.dragenter-area_bottom {
	top: 50%; bottom: 0;
}
</style>
