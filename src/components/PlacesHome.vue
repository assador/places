<template>
	<div ref="root">
		<div class="fullscreen-wrapper">
			<div
				id="grid"
				class="loading-grid"
				:style="compact ? ('grid-template-columns: ' + sidebarSize.left + 'px auto; grid-template-rows: auto ' + sidebarSize.top + 'px 1fr ' + (compact === -1 ? '1fr' : (sidebarSize.bottom + (typeof(sidebarSize.bottom) === 'number' ? 'px' : ''))) + ' auto;') : ('grid-template-rows: ' + sidebarSize.top + 'px 1fr ' + sidebarSize.bottom + 'px; grid-template-columns: ' + sidebarSize.left + 'px 1fr ' + sidebarSize.right + 'px;')"
				@mousemove="documentMouseOver($event);"
				@touchmove="documentMouseOver($event);"
				@mouseup="sidebarDragStop();"
				@touchend="sidebarDragStop();"
			>
				<div
					id="top-left"
					class="app-cell fieldwidth_100"
				>
					<div class="control-buttons">
						<button
							id="actions-append"
							class="actions-button"
							:title="$store.state.t.i.hints.addPlace"
							@click="appendPlace();"
						>
							<span>+</span>
							<span>{{ $store.state.t.i.buttons.newPlace }}</span>
						</button>
						<button
							id="actions-delete"
							class="actions-button"
							:title="$store.state.t.i.hints.deletePlace"
							:disabled="!($store.state.user && currentPlace && currentPlace.userid === $store.state.user.id)"
							@click="$store.dispatch('deletePlaces', {places: {[currentPlace.id]: currentPlace}});"
						>
							<span>-</span>
							<span>{{ $store.state.t.i.buttons.delete }}</span>
						</button>
						<button
							id="actions-append-folder"
							class="actions-button"
							:title="$store.state.t.i.hints.addFolder"
							@click="$router.push({name: 'PlacesHomeFolder'}).catch(e => {console.error(e);});"
						>
							<span>↧</span>
							<span>{{ $store.state.t.i.buttons.newFolder }}</span>
						</button>
						<button
							id="actions-edit-folders"
							:class="'actions-button' + ($root.foldersEditMode ? ' button-pressed' : '')"
							:title="$store.state.t.i.hints.editFolders"
							@click="$root.foldersEditMode = !$root.foldersEditMode;"
						>
							<span>⇆</span>
							<span>{{ $store.state.t.i.buttons.editFolders }}</span>
						</button>
						<input
							:placeholder="$store.state.t.i.inputs.searchPlaces"
							:title="$store.state.t.i.inputs.searchPlaces"
							class="find-places-input fontsize_n"
							@keyup="selectPlaces"
						>
					</div>
				</div>
				<div
					id="top-basic"
					class="app-cell"
				>
					<div id="top-basic-content">
						<div class="brand">
							<h1 class="basiccolor margin_bottom_0">
								{{ $store.state.t.i.brand.header }} —
								<router-link to="/account">
									{{ $store.state.user ? $store.state.user.login : 'o_O' }}
								</router-link>
							</h1>
							<div>{{ $store.state.t.i.brand.slogan }}</div>
						</div>
						<places-dashboard />
					</div>
					<div
						id="messages"
						class="invisible"
						@mouseover="$store.commit('setMouseOverMessages', true)"
						@mouseout="$store.commit('setMouseOverMessages', false)"
						@click="$store.dispatch('clearMessages');"
					>
						<div
							v-for="(message, index) in $store.state.messages"
							:id="'message-' + index"
							:key="index"
							class="message border_1"
						>
							{{ $store.state.messages[index] }}
						</div>
					</div>
				</div>
				<div
					id="top-right"
					class="app-cell"
				>
					<div class="control-buttons">
						<input
							id="inputImportFromFile"
							ref="inputImportFromFile"
							name="jsonFile"
							type="file"
							accept=".json, .gpx"
							@change="importFromFile();"
						>
						<button
							id="actions-fullscreen"
							v-fullscreen="options"
							class="actions-button"
							:title="$store.state.t.i.buttons.fullscreen"
						>
							<span>⤧</span>
							<span>{{ $store.state.t.i.buttons.fullscreen }}</span>
						</button>
						<button
							id="actions-undo"
							class="actions-button"
							:title="$store.state.t.i.buttons.undo"
							@click="$store.dispatch('undo');"
						>
							<span>↺</span>
							<span>{{ $store.state.t.i.buttons.undo }}</span>
						</button>
						<button
							id="actions-redo"
							class="actions-button"
							:title="$store.state.t.i.buttons.redo"
							@click="$store.dispatch('redo');"
						>
							<span>↻</span>
							<span>{{ $store.state.t.i.buttons.redo }}</span>
						</button>
						<button
							id="actions-save"
							:class="'actions-button' + (!$store.state.saved ? ' button-pressed highlight' : '')"
							:title="(!$store.state.saved ? ($store.state.t.i.hints.notSaved + '. ') : '') + $store.state.t.i.hints.sabeToDb"
							@click="$root.toDBCompletely();"
						>
							<span>↸</span>
							<span>{{ $store.state.t.i.buttons.todb }}</span>
						</button>
						<button
							id="actions-import"
							class="actions-button"
							:title="$store.state.t.i.hints.importPlaces"
							onclick="document.getElementById('inputImportFromFile').click();"
						>
							<span>↲</span>
							<span>{{ $store.state.t.i.buttons.import }}</span>
						</button>
						<button
							id="actions-export"
							class="actions-button"
							:title="$store.state.t.i.hints.exportPlaces"
							@click="$router.push({name: 'PlacesHomeExport', params: {mime: 'application/gpx+xml'}}).catch(e => {console.error(e);})"
						>
							<span>↱</span>
							<span>{{ $store.state.t.i.buttons.export }}</span>
						</button>
						<button
							id="actions-about"
							class="actions-button"
							:title="$store.state.t.i.hints.about"
							@click="$router.push({name: 'PlacesHomeText', params: {what: 'about'}}).catch(e => {console.error(e);}); $refs.extmap.center = $refs.extmap.mapCenter;"
						>
							<span>?</span>
							<span>{{ $store.state.t.i.buttons.help }}</span>
						</button>
						<button
							id="actions-exit"
							class="actions-button"
							:title="$store.state.t.i.hints.exit"
							@click="$root.toDBCompletely(); exit();"
						>
							<span>↪</span>
							<span>{{ $store.state.t.i.buttons.exit }}</span>
						</button>
					</div>
				</div>
				<div
					id="basic-left"
					class="app-cell"
				>
					<div id="basic-left__places">
						<div
							v-if="Object.keys($store.state.places).length > 0 || Object.keys($store.state.folders).length > 0"
							id="places-menu"
							class="menu"
						>
							<places-tree
								instanceid="placestree"
							/>
						</div>
						<div v-if="Object.keys($store.state.commonPlaces).length > 0 && commonPlacesShow">
							<h2 class="basiccolor">
								{{ $store.state.t.i.captions.commonPlaces }}
							</h2>
							<div class="margin_bottom">
								<div
									v-for="commonPlace in commonPlaces"
									:id="commonPlace.id"
									:key="commonPlace.id"
									:class="'place-button block_01' + (commonPlace === currentPlace ? ' active' : '')"
									@click="setCurrentPlace(commonPlace);"
								>
									{{ commonPlace.name }}
								</div>
							</div>
							<div class="margin_bottom">
								<a
									v-for="(page, index) in commonPlacesPagesCount"
									:key="index"
									href="javascript:void(0);"
									:class="'pseudo_button' + (index + 1 === commonPlacesPage ? ' un_imp' : '')"
									@click="commonPlacesPage = index + 1;"
								>
									{{ index + 1 }}
								</a>
							</div>
						</div>
					</div>
				</div>
				<div
					id="basic-basic"
					class="app-cell"
				>
					<component
						:is="$store.state.maps[$store.state.activeMapIndex].component"
						ref="extmap"
					/>
					<div
						id="sbs-top"
						:style="'left: -' + sidebarSize.left + 'px; right: -' + sidebarSize.right + 'px;'"
						@mousedown="sidebarDragStart($event, 'top');"
						@touchstart="sidebarDragStart($event, 'top');"
					/>
					<div
						id="sbs-right"
						:style="'top: -' + (sidebarSize.top + (compact ? 0 : sidebarSize.left)) + 'px; bottom: -' + sidebarSize.bottom + 'px;'"
						@mousedown="sidebarDragStart($event, 'right');"
						@touchstart="sidebarDragStart($event, 'right');"
					/>
					<div
						id="sbs-bottom"
						:style="'left: -' + sidebarSize.left + 'px; right: -' + sidebarSize.right + 'px;'"
						@mousedown="sidebarDragStart($event, 'bottom');"
						@touchstart="sidebarDragStart($event, 'bottom');"
					/>
					<div
						id="sbs-left"
						:style="'top: -' + (sidebarSize.top + (compact > 500 ? 0 : sidebarSize.left)) + 'px; bottom: -' + sidebarSize.bottom + 'px;'"
						@mousedown="sidebarDragStart($event, 'left');"
						@touchstart="sidebarDragStart($event, 'left');"
					/>
				</div>
				<div
					id="basic-right"
					class="app-cell"
				>
					<div>
						<div v-if="currentPlace">
							<dl
								v-for="field in orderedCurrentPlaceFields"
								:key="field"
								class="place-detailed margin_bottom_0"
							>
								<dt
									v-if="field === 'link'"
									class="place-detailed__link-dt"
								>
									<a
										v-if="!linkEditing && currentPlace[field].trim()"
										:href="currentPlace[field].trim()"
										target="_blank"
									>
										{{ $store.getters.placeFields[field] }}
									</a>
									<span v-else>
										{{ $store.getters.placeFields[field] }}:
									</span>
								</dt>
								<dt v-else-if="field === 'images' && orderedImages.length">
									{{ $store.getters.placeFields[field] }}:
								</dt>
								<div v-if="field === 'waypoint'">
									<div class="aligned-children">
										<div>
											<dt>
												{{ $store.getters.placeFields['latitude'] }}
											</dt>
											<dd>
												<input
													id="detailed-latitude"
													:value="currentPlaceLat"
													type="number"
													:disabled="$root.currentPlaceCommon"
													class="fieldwidth_100"
													@change="e => $store.dispatch('changePlace', {place: currentPlace, change: {latitude: e.target.value.trim()}})"
												>
											</dd>
										</div>
										<div>
											<dt>
												{{ $store.getters.placeFields['longitude'] }}
											</dt>
											<dd>
												<input
													id="detailed-longitude"
													:value="currentPlaceLon"
													type="number"
													:disabled="$root.currentPlaceCommon"
													class="fieldwidth_100"
													@change="e => $store.dispatch('changePlace', {place: currentPlace, change: {longitude: e.target.value.trim()}})"
												>
											</dd>
										</div>
									</div>
									<div>
										<input
											id="detailed-coordinates"
											:value="currentDegMinSec"
											type="text"
											:disabled="$root.currentPlaceCommon"
											class="fieldwidth_100"
											@change="e => {const coords = string2coords(e.target.value.trim()); if (coords === null) return; $store.dispatch('changePlace', {place: currentPlace, change: {latitude: coords[0], longitude: coords[1]}});}"
										>
									</div>
									<dt>
										{{ $store.getters.placeFields['altitudecapability'] }}
									</dt>
									<dd>
										<input
											id="detailed-altitudecapability"
											:value="$store.state.waypoints[currentPlace.waypoint].altitudecapability"
											type="number"
											:disabled="$root.currentPlaceCommon"
											class="fieldwidth_100"
											@change="e => $store.dispatch('changePlace', {place: currentPlace, change: {altitudecapability: e.target.value.trim()}})"
										>
									</dd>
								</div>
								<dt v-else-if="field !== 'common' && field !== 'link' && field !== 'waypoint' && field !== 'images'">
									{{ $store.getters.placeFields[field] }}:
								</dt>
								<dd v-if="field === 'srt' || field === 'link'">
									<input
										:id="'detailed-' + field"
										v-model.number.trim="currentPlace[field]"
										:type="field === 'srt' ? 'number' : 'text'"
										:disabled="$root.currentPlaceCommon"
										class="fieldwidth_100"
										@change="$store.dispatch('changePlace', {place: currentPlace, change: {[field]: currentPlace[field]}});"
									>
								</dd>
								<dd v-else-if="field === 'time'">
									<input
										:id="'detailed-' + field"
										v-model="currentPlace[field]"
										type="datetime-local"
										:disabled="$root.currentPlaceCommon"
										class="fieldwidth_100"
										@change="$store.dispatch('changePlace', {place: currentPlace, change: {[field]: currentPlace[field]}});"
									>
								</dd>
								<dd
									v-else-if="field === 'common'"
									class="margin_bottom"
								>
									<label>
										<input
											:id="'detailed-' + field"
											v-model="currentPlace[field]"
											type="checkbox"
											:disabled="$root.currentPlaceCommon"
											@change="$store.dispatch('changePlace', {place: currentPlace, change: {[field]: currentPlace[field]}});"
										>
										{{ $store.state.t.i.inputs.checkboxCommon }}
									</label>
								</dd>
								<dd
									v-else-if="field === 'images' && orderedImages.length"
									id="place-images"
								>
									<div class="dd-images">
										<div
											v-for="image in orderedImages"
											:id="image.id"
											:key="image.id"
											data-image
											:class="'place-image' + ($root.currentPlaceCommon ? '' : ' draggable')"
											:draggable="$root.currentPlaceCommon ? false : true"
											@click="$router.push({name: 'PlacesHomeImages', params: {imageId: image.id}}).catch(e => {console.error(e);})"
											@dragstart="$root.handleDragStart"
											@dragenter="$root.handleDragEnter"
										>
											<div
												class="block_02"
											>
												<img
													class="image-thumbnail border_1"
													:draggable="false"
													:src="constants.dirs.uploads.images.small + image.file"
													:alt="currentPlace.name"
													:title="currentPlace.name"
												>
												<div
													v-if="!$root.currentPlaceCommon"
													class="dd-images__delete button"
													:draggable="false"
													@click="$event.stopPropagation(); $store.commit('setIdleTime', 0); $root.deleteImages({[image.id]: image});"
												>
													×
												</div>
											</div>
										</div>
									</div>
								</dd>
								<dd v-else-if="field !== 'waypoint' && field !== 'images'">
									<textarea
										:id="'detailed-' + field"
										v-model.trim="currentPlace[field]"
										:disabled="$root.currentPlaceCommon"
										:placeholder="field === 'name' ? $store.state.t.i.inputs.placeName : (field === 'description' ? $store.state.t.i.inputs.placeDescription : '')"
										class="fieldwidth_100"
										@change="$store.dispatch('changePlace', {place: currentPlace, change: {[field]: currentPlace[field]}});"
									/>
								</dd>
							</dl>
						</div>
						<div
							v-if="currentPlace && !currentPlace.deleted && !$root.currentPlaceCommon"
							class="images-add margin_bottom"
						>
							<div class="images-add__div button">
								<span>{{ $store.state.t.i.buttons.addPhotos }}</span>
								<input
									id="images-add__input"
									ref="inputUploadFiles"
									type="file"
									name="files"
									multiple
									class="images-add__input"
									@change="uploadFiles($event);"
								>
							</div>
						</div>
						<div
							id="images-uploading"
							class="block_02 waiting hidden"
						>
							<span>… {{ $store.state.t.i.buttons.loading }} …</span>
						</div>
						<div v-if="currentPlace && !$root.currentPlaceCommon">
							<label>
								<input
									id="checkbox-homeplace"
									type="checkbox"
									:checked="currentPlace === $store.state.homePlace"
									@change="$store.dispatch('setHomePlace', ($event.target.checked ? currentPlace.id : null));"
								>
								{{ $store.state.t.i.inputs.checkboxHome }}
							</label>
						</div>
					</div>
				</div>
				<div
					id="bottom-left"
					class="app-cell"
				>
					<div class="control-buttons">
						<button
							id="placemarksShowHideButton"
							:class="'actions-button' + ($store.state.placemarksShow ? ' button-pressed' : '')"
							:title="$store.state.t.i.hints.shPlacemarks"
							@click="$store.dispatch('placemarksShowHide')"
						>
							<span>◆</span>
							<span>{{ $store.state.t.i.buttons.places }}</span>
						</button>
						<button
							id="commonPlacesShowHideButton"
							:class="'actions-button' + (commonPlacesShow ? ' button-pressed' : '')"
							:title="$store.state.t.i.hints.shCommonPlaces"
							@click="commonPlacesShowHide();"
						>
							<span>◇</span>
							<span>{{ $store.state.t.i.buttons.commonPlaces }}</span>
						</button>
						<button
							id="commonPlacemarksShowHideButton"
							:class="'actions-button' + ($store.state.commonPlacemarksShow ? ' button-pressed' : '')"
							:title="$store.state.t.i.hints.shCommonPlacemarks"
							@click="$store.dispatch('commonPlacemarksShowHide')"
						>
							<span>⬙</span>
							<span>{{ $store.state.t.i.buttons.commonPlacemarks }}</span>
						</button>
						<button
							id="centerPlacemarkShowHideButton"
							:class="'actions-button' + ($store.state.centerPlacemarkShow ? ' button-pressed' : '')"
							:title="$store.state.t.i.hints.shCenter"
							@click="$store.dispatch('centerPlacemarkShowHide')"
						>
							<span>◈</span>
							<span>{{ $store.state.t.i.buttons.center }}</span>
						</button>
					</div>
				</div>
				<div
					id="bottom-basic"
					class="app-cell"
				>
					<div class="choose-map">
						<select
							id="choose-map-input"
							@change="$store.dispatch('changeMap', $event.target.selectedIndex);"
						>
							<option
								v-for="(map, index) in $store.state.maps"
								:key="index"
								:value="map.component"
								:selected="map.component === $store.state.maps[$store.state.activeMapIndex].component"
							>
								{{ map.name }}
							</option>
						</select>
					</div>
					<div class="center-coordinates">
						<span class="imp">
							{{ $store.state.t.i.buttons.center }}
						</span>
						<span
							class="nobr"
							style="margin-left: 1em;"
						>
							{{ $store.state.t.i.captions.latitude }}:
							<input
								v-model.number.trim="$store.state.center.latitude"
								placeholder="latitude"
								title="$store.state.t.i.captions.latitude"
							>
						</span>
						<span
							class="nobr"
							style="margin-left: 1em;"
						>
							{{ $store.state.t.i.captions.longitude }}:
							<input
								v-model.number.trim="$store.state.center.longitude"
								placeholder="longitude"
								title="$store.state.t.i.captions.longitude"
							>
						</span>
					</div>
				</div>
				<router-view />
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, toRefs, reactive, computed } from 'vue';
import { directive as fullscreen } from 'vue-fullscreen'
import axios from 'axios';
import _ from 'lodash';
import { mapState } from 'vuex';
import { constants } from '@/shared/constants';
import {
	generateRandomString,
	sortObjects,
	deg2degMinSec,
	coords2string,
	string2coords,
} from '@/shared/common';
import { makeFieldsValidatable } from '@/shared/fields_validate';
import { emitter } from '@/shared/bus';
import PlacesDashboard from './PlacesDashboard.vue';
import PlacesTree from './PlacesTree.vue';
import PlacesMapYandex from './PlacesMapYandex.vue';
import PlacesMapOpenStreetMap from './PlacesMapOpenStreetMap.vue';
import { Waypoint, Place, Image } from '@/store/types';

