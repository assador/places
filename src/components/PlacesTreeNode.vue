<template>
	<li
		:id="(instanceid === 'popupexporttree' ? 'to-export-' : '') + 'places-menu-folder-' + folder.id"
		:srt="folder.srt"
		:title="folder.description"
		:class="'folder ' + (folder.opened ? 'folder_opened' : 'folder_closed')"
	>
		<div :class="'folder-subs' + (instanceid === 'popupexporttree' ? ' has-checks-radios' : '')">
			<input
				v-if="instanceid === 'popupexporttree'"
				:id="'to-export-places-menu-folder-checkbox-' + folder.id"
				name="folderCheckbox"
				type="checkbox"
				class="folder-checkbox"
				:checked="foldersCheckedIds.includes(folder.id)"
				@change="e => selectUnselectFolder(folder.id, (e.target as HTMLInputElement).checked)"
			/>
			<a
				v-if="
					!foldersEditMode ||
					props.instanceid === 'popupexporttree' ||
					folder.id === 'root'
				"
				:id="(instanceid === 'popupexporttree' ? 'to-export-' : '') + 'places-menu-folder-link-' + folder.id"
				data-folder-button
				href="javascript: void(0);"
				class="folder-button"
				:draggable="true"
				@click="e => {mainStore.folderOpenClose(instanceid === 'popupexporttree' ? {target: (e.target as Node).parentNode.parentNode} : {folder: folder, opened: !folder.opened});}"
				@dragstart="handleDragStart"
				@dragenter="handleDragEnter"
				@dragleave="handleDragLeave"
				@drop="handleDrop"
			>
				<span
					class="folder-button__text"
				>
					{{ folder.name }}
				</span>
				<span
					class="folder-button__geomarks"
					:title="(folder.geomarks === 1 ? mainStore.t.i.hints.hide : mainStore.t.i.hints.show) + ' ' + mainStore.t.i.hints.placemarksOnMap"
					@click="e => {
						e.stopPropagation();
						mainStore.showHideGeomarks({
							object: (folder.id === 'root' ? mainStore.tree : folder),
							show: (folder.geomarks === 1 ? 0 : 1),
						});
					}"
				>
					{{ !folder.geomarks ? '⚇' : (folder.geomarks === 1 ? '⚉' : '⚈') }}
				</span>
			</a>
			<span
				v-else
				:id="(instanceid === 'popupexporttree' ? 'to-export-' : '') + 'places-menu-folder-link-' + folder.id"
				class="folder-button"
			>
				<input
					:value="folder.name"
					:placeholder="mainStore.t.i.captions.name"
					class="folder-button__name fieldwidth_100"
					@change="e => {mainStore.changeFolder({folder: folder, change: {name: (e.target as HTMLInputElement).value}});}"
					@click="e => {e.stopPropagation(); mainStore.setIdleTime(0);}"
				/>
				<a
					class="folder-button__delete"
					:title="mainStore.t.i.buttons.deleteFolder"
					@click="e => {
						e.stopPropagation();
						router.push({name: 'PlacesHomeDeleteFolder', params: {folderId: folder.id}})
							.catch(err => {console.error(err);})
						;
					}"
				>
					×
				</a>
				<textarea
					:value="folder.description"
					rows="2"
					:placeholder="mainStore.t.i.captions.description"
					class="folder-button__description fieldwidth_100"
					@change="e => {mainStore.changeFolder({folder: folder, change: {description: (e.target as HTMLInputElement).value}});}"
					@click="e => {e.stopPropagation(); mainStore.setIdleTime(0);}"
				/>
			</span>
		</div>
		<div class="folder-subfolders">
			<ul
				v-if="folder.children && Object.keys(folder.children).length"
				class="margin_bottom_0"
			>
				<places-folder
					v-for="child in children"
					:key="child.id"
					:instanceid="instanceid"
					:folder="child"
					:parent="folder"
				/>
			</ul>
		</div>
		<div
			:id="(instanceid === 'popupexporttree' ? 'to-export-folder-' : '') + folder.id"
			class="folder-places"
		>
			<label
				v-for="place in places"
				:id="(instanceid === 'popupexporttree' ? 'to-export-place-' : '') + place.id"
				:key="place.id"
				:srt="place.srt"
				:title="place.description"
				:class="
					'place-button block_01 draggable has-checks-radios' +
					(currentPlace && place.id == currentPlace.id ? ' active' : '') +
					(mainStore.mode === 'measure' && mainStore.measure.places.includes(place.id) ? ' chosen' : '')
				"
				:draggable="true"
				data-place-button
				@click="e => {
					instanceid !== 'popupexporttree' ? choosePlace(place, e) : '';
				}"
				@contextmenu="e => {
					e.preventDefault();
					instanceid !== 'popupexporttree' ? choosePlace(place, e) : '';
				}"
				@dragstart="handleDragStart"
			>
				<input
					v-if="instanceid === 'popupexporttree'"
					:id="'to-export-place-checkbox-' + place.id"
					name="placeCheckbox"
					type="checkbox"
					class="to-export-place-checkbox folder-checkbox"
					:checked="selectedToExport.hasOwnProperty(place.id)"
					@change="e => {
						selectUnselect(place, (e.target as HTMLInputElement).checked);
						foldersCheckedIds = formFoldersCheckedIds();
					}"
				/>
				<span
					class="place-button__text"
				>
					{{ place.name }}
				</span>
				<a
					class="place-button__geomark"
					:title="(!place.geomark ? mainStore.t.i.hints.show : mainStore.t.i.hints.hide) + ' ' + mainStore.t.i.hints.placemarkOnMap"
					@click="e => {
						e.stopPropagation();
						mainStore.showHideGeomarks({
							object: place,
							show: !place.geomark,
						});
					}"
				>
					{{ !place.geomark ? '⚇' : '⚉' }}
				</a>
				<span
					data-place-button-dragenter-area-top
					class="dragenter-area dragenter-area_top"
					@dragenter="handleDragEnter"
					@dragleave="handleDragLeave"
					/>
					<span
					data-place-button-dragenter-area-bottom
					class="dragenter-area dragenter-area_bottom"
					@dragenter="handleDragEnter"
					@dragleave="handleDragLeave"
					/>
				</label>
			</div>
			<div
			v-if="folder.id !== 'root'"
			data-folder-dragenter-area-top
			class="dragenter-area dragenter-area_top"
			@dragenter="handleDragEnter"
			@dragleave="handleDragLeave"
			/>
			<div
			v-if="folder.id !== 'root'"
			data-folder-dragenter-area-bottom
			class="dragenter-area dragenter-area_bottom"
			@dragenter="handleDragEnter"
			@dragleave="handleDragLeave"
		/>
	</li>
