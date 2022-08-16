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
				:draggable="true"
				@click="$store.dispatch('folderOpenClose', instanceid === 'popupexporttree' ? {target: $event.target.parentNode.parentNode} : {folder: folder, opened: !folder.opened});"
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
					@click="
						$event.stopPropagation();
						$store.dispatch('showHideGeomarks', {
							object: (folder.id === 'root' ? $store.state.tree : folder),
							show: (folder.geomarks === 1 ? 0 : 1),
						});
					"
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
					:value="folder.name"
					:placeholder="$store.state.t.i.captions.name"
					class="folder-button__name fieldwidth_100"
					@change="$store.dispatch('changeFolder', {folder: folder, change: {name: folder.name}});"
					@click="$event.stopPropagation(); $store.commit('setIdleTime', 0);"
				>
				<a
					class="folder-button__delete"
					:title="$store.state.t.i.buttons.deleteFolder"
					@click="$event.stopPropagation(); $router.push({name: 'PlacesHomeDeleteFolder', params: {folderId: folder.id}}).catch(() => {})"
				>
					×
				</a>
				<textarea
					:value="folder.description"
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
					:title="(!place.geomark ? $store.state.t.i.hints.show : $store.state.t.i.hints.hide) + ' ' + $store.state.t.i.hints.placemarkOnMap"
					@click="
						$event.stopPropagation();
						$store.dispatch('showHideGeomarks', {
							object: place,
							show: !place.geomark,
						});
					"
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
			class="dragenter-area dragenter-area_top"
			@click="$store.dispatch('folderOpenClose', {folder: folder, opened: folder.opened ? false : true});"
			@dragenter="$root.handleDragEnter"
			@dragleave="$root.handleDragLeave"
		/>
		<div
			v-if="folder.id !== 'root'"
			class="dragenter-area dragenter-area_bottom"
			@click="$store.dispatch('folderOpenClose', {folder: folder, opened: folder.opened ? false : true});"
			@dragenter="$root.handleDragEnter"
			@dragleave="$root.handleDragLeave"
		/>
	</li>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import _ from 'lodash';
import { emitter } from '../shared/bus';
import { mapState } from 'vuex';
import { Place, Folder } from '@/store/types';

export default defineComponent({
	name: 'PlacesFolder',
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
		};
	},
	computed: {
		...mapState(['currentPlace']),
		stateFolderChildren(): Record<string, Folder> {
			return this.folder.children;
		},
		statePlaces(): Record<string, Place> {
			return this.$store.state.places;
		},
	},
	watch: {
		stateFolderChildren: {
			deep: true,
			immediate: true,
			handler(stateFolderChildren: Record<string, Folder>) {
				this.children = _.sortBy(stateFolderChildren, 'srt');
			},
		},
		statePlaces: {
			deep: true,
			immediate: true,
			handler(statePlaces: Record<string, Place>) {
				this.places =
					_.chain(statePlaces)
					.filter(p => p.folderid === this.folder.id && p.show)
					.sortBy('srt')
					.value()
				;
			},
		},
	},
	methods: {
		setCurrentPlace(place: Place) {
			emitter.emit('setCurrentPlace', {place: place});
		},
		selectUnselect(place: Place, checked: boolean) {
			if (checked) {
				this.$root.selectedToExport[place.id] = place;
			} else {
				delete this.$root.selectedToExport[place.id];
			}
		},
		selectUnselectFolder(folderid: string, checked: boolean) {
			for (const placeButton of
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
			for (const folderCheckbox of
				document
					.getElementById('to-export-places-menu-folder-' + folderid)!
						.getElementsByClassName('folder-checkbox')
			) {
				(folderCheckbox as HTMLInputElement).checked = checked ? true : false;
			}
		},
	},
});
</script>
