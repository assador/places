<template>
	<div ref="root">
		<div class="fullscreen-wrapper">
			<div
				id="grid"
				class="loading-grid"
				:style="compact ? ('grid-template-columns: ' + sidebarSize.left + 'px auto; grid-template-rows: auto ' + sidebarSize.top + 'px 1fr ' + (compact === -1 ? '1fr' : (sidebarSize.bottom + (typeof(sidebarSize.bottom) === 'number' ? 'px' : ''))) + ' auto;') : ('grid-template-rows: ' + sidebarSize.top + 'px 1fr ' + sidebarSize.bottom + 'px; grid-template-columns: ' + sidebarSize.left + 'px 1fr ' + sidebarSize.right + 'px;')"
				@mousemove="e => documentMouseOver(e)"
				@touchmove="e => documentMouseOver(e)"
				@mouseup="sidebarDragStop"
				@touchend="sidebarDragStop"
			>
				<div
					id="top-left"
					class="app-cell fieldwidth_100"
				>
					<div class="control-buttons">
						<button
							id="actions-append"
							class="actions-button"
							:title="store.state.t.i.hints.addPlace"
							@click="appendPlace();"
						>
							<span>+</span>
							<span>{{ store.state.t.i.buttons.newPlace }}</span>
						</button>
						<button
							id="actions-delete"
							class="actions-button"
							:title="store.state.t.i.hints.deletePlace"
							:disabled="!(store.state.user && currentPlace && currentPlace.userid === store.state.user.id)"
							@click="store.dispatch('deletePlaces', {places: {[currentPlace.id]: currentPlace}});"
						>
							<span>-</span>
							<span>{{ store.state.t.i.buttons.delete }}</span>
						</button>
						<button
							id="actions-append-folder"
							class="actions-button"
							:title="store.state.t.i.hints.addFolder"
							@click="router.push({name: 'PlacesHomeFolder'}).catch(e => {console.error(e);});"
						>
							<span>↧</span>
							<span>{{ store.state.t.i.buttons.newFolder }}</span>
						</button>
						<button
							id="actions-edit-folders"
							:class="'actions-button' + (foldersEditMode ? ' button-pressed' : '')"
							:title="store.state.t.i.hints.editFolders"
							@click="foldersEditMode = !foldersEditMode;"
						>
							<span>⇆</span>
							<span>{{ store.state.t.i.buttons.editFolders }}</span>
						</button>
						<input
							:placeholder="store.state.t.i.inputs.searchPlaces"
							:title="store.state.t.i.inputs.searchPlaces"
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
								{{ store.state.t.i.brand.header }} —
								<router-link to="/account">
									{{ store.state.user ? store.state.user.login : 'o_O' }}
								</router-link>
								(<router-link
									v-if="
										!!store.state.user &&
										!!store.state.user.groups.find(
											g => g.parent === 'management'
										)
									"
									to="/admin"
								>
админка
</router-link>)
							</h1>
							<div>{{ store.state.t.i.brand.slogan }}</div>
						</div>
						<places-dashboard />
					</div>
					<div
						id="messages"
						class="invisible"
						@mouseover="store.commit('setMouseOverMessages', true)"
						@mouseout="store.commit('setMouseOverMessages', false)"
						@click="store.dispatch('clearMessages');"
					>
						<div
							v-for="(message, index) in store.state.messages"
							:id="'message-' + index"
							:key="index"
							class="message border_1"
						>
							{{ store.state.messages[index] }}
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
							:title="store.state.t.i.buttons.fullscreen"
						>
							<span>⤧</span>
							<span>{{ store.state.t.i.buttons.fullscreen }}</span>
						</button>
						<button
							id="actions-undo"
							class="actions-button"
							:title="store.state.t.i.buttons.undo"
							@click="store.dispatch('undo');"
						>
							<span>↺</span>
							<span>{{ store.state.t.i.buttons.undo }}</span>
						</button>
						<button
							id="actions-redo"
							class="actions-button"
							:title="store.state.t.i.buttons.redo"
							@click="store.dispatch('redo');"
						>
							<span>↻</span>
							<span>{{ store.state.t.i.buttons.redo }}</span>
						</button>
						<button
							id="actions-save"
							:class="'actions-button' + (!store.state.saved ? ' button-pressed highlight' : '')"
							:title="(!store.state.saved ? (store.state.t.i.hints.notSaved + '. ') : '') + store.state.t.i.hints.sabeToDb"
							@click="toDBCompletely"
						>
							<span>↸</span>
							<span>{{ store.state.t.i.buttons.todb }}</span>
						</button>
						<button
							id="actions-import"
							class="actions-button"
							:title="store.state.t.i.hints.importPlaces"
							onclick="document.getElementById('inputImportFromFile').click();"
						>
							<span>↲</span>
							<span>{{ store.state.t.i.buttons.import }}</span>
						</button>
						<button
							id="actions-export"
							class="actions-button"
							:title="store.state.t.i.hints.exportPlaces"
							@click="router.push({name: 'PlacesHomeExport'})"
						>
							<span>↱</span>
							<span>{{ store.state.t.i.buttons.export }}</span>
						</button>
						<button
							id="actions-about"
							class="actions-button"
							:title="store.state.t.i.hints.about"
							@click="router.push({name: 'PlacesHomeText'}); extmap.center = extmap.mapCenter;"
						>
							<span>?</span>
							<span>{{ store.state.t.i.buttons.help }}</span>
						</button>
						<button
							id="actions-exit"
							class="actions-button"
							:title="store.state.t.i.hints.exit"
							@click="e => {toDBCompletely(); exit();}"
						>
							<span>↪</span>
							<span>{{ store.state.t.i.buttons.exit }}</span>
						</button>
					</div>
				</div>
				<div
					id="basic-left"
					class="app-cell"
				>
					<div id="basic-left__places">
						<div
							v-if="Object.keys(store.state.places).length > 0 || Object.keys(store.state.folders).length > 0"
							id="places-menu"
							class="menu"
						>
							<places-tree
								instanceid="placestree"
							/>
						</div>
						<div v-if="Object.keys(store.state.commonPlaces).length > 0 && commonPlacesShow">
							<h2 class="basiccolor">
								{{ store.state.t.i.captions.commonPlaces }}
							</h2>
							<div class="margin_bottom">
								<div
									v-for="commonPlace in commonPlaces"
									:id="commonPlace.id"
									:key="commonPlace.id"
									:class="'place-button block_01' + (commonPlace === currentPlace ? ' active' : '')"
									@click="setCurrentPlace(commonPlace)"
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
					<component :is="maps[store.state.activeMapIndex].component" />
					<div
						id="sbs-top"
						:style="'left: -' + sidebarSize.left + 'px; right: -' + sidebarSize.right + 'px;'"
						@mousedown="e => sidebarDragStart(e, 'top')"
						@touchstart="e => sidebarDragStart(e, 'top')"
					/>
					<div
						id="sbs-right"
						:style="'top: -' + (sidebarSize.top + (compact ? 0 : sidebarSize.left)) + 'px; bottom: -' + sidebarSize.bottom + 'px;'"
						@mousedown="e => sidebarDragStart(e, 'right')"
						@touchstart="e => sidebarDragStart(e, 'right')"
					/>
					<div
						id="sbs-bottom"
						:style="'left: -' + sidebarSize.left + 'px; right: -' + sidebarSize.right + 'px;'"
						@mousedown="e => sidebarDragStart(e, 'bottom')"
						@touchstart="e => sidebarDragStart(e, 'bottom')"
					/>
					<div
						id="sbs-left"
						:style="'top: -' + (sidebarSize.top + (compact as number > 500 ? 0 : sidebarSize.left)) + 'px; bottom: -' + sidebarSize.bottom + 'px;'"
						@mousedown="e => sidebarDragStart(e, 'left')"
						@touchstart="e => sidebarDragStart(e, 'left')"
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
										{{ store.getters.placeFields[field] }}
									</a>
									<span v-else>
										{{ store.getters.placeFields[field] }}:
									</span>
								</dt>
								<dt v-else-if="field === 'images' && orderedImages.length">
									{{ store.getters.placeFields[field] }}:
								</dt>
								<div v-if="field === 'waypoint'">
									<div class="aligned-children">
										<div>
											<dt>
												{{ store.getters.placeFields['latitude'] }}
											</dt>
											<dd>
												<input
													id="detailed-latitude"
													:value="currentPlaceLat"
													type="number"
													:disabled="!!currentPlaceCommon"
													class="fieldwidth_100"
													@change="e => store.dispatch('changePlace', {place: currentPlace, change: {latitude: (e.target as HTMLInputElement).value.trim()}})"
												>
											</dd>
										</div>
										<div>
											<dt>
												{{ store.getters.placeFields['longitude'] }}
											</dt>
											<dd>
												<input
													id="detailed-longitude"
													:value="currentPlaceLon"
													type="number"
													:disabled="!!currentPlaceCommon"
													class="fieldwidth_100"
													@change="e => store.dispatch('changePlace', {place: currentPlace, change: {longitude: (e.target as HTMLInputElement).value.trim()}})"
												>
											</dd>
										</div>
									</div>
									<div>
										<input
											id="detailed-coordinates"
											:value="currentDegMinSec"
											type="text"
											:disabled="!!currentPlaceCommon"
											class="fieldwidth_100"
											@change="e => {const coords = string2coords((e.target as HTMLInputElement).value.trim()); if (coords === null) return; store.dispatch('changePlace', {place: currentPlace, change: {latitude: coords[0], longitude: coords[1]}});}"
										>
									</div>
									<dt>
										{{ store.getters.placeFields['altitudecapability'] }}
									</dt>
									<dd>
										<input
											id="detailed-altitudecapability"
											:value="store.state.waypoints[currentPlace.waypoint].altitudecapability"
											type="number"
											:disabled="!!currentPlaceCommon"
											class="fieldwidth_100"
											@change="e => store.dispatch('changePlace', {place: currentPlace, change: {altitudecapability: (e.target as HTMLInputElement).value.trim()}})"
										>
									</dd>
								</div>
								<dt v-else-if="field !== 'common' && field !== 'link' && field !== 'waypoint' && field !== 'images'">
									{{ store.getters.placeFields[field] }}:
								</dt>
								<dd v-if="field === 'srt' || field === 'link'">
									<input
										:id="'detailed-' + field"
										v-model.number.trim="currentPlace[field]"
										:type="field === 'srt' ? 'number' : 'text'"
										:disabled="!!currentPlaceCommon"
										class="fieldwidth_100"
										@change="store.dispatch('changePlace', {place: currentPlace, change: {[field]: currentPlace[field]}});"
									>
								</dd>
								<dd v-else-if="field === 'time'">
									<input
										:id="'detailed-' + field"
										v-model="currentPlace[field]"
										type="datetime-local"
										:disabled="!!currentPlaceCommon"
										class="fieldwidth_100"
										@change="store.dispatch('changePlace', {place: currentPlace, change: {[field]: currentPlace[field]}});"
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
											:disabled="!!currentPlaceCommon"
											@change="store.dispatch('changePlace', {place: currentPlace, change: {[field]: currentPlace[field]}});"
										>
										{{ store.state.t.i.inputs.checkboxCommon }}
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
											:class="'place-image' + (currentPlaceCommon ? '' : ' draggable')"
											:draggable="currentPlaceCommon ? false : true"
											@click="router.push({name: 'PlacesHomeImages', params: {imageId: image.id}}).catch(e => {console.error(e);})"
											@dragstart="handleDragStart"
											@dragenter="handleDragEnter"
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
													v-if="!currentPlaceCommon"
													class="dd-images__delete button"
													:draggable="false"
													@click="e => {
														e.stopPropagation();
														store.commit('setIdleTime', 0);
														deleteImages({[image.id]: image});
													}"
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
										:disabled="!!currentPlaceCommon"
										:placeholder="field === 'name' ? store.state.t.i.inputs.placeName : (field === 'description' ? store.state.t.i.inputs.placeDescription : '')"
										class="fieldwidth_100"
										@change="store.dispatch('changePlace', {place: currentPlace, change: {[field]: currentPlace[field]}});"
									/>
								</dd>
							</dl>
						</div>
						<div
							v-if="currentPlace && !currentPlace.deleted && !currentPlaceCommon"
							class="images-add margin_bottom"
						>
							<div class="images-add__div button">
								<span>{{ store.state.t.i.buttons.addPhotos }}</span>
								<input
									id="images-add__input"
									ref="inputUploadFiles"
									type="file"
									name="files"
									multiple
									class="images-add__input"
									@change="e => uploadFiles(e)"
								>
							</div>
						</div>
						<div
							id="images-uploading"
							class="block_02 waiting hidden"
						>
							<span>… {{ store.state.t.i.buttons.loading }} …</span>
						</div>
						<div v-if="currentPlace && !currentPlaceCommon">
							<label>
								<input
									id="checkbox-homeplace"
									type="checkbox"
									:checked="currentPlace === store.state.homePlace"
									@change="e => store.dispatch('setHomePlace', ((e.target as HTMLInputElement).checked ? currentPlace.id : null))"
								>
								{{ store.state.t.i.inputs.checkboxHome }}
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
							:class="'actions-button' + (store.state.placemarksShow ? ' button-pressed' : '')"
							:title="store.state.t.i.hints.shPlacemarks"
							@click="store.dispatch('placemarksShowHide')"
						>
							<span>◆</span>
							<span>{{ store.state.t.i.buttons.places }}</span>
						</button>
						<button
							id="commonPlacesShowHideButton"
							:class="'actions-button' + (commonPlacesShow ? ' button-pressed' : '')"
							:title="store.state.t.i.hints.shCommonPlaces"
							@click="commonPlacesShowHide();"
						>
							<span>◇</span>
							<span>{{ store.state.t.i.buttons.commonPlaces }}</span>
						</button>
						<button
							id="commonPlacemarksShowHideButton"
							:class="'actions-button' + (store.state.commonPlacemarksShow ? ' button-pressed' : '')"
							:title="store.state.t.i.hints.shCommonPlacemarks"
							@click="store.dispatch('commonPlacemarksShowHide')"
						>
							<span>⬙</span>
							<span>{{ store.state.t.i.buttons.commonPlacemarks }}</span>
						</button>
						<button
							id="centerPlacemarkShowHideButton"
							:class="'actions-button' + (store.state.centerPlacemarkShow ? ' button-pressed' : '')"
							:title="store.state.t.i.hints.shCenter"
							@click="store.dispatch('centerPlacemarkShowHide')"
						>
							<span>◈</span>
							<span>{{ store.state.t.i.buttons.center }}</span>
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
							@change="e => store.dispatch('changeMap', (e.target as HTMLSelectElement).selectedIndex)"
						>
							<option
								v-for="(map, index) in maps"
								:key="index"
								:value="map.componentName"
								:selected="map.componentName === maps[store.state.activeMapIndex].componentName"
							>
								{{ map.name }}
							</option>
						</select>
					</div>
					<div class="center-coordinates">
						<span class="imp">
							{{ store.state.t.i.buttons.center }}
						</span>
						<span
							class="nobr"
							style="margin-left: 1em;"
						>
							{{ store.state.t.i.captions.latitude }}:
							<input
								v-model.number.trim="store.state.center.latitude"
								placeholder="latitude"
								title="store.state.t.i.captions.latitude"
							>
						</span>
						<span
							class="nobr"
							style="margin-left: 1em;"
						>
							{{ store.state.t.i.captions.longitude }}:
							<input
								v-model.number.trim="store.state.center.longitude"
								placeholder="longitude"
								title="store.state.t.i.captions.longitude"
							>
						</span>
					</div>
				</div>
				<router-view />
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import {
	ref,
	computed,
	watch,
	onMounted,
	onBeforeUnmount,
	onUpdated,
	provide,
	inject,
	nextTick,
	defineAsyncComponent,
} from 'vue';
import { directive as fullscreen } from 'vue-fullscreen';
import axios from 'axios';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import _ from 'lodash';
import { constants } from '@/shared/constants';
import {
	generateRandomString,
	sortObjects,
	coords2string,
	string2coords,
} from '@/shared/common';
import { makeFieldsValidatable } from '@/shared/fields_validate';
import { emitter } from '@/shared/bus';
import PlacesDashboard from './PlacesDashboard.vue';
import PlacesTree from './PlacesTree.vue';
import { Waypoint, Place, Image } from '@/store/types';

