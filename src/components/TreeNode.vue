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
				@change="selectUnselectFolder(folder.id, $event.target.checked);"
			>
			<a
				v-if="!$root.foldersEditMode || folder.id === 'root'"
				:id="(instanceid === 'popupexporttree' ? 'to-export-' : '') + 'places-menu-folder-link-' + folder.id"
				data-folder-button
				href="javascript: void(0);"
				class="folder-button"
				draggable="true"
				@click="$store.dispatch('folderOpenClose', instanceid === 'popupexporttree' ? {target: $event.target.parentNode.parentNode} : {folder: folder, opened: folder.opened ? false : true});"
				@dragstart="$root.handleDragStart"
				@dragenter="$root.handleDragEnter"
				@dragleave="$root.handleDragLeave"
				@drop="$root.handleDrop"
			>
				<span
					class="folder-button__text"
				>
					{{ folder.name }}
				</span>
				<span
					class="folder-button__geomarks"
					:title="(folder.geomarks === 1 ? $store.state.t.i.hints.hide : $store.state.t.i.hints.show) + ' ' + $store.state.t.i.hints.placemarksOnMap"
					@click="$event.stopPropagation(); showHideGeomarks((folder.id === 'root' ? $store.getters.tree : folder), (folder.geomarks === 1 ? 0 : 1));"
				>
					{{ !folder.geomarks ? '⚇' : (folder.geomarks === 1 ? '⚉' : '⚈') }}
				</span>
			</a>
			<span
				v-if="$root.foldersEditMode && folder.id !== 'root'"
				:id="(instanceid === 'popupexporttree' ? 'to-export-' : '') + 'places-menu-folder-link-' + folder.id"
				class="folder-button"
				@click="$store.dispatch('folderOpenClose', {folder: folder, opened: folder.opened ? false : true});"
			>
				<input
					v-model="folder.name"
					:placeholder="$store.state.t.i.captions.name"
					class="folder-button__name fieldwidth_100"
					@change="$store.dispatch('changeFolder', {folder: folder, change: {name: folder.name}});"
					@click="$event.stopPropagation(); $store.commit('setIdleTime', 0);"
				>
				<a
					class="folder-button__delete"
					:title="$store.state.t.i.buttons.deleteFolder"
					@click="$event.stopPropagation(); $router.push({name: 'HomeDeleteFolder', params: {folderId: folder.id}}).catch(() => {})"
				>
					×
				</a>
				<textarea
					v-model="folder.description"
					rows="2"
					:placeholder="$store.state.t.i.captions.description"
					class="folder-button__description fieldwidth_100"
					@change="$store.dispatch('changeFolder', {folder: folder, change: {description: folder.description}});"
					@click="$event.stopPropagation(); $store.commit('setIdleTime', 0);"
				/>
			</span>
		</div>
		<div class="folder-subfolders">
			<ul
				v-if="folder.children && Object.keys(folder.children).length"
				class="margin_bottom_0"
			>
				<folder
					v-for="(child, index) in children"
					:key="folder.id + index"
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
				v-if="place.folderid === folder.id && place.show"
				:id="(instanceid === 'popupexporttree' ? 'to-export-place-' : '') + place.id"
				:key="place.id"
				data-place-button
				:srt="place.srt"
				:title="place.description"
				:class="'place-button block_01 draggable' + (currentPlace && place.id == currentPlace.id ? ' active' : '')"
				draggable="true"
				@click="instanceid !== 'popupexporttree' ? setCurrentPlace(place) : '';"
				@dragstart="$root.handleDragStart"
			>
				<input
					v-if="instanceid === 'popupexporttree'"
					:id="'to-export-place-checkbox-' + place.id"
					name="placeCheckbox"
					type="checkbox"
					class="to-export-place-checkbox"
					@change="selectUnselect(place, $event.target.checked);"
				>
				<span
					class="place-button__text"
				>
					{{ place.name }}
				</span>
				<a
					class="place-button__geomark"
					:title="(place.geomark === false ? $store.state.t.i.hints.show : $store.state.t.i.hints.hide) + ' ' + $store.state.t.i.hints.placemarkOnMap"
					@click="$event.stopPropagation(); showHideGeomarks(place, !place.geomark);"
				>
					{{ !place.geomark ? '⚇' : '⚉' }}
				</a>
				<span
					data-place-button-dragenter-area-top
					class="dragenter-area dragenter-area_top"
					@dragenter="$root.handleDragEnter"
					@dragleave="$root.handleDragLeave"
				/>
				<span
					data-place-button-dragenter-area-bottom
					class="dragenter-area dragenter-area_bottom"
					@dragenter="$root.handleDragEnter"
					@dragleave="$root.handleDragLeave"
				/>
			</label>
		</div>
		<div
			v-if="folder.id !== 'root'"
			data-folder-dragenter-area-top
			class="dragenter-area dragenter-area_top"
			@click="$store.dispatch('folderOpenClose', {folder: folder, opened: folder.opened ? false : true});"
			@dragenter="$root.handleDragEnter"
			@dragleave="$root.handleDragLeave"
		/>
		<div
			v-if="folder.id !== 'root'"
			data-folder-dragenter-area-bottom
			class="dragenter-area dragenter-area_bottom"
			@click="$store.dispatch('folderOpenClose', {folder: folder, opened: folder.opened ? false : true});"
			@dragenter="$root.handleDragEnter"
			@dragleave="$root.handleDragLeave"
		/>
	</li>
