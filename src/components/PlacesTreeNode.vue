<template>
	<li
		:id="(instanceid === 'popupexporttree' ? 'to-export-' : '') + 'places-menu-folder-' + folder.id"
		:srt="folder.srt"
		:title="folder.description"
		:class="'folder ' + (folder.opened ? 'folder_opened' : 'folder_closed')"
	>
		<div>
			<input
				v-if="instanceid === 'popupexporttree'"
				:id="'to-export-places-menu-folder-checkbox-' + folder.id"
				name="folderCheckbox"
				type="checkbox"
				class="folder-checkbox"
				:checked="foldersCheckedIds.includes(folder.id)"
				@change="e => selectUnselectFolder(folder.id, e.target.checked)"
			>
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
				@click="e => {store.dispatch('folderOpenClose', instanceid === 'popupexporttree' ? {target: e.target.parentNode.parentNode} : {folder: folder, opened: !folder.opened});}"
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
					:title="(folder.geomarks === 1 ? store.state.t.i.hints.hide : store.state.t.i.hints.show) + ' ' + store.state.t.i.hints.placemarksOnMap"
					@click="e => {
						e.stopPropagation();
						store.dispatch('showHideGeomarks', {
							object: (folder.id === 'root' ? store.state.tree : folder),
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
					:placeholder="store.state.t.i.captions.name"
					class="folder-button__name fieldwidth_100"
					@change="store.dispatch('changeFolder', {folder: folder, change: {name: folder.name}});"
					@click="e => {e.stopPropagation(); store.commit('setIdleTime', 0);}"
				>
				<a
					class="folder-button__delete"
					:title="store.state.t.i.buttons.deleteFolder"
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
					:placeholder="store.state.t.i.captions.description"
					class="folder-button__description fieldwidth_100"
					@change="store.dispatch('changeFolder', {folder: folder, change: {description: folder.description}});"
					@click="e => {e.stopPropagation(); store.commit('setIdleTime', 0);}"
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
				:class="'place-button block_01 draggable' + (currentPlace && place.id == currentPlace.id ? ' active' : '')"
				:draggable="true"
				data-place-button
				@click="instanceid !== 'popupexporttree' ? setCurrentPlace(place) : '';"
				@dragstart="handleDragStart"
			>
				<input
					v-if="instanceid === 'popupexporttree'"
					:id="'to-export-place-checkbox-' + place.id"
					name="placeCheckbox"
					type="checkbox"
					class="to-export-place-checkbox"
					:checked="selectedToExport.hasOwnProperty(place.id)"
					@change="e => {
						selectUnselect(place, e.target.checked);
						foldersCheckedIds = formFoldersCheckedIds();
					}"
				>
				<span
					class="place-button__text"
				>
					{{ place.name }}
				</span>
				<a
					class="place-button__geomark"
					:title="(!place.geomark ? store.state.t.i.hints.show : store.state.t.i.hints.hide) + ' ' + store.state.t.i.hints.placemarkOnMap"
					@click="e => {
						e.stopPropagation();
						store.dispatch('showHideGeomarks', {
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
			class="dragenter-area dragenter-area_top"
			@dragenter="handleDragEnter"
			@dragleave="handleDragLeave"
		/>
		<div
			v-if="folder.id !== 'root'"
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
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { Place, Folder } from '@/store/types';
import { formFoldersCheckedIds } from '../shared/common';

export interface IPlacesTreeNodeProps {
	instanceid?: string;
	folder?: Folder;
	parent?: Folder;
}
const props = withDefaults(defineProps<IPlacesTreeNodeProps>(), {
	instanceid: '',
	folder: {},
	parent: {},
});

const store = useStore();
const router = useRouter();

const selectedToExport = inject('selectedToExport');
const foldersCheckedIds = inject('foldersCheckedIds');
const foldersEditMode = inject('foldersEditMode');
const handleDragStart = inject('handleDragStart');
const handleDragEnter = inject('handleDragEnter');
const handleDragLeave = inject('handleDragLeave');
const handleDrop = inject('handleDrop');

const currentPlace = computed(() => store.state.currentPlace);
const children = computed(() => _.sortBy(props.folder.children, 'srt'));
const places = computed(() =>
	_.chain(store.state.places)
	.filter(p => p.folderid === props.folder.id && p.show)
	.sortBy('srt')
	.value()
);

const setCurrentPlace = (place: Place): void => {
	emitter.emit('setCurrentPlace', {place: place});
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