const store = useStore();
const router = useRouter();

const idleTimeInterval = inject('idleTimeInterval');
const colorthemes = inject('colorthemes');
const currentPlaceCommon = inject('currentPlaceCommon');
const foldersEditMode = inject('foldersEditMode');
const toDBCompletely = inject('toDBCompletely');
const deleteImages = inject('deleteImages');
const handleDragStart = inject('handleDragStart');
const handleDragEnter = inject('handleDragEnter');
const handleDragOver = inject('handleDragOver');
const handleDrop = inject('handleDrop');

const maps = [
	{
		name: 'OpenStreetMap',
		component: defineAsyncComponent(() => import('./PlacesMapOpenStreetMap.vue')),
		componentName: 'PlacesMapOpenStreetMap',
	}, {
		name: 'Яндекс.Карты',
		component: defineAsyncComponent(() => import('./PlacesMapYandex.vue')),
		componentName: 'PlacesMapYandex',
	}
];

const root = ref(null);
const extmap = ref(null);
provide('extmap', extmap);
const inputImportFromFile = ref(null);
const inputUploadFiles = ref(null);

const state = ref({
	fullscreen: false,
	teleport: true,
	pageOnly: false,
});
const commonPlacesPage = ref(1);
provide('commonPlacesPage', commonPlacesPage);
const commonPlacesPagesCount = ref(0);
const commonPlacesOnPageCount = ref(constants.commonplacesonpagecount);
provide('commonPlacesOnPageCount', commonPlacesOnPageCount);
const commonPlacesShow = ref(false);
const sidebarSize = ref({
	top: constants.sidebars.top,
	right: constants.sidebars.right,
	bottom: constants.sidebars.bottom,
	left: constants.sidebars.left,
});
const sidebarDrag = ref({what: null as unknown, x: 0, y: 0, w: 0, h: 0});
const compact = ref(false as boolean | number);
provide('compact', compact);
const linkEditing = ref(false);
const orderedCurrentPlaceFields = ref([
	'name',
	'description',
	'waypoint',
	'link',
	'time',
	'srt',
	'common',
	'images',
]);

