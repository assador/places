<template>
	<li
		:id="
			(instanceid === 'popupexporttree' ? 'to-export-' : '') +
			'places-menu-folder-' + folder.id
		"
		:srt="folder.srt"
		:title="folder.description"
		class="folder"
		:class="folder.opened ? 'folder_opened' : 'folder_closed'"
	>
		<div
			:id="folder.id === 'root'
				? 'places-header'
				: (folder.id === 'routesroot'
					? 'routes-header'
					: undefined
				)
			"
			class="folder-subs"
			:class="{ folder_editable: foldersEditMode }"
		>
			<div
				v-if="foldersEditMode"
				class="icon icon-triangle"
				:class="folder.opened ? 'icon-triangle_down' : 'icon-triangle_right'"
				@click="e => {
					mainStore.folderOpenClose(
						instanceid === 'popupexporttree'
							? { target: (e.target as Node).parentNode.parentNode }
							: { folder: folder, opened: !folder.opened }
					);
				}"
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
					@change="e => selectUnselectFolder(folder.id, (e.target as HTMLInputElement).checked)"
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
					@change="e => {mainStore.changeFolder({folder: folder, change: {name: (e.target as HTMLInputElement).value}});}"
					@click.stop
				/>
				<textarea
					:value="folder.description"
					rows="2"
					:placeholder="mainStore.t.i.captions.description"
					class="folder-button__description fieldwidth_100"
					@change="e => {mainStore.changeFolder({folder: folder, change: {description: (e.target as HTMLInputElement).value}});}"
					@click.stop
				/>
			</div>