</template>

<script lang="ts">
import Vue from 'vue';
import { PropType } from 'vue';
import _ from 'lodash';
import { bus } from '../shared/bus';
import { mapState } from 'vuex';
import { Place, Folder } from '@/store/types';

export default Vue.extend({
	name: 'Folder',
	props: {
		instanceid: {
			type: String,
			default: '',
		},
		folder: {
			type: Object as PropType<Folder>,
			default() {return {};},
		},
		parent: {
			type: Object as PropType<Folder>,
			default() {return {};},
		},
	},
	data() {
		return {
			children: [] as Array<Folder>,
			places: [] as Array<Place>,
		}
	},
	computed: {
		...mapState(['currentPlace']),
		stateFolderChildren(): Record<string, Folder> {
			return this.folder.children;
		},
		statePlaces(): Record<string, Folder> {
			return this.$store.state.places;
		},
	},
	watch: {
		stateFolderChildren: {
			deep: true,
			immediate: true,
			handler(stateFolderChildren: Record<string, Folder>) {
				this.children = _.orderBy(stateFolderChildren, 'srt');
			},
		},
		statePlaces: {
			deep: true,
			immediate: true,
			handler(statePlaces: Record<string, Place>) {
				this.places = _.orderBy(statePlaces, 'srt');
			},
		},
	},
	methods: {
		setCurrentPlace(place: Place) {
			bus.$emit('setCurrentPlace', {place: place});
		},
		selectUnselect(place: Place, checked: boolean) {
			if (checked) {
				(this.$root as Vue & {selectedToExport: Record<string, Place>})
					.selectedToExport[place.id] = place;
			} else {
				delete (this.$root as Vue & {selectedToExport: Record<string, Place>})
					.selectedToExport[place.id];
			}
		},
		selectUnselectFolder(folderid: string, checked: boolean) {
			for (let placeButton of
				document
					.getElementById('to-export-places-menu-folder-' + folderid)!
						.getElementsByClassName('place-button')
			) {
				if (checked != (
					placeButton.getElementsByClassName('to-export-place-checkbox')[0] as HTMLInputElement
				).checked) {
					(placeButton as HTMLElement).click();
				}
			}
			for (let folderCheckbox of
				document
					.getElementById('to-export-places-menu-folder-' + folderid)!
						.getElementsByClassName('folder-checkbox')
			) {
				(folderCheckbox as HTMLInputElement).checked = checked ? true : false;
			}
		},
		showHideGeomarks(object: any, show: number | boolean) {
			let visibility: number;
			let showHideSubGeomarks = (object: any, show: number | boolean) => {
				if (object.type === 'place') {
					object.geomark = !show ? false : true;
					return;
				}
				object.geomarks = !show ? 0 : 1;
				for (const id in this.$store.state.places) {
					if (this.$store.state.places[id].folderid === object.id) {
						this.$store.state.places[id].geomark = show;
					}
				}
				if (object.children && Object.keys(object.children).length) {
					for (const id in object.children) {
						showHideSubGeomarks(object.children[id], show);
					}
				}
			}
			let showHideParentsGeomarks = (object: any) => {
				if (object.id === 'root') return;
				const parentProperty = (object.type === 'place' ? 'folderid' : 'parent');
				let geomarksProperty;
				let neibours: Array<Place | Folder> =
					Object.values(this.$store.state.places).filter(
						(neibour: Place) => neibour.folderid === object[parentProperty]
					) as Array<Place | Folder>
				;
				if (this.$store.getters.treeFlat[object[parentProperty]].children) {
					neibours = neibours.concat(
						Object.values(this.$store.getters.treeFlat[object[parentProperty]].children)
					);
				}
				for (let i = 0; i < neibours.length; i++) {
					geomarksProperty = (neibours[i].type === 'place' ? 'geomark' : 'geomarks');
					if (i === 0) {
						visibility = neibours[i][geomarksProperty];
						continue;
					}
					if (visibility != neibours[i][geomarksProperty]) {
						visibility = 2;
						break;
					}
				}
				this.$store.getters.treeFlat[object[parentProperty]].geomarks = Number(visibility);
				showHideParentsGeomarks(this.$store.getters.treeFlat[object[parentProperty]]);
			}
			showHideSubGeomarks(object, show);
			showHideParentsGeomarks(object);
		},
	},
});
</script>