const currentPlace = computed(() => store.state.currentPlace);
const waypoints = computed(() => store.state.waypoints);
const colortheme = computed(() => store.state.colortheme);

const options = computed(() => {
	return {
		callback: (isFullscreen) => {
			state.value.fullscreen = isFullscreen;
		},
		target: '.fullscreen-wrapper',
		teleport: state.value.teleport,
		pageOnly: state.value.pageOnly,
	}
});
const commonPlaces = computed((): Record<string, Place> => {
	const places: Record<string, Place> = {};
	for (const id in store.state.commonPlaces) {
		if (
			Object.keys(store.state.commonPlaces).indexOf(id) >=
			commonPlacesOnPageCount.value * (commonPlacesPage.value - 1) &&
			Object.keys(store.state.commonPlaces).indexOf(id) <
			commonPlacesOnPageCount.value * commonPlacesPage.value
		) {
			places[id] = store.state.commonPlaces[id];
		}
	}
	return places;
});
const orderedImages = computed((): Array<Image> => {
	return (
		currentPlace.value
		? _.orderBy(currentPlace.value.images, 'srt')
			: []
	);
});
const stateReady = computed((): boolean => {
	return store.state.ready;
});
const currentPlaceLat = computed((): number => {
	return waypoints.value[currentPlace.value.waypoint].latitude;
});
const currentPlaceLon = computed((): number => {
	return waypoints.value[currentPlace.value.waypoint].longitude;
});
const currentDegMinSec = computed((): string => {
	return coords2string([currentPlaceLat.value, currentPlaceLon.value]);
});