export default defineComponent({
    directives: {
    	fullscreen,
	},
	components: {
		PlacesDashboard,
		PlacesTree,
		PlacesMapYandex,
		PlacesMapOpenStreetMap,
	},
	setup() {
		const root = ref();
		const state = reactive({
			fullscreen: false,
			teleport: true,
			pageOnly: false,
		});
		const options = computed(() => {
			return {
				callback: (isFullscreen) => {
					state.fullscreen = isFullscreen;
				},
				target: '.fullscreen-wrapper',
				teleport: state.teleport,
				pageOnly: state.pageOnly,
			}
		});
		return {
			root,
			...toRefs(state),
			options,
			deg2degMinSec,
			string2coords,
		};
	},
	data() {
		return {
			constants: constants,
			commonPlacesPage: 1,
			commonPlacesPagesCount: 0,
			commonPlacesOnPageCount: constants.commonplacesonpagecount,
			commonPlacesShow: false,
			sidebarSize: {
				top: constants.sidebars.top,
				right: constants.sidebars.right,
				bottom: constants.sidebars.bottom,
				left: constants.sidebars.left,
			},
			sidebarDrag: {what: null as unknown, x: 0, y: 0, w: 0, h: 0},
			compact: false as boolean,
			linkEditing: false,
			orderedCurrentPlaceFields: [
				'name',
				'description',
				'waypoint',
				'link',
				'time',
				'srt',
				'common',
				'images',
			],
			orderedCurrentWaypointFields: [
				'latitude',
				'longitude',
				'altitudecapability',
			],
		};
	},
	computed: {
		...mapState(['currentPlace', 'waypoints', 'colortheme']),
		commonPlaces(): Record<string, Place> {
			const commonPlaces: Record<string, Place> = {};
			for (const id in this.$store.state.commonPlaces) {
				if (
					Object.keys(this.$store.state.commonPlaces).indexOf(id) >=
					this.commonPlacesOnPageCount * (this.commonPlacesPage - 1) &&
					Object.keys(this.$store.state.commonPlaces).indexOf(id) <
					this.commonPlacesOnPageCount * this.commonPlacesPage
				) {
					commonPlaces[id] = this.$store.state.commonPlaces[id];
				}
			}
			return commonPlaces;
		},
		orderedImages(): Array<Image> {
			return (
				this.currentPlace
					? _.orderBy(this.currentPlace.images, 'srt')
					: []
			);
		},
		geomarksVisibility(): Record<string, boolean> {
			const geomarksVisibility: Record<string, boolean> = {};
			for (const id in this.$store.state.places) {
				geomarksVisibility[id] = this.$store.state.places[id].geomark;
			}
			return geomarksVisibility;
		},
		stateReady(): boolean {
			return this.$store.state.ready;
		},
		currentPlaceLat(): number {
			return this.waypoints[this.currentPlace.waypoint].latitude;
		},
		currentPlaceLon(): number {
			return this.waypoints[this.currentPlace.waypoint].longitude;
		},
		currentDegMinSec(): string {
			return coords2string([this.currentPlaceLat, this.currentPlaceLon]);
		},
	},
	watch: {
		stateReady() {
			this.stateReadyChanged();
		},
		fullscreen() {
			if (this.fullscreen) {
				document.querySelector('.fullscreen-wrapper')
					.classList.add('colortheme-' + this.colortheme);
			}
		},
		colortheme() {
			this.updateColorthemeInFullscreen();
		},
	},
	created() {
		emitter.on('setCurrentPlace', (payload: {place: Place}) => {
			this.setCurrentPlace(payload.place);
		});
		emitter.on('deletePlace', (place: Place) => {
			this.deletePlace(place);
		});
	},
	mounted() {
		if (this.stateReady) {
			this.stateReadyChanged();
		}
		this.$store.commit('setIdleTime', 0);
		if (!this.$root.idleTimeInterval) {
			this.$root.idleTimeInterval =
				window.setInterval(() => {
					if (this.$store.state.idleTime < constants.sessionlifetime) {
						this.$store.commit('setIdleTime', this.$store.state.idleTime + 1);
					} else {
						window.clearInterval(this.$root.idleTimeInterval);
						this.$root.idleTimeInterval = undefined;
						this.$store.dispatch('unload');
						this.$router.push({name: 'PlacesAuth'})
							.catch(e => {console.error(e);})
						;
					}
				}, 1000);
		}
		this.$nextTick(() => {
			makeFieldsValidatable();
		});
	},
	updated() {
		makeFieldsValidatable();
	},
	beforeUnmount() {
		document.removeEventListener('dragover', this.$root.handleDragOver, false);
		document.removeEventListener('drop', this.$root.handleDrop, false);
		document.removeEventListener('keyup', this.keyup, false);
		emitter.off('setCurrentPlace');
		window.clearInterval(this.$root.idleTimeInterval);
	},
	methods: {
		updateColorthemeInFullscreen(): void {
			if (this.fullscreen) {
				const fullscreenWrapper = document.querySelector('.fullscreen-wrapper');
				for (const colortheme of this.$root.colorthemes) {
					fullscreenWrapper.classList.remove('colortheme-' + colortheme.value);
				}
				fullscreenWrapper.classList.add('colortheme-' + this.colortheme);
			}
		},
		blur() {
			const el = this.$el.querySelector(':focus');
			if (el) {
				try {(el as HTMLElement).blur();} catch(e) {console.error(e);}
			}
		},
		exit() {
			this.$store.dispatch('unload');
			this.$router.push({name: 'PlacesAuth'}).catch(e => {console.error(e);});
		},
		stateReadyChanged() {
			if (this.stateReady) {
				this.$store.dispatch('restoreObjectsAsLinks');
				if (!this.currentPlace) {
					if (this.$store.state.homePlace) {
						this.setCurrentPlace(this.$store.state.homePlace);
					} else if (Object.keys(this.$store.state.places).length) {
						let firstPlaceInRoot: Place;
						for (const id in this.$store.state.places) {
							if (this.$store.state.places[id].folderid === 'root') {
								firstPlaceInRoot = this.$store.state.places[id];
								break;
							}
						}
						if (firstPlaceInRoot) {
							this.setCurrentPlace(firstPlaceInRoot);
						} else {
							this.setCurrentPlace(
								this.$store.state.places[
									Object.keys(this.$store.state.places)[0]
								]
							)
						}
					}
				}
				this.openTreeToCurrentPlace();
				this.commonPlacesPagesCount = Math.ceil(
					Object.keys(this.$store.state.commonPlaces).length /
					this.commonPlacesOnPageCount
				);
				this.$root.currentPlaceCommon = false;
				if (
					this.currentPlace &&
					this.currentPlace.common &&
					this.currentPlace.userid !== this.$store.state.user.id
				) {
					const inPaginator =
						Object.keys(this.$store.state.commonPlaces).indexOf(this.currentPlace.id) /
						this.commonPlacesOnPageCount
					;
					this.commonPlacesPage = (Number.isInteger(inPaginator)
						? inPaginator + 1
						: Math.ceil(inPaginator)
					);
					this.$root.currentPlaceCommon = true;
				}
				document.addEventListener('dragover', this.$root.handleDragOver, false);
				document.addEventListener('drop', this.$root.handleDrop, false);
				document.addEventListener('keyup', this.keyup, false);
				window.addEventListener('resize', this.windowResize, false);
				if (this.$store.state.user.testaccount) {
					window.setTimeout(() => {
						this.$store.dispatch("setMessage",
							this.$store.state.t.m.popup.testAccount
						);
					}, 3000);
				}
				this.windowResize();
				this.$store.commit('backupState');
			}
		},
		openTreeToCurrentPlace() {
			if (!this.$root.currentPlaceCommon && this.currentPlace) {
				let folder, folderid = this.currentPlace.folderid;
				while (folderid) {
					folder = this.$store.getters.treeFlat[folderid];
					if (!folder) {
						break;
					}
					this.$store.dispatch('folderOpenClose', {
						folder: folder,
						opened: true,
					});
					folderid = folder.parent;
				}
			}
		},
		setCurrentPlace(place: Place | null): void {
			if (this.currentPlace && place === this.currentPlace) return;
			if (!place) {
				this.$store.commit('setCurrentPlace', null);
				return;
			}
			this.$store.commit('setCurrentPlace', place);
			this.$root.currentPlaceCommon = (
				this.currentPlace.userid !== this.$store.state.user.id
					? true
					: false
			);
			this.openTreeToCurrentPlace();
			this.$store.dispatch('updateMap', {
				latitude: this.$store.state.waypoints[this.currentPlace.waypoint].latitude,
				longitude: this.$store.state.waypoints[this.currentPlace.waypoint].longitude,
			});
		},
		async appendPlace() {
			if (
				this.$store.state.serverConfig.rights.placescount < 0 ||
				this.$store.state.serverConfig.rights.placescount
					> Object.keys(this.$store.state.places).length ||
				this.$store.state.user.testaccount
			) {
				let lat: number, lng: number;
				if (
					this.$store.state.maps[this.$store.state.activeMapIndex].component ===
					'PlacesMapYandex'
				) {
					lat = this.$refs.extmap.map.getCenter()[0].toFixed(7);
					lng = this.$refs.extmap.map.getCenter()[1].toFixed(7);
				} else {
					lat = this.$refs.extmap.map.getCenter().lat.toFixed(7);
					lng = this.$refs.extmap.map.getCenter().lng.toFixed(7);
				}
				const newWaypoint: Waypoint = {
					id: generateRandomString(32),
					latitude:
						Number(lat) ||
						Number(constants.map.initial.latitude) ||
						null,
					longitude:
						Number(lng) ||
						Number(constants.map.initial.longitude) ||
						null,
					altitudecapability: null,
					time: new Date().toISOString().slice(0, -5),
					common: false,
					type: 'waypoint',
					added: true,
					deleted: false,
					updated: false,
					show: true,
				};
				const newPlace: Place = {
					type: 'place',
					userid: sessionStorage.getItem('places-userid'),
					name: '',
					description: '',
					waypoint: newWaypoint.id,
					link: '',
					time: new Date().toISOString().slice(0, -5),
					id: generateRandomString(32),
					folderid:
						this.currentPlace
							? this.currentPlace.folderid
							: 'root'
					,
					srt: Number(
						Object.keys(this.$store.state.places).length > 0
							? Math.ceil(Math.max(
								...Object.values(this.$store.state.places).map(
									(place: Place) => place.srt
								)
							)) + 1
							: 1
					) || 0,
					common: false,
					geomark: true,
					images: {},
					added: true,
					deleted: false,
					updated: false,
					show: true,
				};
				await this.$store.dispatch('addPlace', {place: newPlace});
				this.$store.dispatch('addWaypoint', {waypoint: newWaypoint, from: newPlace});
				this.setCurrentPlace(newPlace);
				this.$nextTick(() => {
					document.getElementById('detailed-name')!.classList.add('highlight');
				});
				window.setTimeout(function() {
					document.getElementById('detailed-name')!.classList.remove('highlight');
					document.getElementById('detailed-name')!.focus();
				}, 500);
				return newPlace;
			} else {
				this.$store.dispatch('setMessage',
					this.$store.state.t.m.popup.placesCountExceeded
				);
			}
		},
		deletePlace(place: Place) {
			if (place === this.currentPlace) {
				// Set current place
				if (Object.keys(this.$store.state.places).length > 1) {
					if (document.getElementById(place.id)!.nextElementSibling!) {
						this.setCurrentPlace(this.$store.state.places[
							document.getElementById(place.id)!.nextElementSibling!.id
						]);
					} else if (document.getElementById(place.id)!.previousElementSibling!) {
						this.setCurrentPlace(this.$store.state.places[
							document.getElementById(place.id)!.previousElementSibling!.id
						]);
					} else if (
						this.$store.state.homePlace &&
						this.$store.state.homePlace !== place
					) {
						this.setCurrentPlace(this.$store.state.homePlace);
					} else {
						let firstPlaceInRoot: Place, inRoot = false;
						for (const id in this.$store.state.places) {
							if (this.$store.state.places[id].folderid === 'root') {
								if (firstPlaceInRoot) {
									if (this.$store.state.places[id].srt < firstPlaceInRoot.srt) {
										firstPlaceInRoot = this.$store.state.places[id];
									}
								} else {
									firstPlaceInRoot = this.$store.state.places[id];
								}
								inRoot = true;
							}
						}
						if (inRoot) {
							this.setCurrentPlace(firstPlaceInRoot);
						} else {
							this.setCurrentPlace(
								this.$store.state.places[Object.keys(this.$store.state.places)[0]]
							);
						}
					}
				} else {
					this.setCurrentPlace(null);
				}
			}
		},
		commonPlacesShowHide(show = null) {
			this.commonPlacesShow =
				show === null
					? !this.commonPlacesShow
					: show
			;
			this.$store.dispatch('commonPlacemarksShowHide', this.commonPlacesShow);
		},
		importFromFile() {
			const mime = (this.$refs.inputImportFromFile as HTMLInputElement).files![0].type;
			const reader = new FileReader();
			reader.onload = (event: Event) => {
				this.$nextTick(() => {
					this.$store.dispatch('setPlaces', {
						text: (event.target as FileReader).result,
						mime: mime,
					});
					(this.$refs.inputImportFromFile as HTMLInputElement).value = '';
				});
			};
			if (mime === 'application/json' || mime === 'application/gpx+xml') {
				reader.readAsText(
					(this.$refs.inputImportFromFile as HTMLInputElement).files![0]
				);
			} else {
				this.$store.dispatch('setMessage',
					this.$store.state.t.m.popup.invalidImportFileType
				);
			}
		},
		uploadFiles(event: Event) {
			event.preventDefault();
			if (this.$store.state.user.testaccount) {
				this.$store.dispatch('setMessage',
					this.$store.state.t.m.popup.taNotAllowFileUploads
				);
			} else {
				const
					data = new FormData(),
					files = (this.$refs.inputUploadFiles as HTMLInputElement).files,
					filesArray: Array<Image> = [];
				let srt: number;
				if (
					this.currentPlace.images &&
					Object.keys(this.currentPlace.images).length
				) {
					const storeImages = Object.values(this.currentPlace.images);
					srt = Number(sortObjects(storeImages, 'srt').pop().srt) || 0;
				} else {
					srt = 0;
				}
				for (let i = 0; i < files.length; i++) {
					if (!this.$store.state.serverConfig.mimes[files![i].type]) {
						this.$store.dispatch('setMessage',
							this.$store.state.t.m.popup.file + ' ' +
							files![i].name +
							' ' + this.$store.state.t.m.popup.fileNotImage
						);
					} else if (files![i].size > this.$store.state.serverConfig.uploadsize) {
						this.$store.dispatch('setMessage',
							this.$store.state.t.m.popup.file + ' ' +
							files![i].name +
							' ' + this.$store.state.t.m.popup.fileTooLarge
						);
					} else {
						const rndname = generateRandomString(32);
						data.append(rndname, files![i]);
						filesArray.push({
							id: rndname,
							file:
								rndname +
								'.' +
								this.$store.state.serverConfig.mimes[files![i].type]
							,
							size: Number(files![i].size) || null,
							type: files![i].type,
							lastmodified: Number(files![i].lastModified) || null,
							srt: ++srt,
							placeid: this.currentPlace.id
								? this.currentPlace.id
								: null,
						});
					}
				}
				if (filesArray.length) {
					document.getElementById('images-uploading')!.classList.remove('hidden');
					data.append('userid', this.$store.state.user.id);
					axios.post('/backend/upload.php', data)
						.then(response => {
							(document.getElementById('images-add__input') as HTMLInputElement).value = '';
							document.getElementById('images-uploading')!.classList.add('hidden');
							for (let i = 0; i < filesArray.length; i++) {
								if (!response.data[1].find(
									(f: Record<string, unknown>) =>
										f.id === filesArray[i].id
								)) {
									filesArray.splice(i, 1);
									i--;
								}
							}
							/*
							Проверка накопленных кодов ошибок и замечаний
							в процессе выполнения /dist/backend/upload.php
							*/
							response.data[0].forEach((code: number) => {
								switch (code) {
									case 2 :
										this.$store.dispatch('setMessage',
											this.$store.state.t.m.popup.taNotAllowFileUploads
										);
										break;
									case 3 :
										this.$store.dispatch('setMessage',
											this.$store.state.t.m.popup.filesNotImages
										);
										break;
									case 4 :
										this.$store.dispatch('setMessage',
											this.$store.state.t.m.popup.filesTooLarge +
											' ' + (Number(
												(this.$store.state.serverConfig.rights.photosize
												/ 1048576).toFixed(3)
											) || 0) + ' Mb.'
										);
										break;
								}
							});
							if (response.data[1].length > 0) {
								if (this.currentPlace) {
									const newImagesObject: Record<string, Image> =
										Object.assign({}, (this.currentPlace.images
											? this.currentPlace.images
											: {}
										));
									for (const image of filesArray) {
										newImagesObject[image.id] = image;
									}
									this.$store.dispatch('changePlace', {
										place: this.currentPlace,
										change: {images: newImagesObject},
									}).then(() => {
										emitter.emit('toDB', {
											what: 'places',
											data: [this.currentPlace],
										});
									});
								}
								emitter.emit('toDB', {
									what: 'images_upload',
									data: filesArray,
								});
								this.$store.dispatch('setMessage',
									this.$store.state.t.m.popup.filesUploadedSuccessfully
								);
							}
						})
						.catch(error => {
							this.$store.dispatch('setMessage',
								this.$store.state.t.m.popup.filesUploadError +
								' ' + error
							);
						});
				}
			}
		},
		keyup(event: Event) {
			if (
				(event as KeyboardEvent).altKey &&
				(event as KeyboardEvent).shiftKey
			) {
				if (
					(constants.shortcuts as Record<string, string>)
						[(event as KeyboardEvent).keyCode]
				) {
					this.blur();
				}
				switch (
					(constants.shortcuts as Record<string, string>)
						[(event as KeyboardEvent).keyCode]
				) {
					case 'add' :
						this.appendPlace();
						break;
					case 'delete' :
						if (
							this.currentPlace &&
								this.currentPlace.userid ===
									this.$store.state.user.id
						) {
							this.$store.dispatch('deletePlaces', {
								places: {[this.currentPlace.id]: this.currentPlace}
							});
						}
						break;
					case 'add folder' :
						this.$router.push({name: 'PlacesHomeFolder'})
							.catch(e => {console.error(e);})
						;
						break;
					case 'edit mode' :
						this.$root.foldersEditMode = !this.$root.foldersEditMode;
						if (
							document.getElementById('actions-edit-folders')!
								.classList.contains('button-pressed')
						) {
							document.getElementById('actions-edit-folders')!
								.classList.remove('button-pressed')
							;
						} else {
							document.getElementById('actions-edit-folders')!
								.classList.add('button-pressed')
							;
						}
						break;
					case 'import' :
						document.getElementById('inputImportFromFile')!.click();
						break;
					case 'export' :
						this.$router.push({
							name: 'PlacesHomeExport',
							params: {mime: 'application/gpx+xml'},
						}).catch(e => {console.error(e);});
						break;
					case 'save' :
						emitter.emit('toDBCompletely');
						break;
					case 'help' :
						this.$router.push({name: 'PlacesHomeText', params: {what: 'about'}});
						break;
					case 'revert' :
						document.location.reload();
						break;
					case 'quit' :
						emitter.emit('toDBCompletely');
						this.exit();
						break;
					case 'other' :
						this.commonPlacesShowHide();
						break;
					case 'placemarks' :
						this.$store.dispatch('placemarksShowHide');
						break;
					case 'other placemarks' :
						this.$store.dispatch('commonPlacemarksShowHide');
						break;
					case 'center' :
						this.$store.dispatch('centerPlacemarkShowHide');
						break;
					case 'undo' :
						this.$store.dispatch('undo');
						break;
					case 'redo' :
						this.$store.dispatch('redo');
						break;
				}
			}
		},
		windowResize() {
			if (window.innerWidth > constants.compactWidth) {
				this.sidebarSize.top = constants.sidebars.top;
				this.sidebarSize.right = constants.sidebars.right;
				this.sidebarSize.bottom = constants.sidebars.bottom;
				this.sidebarSize.left = constants.sidebars.left;
				document.getElementById('sbs-left')!.style.marginLeft = '0';
				document.getElementById('sbs-top')!.style.marginTop = '0';
				document.getElementById('sbs-bottom')!.style.marginBottom = '0';
				this.compact = false;
			} else {
				if (this.compact) {
					this.sidebarSize.top = parseInt(window.getComputedStyle(
						document.getElementById('top-left') as Element
					).height);
				}
				this.sidebarSize.right = parseInt(window.getComputedStyle(
					document.getElementById('top-right') as Element
				).width);
				(this.sidebarSize.bottom as unknown) = (this.compact
					? parseInt(window.getComputedStyle(
						document.getElementById('basic-basic') as Element
					).height)
					: '1fr'
				);
				this.sidebarSize.left = parseInt(window.getComputedStyle(
					document.getElementById('top-left') as Element
				).width);
				document.getElementById('sbs-left')!.style.marginLeft =
					this.sidebarSize.left + 'px';
				document.getElementById('sbs-top')!.style.marginTop =
					-parseInt(window.getComputedStyle(
						document.getElementById('basic-left') as Element
					).height) + 'px';
				document.getElementById('sbs-bottom')!.style.marginBottom =
					this.sidebarSize.bottom + 'px';
				this.compact = true;
			}
			document.getElementById('grid')!.classList.remove('loading-grid');
		},
		sidebarDragStart(event: Event, what: string) {
			event.preventDefault();
			this.sidebarDrag.what = what;
			if ((event as TouchEvent).changedTouches) {
				this.sidebarDrag.x = (event as TouchEvent).changedTouches[0].pageX;
				this.sidebarDrag.y = (event as TouchEvent).changedTouches[0].pageY;
			} else {
				this.sidebarDrag.x = (event as MouseEvent).screenX;
				this.sidebarDrag.y = (event as MouseEvent).screenY;
			}
			switch (this.sidebarDrag.what) {
				case 'top' :
					this.sidebarDrag.h = this.sidebarSize.top;
					break;
				case 'bottom' :
					this.sidebarDrag.h = this.sidebarSize.bottom;
					break;
				case 'left' :
					this.sidebarDrag.w = this.sidebarSize.left;
					break;
				case 'right' :
					this.sidebarDrag.w = this.sidebarSize.right;
					break;
			}
		},
		documentMouseOver(event: Event) {
			if (this.sidebarDrag.what !== null) {
				switch (this.sidebarDrag.what) {
					case 'top' :
						this.sidebarSize.top =
							this.sidebarDrag.h - this.sidebarDrag.y +
							((event as TouchEvent).changedTouches
								? (event as TouchEvent).changedTouches[0].pageY
								: (event as MouseEvent).screenY
							);
						break;
					case 'bottom' :
						this.sidebarSize.bottom =
							this.sidebarDrag.h + this.sidebarDrag.y -
							((event as TouchEvent).changedTouches
								? (event as TouchEvent).changedTouches[0].pageY
								: (event as MouseEvent).screenY
							);
						break;
					case 'left' :
						this.sidebarSize.left =
							this.sidebarDrag.w - this.sidebarDrag.x +
							((event as TouchEvent).changedTouches
								? (event as TouchEvent).changedTouches[0].pageX
								: (event as MouseEvent).screenX
							);
						break;
					case 'right' :
						this.sidebarSize.right =
							this.sidebarDrag.w + this.sidebarDrag.x -
							((event as TouchEvent).changedTouches
								? (event as TouchEvent).changedTouches[0].pageX
								: (event as MouseEvent).screenX
							);
						break;
				}
			}
		},
		sidebarDragStop() {
			this.sidebarDrag.what = null;
			if (this.compact) {
				this.windowResize();
			}
		},
		// Search and select a place by name
		selectPlaces(event: Event) {
			if ((event as KeyboardEvent).keyCode === 27) {
				(event.target as HTMLInputElement).value = '';
			} else {
				for (const id in this.$store.state.places) {
					const regexp = new RegExp(
						(event.target as HTMLInputElement).value, 'i'
					);
					if (
						(event.target as HTMLInputElement).value.length > 1 &&
						regexp.test(this.$store.state.places[id].name)
					) {
						this.setCurrentPlace(this.$store.state.places[id]);
					}
				}
			}
		},
	},
});
</script>
