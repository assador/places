<template>
	<li
		:id="
			(instanceid === 'popupexporttree' ? 'to-export-' : '') +
			'places-menu-folder-' + folder.id
		"
		:srt="folder.srt"
		:title="folder.description"
		:class="'folder ' + (folder.opened ? 'folder_opened' : 'folder_closed')"
	>
		<div
			:id="folder.id === 'root'
				? 'places-header'
				: (folder.id === 'tracksroot'
					? 'tracks-header'
					: undefined
				)
			"
			:class="
				'folder-subs' +
				(foldersEditMode ? ' folder_editable' : '')
			"
		>
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
				class="folder-button"
				:draggable="folder.parent ? true : false"
				:data-places-tree-type="what === 'places' ? 'place' : 'track'"
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
					v-if="!foldersEditMode"
					:id="
						(instanceid === 'popupexporttree' ? 'to-export-' : '') +
						'places-menu-folder-link-' + folder.id
					"
					class="folder-button__content"
				>
					<h2
						v-if="folder.id === 'root'"
						class="color-01"
					>
						{{ mainStore.t.i.captions.places }}
					</h2>
					<h2
						v-else-if="folder.id === 'tracksroot'"
						class="color-01"
					>
						{{ mainStore.t.i.captions.tracks }}
					</h2>
					<div v-else>
						{{ folder.name }}
					</div>
				</div>
				<div
					v-else
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
						@click="e => e.stopPropagation()"
					/>
					<textarea
						:value="folder.description"
						rows="2"
						:placeholder="mainStore.t.i.captions.description"
						class="folder-button__description fieldwidth_100"
						@change="e => {mainStore.changeFolder({folder: folder, change: {description: (e.target as HTMLInputElement).value}});}"
						@click="e => e.stopPropagation()"
					/>
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
						"
						:title="
							(folder.geomarks === 1
								? mainStore.t.i.hints.hide
								: mainStore.t.i.hints.show
							) + ' ' +
							mainStore.t.i.hints.placemarksOnMap
						"
						accesskey="a"
						@click="e => {
							e.stopPropagation();
							if (what === 'places') {
								mainStore.showHideGeomarks({
									object: (folder.id === 'root' ? mainStore.tree : folder),
									show: (folder.geomarks === 1 ? 0 : 1),
								});
							} else if (what === 'tracks') {
								mainStore.showHideGeomarks({
									object: (folder.id === 'tracksroot' ? mainStore.treeTracks : folder),
									show: (folder.geomarks === 1 ? 0 : 1),
								});
							}
						}"
					/>
					<span
						class="folder-button__control icon icon-plus"
						:title="mainStore.t.i.hints.addPlace"
						accesskey="a"
						@click="e => {
							e.stopPropagation();
							appendPlace({
								folderid: folder.id,
								srt:
									places.length > 0
										? places[places.length - 1].srt + 1
										: 1
							});
						}"
					/>
					<span
						class="folder-button__control icon icon-plus"
						:title="mainStore.t.i.hints.addFolderIn"
						accesskey="f"
						@click="router.push({
							name: 'HomeFolder',
							params: { parentId: folder.id },
						})"
					/>
					<span
						class="folder-button__control icon icon-cross-45"
						:title="mainStore.t.i.buttons.deleteFolder"
						accesskey="f"
						@click="e => {
							e.stopPropagation();
							router.push({
								name: 'HomeDeleteFolder',
								params: { id: folder.id },
							})
								.catch(error => { console.error(error); })
							;
						}"
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
						)
					"
					:title="
						(folder.geomarks === 1
							? mainStore.t.i.hints.hide
							: mainStore.t.i.hints.show
						) + ' ' +
						mainStore.t.i.hints.placemarksOnMap
					"
					accesskey="a"
					@click="e => {
						e.stopPropagation();
						if (what === 'places') {
							mainStore.showHideGeomarks({
								object: (folder.id === 'root' ? mainStore.tree : folder),
								show: (folder.geomarks === 1 ? 0 : 1),
							});
						} else if (what === 'tracks') {
							mainStore.showHideGeomarks({
								object: (folder.id === 'tracksroot' ? mainStore.treeTracks : folder),
								show: (folder.geomarks === 1 ? 0 : 1),
							});
						}
					}"
				/>
				<button
					class="button-iconed icon icon-plus"
					:title="mainStore.t.i.hints.addPlace"
					accesskey="a"
					@click="appendPlace()"
				/>
				<button
					class="button-iconed icon icon-plus"
					:title="mainStore.t.i.hints.addFolder"
					accesskey="f"
					@click="router.push({
						name: 'HomeFolder',
						params: { parentId: 'root' },
					})"
				/>
			</div>
			<div
				v-else-if="folder.id === 'tracksroot'"
				class="control-buttons"
			>
				<button
					class="button-iconed icon icon-plus"
					:title="mainStore.t.i.hints.addTrack"
					accesskey="a"
					@click="appendTrack()"
				/>
				<button
					class="button-iconed icon icon-cross-45"
					:title="mainStore.t.i.hints.deleteTrack"
					:disabled="!(mainStore.user && currentTrack && currentTrack.userid === mainStore.user.id)"
					accesskey="d"
					@click="mainStore.deleteObjects({
						objects: {[currentTrack.id]: currentTrack}
					})"
				/>
				<button
					class="button-iconed icon icon-plus"
					:title="mainStore.t.i.hints.addFolder"
					accesskey="f"
					@click="router.push({
						name: 'HomeFolder',
						params: { parentId: 'tracksroot' },
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
			<label
				v-for="(object, index) in (what === 'places' ? places : tracks)"
				:id="
					(instanceid === 'popupexporttree' ? 'to-export-place-' : '') +
					object.id
				"
				:key="object.id"
				:type="object.type"
				:srt="object.srt"
				:title="object.description"
				:class="
					'place-button block_01 draggable' +
					(what === 'places'
						? (currentPlace && object.id == currentPlace.id ? ' active' : '')
						: (currentTrack && object.id == currentTrack.id ? ' active' : '')
					) +
					(mainStore.mode === 'measure' && mainStore.measure.points.includes(object.id) ? ' chosen' : '')
				"
				:draggable="true"
				:data-places-tree-type="what === 'places' ? 'place' : 'track'"
				:data-places-tree-item-id="object.id"
				:data-places-tree-item-type="object.type"
				:data-places-tree-item-parent-id="object.folderid"
				@dragstart="handleDragStart"
				@click="e => {
					if (instanceid === 'popupexporttree') return;
					if (what === 'places') {
						choosePlaceInTree(object as Place, e);
					} else if (what === 'tracks') {
						chooseTrackInTree(object as Track, e);
					}
					const point = getPoint(object);
					if (point) {
						mainStore.updateMap({
							latitude: point.latitude,
							longitude: point.longitude,
						});
					}
				}"
				@contextmenu="e => {
					e.preventDefault();
					if (instanceid !== 'popupexporttree') {
						if (what === 'places') {
							choosePlaceInTree(object as Place, e);
						} else if (what === 'tracks') {
							chooseTrackInTree(object as Track, e);
						}
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
									object as Track,
									(e.target as HTMLInputElement).checked
								);
							}
							foldersCheckedIds = formFoldersCheckedIds();
						}"
						@click="e => e.stopPropagation()"
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
						)"
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
						@click="e => {
							e.stopPropagation();
							mainStore.showHideGeomarks({
								object: object,
								show: !(object['geomark']
									? object['geomark']
									: object['geomarks']
								),
							});
						}"
					/>
					<span
						v-if="what === 'places'"
						class="place-button__control icon icon-plus"
						:title="mainStore.t.i.hints.addPlaceNext"
						@click="e => {
							e.stopPropagation();
							appendPlace({
								folderid: folder.id,
								srt: (
									index === places.length - 1
										? object.srt + 1
										: object.srt + (places[index + 1].srt - object.srt) / 2
								),
							});
						}"
					/>
					<span
						v-else-if="what === 'tracks'"
						class="place-button__control icon icon-plus"
						:title="mainStore.t.i.hints.addTrackNext"
						@click="e => {
							e.stopPropagation();
							appendTrack({
								folderid: folder.id,
								srt: (
									index === tracks.length - 1
										? object.srt + 1
										: object.srt + (tracks[index + 1].srt - object.srt) / 2
								),
							});
						}"
					/>
					<span
						class="place-button__control icon icon-cross-45"
						:title="mainStore.t.i.hints.deletePlace"
						@click="e => {
							e.stopPropagation();
							mainStore.deleteObjects({objects: {[object.id]: object}});
						}"
					/>
				</span>
				<span
					:data-places-tree-type="what === 'places' ? 'place' : 'track'"
					:data-places-tree-item-id="object.id"
					:data-places-tree-item-type="object.type"
					:data-places-tree-item-sorting-area-top="true"
					class="dragenter-area dragenter-area_top"
					@dragenter="handleDragEnter"
					@dragleave="handleDragLeave"
				/>
				<span
					:data-places-tree-type="what === 'places' ? 'place' : 'track'"
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
			v-if="folder.id !== 'root' && folder.id !== 'tracksroot'"
			:data-places-tree-folder-sorting-area-top-folderid="folder.id"
			class="dragenter-area dragenter-area_top"
			@dragenter="handleDragEnter"
			@dragleave="handleDragLeave"
		/>
		<div
			v-if="folder.id !== 'root' && folder.id !== 'tracksroot'"
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
import { inject, computed } from 'vue';
import { useMainStore } from '@/stores/main';
import { useRouter } from 'vue-router';
import { Point, Place, Track, Folder } from '@/stores/types';
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