watch(() => stateReady.value, () => {
	stateReadyChanged();
});
watch(() => state.value.fullscreen, () => {
	updateColorthemeInFullscreen();
});
watch(() => colortheme.value, () => {
	updateColorthemeInFullscreen();
});

emitter.on('setCurrentPlace', (payload: {place: Place}) => {
	setCurrentPlace(payload.place);
});
emitter.on('deletePlace', (place: Place) => {
	deletePlace(place);
});

onMounted(async () => {
	if (stateReady.value) {
		stateReadyChanged();
	}
	store.commit('setIdleTime', 0);
	if (!idleTimeInterval.value) {
		idleTimeInterval.value =
			window.setInterval(() => {
				if (store.state.idleTime < constants.sessionlifetime) {
					store.commit('setIdleTime', store.state.idleTime + 1);
				} else {
					window.clearInterval(idleTimeInterval.value);
					idleTimeInterval.value = undefined;
					store.dispatch('unload').then(() => router.push({name: 'PlacesAuth'}));
				}
			}, 1000);
	}
	await nextTick();
	makeFieldsValidatable();
});
onBeforeUnmount(() => {
	document.removeEventListener('dragover', handleDragOver, false);
	document.removeEventListener('drop', handleDrop, false);
	document.removeEventListener('keyup', keyup, false);
	emitter.off('setCurrentPlace');
	window.clearInterval(idleTimeInterval.value);
});
onUpdated(() => makeFieldsValidatable());