</template>

<script lang="ts">
export default {
	name: 'PlacesFolder',
};
</script>

<script setup lang="ts">
import _ from 'lodash';
import { inject, computed } from 'vue';
import { emitter } from '../shared/bus';
import { useMainStore } from '@/stores/main';;
import { useRouter } from 'vue-router';
import { Place, Folder } from '@/stores/types';
import { formFoldersCheckedIds } from '../shared/common';

export interface IPlacesTreeNodeProps {
	instanceid?: string;
	folder?: Folder;
	parent?: Folder;
}
const props = withDefaults(defineProps<IPlacesTreeNodeProps>(), {
	instanceid: null,
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
const handleDragLeave = inject<typeof handleDragLeave >('handleDragLeave');
const handleDrop = inject<typeof handleDrop>('handleDrop');

const currentPlace = computed(() => mainStore.currentPlace);
const children = computed(() => _.sortBy(props.folder.children, 'srt'));
const places = computed(() =>
	_.chain(mainStore.places)
	.filter(p => p.folderid === props.folder.id && p.show)
	.sortBy('srt')
	.value()
);

const choosePlace = (place: Place, e: Event): void => {
	emitter.emit('choosePlace', {
		place: place,
		mode: (
			mainStore.mode === 'measure' && e.type === 'contextmenu'
				? 'measure' : 'normal'
		),
	});
};
const selectUnselect = (place: Place, checked: boolean): void => {
	if (checked) {
		selectedToExport.value[place.id] = place;
	} else {
		delete selectedToExport.value[place.id];
	}
};
const selectUnselectFolder = (folderid: string, checked: boolean): void => {
	for (const placeButton of
		document.getElementById('to-export-places-menu-folder-' + folderid)!
			.getElementsByClassName('place-button')
	) {
		if (checked != (
			placeButton.getElementsByClassName('to-export-place-checkbox')[0] as HTMLInputElement
		).checked) {
			(placeButton as HTMLElement).click();
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