const selectedToExport = inject<typeof selectedToExport>('selectedToExport');
const foldersCheckedIds: string[] = inject('foldersCheckedIds');
const foldersEditMode = inject('foldersEditMode');
const handleDragStart = inject<typeof handleDragStart>('handleDragStart');
const handleDragEnter = inject<typeof handleDragEnter>('handleDragEnter');
const handleDragLeave = inject<typeof handleDragLeave>('handleDragLeave');
const handleDrop = inject<typeof handleDrop>('handleDrop');

const appendPlace = inject('appendPlace') as (payload?: Record<string, any>) => void;
const appendTrack = inject('appendTrack') as (payload?: Record<string, any>) => void;

const currentPlace = computed(() => mainStore.currentPlace);
const currentTrack = computed(() => mainStore.currentTrack);
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
const tracks = computed(() =>
	_.chain(mainStore.tracks)
	.filter(t =>
		t.show &&
		(
			t.folderid === props.folder.id ||
			t.folderid === null && props.folder.id === 'tracksroot'
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

const choosePlaceInTree = (place: Place, e: Event): void => {
	mainStore.choosePlace(
		place,
		mainStore.mode === 'measure' && e.type === 'contextmenu'
			? 'measure'
			: 'normal'
	);
};
const chooseTrackInTree = (track: Track, e: Event): void => {
	mainStore.chooseTrack(
		track,
		mainStore.mode === 'measure' && e.type === 'contextmenu'
			? 'measure'
			: 'normal'
	);
};
const getPoint = (object: any): Point | null => {
	if (object.type === 'place') {
		return mainStore.points[object.pointid];
	} else if (
		object.type === 'track' &&
		typeof object.choosing === 'number' &&
		object.points[object.choosing]
	) {
		return object.points[object.choosing];
	}
	return null;
}
const selectUnselect = (object: Place | Track, checked: boolean): void => {
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
			transform: scale(0.7);
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
	grid-template-columns: 7px 1fr auto;
	flex: 1 0 auto;
	z-index: 0;
	&::before {
		display: inline-block;
		flex-shrink: 0;
	}
}
.folder {
	display: flex;
	flex-direction: column;
	position: relative;
	padding-left: 15px;
	&::before {
		display: none;
	}
	& > .folder-subs {
		z-index: 20;
	}
	&:is(.folder_closed, .folder_opened) > :is(h2, h2::before) {
		cursor: pointer;
	}
	&.folder_opened:is(
		.points,
		#places-menu-folder-root,
		#places-menu-folder-tracksroot
	) > .folder-subs:has(~ .folder-subfolders *),
	:is(#places-header, #tracks-header):has(~ .folder-places:not(:empty)) {
		margin-bottom: 12px;
	}
	&.folder-root {
		> .folder-subfolders > * > .folder {
			padding: 0;
		}
	}
	&_editable {
		align-items: start;
		flex-wrap: nowrap;
		padding-left: 11px;
		textarea {
			min-height: auto;
			height: auto;
		}
		.control-buttons {
			flex: 0 1 auto;
			flex-flow: column wrap;
		}
		.folder-button {
			grid-template-columns: 8px 1fr auto !important;
			flex: auto;
			margin: 0 -8px 8px -12px;
			&::before {
				margin-right: 0 !important;
			}
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
	}
	.folder-distances {
		margin-top: -6px;
		align-self: end;
		text-align: right;
		pointer-events: auto !important;
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
	> * > .folder-button::before {
		content: '\25e2';
	}
	> .folder-places {
		display: none !important;
	}
}
.folder_opened {
	> .folder-subfolders {
		display: block;
	}
	> * > .folder-button::before {
		content: '\25e4';
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
	&:not(&:is(&#root, &#tracksroot)) {
		margin-left: 15px;
	}
}
#places-header, #tracks-header {
	display: flex;
	gap: 8px;
	align-items: center;
	z-index: 10;
	&.folder-subs {
		z-index: 20;
	}
	.control-buttons * {
		pointer-events: auto !important;
	}
	.folder-button {
		grid-template-columns: 7px 1fr;
		&::before {
			margin-left: 0;
			width: 1em;
			margin-right: 8px;
		}
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
.draggable *, .folder:not(:has(.folder_editable)) *, .place-button {
	pointer-events: none;
}
.draggable,
.dragenter-area,
.folder-button,
:is(.place-button__controls, .folder-button__controls) * {
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