const updateColorthemeInFullscreen = (): void => {
	if (state.value.fullscreen) {
		const fullscreenWrapper = document.querySelector('.fullscreen-wrapper');
		for (const theme of colorthemes.value) {
			fullscreenWrapper.classList.remove('colortheme-' + theme.value);
		}
		fullscreenWrapper.classList.add('colortheme-' + colortheme.value);
	}
};
const blur = (el?: HTMLElement): void => {
	if (el) {
		try {(el as HTMLElement).blur();} catch(e) {}
	} else {
		const els = document.querySelectorAll(':focus');
		for(const el of els) {
			try {(el as HTMLElement).blur();} catch(e) {}
		}
	}
};
const exit = async (): Promise<void> => {
	await store.dispatch('unload');
	router.push({name: 'PlacesAuth'});
};
const stateReadyChanged = async (): Promise<void> => {
	if (!stateReady.value) return;
	await store.dispatch('restoreObjectsAsLinks');
	if (!currentPlace.value) {
		if (store.state.homePlace) {
			setCurrentPlace(store.state.homePlace);
		} else if (Object.keys(store.state.places).length) {
			let firstPlaceInRoot: Place;
			for (const id in store.state.places) {
				if (store.state.places[id].folderid === 'root') {
					firstPlaceInRoot = store.state.places[id];
					break;
				}
			}
			if (firstPlaceInRoot) {
				setCurrentPlace(firstPlaceInRoot);
			} else {
				setCurrentPlace(
					store.state.places[
						Object.keys(store.state.places)[0]
					]
				);
			}
		}
	}
	openTreeToCurrentPlace();
	commonPlacesPagesCount.value = Math.ceil(
		Object.keys(store.state.commonPlaces).length /
		commonPlacesOnPageCount.value
	);
	currentPlaceCommon.value = false;
	if (
		currentPlace.value &&
		currentPlace.value.common &&
		currentPlace.value.userid !== store.state.user.id
	) {
		const inPaginator =
			Object.keys(store.state.commonPlaces).indexOf(currentPlace.value.id) /
				commonPlacesOnPageCount.value
		;
		commonPlacesPage.value = (Number.isInteger(inPaginator)
			? inPaginator + 1
			: Math.ceil(inPaginator)
		);
		currentPlaceCommon.value = true;
	}
	document.addEventListener('dragover', handleDragOver, false);
	document.addEventListener('drop', handleDrop, false);
	document.addEventListener('keyup', keyup, false);
	window.addEventListener('resize', windowResize, false);
	if (store.state.user.testaccount) {
		window.setTimeout(() => {
			store.dispatch("setMessage",
				store.state.t.m.popup.testAccount
			);
		}, 3000);
	}
	windowResize();
	store.commit('backupState');
};
const openTreeToCurrentPlace = (): void => {
	if (currentPlaceCommon.value || !currentPlace.value) return;
	let folder, folderid = currentPlace.value.folderid;
	while (folderid) {
		folder = store.getters.treeFlat[folderid];
		if (!folder) break;
		store.dispatch('folderOpenClose', {
			folder: folder,
			opened: true,
		});
		folderid = folder.parent;
	}
};
const setCurrentPlace = (place: Place | null): void => {
	if (currentPlace.value && place === currentPlace.value) return;
	if (!place) {
		store.commit('setCurrentPlace', null);
		return;
	}
	store.commit('setCurrentPlace', place);
	currentPlaceCommon.value = (
		currentPlace.value.userid !== store.state.user.id
			? true
			: false
	);
	openTreeToCurrentPlace();
	store.dispatch('updateMap', {
		latitude: store.state.waypoints[currentPlace.value.waypoint].latitude,
		longitude: store.state.waypoints[currentPlace.value.waypoint].longitude,
	});
};
const appendPlace = async (): Promise<void | Place> => {
	if (
		store.state.serverConfig.rights.placescount < 0 ||
		store.state.serverConfig.rights.placescount
			> Object.keys(store.state.places).length ||
		store.state.user.testaccount
	) {
		let lat: number, lng: number;
		if (maps[store.state.activeMapIndex].componentName === 'PlacesMapYandex') {
			lat = extmap.value.coordinates[0].toFixed(7);
			lng = extmap.value.coordinates[1].toFixed(7);
		} else {
			lat = extmap.value.center[0].toFixed(7);
			lng = extmap.value.center[1].toFixed(7);
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
				currentPlace.value
					? currentPlace.value.folderid
					: 'root'
			,
			srt: Number(
				Object.keys(store.state.places).length > 0
					? Math.ceil(Math.max(
						...Object.values(store.state.places).map(
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
		await store.dispatch('addPlace', {place: newPlace});
		store.dispatch('addWaypoint', {waypoint: newWaypoint, from: newPlace});
		setCurrentPlace(newPlace);
		await nextTick();
		document.getElementById('detailed-name')!.classList.add('highlight');
		window.setTimeout(function() {
			document.getElementById('detailed-name')!.classList.remove('highlight');
			document.getElementById('detailed-name')!.focus();
		}, 500);
		return newPlace;
	} else {
		store.dispatch('setMessage',
			store.state.t.m.popup.placesCountExceeded
		);
	}
};
const deletePlace = (place: Place): void => {
	if (place === currentPlace.value) {
		// Set current place
		if (Object.keys(store.state.places).length > 1) {
			if (document.getElementById(place.id)!.nextElementSibling!) {
				setCurrentPlace(store.state.places[
					document.getElementById(place.id)!.nextElementSibling!.id
				]);
			} else if (document.getElementById(place.id)!.previousElementSibling!) {
				setCurrentPlace(store.state.places[
					document.getElementById(place.id)!.previousElementSibling!.id
				]);
			} else if (
				store.state.homePlace &&
				store.state.homePlace !== place
			) {
				setCurrentPlace(store.state.homePlace);
			} else {
				let firstPlaceInRoot: Place, inRoot = false;
				for (const id in store.state.places) {
					if (store.state.places[id].folderid === 'root') {
						if (firstPlaceInRoot) {
							if (store.state.places[id].srt < firstPlaceInRoot.srt) {
								firstPlaceInRoot = store.state.places[id];
							}
						} else {
							firstPlaceInRoot = store.state.places[id];
						}
						inRoot = true;
					}
				}
				if (inRoot) {
					setCurrentPlace(firstPlaceInRoot);
				} else {
					setCurrentPlace(store.state.places[Object.keys(store.state.places)[0]]);
				}
			}
		} else {
			setCurrentPlace(null);
		}
	}
};
const commonPlacesShowHide = (show = null): void => {
	commonPlacesShow.value =
		show === null
			? !commonPlacesShow.value
			: show
	;
	store.dispatch('commonPlacemarksShowHide', commonPlacesShow.value);
};
provide('commonPlacesShowHide', commonPlacesShowHide);

const importFromFile = (): void => {
	const mime = (inputImportFromFile.value as HTMLInputElement).files![0].type;
	const reader = new FileReader();
	reader.onload = async (event: Event) => {
		await nextTick();
		store.dispatch('setPlaces', {
			text: (event.target as FileReader).result,
			mime: mime,
		});
		(inputImportFromFile.value as HTMLInputElement).value = '';
	};
	if (mime === 'application/json' || mime === 'application/gpx+xml') {
		reader.readAsText(
			(inputImportFromFile.value as HTMLInputElement).files![0]
		);
	} else {
		store.dispatch('setMessage',
			store.state.t.m.popup.invalidImportFileType
		);
	}
};
const uploadFiles = (event: Event): void => {
	event.preventDefault();
	if (store.state.user.testaccount) {
		store.dispatch('setMessage',
			store.state.t.m.popup.taNotAllowFileUploads
		);
	} else {
		const
			data = new FormData(),
			files = (inputUploadFiles.value as HTMLInputElement).files,
			filesArray: Array<Image> = [];
		let srt: number;
		if (
			currentPlace.value.images &&
			Object.keys(currentPlace.value.images).length
		) {
			const storeImages = Object.values(currentPlace.value.images);
			srt = Number(sortObjects(storeImages, 'srt').pop().srt) || 0;
		} else {
			srt = 0;
		}
		for (let i = 0; i < files.length; i++) {
			if (!store.state.serverConfig.mimes[files![i].type]) {
				store.dispatch('setMessage',
					store.state.t.m.popup.file + ' ' +
					files![i].name +
					' ' + store.state.t.m.popup.fileNotImage
				);
			} else if (files![i].size > store.state.serverConfig.uploadsize) {
				store.dispatch('setMessage',
					store.state.t.m.popup.file + ' ' +
					files![i].name +
					' ' + store.state.t.m.popup.fileTooLarge
				);
			} else {
				const rndname = generateRandomString(32);
				data.append(rndname, files![i]);
				filesArray.push({
					id: rndname,
					file:
						rndname +
						'.' +
						store.state.serverConfig.mimes[files![i].type]
					,
					size: Number(files![i].size) || null,
					type: files![i].type,
					lastmodified: Number(files![i].lastModified) || null,
					srt: ++srt,
					placeid: currentPlace.value.id
						? currentPlace.value.id
						: null,
				});
			}
		}
		if (filesArray.length) {
			document.getElementById('images-uploading')!.classList.remove('hidden');
			data.append('userid', store.state.user.id);
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
								store.dispatch('setMessage',
									store.state.t.m.popup.taNotAllowFileUploads
								);
								break;
							case 3 :
								store.dispatch('setMessage',
									store.state.t.m.popup.filesNotImages
								);
								break;
							case 4 :
								store.dispatch('setMessage',
									store.state.t.m.popup.filesTooLarge +
									' ' + (Number(
										(store.state.serverConfig.rights.photosize
										/ 1048576).toFixed(3)
									) || 0) + ' Mb.'
								);
								break;
						}
					});
					if (response.data[1].length > 0) {
						if (currentPlace.value) {
							const newImagesObject: Record<string, Image> =
								Object.assign({}, (currentPlace.value.images
									? currentPlace.value.images
									: {}
								));
							for (const image of filesArray) {
								newImagesObject[image.id] = image;
							}
							store.dispatch('changePlace', {
								place: currentPlace.value,
								change: {images: newImagesObject},
							}).then(() => {
								emitter.emit('toDB', {
									what: 'places',
									data: [currentPlace.value],
								});
							});
						}
						emitter.emit('toDB', {
							what: 'images_upload',
							data: filesArray,
						});
						store.dispatch('setMessage',
							store.state.t.m.popup.filesUploadedSuccessfully
						);
					}
				})
				.catch(error => {
					store.dispatch('setMessage',
						store.state.t.m.popup.filesUploadError +
						' ' + error
					);
				});
		}
	}
};
const keyup = (event: Event): void => {
	if (
		(event as KeyboardEvent).altKey &&
		(event as KeyboardEvent).shiftKey
	) {
		if (
			(constants.shortcuts as Record<string, string>)
				[(event as KeyboardEvent).code]
		) {
			blur();
		}
		switch (
			(constants.shortcuts as Record<string, string>)
				[(event as KeyboardEvent).keyCode]
		) {
			case 'add' :
				appendPlace();
				break;
			case 'delete' :
				if (
					currentPlace.value &&
						currentPlace.value.userid ===
							store.state.user.id
				) {
					store.dispatch('deletePlaces', {
						places: {[currentPlace.value.id]: currentPlace.value}
					});
				}
				break;
			case 'add folder' :
				router.push({name: 'PlacesHomeFolder'});
				break;
			case 'edit mode' :
				foldersEditMode.value = !foldersEditMode.value;
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
				router.push({
					name: 'PlacesHomeExport',
				});
				break;
			case 'save' :
				emitter.emit('toDBCompletely');
				break;
			case 'help' :
				router.push({name: 'PlacesHomeText', params: {what: 'about'}});
				break;
			case 'revert' :
				document.location.reload();
				break;
			case 'quit' :
				emitter.emit('toDBCompletely');
				exit();
				break;
			case 'other' :
				commonPlacesShowHide();
				break;
			case 'placemarks' :
				store.dispatch('placemarksShowHide');
				break;
			case 'other placemarks' :
				store.dispatch('commonPlacemarksShowHide');
				break;
			case 'center' :
				store.dispatch('centerPlacemarkShowHide');
				break;
			case 'undo' :
				store.dispatch('undo');
				break;
			case 'redo' :
				store.dispatch('redo');
				break;
		}
	}
};
const windowResize = (): void => {
	if (window.innerWidth > constants.compactWidth) {
		sidebarSize.value.top = constants.sidebars.top;
		sidebarSize.value.right = constants.sidebars.right;
		sidebarSize.value.bottom = constants.sidebars.bottom;
		sidebarSize.value.left = constants.sidebars.left;
		document.getElementById('sbs-left')!.style.marginLeft = '0';
		document.getElementById('sbs-top')!.style.marginTop = '0';
		document.getElementById('sbs-bottom')!.style.marginBottom = '0';
		compact.value = false;
	} else {
		if (compact.value) {
			sidebarSize.value.top = parseInt(window.getComputedStyle(
				document.getElementById('top-left') as Element
			).height);
		}
		sidebarSize.value.right = parseInt(window.getComputedStyle(
			document.getElementById('top-right') as Element
		).width);
		(sidebarSize.value.bottom as unknown) = (compact.value
			? parseInt(window.getComputedStyle(
				document.getElementById('basic-basic') as Element
			).height)
			: '1fr'
		);
		sidebarSize.value.left = parseInt(window.getComputedStyle(
			document.getElementById('top-left') as Element
		).width);
		document.getElementById('sbs-left')!.style.marginLeft = sidebarSize.value.left + 'px';
		document.getElementById('sbs-top')!.style.marginTop =
			-parseInt(window.getComputedStyle(
				document.getElementById('basic-left') as Element
			).height) + 'px'
		;
		document.getElementById('sbs-bottom')!.style.marginBottom = sidebarSize.value.bottom + 'px';
		compact.value = true;
	}
	document.getElementById('grid')!.classList.remove('loading-grid');
};
const sidebarDragStart = (event: Event, what: string): void => {
	event.preventDefault();
	sidebarDrag.value.what = what;
	if ((event as TouchEvent).changedTouches) {
		sidebarDrag.value.x = (event as TouchEvent).changedTouches[0].pageX;
		sidebarDrag.value.y = (event as TouchEvent).changedTouches[0].pageY;
	} else {
		sidebarDrag.value.x = (event as MouseEvent).screenX;
		sidebarDrag.value.y = (event as MouseEvent).screenY;
	}
	switch (sidebarDrag.value.what) {
		case 'top' :
			sidebarDrag.value.h = sidebarSize.value.top;
			break;
		case 'bottom' :
			sidebarDrag.value.h = sidebarSize.value.bottom;
			break;
		case 'left' :
			sidebarDrag.value.w = sidebarSize.value.left;
			break;
		case 'right' :
			sidebarDrag.value.w = sidebarSize.value.right;
			break;
	}
};
const documentMouseOver = (event: Event): void => {
	if (sidebarDrag.value.what !== null) {
		switch (sidebarDrag.value.what) {
			case 'top' :
				sidebarSize.value.top =
					sidebarDrag.value.h - sidebarDrag.value.y +
					((event as TouchEvent).changedTouches
						? (event as TouchEvent).changedTouches[0].pageY
						: (event as MouseEvent).screenY
					);
				break;
			case 'bottom' :
				sidebarSize.value.bottom =
					sidebarDrag.value.h + sidebarDrag.value.y -
					((event as TouchEvent).changedTouches
						? (event as TouchEvent).changedTouches[0].pageY
						: (event as MouseEvent).screenY
					);
				break;
			case 'left' :
				sidebarSize.value.left =
					sidebarDrag.value.w - sidebarDrag.value.x +
					((event as TouchEvent).changedTouches
						? (event as TouchEvent).changedTouches[0].pageX
						: (event as MouseEvent).screenX
					);
				break;
			case 'right' :
				sidebarSize.value.right =
					sidebarDrag.value.w + sidebarDrag.value.x -
					((event as TouchEvent).changedTouches
						? (event as TouchEvent).changedTouches[0].pageX
						: (event as MouseEvent).screenX
					);
				break;
		}
	}
};
const sidebarDragStop = (): void => {
	sidebarDrag.value.what = null;
	if (compact.value) {
		windowResize();
	}
};
// Search and select a place by name
const selectPlaces = (event: Event): void => {
	if ((event as KeyboardEvent).keyCode === 27) {
		(event.target as HTMLInputElement).value = '';
	} else {
		for (const id in store.state.places) {
			const regexp = new RegExp(
				(event.target as HTMLInputElement).value, 'i'
			);
			if (
				(event.target as HTMLInputElement).value.length > 1 &&
				regexp.test(store.state.places[id].name)
			) {
				setCurrentPlace(store.state.places[id]);
			}
		}
	}
};
</script>