<!-- SEC folder-button  -->

			<div
				v-if="!foldersEditMode"
				class="folder-button"
				:draggable="folder.parent ? true : false"
				:data-places-tree-type="what === 'places' ? 'place' : 'route'"
				:data-places-tree-folder-id="folder.id"
				:data-places-tree-item-type="'folder'"
				@dragstart="handleDragStart"
				@dragenter="handleDragEnter"
				@dragleave="handleDragLeave"
				@drop="handleDrop"
				@click="e => {
					mainStore.folderOpenClose(
						instanceid === 'popupexporttree'
							? { target: (e.target as Node).parentNode.parentNode }
							: { folder: folder, opened: !folder.opened }
					);
				}"
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
						:class="folder.opened ? 'icon-triangle_down' : 'icon-triangle_right'"
					/>
					<h2
						v-if="folder.id === 'root'"
						class="color-01"
					>
						{{ mainStore.t.i.captions.places }}
					</h2>
					<h2
						v-else-if="folder.id === 'routesroot'"
						class="color-01"
					>
						{{ mainStore.t.i.captions.routes }}
					</h2>
					<div v-else>
						{{ folder.name }}
					</div>
				</div>
				<div
					v-if="folder.parent"
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
							mainStore.t.i.hints.placemarksOnMap
						"
						accesskey="a"
						@click.stop="() => {
							if (what === 'places') {
								mainStore.showHideGeomarks({
									object: (folder.id === 'root' ? mainStore.tree : folder),
									show: (folder.geomarks === 1 ? 0 : 1),
								});
							} else if (what === 'routes') {
								mainStore.showHideGeomarks({
									object: (folder.id === 'routesroot' ? mainStore.treeRoutes : folder),
									show: (folder.geomarks === 1 ? 0 : 1),
								});
							}
						}"
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
						class="folder-button__control icon icon-plus-circled"
						:title="mainStore.t.i.hints.addFolderIn"
						accesskey="f"
						@click.stop="router.push({
							name: 'HomeFolder',
							params: { parentId: folder.id },
						})"
					/>
					<span
						class="folder-button__control icon icon-cross-45-circled"
						:title="mainStore.t.i.buttons.deleteFolder"
						accesskey="f"
						@click.stop="router.push({
							name: 'HomeDeleteFolder',
							params: { id: folder.id },
						})"
					/>
				</div>
			</div>
			<div
				v-if="folder.id === 'root'"
				class="control-buttons"
			>
				<button
					class="button-iconed icon"
					:class="
						'icon-geomark-' +
						(!folder.geomarks
							? '0'
							: (folder.geomarks === 1 ? '1' : '2')
						) +
						'-circled'
					"
					:title="
						(folder.geomarks === 1
							? mainStore.t.i.hints.hide
							: mainStore.t.i.hints.show
						) + ' ' +
						mainStore.t.i.hints.placemarksOnMap
					"
					accesskey="a"
					@click.stop="() => {
						if (what === 'places') {
							mainStore.showHideGeomarks({
								object: (folder.id === 'root' ? mainStore.tree : folder),
								show: (folder.geomarks === 1 ? 0 : 1),
							});
						} else if (what === 'routes') {
							mainStore.showHideGeomarks({
								object: (folder.id === 'routesroot' ? mainStore.treeRoutes : folder),
								show: (folder.geomarks === 1 ? 0 : 1),
							});
						}
					}"
				/>
				<button
					class="button-iconed icon icon-plus-circled"
					:title="mainStore.t.i.hints.addPlace"
					accesskey="a"
					@click="() => {
						mainStore.upsertPlace();
						$nextTick(() => currentPlaceNameInputRef.focus());
					}"
				/>
				<button
					class="button-iconed icon icon-plus-circled"
					:title="mainStore.t.i.hints.addFolder"
					accesskey="f"
					@click="router.push({
						name: 'HomeFolder',
						params: { parentId: 'root' },
					})"
				/>
			</div>
			<div
				v-else-if="folder.id === 'routesroot'"
				class="control-buttons"
			>
				<button
					class="button-iconed icon icon-plus-circled"
					:title="mainStore.t.i.hints.addRoute"
					accesskey="a"
					@click="() => {
						mainStore.upsertRoute();
						$nextTick(() => currentRouteNameInputRef.focus());
					}"
				/>
				<button
					class="button-iconed icon icon-cross-45-circled"
					:title="mainStore.t.i.hints.deleteRoute"
					:disabled="!(
						mainStore.user &&
						mainStore.currentRoute &&
						mainStore.currentRoute.userid === mainStore.user.id
					)"
					accesskey="d"
					@click="
						mainStore.deleteObjects({
							objects: {
								[mainStore.currentRoute.id]: mainStore.currentRoute,
							},
						})
					"
				/>
				<button
					class="button-iconed icon icon-plus-circled"
					:title="mainStore.t.i.hints.addFolder"
					accesskey="f"
					@click="router.push({
						name: 'HomeFolder',
						params: { parentId: 'routesroot' },
					})"
				/>
			</div>
		</div>
		<div class="folder-subfolders">
			<ul
				v-if="folder.children && Object.keys(folder.children).length"
				class="margin_bottom_0"
			>
				<subfolder
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
				:data-places-tree-type="what === 'places' ? 'place' : 'route'"
				:data-places-tree-item-id="object.id"
				:data-places-tree-item-type="object.type"
				:data-places-tree-item-parent-id="object.folderid"
				@dragstart="handleDragStart"
				@click="() => {
					if (instanceid === 'popupexporttree') return;
					if (what === 'places') {
						mainStore.setCurrentPlace(object as Place);
					} else if (what === 'routes') {
						mainStore.setCurrentRoute(object as Route);
					}
					const point = mainStore.getPointById(
						what === 'places'
							? object['pointid']
							: object['points'][object['choosing']]
					);
					if (point) {
						mainStore.updateMap({
							latitude: point.latitude,
							longitude: point.longitude,
						});
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
									(e.target as HTMLInputElement).checked
								);
							} else {
								selectUnselect(
									object as Route,
									(e.target as HTMLInputElement).checked
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
				<span class="place-button__controls">
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
							) +
							' ' + (what === 'places'
								? mainStore.t.i.hints.placemarkOnMap
								: mainStore.t.i.hints.placemarksOnMap
							)
						"
						@click.stop="mainStore.showHideGeomarks({
							object: object,
							show: !(object['geomark']
								? object['geomark']
								: object['geomarks']
							),
						})"
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
						:title="mainStore.t.i.hints.deletePlace"
						@click.stop="mainStore.deleteObjects({
							objects: { [object.id]: object }
						})"
					/>
				</span>
				<span
					:data-places-tree-type="what === 'places' ? 'place' : 'route'"
					:data-places-tree-item-id="object.id"
					:data-places-tree-item-type="object.type"
					:data-places-tree-item-sorting-area-top="true"
					class="dragenter-area dragenter-area_top"
					@dragenter="handleDragEnter"
					@dragleave="handleDragLeave"
				/>
				<span
					:data-places-tree-type="what === 'places' ? 'place' : 'route'"
					:data-places-tree-item-id="object.id"
					:data-places-tree-item-type="object.type"
					:data-places-tree-item-sorting-area-bottom="true"
					class="dragenter-area dragenter-area_bottom"
					@dragenter="handleDragEnter"
					@dragleave="handleDragLeave"
				/>
			</label>
		</div>
		<div
			v-if="distance > 0 && folder.opened"
			:title="distance + mainStore.t.i.hints.distanceBetweenPointsInFolder"
			class="folder-distances"
		>
			<span class="un_color">{{ mainStore.t.i.captions.total }}: </span>
			<span class="color-01">{{ distance }}</span>
			<span class="un_color"> {{ mainStore.t.i.text.km }}</span>
		</div>
		<div
			v-if="folder.id !== 'root' && folder.id !== 'routesroot'"
			:data-places-tree-folder-sorting-area-top-folderid="folder.id"
			class="dragenter-area dragenter-area_top"
			@dragenter="handleDragEnter"
			@dragleave="handleDragLeave"
		/>
		<div
			v-if="folder.id !== 'root' && folder.id !== 'routesroot'"
			:data-places-tree-folder-sorting-area-bottom-folderid="folder.id"
			class="dragenter-area dragenter-area_bottom"
			@dragenter="handleDragEnter"
			@dragleave="handleDragLeave"
		/>
	</li>
