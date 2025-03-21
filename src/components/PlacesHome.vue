<template>
	<div
		id="grid"
		ref="root"
		:class="`sbs_${sbs}`"
		:style="!compact ? ('grid-template-rows: ' + sidebarSize.top + 'px 1fr ' + sidebarSize.bottom + 'px; grid-template-columns: ' + sidebarSize.left + 'px 1fr ' + sidebarSize.right + 'px;') : ''"
		@mousemove="e => documentMouseOver(e)"
		@touchmove="e => documentMouseOver(e)"
		@mouseup="sidebarDragStop"
		@touchend="sidebarDragStop"
	>
		<div
			id="top-basic"
			class="app-cell"
			:style="sidebarSize.top === 0 ? 'display: none' : ''"
		>
			<div id="top-basic-content">
				<div class="brand">
					<h1 class="basiccolor margin_bottom_0">
						{{ mainStore.t.i.brand.header }} —
						<router-link to="/account">
							{{ mainStore.user ? mainStore.user.login : 'o_O' }}
						</router-link>
						<router-link
							v-if="
								!!mainStore['user'] &&
								!!mainStore.user['groups'] &&
								!!mainStore.user['groups'].find(
									g => g.parent === 'management'
								)
							"
							to="/admin"
							class="admin-link"
						>
							{{ mainStore.t.i.captions.admin }}
						</router-link>
					</h1>
					<div>{{ mainStore.t.i.brand.slogan }}</div>
				</div>
				<places-dashboard />
			</div>
			<div
				id="messages"
				class="invisible"
				@mouseover="mainStore.setMouseOverMessages(true)"
				@mouseout="mainStore.setMouseOverMessages(false)"
				@click="mainStore.clearMessages();"
			>
				<div
					v-for="(message, index) in mainStore.messages"
					:id="'message-' + index"
					:key="index"
					class="message border_1"
				>
					{{ mainStore.messages[index] }}
				</div>
			</div>
		</div>
		<div
			id="top-right"
			class="app-cell"
			:style="sidebarSize.top === 0 || sidebarSize.right === 0 ? 'display: none' : ''"
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
					id="actions-undo"
					:disabled="mainStore.stateBackupsIndex === 0"
					class="actions-button"
					:title="mainStore.t.i.buttons.undo"
					@click="mainStore.undo();"
				>
					<span>↺</span>
					<span>{{ mainStore.t.i.buttons.undo }}</span>
				</button>
				<button
					id="actions-redo"
					:disabled="
						!mainStore.stateBackups ||
						mainStore.stateBackupsIndex === mainStore.stateBackups.length - 1
					"
					class="actions-button"
					:title="mainStore.t.i.buttons.redo"
					@click="mainStore.redo();"
				>
					<span>↻</span>
					<span>{{ mainStore.t.i.buttons.redo }}</span>
				</button>
				<button
					id="actions-save"
					:disabled="mainStore.saved"
					:class="'actions-button' + (!mainStore.saved ? ' button-pressed' : '')"
					:title="(!mainStore.saved ? (mainStore.t.i.hints.notSaved + '. ') : '') + mainStore.t.i.hints.sabeToDb"
					@click="toDBCompletely"
				>
					<span>↸</span>
					<span>{{ mainStore.t.i.buttons.save }}</span>
				</button>
				<button
					id="actions-install"
					class="actions-button"
					:title="mainStore.t.i.hints.install"
					:disabled="installButtonEnabled"
					@click="installPWA"
				>
					<span>⤓</span>
					<span>{{ mainStore.t.i.buttons.install }}</span>
				</button>
				<button
					id="actions-import"
					class="actions-button"
					:title="mainStore.t.i.hints.importPlaces"
					@click="inputImportFromFile.click()"
				>
					<span>↲</span>
					<span>{{ mainStore.t.i.buttons.import }}</span>
				</button>
				<button
					id="actions-export"
					class="actions-button"
					:title="mainStore.t.i.hints.exportPlaces"
					@click="router.push({name: 'PlacesHomeExport'})"
				>
					<span>↱</span>
					<span>{{ mainStore.t.i.buttons.export }}</span>
				</button>
				<button
					id="actions-about"
					class="actions-button"
					:title="mainStore.t.i.hints.about"
					@click="
						router.push({
							name: 'PlacesHomeText',
							params: {what: 'about'}
						});
					"
				>
					<span>?</span>
					<span>{{ mainStore.t.i.buttons.help }}</span>
				</button>
				<button
					id="actions-exit"
					class="actions-button"
					:title="mainStore.t.i.hints.exit"
					@click="e => {toDBCompletely().then(() => exit())}"
				>
					<span>↪</span>
					<span>{{ mainStore.t.i.buttons.exit }}</span>
				</button>
			</div>
		</div>
		<div
			id="basic-left"
			class="app-cell"
			:style="sidebarSize.left === 0 ? 'display: none' : ''"
		>
			<div class="control-buttons">
				<button
					id="actions-append"
					class="actions-button"
					:title="mainStore.t.i.hints.addPlace"
					@click="appendPlace();"
				>
					<span>⊕</span>
					<span>{{ mainStore.t.i.buttons.newPlace }}</span>
				</button>
				<button
					id="actions-delete"
					class="actions-button"
					:title="mainStore.t.i.hints.deletePlace"
					:disabled="!(mainStore.user && currentPlace && currentPlace.userid === mainStore.user.id)"
					@click="mainStore.deletePlaces({places: {[currentPlace.id]: currentPlace}});"
				>
					<span>⊖</span>
					<span>{{ mainStore.t.i.buttons.delete }}</span>
				</button>
				<button
					id="actions-append-folder"
					class="actions-button"
					:title="mainStore.t.i.hints.addFolder"
					@click="router.push({name: 'PlacesHomeFolder'}).catch(e => {console.error(e);});"
				>
					<span>⊕</span>
					<span>{{ mainStore.t.i.buttons.newFolder }}</span>
				</button>
				<button
					id="actions-edit-folders"
					:class="'actions-button' + (foldersEditMode ? ' button-pressed' : '')"
					:title="mainStore.t.i.hints.editFolders"
					@click="foldersEditMode = !foldersEditMode;"
				>
					<span>🖉</span>
					<span>{{ mainStore.t.i.buttons.editFolders }}</span>
				</button>
				<button
					id="actions-range"
					:class="'actions-button' + (mainStore.rangeShow ? ' button-pressed' : '')"
					:title="mainStore.t.i.captions.range"
					@click="e => {
						mainStore.rangeShow = !mainStore.rangeShow;
						mainStore.rangeShow
						? mainStore.showInRange(mainStore.range)
						: mainStore.showInRange(null)
					}"
				>
					<span>⊘</span>
					<span>{{ mainStore.t.i.buttons.range }}</span>
				</button>
				<button
					id="actions-measure"
					:class="'actions-button' + (mainStore.measure.show ? ' button-pressed' : '')"
					:title="mainStore.t.i.captions.measure"
					@click="e => {
						mainStore.measure.show = !mainStore.measure.show;
						mainStore.measure.places = [];
						mainStore.measure.distance = 0;
						mainStore.measure.choosing = 0;
						mainStore.mode = mainStore.measure.show ? 'measure' : 'normal';
					}"
				>
					<span>123</span>
					<span>{{ mainStore.t.i.buttons.measure }}</span>
				</button>
			</div>
			<form
				v-if="mainStore.rangeShow"
				action="javascript:void(0)"
				class="control-range"
				@submit="mainStore.showInRange(mainStore.range)"
			>
				<input
					ref="rangeInput"
					v-model="mainStore.range"
					type="number"
					min="0"
					max="6378136.6"
					:placeholder="mainStore.t.i.buttons.range"
					:title="mainStore.t.i.captions.range"
					class="fieldwidth_100"
				>
				<button @click="mainStore.showInRange(mainStore.range)">
					<span>↪</span>
				</button>
				<button
					:title="mainStore.t.i.buttons.clear"
					@click="
						if (mainStore.range !== null) {
							mainStore.range = null;
							mainStore.showInRange(null);
						}
					"
				>
					<span>⊗</span>
				</button>
			</form>
			<div
				v-if="mainStore.measure.show"
				class="control-measure"
			>
				<dt>
					{{ mainStore.t.i.captions.measure }}:
					<span class="imp_02">{{ mainStore.measure.distance.toFixed(3) }}</span> {{ mainStore.t.i.text.km }}
				</dt>
				<dd
					v-for="(id, index) in mainStore.measure.places"
					:key="index"
					:measureitem="id"
					:draggable="true"
					class="draggable"
					@dragstart="e => handleDragStart(e, 'measure')"
					@dragenter="handleDragEnter"
					@drop="handleDrop"
				>
					<span>{{ id !== null ? mainStore.places[id].name : `${mainStore.t.i.captions.measureChoose}:` }}</span>
					<button
						:title="mainStore.t.i.buttons.specify"
						:class="mainStore.measure.choosing === index ? 'button-pressed' : ''"
						@click="
							mainStore.measure.choosing =
								mainStore.measure.choosing === index
									? mainStore.measure.places.length
									: index
						"
					>
						<span>↪</span>
					</button>
					<button
						:title="mainStore.t.i.buttons.clear"
						@click="
							mainStore.measure.places.splice(index, 1);
							mainStore.measure.choosing = mainStore.measure.places.length;
						"
					>
						<span>⊗</span>
					</button>
				</dd>
			</div>
			<div class="control-search">
				<input
					ref="searchInput"
					:placeholder="mainStore.t.i.inputs.searchPlaces"
					:title="mainStore.t.i.inputs.searchPlaces"
					class="find-places-input fontsize_n"
					@keyup="searchInputEvent"
				>
				<button
					:title="mainStore.t.i.buttons.find"
					@click="selectPlaces(searchInput.value)"
				>
					<span>↪</span>
				</button>
				<button
					:title="mainStore.t.i.buttons.clear"
					@click="
						if (searchInput.value !== '') {
							searchInput.value = '';
							selectPlaces(searchInput.value);
						}
					"
				>
					<span>⊗</span>
				</button>
			</div>
			<div id="basic-left__places">
				<div
					v-if="Object.keys(mainStore.places).length > 0 || Object.keys(mainStore.folders).length > 0"
					id="places-menu"
					class="menu"
				>
					<places-tree instanceid="placestree" />
				</div>
				<div v-if="Object.keys(mainStore.commonPlaces).length > 0 && commonPlacesShow">
					<h2 class="basiccolor">
						{{ mainStore.t.i.captions.commonPlaces }}
					</h2>
					<div class="margin_bottom">
						<div
							v-for="commonPlace in commonPlaces"
							:id="commonPlace.id"
							:key="commonPlace.id"
							:class="'place-button block_01' + (commonPlace === currentPlace ? ' active' : '')"
							@click="choosePlace(commonPlace)"
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
			<div
				class="basic-on-full button"
				@click="basicOnFull"
			>
				⤧
			</div>
			<component :is="maps[mainStore.activeMapIndex].component" />
			<div
				id="sbs-top"
				:style="'left: 0; right: -' + sidebarSize.right + 'px;'"
				@mousedown="e => sidebarDragStart(e, 'top')"
				@touchstart="e => sidebarDragStart(e, 'top')"
			/>
			<div
				id="sbs-right"
				:style="'top: -' + (sidebarSize.top + sidebarSize.left) + 'px; bottom: -' + sidebarSize.bottom + 'px;'"
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
				:style="'top: -' + (sidebarSize.top + sidebarSize.left) + 'px; bottom: -' + sidebarSize.bottom + 'px;'"
				@mousedown="e => sidebarDragStart(e, 'left')"
				@touchstart="e => sidebarDragStart(e, 'left')"
			/>
		</div>
		<div
			id="basic-right"
			class="app-cell"
			:style="sidebarSize.right === 0 ? 'display: none' : ''"
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
								{{ mainStore.placeFields[field] }}
							</a>
							<span v-else>
								{{ mainStore.placeFields[field] }}:
							</span>
						</dt>
						<dt v-else-if="field === 'images' && orderedImages.length">
							{{ mainStore.placeFields[field] }}:
						</dt>
						<div v-if="field === 'waypoint'">
							<div class="two-fields">
								<div>
									<dt>
										{{ mainStore.placeFields['latitude'] }} °
									</dt>
									<dd>
										<input
											id="detailed-latitude"
											:value="currentPlaceLat"
											type="number"
											:disabled="!!currentPlaceCommon"
											class="fieldwidth_100"
											@change="e => mainStore.changePlace({place: currentPlace, change: {latitude: (e.target as HTMLInputElement).value.trim()}})"
										>
									</dd>
								</div>
								<div>
									<dt>
										{{ mainStore.placeFields['longitude'] }} °
									</dt>
									<dd>
										<input
											id="detailed-longitude"
											:value="currentPlaceLon"
											type="number"
											:disabled="!!currentPlaceCommon"
											class="fieldwidth_100"
											@change="e => mainStore.changePlace({place: currentPlace, change: {longitude: (e.target as HTMLInputElement).value.trim()}})"
										>
									</dd>
								</div>
								<div class="two-fields__combined">
									<input
										id="detailed-coordinates"
										:value="currentDegMinSec"
										type="text"
										:disabled="!!currentPlaceCommon"
										class="fieldwidth_100"
										@change="e => {const coords = string2coords((e.target as HTMLInputElement).value.trim()); if (coords === null) return; mainStore.changePlace({place: currentPlace, change: {latitude: coords[0], longitude: coords[1]}});}"
									>
								</div>
							</div>
							<div class="margin_bottom_1">
								<strong>{{ mainStore.placeFields['altitudecapability'] }}:</strong>
								{{ currentPlaceEle === null ? '?' : currentPlaceEle }}
							</div>
						</div>
						<dt v-else-if="field !== 'common' && field !== 'link' && field !== 'waypoint' && field !== 'images'">
							{{ mainStore.placeFields[field] }}:
						</dt>
						<dd v-if="field === 'srt' || field === 'link'">
							<input
								:id="'detailed-' + field"
								v-model.number.trim="currentPlace[field]"
								:type="field === 'srt' ? 'number' : 'text'"
								:disabled="!!currentPlaceCommon"
								class="fieldwidth_100"
								@change="mainStore.changePlace({place: currentPlace, change: {[field]: currentPlace[field]}});"
							>
						</dd>
						<dd v-else-if="field === 'time'">
							<input
								:id="'detailed-' + field"
								v-model="currentPlace[field]"
								type="datetime-local"
								:disabled="!!currentPlaceCommon"
								class="fieldwidth_100"
								@change="mainStore.changePlace({place: currentPlace, change: {[field]: currentPlace[field]}});"
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
									@change="mainStore.changePlace({place: currentPlace, change: {[field]: currentPlace[field]}});"
								>
								{{ mainStore.t.i.inputs.checkboxCommon }}
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
									@dragstart="e => handleDragStart(e, 'images')"
									@dragenter="handleDragEnter"
									@drop="handleDrop"
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
												confirm(deleteImages, [{[image.id]: image}]);
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
								:placeholder="field === 'name' ? mainStore.t.i.inputs.placeName : (field === 'description' ? mainStore.t.i.inputs.placeDescription : '')"
								class="fieldwidth_100"
								@change="mainStore.changePlace({place: currentPlace, change: {[field]: currentPlace[field]}});"
							/>
						</dd>
					</dl>
				</div>
				<div
					v-if="currentPlace && !currentPlace.deleted && !currentPlaceCommon"
					class="images-add margin_bottom"
				>
					<div class="images-add__div button">
						<span>{{ mainStore.t.i.buttons.addPhotos }}</span>
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
					<span>… {{ mainStore.t.i.buttons.loading }} …</span>
				</div>
				<div v-if="currentPlace && !currentPlaceCommon">
					<label>
						<input
							id="checkbox-homeplace"
							type="checkbox"
							:checked="currentPlace === mainStore.homePlace"
							@change="e => mainStore.setHomePlace((e.target as HTMLInputElement).checked ? currentPlace.id : null)"
						>
						{{ mainStore.t.i.inputs.checkboxHome }}
					</label>
				</div>
				<div>
					<button
						:disabled="mainStore.saved"
						:title="(!mainStore.saved ? (mainStore.t.i.hints.notSaved + '. ') : '') + mainStore.t.i.hints.sabeToDb"
						class="save-button"
						@click="toDBCompletely"
					>
						{{ mainStore.t.i.buttons.save }}
					</button>
				</div>
			</div>
		</div>
		<div
			id="bottom-left"
			class="app-cell"
			:style="sidebarSize.bottom === 0 || sidebarSize.left === 0 ? 'display: none' : ''"
		>
			<div class="control-buttons">
				<button
					id="placemarksShowHideButton"
					:class="'actions-button' + (mainStore.placemarksShow ? ' button-pressed' : '')"
					:title="mainStore.t.i.hints.shPlacemarks"
					@click="mainStore.placemarksShowHide()"
				>
					<span>◆</span>
					<span>{{ mainStore.t.i.buttons.places }}</span>
				</button>
				<button
					id="commonPlacesShowHideButton"
					:class="'actions-button' + (commonPlacesShow ? ' button-pressed' : '')"
					:title="mainStore.t.i.hints.shCommonPlaces"
					@click="commonPlacesShowHide();"
				>
					<span>◇</span>
					<span>{{ mainStore.t.i.buttons.commonPlaces }}</span>
				</button>
				<button
					id="commonPlacemarksShowHideButton"
					:class="'actions-button' + (mainStore.commonPlacemarksShow ? ' button-pressed' : '')"
					:title="mainStore.t.i.hints.shCommonPlacemarks"
					@click="mainStore.commonPlacemarksShowHide()"
				>
					<span>⬙</span>
					<span>{{ mainStore.t.i.buttons.commonPlacemarks }}</span>
				</button>
				<button
					id="centerPlacemarkShowHideButton"
					:class="'actions-button' + (mainStore.centerPlacemarkShow ? ' button-pressed' : '')"
					:title="mainStore.t.i.hints.shCenter"
					@click="mainStore.centerPlacemarkShowHide()"
				>
					<span>◈</span>
					<span>{{ mainStore.t.i.buttons.center }}</span>
				</button>
			</div>
		</div>
		<div
			id="bottom-basic"
			class="app-cell"
			:style="sidebarSize.bottom === 0 ? 'display: none' : ''"
		>
			<div class="choose-map">
				<select
					id="choose-map-input"
					@change="e => mainStore.changeMap((e.target as HTMLSelectElement).selectedIndex)"
				>
					<option
						v-for="(map, index) in maps"
						:key="index"
						:value="map.componentName"
						:selected="map.componentName === maps[mainStore.activeMapIndex].componentName"
					>
						{{ map.name }}
					</option>
				</select>
			</div>
			<div class="center-coordinates">
				<span class="imp">
					{{ mainStore.t.i.buttons.center }}
				</span>
				<span
					class="nobr"
					style="margin-left: 1em;"
				>
					{{ mainStore.t.i.captions.latitude }} °:
					<input
						v-model.number.trim="mainStore.center.latitude"
						placeholder="latitude"
						title="mainStore.t.i.captions.latitude"
					>
				</span>
				<span
					class="nobr"
					style="margin-left: 1em;"
				>
					{{ mainStore.t.i.captions.longitude }} °:
					<input
						v-model.number.trim="mainStore.center.longitude"
						placeholder="longitude"
						title="mainStore.t.i.captions.longitude"
					>
				</span>
			</div>
		</div>
		<div
			v-if="compact"
			id="sbs-up"
			class="button"
			@click="sbsTo('up')"
			>
			🞁
		</div>
		<div
			v-if="compact"
			id="sbs-down"
			class="button"
			@click="sbsTo('down')"
		>
			🞃
		</div>
		<router-view />
		<places-popup-confirm
			v-if="confirmPopup"
			:callback="confirmCallback"
			:arguments="confirmCallbackArgs"
		/>
	</div>
