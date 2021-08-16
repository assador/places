<template>
	<li
		:id="(instanceid === 'popupexporttree' ? 'to-export-' : '') + 'places-menu-folder-' + folder.id"
		:srt="folder.srt"
		:title="folder.description"
		:class="'folder ' + (instanceid !== 'popupexporttree' ? (folder.opened ? 'folder_opened' : 'folder_closed') : '')"
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
				@click="$store.commit('folderOpenClose', instanceid === 'popupexporttree' ? {target: $event.target.parentNode.parentNode} : {folder: folder, opened: folder.opened ? false : true});"
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
					:title="(folder.geomarks === 1 ? 'Скрыть' : 'Показать') + ' геометки на карте'"
					@click="$event.stopPropagation(); showHideGeomarks((folder.id === 'root' ? $root.folderRoot : folder), (folder.geomarks === 1 ? 0 : 1));"
				>
					{{ !folder.geomarks ? '⚇' : (folder.geomarks === 1 ? '⚉' : '⚈') }}
				</span>
			</a>
			<span
				v-if="$root.foldersEditMode && folder.id !== 'root'"
				:id="(instanceid === 'popupexporttree' ? 'to-export-' : '') + 'places-menu-folder-link-' + folder.id"
				class="folder-button"
				@click="$store.commit('folderOpenClose', {folder: folder, opened: folder.opened ? false : true});"
			>
				<input
					v-model="folder.name"
					placeholder="Название"
					class="folder-button__name fieldwidth_100"
					@change="$store.commit('changeFolder', {folder: folder, change: {updated: true}});"
					@click="$event.stopPropagation(); $store.commit('setIdleTime', 0);"
				>
				<a
					class="folder-button__delete"
					title="Удалить папку"
					@click="$event.stopPropagation(); $router.push({name: 'HomeDeleteFolder', params: {folderId: folder.id}}).catch(() => {})"
				>
					×
				</a>
				<textarea
					v-model="folder.description"
					rows="2"
					placeholder="Описание"
					class="folder-button__description fieldwidth_100"
					@change="$store.commit('changeFolder', {folder: folder, change: {updated: true}});"
					@click="$event.stopPropagation(); $store.commit('setIdleTime', 0);"
				/>
			</span>
		</div>
		<div class="folder-subfolders">
			<ul
				v-if="folder.children && folder.children.length"
				class="margin_bottom_0"
			>
				<folder
					v-for="(child, index) in orderedChildren"
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
				v-for="place in orderedPlaces"
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
					:title="(place.geomark === false ? 'Показать' : 'Скрыть') + ' геометку на карте'"
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
			@click="$store.commit('folderOpenClose', {folder: folder, opened: folder.opened ? false : true});"
			@dragenter="$root.handleDragEnter"
			@dragleave="$root.handleDragLeave"
		/>
		<div
			v-if="folder.id !== 'root'"
			data-folder-dragenter-area-bottom
			class="dragenter-area dragenter-area_bottom"
			@click="$store.commit('folderOpenClose', {folder: folder, opened: folder.opened ? false : true});"
			@dragenter="$root.handleDragEnter"
			@dragleave="$root.handleDragLeave"
		/>
	</li>
</template>

<script>
import _ from 'lodash'
import { bus } from '../shared/bus'
import { mapState } from 'vuex'
export default {
	name: 'Folder',
	props: ['instanceid', 'folder', 'parent'],
	data() {
		return {
			folderData: {},
		}
	},
	computed: {
		...mapState(['currentPlace', 'currentPlaceIndex']),
		orderedChildren() {
			return _.orderBy(this.folderData.children, 'srt');
		},
		orderedPlaces() {
			return _.orderBy(this.$store.state.places, 'srt');
		},
	},
	watch: {
		folder: {
			deep: true,
			immediate: true,
			handler(folder) {
				this.folderData = {
					...folder,
					children: folder.children,
				};
			},
		},
	},
	methods: {
		setCurrentPlace(place) {
			bus.$emit('setCurrentPlace', {place: place});
		},
		selectUnselect(place, checked) {
			if (checked) {
				this.$root.selectedToExport.push(place);
			} else {
				for (let i = 0; i < this.$root.selectedToExport.length; i++) {
					if (this.$root.selectedToExport[i] === place) {
						this.$root.selectedToExport.splice(i, 1);
						break;
					}
				}
			}
		},
		selectUnselectFolder(folderid, checked) {
			for (let placeButton of
				document
					.getElementById('to-export-places-menu-folder-' + folderid)
					.getElementsByClassName('place-button')
			) {
				if (checked !=
					placeButton
						.getElementsByClassName('to-export-place-checkbox')[0]
						.checked
				) {
					placeButton.click();
				}
				
			}
			for (let folderCheckbox of
				document
					.getElementById('to-export-places-menu-folder-' + folderid)
					.getElementsByClassName('folder-checkbox')
			) {
				folderCheckbox.checked = checked ? true : false;
				
			}
		},
		showHideGeomarks(object, show) {
			let neibours, parentFolder, visibility;
			let showHideSubGeomarks = (object, show) => {
				if (object.type === 'place') {
					object.geomark = !show ? false : true;
					return;
				}
				object.geomarks = !show ? 0 : 1;
				for (let place of this.$store.state.places) {
					if (place.folderid === object.id) {
						place.geomark = show;
					}
				}
				if (Array.isArray(object.children) && object.children.length > 0) {
					for (let child of object.children) {
						showHideSubGeomarks(child, show);
					}
				}
			}
			let showHideParentsGeomarks = (object) => {
				if (object.id === 'root') return;
				const parentProperty = (object.type === 'place' ? 'folderid' : 'parent');
				let geomarksProperty;
				let neibours = this.$store.state.places.filter(neibour => {
					return neibour.folderid === object[parentProperty];
				});
				if (this.$root.foldersPlain[object[parentProperty]].children) {
					neibours = neibours.concat(
						this.$root.foldersPlain[object[parentProperty]].children
					);
				}
				for (let i = 0; i < neibours.length; i++) {
					geomarksProperty = (neibours[i].type === 'place' ? 'geomark' : 'geomarks');
					if (i === 0) {
						visibility = neibours[i][geomarksProperty]
						continue;
					}
					if (visibility != neibours[i][geomarksProperty]) {
						visibility = 2;
						break;
					}
				}
				this.$root.foldersPlain[object[parentProperty]].geomarks = Number(visibility);
				showHideParentsGeomarks(this.$root.foldersPlain[object[parentProperty]]);
			}
			showHideSubGeomarks(object, show);
			showHideParentsGeomarks(object);
		},
	},
}
</script>