</template>

<script lang="ts">
export default {
	name: 'Subfolder',
};
</script>

<script setup lang="ts">
import _ from 'lodash';
import { computed, inject } from 'vue';
import { useMainStore } from '@/stores/main';
import { useRouter } from 'vue-router';
import { Place, Route, Folder } from '@/stores/types';
import { formFoldersCheckedIds } from '@/shared';

export interface IPlacesTreeNodeProps {
	instanceid?: string;
	what: string;
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
const handleDragStart = inject<typeof handleDragStart>('handleDragStart');
const handleDragEnter = inject<typeof handleDragEnter>('handleDragEnter');
const handleDragLeave = inject<typeof handleDragLeave>('handleDragLeave');
const handleDrop = inject<typeof handleDrop>('handleDrop');

const children = computed(() => _.sortBy(props.folder.children, 'srt'));
const places = computed(() =>
	_.chain(mainStore.places)
	.filter(p =>
		p.show &&
		(
			p.folderid === props.folder.id ||
			p.folderid === null && props.folder.id === 'root'
		)
	)
	.sortBy('srt')
	.value()
);
const routes = computed(() =>
	_.chain(mainStore.routes)
	.filter(t =>
		t.show &&
		(
			t.folderid === props.folder.id ||
			t.folderid === null && props.folder.id === 'routesroot'
		)
	)
	.sortBy('srt')
	.value()
);

const distance = computed(() =>
	Math.round(mainStore.distanceBetweenPoints(
		places.value.map(place => place.pointid)
	) * 1000) / 1000
);

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
		z-index: 20;
	}
	&.folder_opened:is(
		.points,
		#places-menu-folder-root,
		#places-menu-folder-routesroot
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
.folder_opened {
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
.tree-item-checkbox {
	position: relative;
	margin: -2px 0 0 -2px;
}
.folder-subs .tree-item-checkbox-container {
	position: relative;
	width: 20px; height: 20px;
	left: -20px;
	&::before {
		position: relative;
	}
	+ .folder-button {
		margin-left: 10px;
	}
	.tree-item-checkbox {
		position: relative;
		margin-top: -38px;
	}
}
.folder-places {
	display: block;
	&:not(&:is(&#root, &#routesroot)) {
		margin-left: 18px;
	}
}
#places-header, #routes-header {
	display: flex;
	gap: 8px;
	align-items: center;
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
	.tree-item-checkbox-container {
		left: 0;
		&::before {
			left: 1px;
		}
		+ .folder-button {
			margin-left: 0;
			margin-bottom: 12px;
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
.draggable,
.dragenter-area,
.place-button,
.folder-button,
.control-buttons *,
.place-button__control,
.folder-button__control {
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