</template>

<script setup lang="ts">
import {
	ref, Ref,
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
import axios from 'axios';
import { useMainStore } from '@/stores/main';
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
import PlacesPopupConfirm from './PlacesPopupConfirm.vue';
import { Waypoint, Place, Image } from '@/stores/types';

const mainStore = useMainStore();
const router = useRouter();

const idleTimeInterval = inject<typeof idleTimeInterval>('idleTimeInterval');
const currentPlaceCommon = inject<Ref<boolean>>('currentPlaceCommon');
const foldersEditMode = inject<Ref<boolean>>('foldersEditMode');
const toDB = inject<typeof toDB>('toDB');
const toDBCompletely = inject<typeof toDBCompletely>('toDBCompletely');
const deleteImages = inject<typeof deleteImages>('deleteImages');
const handleDragStart = inject<typeof handleDragStart>('handleDragStart');
const handleDragEnter = inject<typeof handleDragEnter>('handleDragEnter');
const handleDragOver = inject<typeof handleDragOver>('handleDragOver');
const handleDrop = inject<typeof handleDrop>('handleDrop');

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
const basicOnFull = (): void => {
	root.value.classList.toggle('basic-fulled');
}
const extmap = ref(null);
provide('extmap', extmap);
const inputImportFromFile = ref(null);
const inputUploadFiles = ref(null);

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
const sbs = ref('all');
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

const currentPlace = computed(() => mainStore.currentPlace);
const waypoints = computed(() => mainStore.waypoints);
const commonPlaces = computed((): Record<string, Place> => {
	const places: Record<string, Place> = {};
	for (const id in mainStore.commonPlaces) {
		if (
			Object.keys(mainStore.commonPlaces).indexOf(id) >=
			commonPlacesOnPageCount.value * (commonPlacesPage.value - 1) &&
			Object.keys(mainStore.commonPlaces).indexOf(id) <
			commonPlacesOnPageCount.value * commonPlacesPage.value
		) {
			places[id] = mainStore.commonPlaces[id];
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
	return mainStore.ready;
});
const currentPlaceLat = computed((): number => {
	return waypoints.value[currentPlace.value.waypoint].latitude;
});
const currentPlaceLon = computed((): number => {
	return waypoints.value[currentPlace.value.waypoint].longitude;
});
const currentPlaceEle = ref<number | null>(null);

const getCurrentPlaceEle = (): void => {
	axios
		.get(`https://api.open-meteo.com/v1/elevation?latitude=${currentPlaceLat.value}&longitude=${currentPlaceLon.value}`)
		.then(response => {
			currentPlaceEle.value = Number(response.data.elevation);
			if (isNaN(currentPlaceEle.value)) currentPlaceEle.value = null;
		})
		.catch(() => {
			currentPlaceEle.value = null;
		})
	;
}

watch(currentPlace, (): void => {
	getCurrentPlaceEle();
});
const currentDegMinSec = computed((): string => {
	return coords2string([currentPlaceLat.value, currentPlaceLon.value]);
});

watch(() => stateReady.value, () => {
	stateReadyChanged();
});

watch(mainStore, changedStore => {
	if (!changedStore.refreshing) {
		sessionStorage.setItem('places-store-state', JSON.stringify(changedStore.$state));
	}
});
watch(mainStore.measure.places, () => {
	mainStore.measureDistance();
}, {deep: true});

emitter.on('choosePlace', (payload: {place: Place}) => {
	choosePlace(payload.place);
});
emitter.on('deletePlace', (place: Place) => {
	deletePlace(place);
});

const confirmPopup = ref(false);
provide('confirmPopup', confirmPopup);
const confirmCallback = ref(null);
const confirmCallbackArgs = ref(null);
const confirm = (func, args): boolean => {
	confirmPopup.value = true;
	confirmCallback.value = func;
	confirmCallbackArgs.value = args;
	return true;
}

onMounted(async () => {
	if (stateReady.value) {
		stateReadyChanged();
	}
	mainStore.setIdleTime(0);
	if (!idleTimeInterval.value) {
		idleTimeInterval.value =
			window.setInterval(() => {
				if (mainStore.idleTime < constants.sessionlifetime) {
					mainStore.setIdleTime(mainStore.idleTime + 1);
				} else {
					window.clearInterval(idleTimeInterval.value);
					idleTimeInterval.value = undefined;
					mainStore.unload();
					router.push({name: 'PlacesAuth'});
				}
			}, 1000);
	}
	await nextTick();
	makeFieldsValidatable(mainStore.t);
	getCurrentPlaceEle();
});
onBeforeUnmount(() => {
	document.removeEventListener('dragover', handleDragOver, false);
	document.removeEventListener('drop', handleDrop, false);
	document.removeEventListener('keyup', keyup, false);
	emitter.off('choosePlace');
	window.clearInterval(idleTimeInterval.value);
});
onUpdated(() => makeFieldsValidatable(mainStore.t));

const installEvent = inject<typeof installEvent>('installEvent');
const installButtonEnabled = ref(false);
watch(() => installEvent.value, () => {
	installButtonEnabled.value = !!installEvent.value;
});

const dismissPrompt = (): void => {
	installButtonEnabled.value = false;
};
const installPWA = (): void => {
	installEvent.value.prompt();
	installEvent.value.userChoice.then(choice => {
		dismissPrompt();
		if (choice.outcome === 'accepted') {
		} else {
		}
	});
};

const blur = (el?: HTMLElement): void => {
	if (el) {
		try {(el as HTMLElement).blur();} finally {}
	} else {
		const els = document.querySelectorAll(':focus');
		for(const el of els) {
			try {(el as HTMLElement).blur();} finally {}
		}
	}
};
const exit = (): void => {
	router.push({name: 'PlacesAuth'});
};
const stateReadyChanged = async (): Promise<void> => {
	if (!stateReady.value) return;
	await mainStore.restoreObjectsAsLinks();
	if (!currentPlace.value) {
		if (mainStore.homePlace) {
			choosePlace(mainStore.homePlace);
		} else if (Object.keys(mainStore.places).length) {
			let firstPlaceInRoot: Place;
			for (const id in mainStore.places) {
				if (mainStore.places[id].folderid === 'root') {
					firstPlaceInRoot = mainStore.places[id];
					break;
				}
			}
			if (firstPlaceInRoot) {
				choosePlace(firstPlaceInRoot);
			} else {
				choosePlace(
					mainStore.places[
						Object.keys(mainStore.places)[0]
					]
				);
			}
		}
	}
	openTreeToCurrentPlace();
	commonPlacesPagesCount.value = Math.ceil(
		Object.keys(mainStore.commonPlaces).length /
		commonPlacesOnPageCount.value
	);
	currentPlaceCommon.value = false;
	if (
		currentPlace.value &&
		currentPlace.value.common &&
		currentPlace.value.userid !== mainStore.user.id
	) {
		const inPaginator =
			Object.keys(mainStore.commonPlaces).indexOf(currentPlace.value.id) /
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
	if (mainStore.user.testaccount) {
		window.setTimeout(() => {
			mainStore.setMessage(
				mainStore.t.m.popup.testAccount
			);
		}, 3000);
	}
	windowResize();
};
const openTreeToCurrentPlace = (): void => {
	if (currentPlaceCommon.value || !currentPlace.value) return;
	let folder, folderid = currentPlace.value.folderid;
	while (folderid) {
		folder = mainStore.treeFlat[folderid];
		if (!folder) break;
		mainStore.folderOpenClose({
			folder: folder,
			opened: true,
		});
		folderid = folder.parent;
	}
};
const choosePlace = (place: Place | null): void => {
	if (!place) {
		mainStore.currentPlace = null;
		return;
	}
	switch (mainStore.mode) {
		case 'measure':
			const index = mainStore.measure.places.indexOf(place.id);
			if (index === -1) {
				if (mainStore.measure.choosing === mainStore.measure.places.length) {
					mainStore.measure.places.push(place.id);
				} else {
					(mainStore.measure.places[mainStore.measure.choosing] = place.id);
				}
			} else {
				mainStore.measure.places.splice(index, 1);
			}
			mainStore.measure.choosing = mainStore.measure.places.length;
			mainStore.measureDistance();
			break;
		default:
			if (currentPlace.value && place === currentPlace.value) return;
			mainStore.currentPlace = place;
			currentPlaceCommon.value = (
				currentPlace.value.userid !== mainStore.user.id
					? true
					: false
			);
			openTreeToCurrentPlace();
			mainStore.updateMap({
				latitude: mainStore.waypoints[currentPlace.value.waypoint].latitude,
				longitude: mainStore.waypoints[currentPlace.value.waypoint].longitude,
			});
			break;
	}
};
const appendPlace = async (): Promise<void | Place> => {
	if (
		mainStore.serverConfig.rights.placescount < 0 ||
		mainStore.serverConfig.rights.placescount
			> Object.keys(mainStore.places).length ||
		mainStore.user.testaccount
	) {
		const newWaypoint: Waypoint = {
			id: generateRandomString(32),
			latitude:
				mainStore.center.latitude ||
				null,
			longitude:
				mainStore.center.longitude ||
				null,
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
				Object.keys(mainStore.places).length > 0
					? Math.ceil(Math.max(
						...Object.values(mainStore.places).map(
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
		await mainStore.addPlace({place: newPlace});
		mainStore.addWaypoint({waypoint: newWaypoint, from: newPlace});
		choosePlace(newPlace);
		await nextTick();
		document.getElementById('detailed-name')!.classList.add('highlight');
		window.setTimeout(function() {
			document.getElementById('detailed-name')!.classList.remove('highlight');
			document.getElementById('detailed-name')!.focus();
		}, 500);
		return newPlace;
	} else {
		mainStore.setMessage(
			mainStore.t.m.popup.placesCountExceeded
		);
	}
};
const deletePlace = (place: Place): void => {
	if (place === currentPlace.value) {
		// Set current place
		if (Object.keys(mainStore.places).length > 1) {
			if (document.getElementById(place.id)!.nextElementSibling!) {
				choosePlace(mainStore.places[
					document.getElementById(place.id)!.nextElementSibling!.id
				]);
			} else if (document.getElementById(place.id)!.previousElementSibling!) {
				choosePlace(mainStore.places[
					document.getElementById(place.id)!.previousElementSibling!.id
				]);
			} else if (
				mainStore.homePlace &&
				mainStore.homePlace !== place
			) {
				choosePlace(mainStore.homePlace);
			} else {
				let firstPlaceInRoot: Place, inRoot = false;
				for (const id in mainStore.places) {
					if (mainStore.places[id].folderid === 'root') {
						if (firstPlaceInRoot) {
							if (mainStore.places[id].srt < firstPlaceInRoot.srt) {
								firstPlaceInRoot = mainStore.places[id];
							}
						} else {
							firstPlaceInRoot = mainStore.places[id];
						}
						inRoot = true;
					}
				}
				if (inRoot) {
					choosePlace(firstPlaceInRoot);
				} else {
					choosePlace(mainStore.places[Object.keys(mainStore.places)[0]]);
				}
			}
		} else {
			choosePlace(null);
		}
	}
};
const commonPlacesShowHide = (show = null): void => {
	commonPlacesShow.value =
		show === null
			? !commonPlacesShow.value
			: show
	;
	mainStore.commonPlacemarksShowHide(commonPlacesShow.value);
};
provide('commonPlacesShowHide', commonPlacesShowHide);

const importFromFile = (): void => {
	const mime = (inputImportFromFile.value as HTMLInputElement).files![0].type;
	const reader = new FileReader();
	reader.onload = async (event: Event) => {
		await nextTick();
		mainStore.setPlaces({
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
		mainStore.setMessage(
			mainStore.t.m.popup.invalidImportFileType
		);
	}
};
const uploadFiles = (event: Event): void => {
	event.preventDefault();
	if (mainStore.user.testaccount) {
		mainStore.setMessage(
			mainStore.t.m.popup.taNotAllowFileUploads
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
			if (!mainStore.serverConfig.mimes[files![i].type]) {
				mainStore.setMessage(
					mainStore.t.m.popup.file + ' ' +
					files![i].name +
					' ' + mainStore.t.m.popup.fileNotImage
				);
			} else if (files![i].size > mainStore.serverConfig.uploadsize) {
				mainStore.setMessage(
					mainStore.t.m.popup.file + ' ' +
					files![i].name +
					' ' + mainStore.t.m.popup.fileTooLarge
				);
			} else {
				const rndname = generateRandomString(32);
				data.append(rndname, files![i]);
				filesArray.push({
					id: rndname,
					file:
						rndname +
						'.' +
						mainStore.serverConfig.mimes[files![i].type]
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
			data.append('userid', mainStore.user.id);
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
								mainStore.setMessage(
									mainStore.t.m.popup.taNotAllowFileUploads
								);
								break;
							case 3 :
								mainStore.setMessage(
									mainStore.t.m.popup.filesNotImages
								);
								break;
							case 4 :
							mainStore.setMessage(
									mainStore.t.m.popup.filesTooLarge +
									' ' + (Number(
										(mainStore.serverConfig.rights.photosize
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
							mainStore.changePlace({
								place: currentPlace.value,
								change: {images: newImagesObject},
							}).then(() => {
								toDB({
									what: 'places',
									data: [currentPlace.value],
								});
							});
						}
						toDB({
							what: 'images_upload',
							data: filesArray,
						});
						mainStore.setMessage(
							mainStore.t.m.popup.filesUploadedSuccessfully
						);
					}
				})
				.catch(error => {
					mainStore.setMessage(
						mainStore.t.m.popup.filesUploadError +
						' ' + error
					);
					(document.getElementById('images-add__input') as HTMLInputElement).value = '';
					document.getElementById('images-uploading')!.classList.add('hidden');
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
				[(event as KeyboardEvent).code]
		) {
			case 'add' :
				appendPlace();
				break;
			case 'delete' :
				if (
					currentPlace.value &&
						currentPlace.value.userid ===
							mainStore.user.id
				) {
					mainStore.deletePlaces({
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
				inputImportFromFile.value.click();
				break;
			case 'export' :
				router.push({
					name: 'PlacesHomeExport',
				});
				break;
			case 'save' :
				toDBCompletely();
				break;
			case 'help' :
				router.push({name: 'PlacesHomeText', params: {what: 'about'}});
				break;
			case 'revert' :
				document.location.reload();
				break;
			case 'quit' :
				toDBCompletely();
				exit();
				break;
			case 'other' :
				commonPlacesShowHide();
				break;
			case 'placemarks' :
				mainStore.placemarksShowHide();
				break;
			case 'other placemarks' :
				mainStore.commonPlacemarksShowHide();
				break;
			case 'center' :
				mainStore.centerPlacemarkShowHide();
				break;
			case 'undo' :
				mainStore.undo();
				break;
			case 'redo' :
				mainStore.redo();
				break;
		}
	}
};
const sbsTo = (to?: string): void => {
	switch (sbs.value) {
		case 'upper':
			if (to === 'up') sbs.value = 'all';
			break;
		case 'lower':
			if (to === 'down') sbs.value = 'all';
			break;
		case 'all':
		default :
			if (to === 'up') sbs.value = 'lower';
			if (to === 'down') sbs.value = 'upper';
			break;
	}
}
const windowResize = (): void => {
	if (window.innerWidth > constants.compactWidth) {
		compact.value = false;
	} else {
		compact.value = true;
	}
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
	if (sidebarDrag.value.what === null) return;
	switch (sidebarDrag.value.what) {
		case 'top' :
			sidebarSize.value.top = (
				sidebarDrag.value.h - sidebarDrag.value.y +
				((event as TouchEvent).changedTouches
					? (event as TouchEvent).changedTouches[0].pageY
					: (event as MouseEvent).screenY
				));
			if (sidebarSize.value.top < constants.sidebars.top) {
				sidebarSize.value.top = 0;
			}
			break;
		case 'bottom' :
			sidebarSize.value.bottom =
				sidebarDrag.value.h + sidebarDrag.value.y -
				((event as TouchEvent).changedTouches
					? (event as TouchEvent).changedTouches[0].pageY
					: (event as MouseEvent).screenY
				);
			if (sidebarSize.value.bottom < constants.sidebars.bottom) {
				sidebarSize.value.bottom = 0;
			}
			break;
		case 'left' :
			sidebarSize.value.left =
				sidebarDrag.value.w - sidebarDrag.value.x +
				((event as TouchEvent).changedTouches
					? (event as TouchEvent).changedTouches[0].pageX
					: (event as MouseEvent).screenX
				);
			if (sidebarSize.value.left < constants.sidebars.top) {
				sidebarSize.value.left = 0;
			}
			break;
		case 'right' :
			sidebarSize.value.right =
				sidebarDrag.value.w + sidebarDrag.value.x -
				((event as TouchEvent).changedTouches
					? (event as TouchEvent).changedTouches[0].pageX
					: (event as MouseEvent).screenX
				);
			if (sidebarSize.value.right < constants.sidebars.top) {
				sidebarSize.value.right = 0;
			}
			break;
	}
};
const sidebarDragStop = (): void => {
	sidebarDrag.value.what = null;
};
// Search places by name
const rangeInput = ref(null);
const searchInput = ref(null);
const searchInputEvent = (event: Event): void => {
	if ((event as KeyboardEvent).code === "Escape") {
		(event.target as HTMLInputElement).value = '';
	}
	if (
		(event as KeyboardEvent).code === "Escape" ||
		(event as KeyboardEvent).code === "Enter"
	) {
		selectPlaces((event.target as HTMLInputElement).value);
	}
}
const selectPlaces = (text: string): void => {
	const regexp = new RegExp(text, 'i');
	const folders = mainStore.treeFlat;
	for (const id in mainStore.places) {
		if (regexp.test(mainStore.places[id].name)) {
			mainStore.places[id].show = true;
			if (
				text.length !== 0 &&
				!folders[mainStore.places[id].folderid].opened
			) {
				mainStore.folderOpenClose({
					folder: folders[mainStore.places[id].folderid],
					opened: true,
				});
			}
		} else {
			mainStore.places[id].show = false;
		}
	}
};
</script>

<style lang="scss" scoped>
.admin-link {
	position: relative;
	top: -10px; left: 5px;
	font-size: 55%;
	text-transform: lowercase;
}
.control-search {
	display: grid;
	grid-template-columns: 1fr auto auto;
	gap: 8px;
	align-items: center;
	margin-top: 8px;
	input {
		width: 100%;
	}
	.actions-button {
		margin: 0;
	}
}
.control-range, .control-measure dd {
	display: grid;
	gap: 8px;
	align-items: center;
}
.control-range {
	grid-template-columns: 1fr auto auto;
}
.control-measure dd {
	grid-template-columns: 1fr auto auto;
}
.control-range, .control-measure, .control-measure dd {
	margin: 8px 0 0 0;
	padding-left: 0;
}
.control-measure {
	padding-bottom: 8px;
}
#basic-left__places {
	margin-top: 1rem;
}
.two-fields {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 8px;
	margin-bottom: 8px;
	&__detailed_combined {
		grid-column: 1 / 3;
	}
	h4 {
		margin-bottom: -0.5rem;
	}
	> * {
		box-sizing: border-box;
		width: 100%;
	}
	input:is(:not([type="checkbox"])) {
		margin-bottom: 0 !important;
	}
	dd {
		display: flex;
		gap: 8px;
	}
	.two-fields__combined {
		grid-column: 1 / 3;
	}
}
</style>
