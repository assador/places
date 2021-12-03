<template>
	<div
		id="grid"
		class="loading-grid"
		:style="compact ? ('grid-template-columns: ' + sidebarSize.left + 'px auto; grid-template-rows: auto ' + sidebarSize.top + 'px 1fr ' + (compact === -1 ? '1fr' : (sidebarSize.bottom + (typeof(sidebarSize.bottom) === 'number' ? 'px' : ''))) + ' auto;') : ('grid-template-rows: ' + sidebarSize.top + 'px 1fr ' + sidebarSize.bottom + 'px; grid-template-columns: ' + sidebarSize.left + 'px 1fr ' + sidebarSize.right + 'px;')"
		@mousemove="documentMouseOver($event);"
		@touchmove="documentMouseOver($event);"
		@mouseup="sidebarDragStop($event);"
		@touchend="sidebarDragStop($event);"
	>
		<div
			id="top-left"
			class="app-cell fieldwidth_100"
		>
			// Control buttons for the places management
			<div class="control-buttons">
				<button
					id="actions-append"
					class="actions-button"
					title="Добавить место в центре карты"
					@click="appendPlace();"
				>
					+
				</button>
				<button
					id="actions-delete"
					class="actions-button"
					title="Удалить текущее место"
					:disabled="!($store.state.user && currentPlace && currentPlace.userid == $store.state.user.id)"
					@click="deletePlace(currentPlace);"
				>
					×
				</button>
				<button
					id="actions-append-folder"
					class="actions-button"
					title="Добавить папку"
					@click="$router.push({name: 'HomeFolder'}).catch(() => {});"
				>
					П+
				</button>
				<button
					id="actions-edit-folders"
					:class="'actions-button' + ($root.foldersEditMode ? ' button-pressed' : '')"
					title="Редактировать папки"
					@click="$root.foldersEditMode = !$root.foldersEditMode;"
				>
					ПР
				</button>
			</div>
			// Input field to search the places by name
			<input
				placeholder="Поиск по названию мест"
				title="Поиск по названию мест"
				class="find-places-input fieldwidth_100 fontsize_n"
				@keyup="selectPlaces"
			>
		</div>
		<div
			id="top-basic"
			class="app-cell"
		>
			<div>
				<div class="brand">
					<h1 class="basiccolor margin_bottom_0">
						Места —
						<router-link to="/account">
							{{ $store.state.user ? $store.state.user.login : 'o_O' }}
						</router-link>
					</h1>
					<div>Сервис просмотра и редактирования библиотек мест</div>
				</div>
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
					id="actions-undo"
					class="actions-button"
					title="Отменить"
					@click="$store.dispatch('undo');"
				>
					↺
				</button>
				<button
					id="actions-redo"
					class="actions-button"
					title="Вернуть"
					@click="$store.dispatch('redo');"
				>
					↻
				</button>
				<button
					id="actions-save"
					:class="'actions-button' + (!$store.state.saved ? ' button-pressed highlight' : '')"
					:title="(!$store.state.saved ? 'Не сохранено. ' : '') + 'Сохранить в базу данных.'"
					@click="$root.toDBCompletely();"
				>
					↯
				</button>
				<button
					id="actions-import"
					class="actions-button"
					title="Импортировать места"
					onclick="document.getElementById('inputImportFromFile').click();"
				>
					↲
				</button>
				<button
					id="actions-export"
					class="actions-button"
					title="Экспортировать свои места"
					@click="$router.push({name: 'HomeExport', params: {mime: 'application/gpx+xml'}}).catch(() => {})"
				>
					↱
				</button>
				<button
					id="actions-about"
					class="actions-button"
					title="О «Местах», справка"
					@click="$router.push({name: 'HomeText', params: {what: 'about'}}).catch(() => {})"
				>
					?
				</button>
				<button
					id="actions-exit"
					class="actions-button"
					title="Выйти"
					@click="$root.toDBCompletely(); exit();"
				>
					↪
				</button>
			</div>
		</div>
		<div
			id="basic-left"
			class="app-cell"
		>
			<div id="basic-left__places">
				<div
					v-if="$store.state.places.length > 0 || $store.state.folders.length > 0"
					id="places-menu"
					class="menu"
				>
					<tree
						instanceid="placestree"
						:data="$root.folderRoot || {}"
					/>
				</div>
				<div v-if="$store.state.commonPlaces.length > 0 && commonPlacesShow">
					<h2 class="basiccolor">
						Другие места
					</h2>
					<div class="margin_bottom">
						<div
							v-for="commonPlace in $store.state.commonPlaces"
							v-if="$store.state.commonPlaces.indexOf(commonPlace) >= commonPlacesOnPageCount * (commonPlacesPage - 1) && $store.state.commonPlaces.indexOf(commonPlace) < commonPlacesOnPageCount * commonPlacesPage"
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
				:is="$root.maps[$root.activeMapIndex].component"
				:id="currentPlace ? currentPlace.id : null"
				ref="extmap"
				:name="currentPlace ? currentPlace.name : ''"
				:description="currentPlace ? currentPlace.description : ''"
				:link="currentPlace ? currentPlace.link : ''"
				:images="currentPlace ? currentPlace.images : []"
				:latitude="currentPlace ? currentPlace.latitude : constants.map.initial.latitude"
				:longitude="currentPlace ? currentPlace.longitude : constants.map.initial.longitude"
				:altitudecapability="currentPlace ? currentPlace.altitudecapability : ''"
				:time="currentPlace ? currentPlace.time : ''"
				:center-latitude="$store.state.center ? $store.state.center.latitude : constants.map.initial.latitude"
				:center-longitude="$store.state.center ? $store.state.center.longitude : constants.map.initial.longitude"
				:zoom="$store.state.zoom ? $store.state.zoom : constants.map.initial.zoom"
				:geomarks-visibility="geomarksVisibility"
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
				<dt v-if="currentPlace">
					<dl
						v-for="field in Object.keys(currentPlace)"
						:key="field"
						class="place-detailed margin_bottom_0"
					>
						<dt
							v-if="field == 'link'"
							class="place-detailed__link-dt"
						>
							<a
								v-if="!linkEditing && currentPlace[field].trim()"
								:href="currentPlace[field].trim()"
								target="_blank"
							>
								{{ $store.state.placeFields[field] }}
							</a>
							<span v-else>
								{{ $store.state.placeFields[field] }}:
							</span>
						</dt>
						<dt v-else-if="!(field == 'images' && currentPlace.images.length == 0) && !(field == 'common' && $root.currentPlaceCommon) && field != 'link' && field != 'show' && field != 'type' && field != 'id' && field != 'folderid' && field != 'userid' && field != 'geomark' && field != 'added' && field != 'deleted' && field != 'updated' && field != 'common'">
							{{ $store.state.placeFields[field] }}:
						</dt>
						<dd v-if="field == 'srt' || field == 'link' || field == 'latitude' || field == 'longitude' || field == 'altitudecapability'">
							<input
								:id="'detailed-' + field"
								v-model.number.trim="currentPlace[field]"
								type="text"
								:disabled="$root.currentPlaceCommon"
								class="fieldwidth_100"
								@change="$store.dispatch('changePlace', {place: currentPlace, change: {[field]: currentPlace[field]}});"
							>
						</dd>
						<dd v-else-if="field == 'time'">
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
							v-else-if="!(field == 'common' && $root.currentPlaceCommon) && field != 'show' && field != 'type' && field != 'id' && field != 'folderid' && field != 'userid' && field != 'geomark' && field != 'added' && field != 'deleted' && field != 'updated' && field == 'common'"
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
								Место видно другим
							</label>
						</dd>
						<dd
							v-else-if="field == 'images' && currentPlace.images.length > 0"
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
									@click="$router.push({name: 'HomeImages', params: {imageId: image.id}}).catch(() => {})"
									@dragstart="$root.handleDragStart"
									@dragenter="$root.handleDragEnter"
								>
									<div
										class="block_02"
									>
										<img
											class="image-thumbnail border_1"
											draggable="false"
											:src="constants.dirs.uploads.images.small + image.file"
											:alt="currentPlace.name"
											:title="currentPlace.name"
										>
										<div
											v-if="!$root.currentPlaceCommon"
											class="dd-images__delete button"
											draggable="false"
											@click="$event.stopPropagation(); $store.commit('setIdleTime', 0); $root.deleteImages([image]);"
										>
											×
										</div>
									</div>
								</div>
							</div>
						</dd>
						<dd v-else-if="field != 'common' && field != 'link' && field != 'images' && field != 'show' && field != 'type' && field != 'id' && field != 'folderid' && field != 'userid' && field != 'geomark' && field != 'added' && field != 'deleted' && field != 'updated'">
							<textarea
								:id="'detailed-' + field"
								v-model.trim="currentPlace[field]"
								:disabled="$root.currentPlaceCommon"
								:placeholder="field == 'name' ? 'Название места' : (field == 'description' ? 'Описание места' : '')"
								class="fieldwidth_100"
								@change="$store.dispatch('changePlace', {place: currentPlace, change: {[field]: currentPlace[field]}});"
							/>
						</dd>
					</dl>
				</dt>
				<div
					v-if="currentPlace && !currentPlace.deleted && !$root.currentPlaceCommon"
					class="images-add margin_bottom"
				>
					<div class="images-add__div button">
						<span>Добавить фотографии</span>
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
					<span>… загрузка …</span>
				</div>
				<div v-if="currentPlace && !$root.currentPlaceCommon">
					<label>
						<input
							id="checkbox-homeplace"
							type="checkbox"
							:checked="currentPlace === $store.state.homePlace ? 'checked' : ''"
							@change="$store.dispatch('setHomePlace', ($event.target.checked ? currentPlace.id : null));"
						>
						Домашнее место
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
					title="Показать / скрыть все свои геометки"
					@click="$store.dispatch('placemarksShowHide')"
				>
					◉
				</button>
				<button
					id="commonPlacesShowHideButton"
					:class="'actions-button' + (commonPlacesShow ? ' button-pressed' : '')"
					title="Показать / скрыть все другие места и их геометки"
					@click="commonPlacesShowHide();"
				>
					◪
				</button>
				<button
					id="commonPlacemarksShowHideButton"
					:class="'actions-button' + ($store.state.commonPlacemarksShow ? ' button-pressed' : '')"
					title="Показать / скрыть все другие геометки"
					@click="$store.dispatch('commonPlacemarksShowHide')"
				>
					◎
				</button>
				<button
					id="centerPlacemarkShowHideButton"
					:class="'actions-button' + ($store.state.centerPlacemarkShow ? ' button-pressed' : '')"
					title="Показать / скрыть метку центра карты"
					@click="$store.dispatch('centerPlacemarkShowHide')"
				>
					◈
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
					@change="$root.changeMap($event.target.selectedIndex); showMap(true);"
				>
					<option
						v-for="(map, index) in $root.maps"
						:key="index"
						:value="map.component"
						:selected="map.component === $root.maps[$root.activeMapIndex].component"
					>
						{{ map.name }}
					</option>
				</select>
			</div>
			<div class="center-coordinates">
				<span class="imp">
					Центр
				</span>
				<span
					class="nobr"
					style="margin-left: 1em;"
				>
					Широта:
					<input
						v-model.number.trim="$store.state.center.latitude"
						placeholder="latitude"
						title="Широта"
					>
				</span>
				<span
					class="nobr"
					style="margin-left: 1em;"
				>
					Долгота:
					<input
						v-model.number.trim="$store.state.center.longitude"
						placeholder="longitude"
						title="Долгота"
					>
				</span>
			</div>
		</div>
		<router-view />
	</div>
</template>

<script lang="ts">
import Vue from 'vue';
import _ from 'lodash';
import { constants } from '../shared/constants';
import { mapState } from 'vuex';
import { commonFunctions } from '../shared/common';
import { makeFieldsValidatable } from '../shared/fields_validate';
import { bus } from '../shared/bus';
import axios from 'axios';
import Tree from './Tree.vue';
import MapYandex from './MapYandex.vue';
import MapOpenStreetMap from './MapOpenStreetMap.vue';
import { Place, Image, Folder } from '@/store/types';

export default Vue.extend({
	components: {
		Tree,
		MapYandex,
		MapOpenStreetMap,
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
		}
	},
	computed: {
		...mapState(['currentPlace', 'currentPlaceIndex']),
		orderedImages(): Array<Image> {
			return this.currentPlace ? _.orderBy(this.currentPlace.images, 'srt') : [];
		},
		geomarksVisibility(): Record<string, boolean> {
			let geomarksVisibility: Record<string, boolean> = {};
			for (let p of this.$store.state.places) {
				geomarksVisibility[p.id] = p.geomark;
			}
			return geomarksVisibility;
		},
		stateReady(): boolean {
			return this.$store.state.ready;
		},
	},
	watch: {
		getCurrentPlace: {
			deep: true,
			immediate: true,
			handler(place) {
				if (place) {
					this.$store.commit('setCurrentPlace', {
						...place,
						images: place.images,
					});
				}
			},
		},
		stateReady() {
			this.stateReadyChanged();
		},
	},
	created() {
		bus.$on('setCurrentPlace', (payload: {place: Place, common: boolean}) => {
			this.setCurrentPlace(payload.place, payload.common);
		});
	},
	mounted() {
		if (this.stateReady) {
			this.stateReadyChanged();
		}
		this.$store.commit('setIdleTime', 0);
		if (!(this.$root as Vue & {idleTimeInterval: number | undefined}).idleTimeInterval) {
			(this.$root as Vue & {idleTimeInterval: number | undefined}).idleTimeInterval =
				window.setInterval(() => {
					if (this.$store.state.idleTime < constants.sessionlifetime) {
						this.$store.commit('setIdleTime', this.$store.state.idleTime + 1);
					} else {
						window.clearInterval(
							(this.$root as Vue & {idleTimeInterval: number | undefined})
								.idleTimeInterval
						);
						(this.$root as Vue & {idleTimeInterval: number | undefined})
							.idleTimeInterval = undefined;
						this.$store.dispatch('unload');
						this.$router.push({name: 'Auth'}).catch(() => {});
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
	beforeDestroy() {
		document.removeEventListener(
			'dragover',
			(this.$root as Vue & {handleDragOver(event: Event): void}).handleDragOver,
			false
		);
		document.removeEventListener(
			'drop',
			(this.$root as Vue & {handleDrop(event: Event): void}).handleDrop,
			false
		);
		document.removeEventListener('keyup', this.keyup, false);
		bus.$off('setCurrentPlace');
	},
	methods: {
		blur() {
			let el = this.$el.querySelector(':focus');
			if (el) {
				try {(el as HTMLElement).blur();} catch(e) {}
			}
		},
		exit() {
			this.$store.dispatch('unload');
			this.$router.push({name: 'Auth'}).catch(() => {});
		},
		stateReadyChanged() {
			if (this.stateReady) {
				this.$store.dispatch('restoreObjectsAsLinks');
				if (!this.currentPlace && this.$store.state.places.length > 0) {
					if (this.$store.state.homePlace) {
						this.setCurrentPlace(this.$store.state.homePlace);
					} else {
						let firstPlaceInRoot = this.$store.state.places.find(
							(p: Place) => p.folderid === 'root'
						);
						if (firstPlaceInRoot) {
							this.setCurrentPlace(firstPlaceInRoot);
						} else {
							this.setCurrentPlace(this.$store.state.places[0]);
						}
					}
				}
				this.openTreeToCurrentPlace();
				this.commonPlacesPagesCount = Math.ceil(
					this.$store.state.commonPlaces.length / this.commonPlacesOnPageCount
				);
				(this.$root as Vue & {currentPlaceCommon: boolean}).currentPlaceCommon = false;
				if (
					this.currentPlace &&
					this.currentPlace.common &&
					this.currentPlace.userid !== this.$store.state.user.id
				) {
					const inPaginator =
						this.$store.state.commonPlaces.indexOf(this.currentPlace) /
						this.commonPlacesOnPageCount
					;
					this.commonPlacesPage = (Number.isInteger(inPaginator)
						? inPaginator + 1
						: Math.ceil(inPaginator)
					);
					(this.$root as Vue & {currentPlaceCommon: boolean}).currentPlaceCommon = true;
				}
				this.showMap(false);
				document.addEventListener(
					'dragover',
					(this.$root as Vue & {handleDragOver(event: Event): void}).handleDragOver,
					false
				);
				document.addEventListener(
					'drop',
					(this.$root as Vue & {handleDrop(event: Event): void}).handleDrop,
					false
				);
				document.addEventListener('keyup', this.keyup, false);
				window.addEventListener('resize', this.windowResize, false);
				if (this.$store.state.user.testaccount) {
					window.setTimeout(() => {
						this.$store.dispatch("setMessage", `
							Вы авторизовались под тестовым аккаунтом;
							невозможны сохранение изменений в базу данных
							и загрузка файлов, в том числе фотографий.
						`);
					}, 3000);
				}
				this.windowResize();
				this.$store.commit('backupState');
			}
		},
		showMap(mapLoaded: boolean) {
			this.$nextTick(() => {
				if (this.$refs.extmap) {
					if ((this.$refs.extmap as Vue & {map: any}).map) {
						if (
							(this.$root as Vue & {maps: Array<Record<string, string>>}).maps[
								(this.$root as Vue & {activeMapIndex: number}).activeMapIndex
							].component === 'MapYandex'
						) {
							(this.$refs.extmap as Vue & {map: any}).map.destroy();
						} else {
							(this.$refs.extmap as Vue & {map: any}).map.remove();
						}
					}
					if (!mapLoaded) {
						if (this.currentPlace) {
							(this.$refs.extmap as Vue & {
								showMap(lat: number, lng: number, zoom: number): void
							}).showMap(
								this.currentPlace.latitude,
								this.currentPlace.longitude,
								constants.map.initial.zoom
								
							);
						} else {
							(this.$refs.extmap as Vue & {
								showMap(lat: number, lng: number, zoom: number): void
							}).showMap(
								constants.map.initial.latitude,
								constants.map.initial.longitude,
								constants.map.initial.zoom
							);
						}
					} else {
						(this.$refs.extmap as Vue & {
							showMap(lat: number, lng: number, zoom: number): void
						}).showMap(
							this.$store.state.center.latitude,
							this.$store.state.center.longitude,
							this.$store.state.zoom
						);
					}
				}
			});
		},
		openTreeToCurrentPlace() {
			if (
				!(this.$root as Vue & {currentPlaceCommon: boolean}).currentPlaceCommon &&
				this.currentPlace
			) {
				let folder, folderid = this.currentPlace.folderid;
				while (folderid) {
					folder = commonFunctions.findInTree(
						(this.$root as Vue & {folderRoot: Folder}).folderRoot,
						'children',
						'id',
						folderid
					);
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
		setCurrentPlace(place: Place | null, common?: boolean): void {
			if (this.currentPlace && place === this.currentPlace) return;
			if (this.currentPlace) {
				if (
					!(this.$root as Vue & {currentPlaceCommon: boolean}).currentPlaceCommon &&
					(this.$refs.extmap as Vue & {mrks: any}).mrks[this.currentPlace.id]
				) {
					if (
						(this.$root as Vue & {maps: Array<Record<string, string>>}).maps[
							(this.$root as Vue & {activeMapIndex: number}).activeMapIndex
						].component === 'MapYandex'
					) {
						(this.$refs.extmap as Vue & {mrks: any})
							.mrks[this.currentPlace.id].options.set(
								'iconColor',
								(this.$refs.extmap as Vue & {privatePlacemarksColor: string})
									.privatePlacemarksColor
							);
					} else {
						(this.$refs.extmap as Vue & {mrks: any})
							.mrks[this.currentPlace.id].setIcon(
								(this.$refs.extmap as Vue & {icon_01: any}).icon_01
							);
					}
				} else if (
					(this.$refs.extmap as Vue & {commonMrks: any}).commonMrks[this.currentPlace.id]
				) {
					if (
						(this.$root as Vue & {maps: Array<Record<string, string>>}).maps[
							(this.$root as Vue & {activeMapIndex: number}).activeMapIndex
						].component === 'MapYandex'
					) {
						(this.$refs.extmap as Vue & {commonMrks: any})
							.commonMrks[this.currentPlace.id].options.set(
								'iconColor',
								(this.$refs.extmap as Vue & {commonPlacemarksColor: string})
									.commonPlacemarksColor
							);
					} else {
						(this.$refs.extmap as Vue & {commonMrks: any})
							.commonMrks[this.currentPlace.id].setIcon(
								(this.$refs.extmap as Vue & {icon_02: any}).icon_02
							);
					}
				}
			}
			if (!place) {
				this.$store.commit('setCurrentPlace', null);
				return;
			}
			this.$store.commit('setCurrentPlaceIndex', this.$store.state.places.indexOf(place));
			this.$store.commit('setCurrentPlace', place);
			(this.$root as Vue & {currentPlaceCommon: boolean}).currentPlaceCommon = (
				this.currentPlace.userid !== this.$store.state.user.id
					? true
					: false
			);
			if (
				!(this.$root as Vue & {currentPlaceCommon: boolean}).currentPlaceCommon &&
				(this.$refs.extmap as Vue & {mrks: any}).mrks[this.currentPlace.id]
			) {
				if (
					(this.$root as Vue & {maps: Array<Record<string, string>>}).maps[
						(this.$root as Vue & {activeMapIndex: number}).activeMapIndex
					].component === 'MapYandex'
				) {
					(this.$refs.extmap as Vue & {mrks: any})
						.mrks[this.currentPlace.id].options.set(
							'iconColor',
							(this.$refs.extmap as Vue & {activePlacemarksColor: string})
								.activePlacemarksColor
						);
				} else {
					(this.$refs.extmap as Vue & {mrks: any})
						.mrks[this.currentPlace.id].setIcon(
							(this.$refs.extmap as Vue & {icon_03: any}).icon_03
						);
				}
			} else if (
				(this.$refs.extmap as Vue & {commonMrks: any}).commonMrks[this.currentPlace.id]
			) {
				if (
					(this.$root as Vue & {maps: Array<Record<string, string>>}).maps[
						(this.$root as Vue & {activeMapIndex: number}).activeMapIndex
					].component === 'MapYandex'
				) {
					(this.$refs.extmap as Vue & {commonMrks: any})
						.commonMrks[this.currentPlace.id].options.set(
							'iconColor',
							(this.$refs.extmap as Vue & {activePlacemarksColor: string})
								.activePlacemarksColor
						);
				} else {
					(this.$refs.extmap as Vue & {commonMrks: any})
						.commonMrks[this.currentPlace.id].setIcon(
							(this.$refs.extmap as Vue & {icon_03: any}).icon_03
						);
				}
			}
			this.openTreeToCurrentPlace();
			this.$store.dispatch('changeMap', {
				latitude: this.currentPlace.latitude,
				longitude: this.currentPlace.longitude,
			});
		},
		appendPlace() {
			if (
				this.$store.state.serverConfig.rights.placescount < 0 ||
				this.$store.state.serverConfig.rights.placescount
					> this.$store.state.places.length ||
				this.$store.state.user.testaccount
			) {
				let lat, lng;
				if (
					(this.$root as Vue & {maps: any}).maps[
						(this.$root as Vue & {activeMapIndex: number}).activeMapIndex
					].component === 'MapYandex'
				) {
					lat = (this.$refs.extmap as Vue & {map: any}).map.getCenter()[0].toFixed(7);
					lng = (this.$refs.extmap as Vue & {map: any}).map.getCenter()[1].toFixed(7);
				} else {
					lat = (this.$refs.extmap as Vue & {map: any}).map.getCenter().lat.toFixed(7);
					lng = (this.$refs.extmap as Vue & {map: any}).map.getCenter().lng.toFixed(7);
				}
				let newPlace = {
					type: 'place',
					userid: sessionStorage.getItem('places-userid') as string,
					name: '',
					description: '',
					link: '',
					latitude: lat,
					longitude: lng,
					time: new Date().toISOString().slice(0, -5),
					id: commonFunctions.generateRandomString(32),
					folderid:
						this.currentPlace
							? this.currentPlace.folderid
							: 'root'
					,
					srt:
						this.$store.state.places.length > 0
							? Math.ceil(Math.max(
								...this.$store.state.places.map(
									(place: Place) => place.srt
								)
							)) + 1
							: 1
					,
					common: false,
					geomark: true,
					images: [],
					added: true,
					deleted: false,
					updated: false,
					show: true,
				};
				this.$store.dispatch('addPlace', newPlace);
				(this.$refs.extmap as Vue & {appendPlacemark(
					marks: Record<string, any>, place: Place, type: string
				): void}).appendPlacemark(
					(this.$refs.extmap as Vue & {mrks: any}).mrks,
					newPlace,
					'private'
				);
				this.setCurrentPlace(
					this.$store.state.places[
						this.$store.state.places.length - 1
					]
				);
				this.$nextTick(() => {
					document.getElementById('detailed-name')!.classList.add('highlight');
				});
				window.setTimeout(function() {
					document.getElementById('detailed-name')!.classList.remove('highlight');
					document.getElementById('detailed-name')!.focus();
				}, 500);
				return newPlace;
			} else {
				this.$store.dispatch('setMessage', `
					Превышено максимально допустимое для вашей
					текущей роли количство мест.
				`);
			}
		},
		deletePlace(place: Place) {
			if (place.images) {
				(this.$root as Vue & {deleteImages(
					images: Array<Image>, family?: boolean
				): void}).deleteImages(place.images, true);
			}
			if (this.$store.state.places.length > 1) {
				let firstRootPlace;
				if (document.getElementById(place.id)!.nextElementSibling!) {
					this.setCurrentPlace(
						this.$store.state.places.find(
							(p: Place) => p.id ===
								document.getElementById(place.id)!
									.nextElementSibling!.id
						)
					);
				} else if (document.getElementById(place.id)!.previousElementSibling!) {
					this.setCurrentPlace(
						this.$store.state.places.find(
							(p: Place) => p.id ===
								document.getElementById(place.id)!
									.previousElementSibling!.id
						)
					);
				} else if (this.$store.state.homePlace) {
					this.setCurrentPlace(this.$store.state.homePlace);
				} else if (
					!!(firstRootPlace = this.$store.state.places.find(
						(p: Place) => p.folderid === 'root'
					))
				) {
					this.setCurrentPlace(firstRootPlace);
				} else {
					let firstPlaceInState;
					this.setCurrentPlace(
						!(firstPlaceInState =
							this.$store.state.places.find(
								(p: Place) => !p.deleted
							)
						) ? null : firstPlaceInState
					);
				}
			} else {
				this.setCurrentPlace(null);
			}
			if (
				(this.$root as Vue & {maps: Array<Record<string, string>>}).maps[
					(this.$root as Vue & {activeMapIndex: number}).activeMapIndex
				].component === 'MapYandex'
			) {
				(this.$refs.extmap as Vue & {map: any}).map.geoObjects.remove(
					(this.$refs.extmap as Vue & {mrks: any}).mrks[place.id]
				);
			} else {
				(this.$refs.extmap as Vue & {map: any}).map.removeLayer(
					(this.$refs.extmap as Vue & {mrks: any}).mrks[place.id]
				);
			}
			delete (this.$refs.extmap as Vue & {mrks: any}).mrks[place.id];
			this.$store.dispatch('deletePlace', place);
		},
		commonPlacesShowHide(show = null) {
			this.commonPlacesShow =
				show === null
					? !this.commonPlacesShow
					: show
			;
			this.$store.dispatch('commonPlacemarksShowHide', this.commonPlacesShow);
			for (let key in (this.$refs.extmap as Vue & {commonMrks: any}).commonMrks) {
				if (
					(this.$root as Vue & {maps: Array<Record<string, string>>}).maps[
						(this.$root as Vue & {activeMapIndex: number}).activeMapIndex
					].component === 'MapYandex'
				) {
					(this.$refs.extmap as Vue & {commonMrks: any})
						.commonMrks[key].options.set('visible', this.commonPlacesShow);
				} else {
					if (this.commonPlacesShow) {
						(this.$refs.extmap as Vue & {map: any}).map.addLayer(
							(this.$refs.extmap as Vue & {commonMrks: any}).commonMrks[key]
						);
					} else {
						(this.$refs.extmap as Vue & {map: any}).map.removeLayer(
							(this.$refs.extmap as Vue & {commonMrks: any}).commonMrks[key]
						);
					}
				}
			}
		},
		importFromFile() {
			let mime = (this.$refs.inputImportFromFile as HTMLInputElement).files![0].type;
			let reader = new FileReader();
			reader.onload = (event: Event) => {
				this.$nextTick(() => {
					this.$store.dispatch('setPlaces', {
						text: (event.target as FileReader).result,
						mime: mime,
					}).then(() => {
						this.showMap(true);
					});
					(this.$refs.inputImportFromFile as HTMLInputElement).value = '';
				});
			};
			if (mime == 'application/json' || mime == 'application/gpx+xml') {
				reader.readAsText(
					(this.$refs.inputImportFromFile as HTMLInputElement).files![0]
				);
			} else {
				this.$store.dispatch('setMessage', `
					Недопустимый тип импортируемого файла.
					Допускаются только JSON и GPX.
				`);
			}
		},
		uploadFiles(event: Event) {
			event.preventDefault();
			if (this.$store.state.user.testaccount) {
				this.$store.dispatch('setMessage',
					'Тестовый аккаунт не позволяет загрузку файлов.'
				);
			} else {
				let
					data = new FormData(),
					files = (this.$refs.inputUploadFiles as HTMLInputElement).files,
					filesArray: Array<Record<string, unknown>> = [],
					srt: number
				;
				if (
					this.currentPlace &&
					this.currentPlace.images.length > 0
				) {
					let storeImages = this.currentPlace.images;
					srt = commonFunctions.sortObjects(storeImages, 'srt').pop()!.srt;
				} else {
					srt = 0;
				}
				for (let i = 0; i < files!.length; i++) {
					if (!this.$store.state.serverConfig.mimes[files![i].type]) {
						this.$store.dispatch('setMessage',
							'Файл ' +
							files![i].name +
							' не является картинкой и загружен не будет.'
						);
					} else if (files![i].size > this.$store.state.serverConfig.uploadsize) {
						this.$store.dispatch('setMessage',
							'Файл ' +
							files![i].name +
							' слишком большого размера и загружен не будет.'
						);
					} else {
						let rndname = commonFunctions.generateRandomString(32);
						data.append(rndname, files![i]);
						filesArray.push({
							id: rndname,
							file:
								rndname +
								'.' +
								this.$store.state.serverConfig.mimes[files![i].type]
							,
							size: files![i].size,
							type: files![i].type,
							lastmodified: files![i].lastModified,
							srt: ++srt,
							placeid: this.currentPlace.id
								? this.currentPlace.id
								: null,
						});
					}
				}
				if (filesArray.length > 0) {
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
							let images = this.currentPlace.images
								? this.currentPlace.images.concat(filesArray)
								: filesArray
							;
							this.$store.dispatch('changePlace', {
								place: this.currentPlace,
								change: {images: images},
							});
							/*
							 * Проверка накопленных кодов ошибок и замечаний
							 * в процессе выполнения /dist/backend/upload.php
							 */
							response.data[0].forEach((code: number) => {
								switch (code) {
									case 2 :
										this.$store.dispatch('setMessage', `
											Тестовый аккаунт не позволяет загрузку файлов.
										`
										);
										break;
									case 3 :
										this.$store.dispatch('setMessage', `
											Некоторые файлы не являются
											картинками и загружены не были.
										`
										);
										break;
									case 4 :
										this.$store.dispatch('setMessage', `
											Некоторые файлы слишком большого
											размера и загружены не были.
											Для вашей роли размер файла ограничен
											` + ' ' + Number(
												(this.$store.state.serverConfig.rights.photosize
												/ 1048576).toFixed(3)
											) + ' Mb.'
										);
										break;
								}
							});
							if (response.data[1].length > 0) {
								this.$store.dispatch('setMessage',
									'Файлы успешно загружены.'
								);
								bus.$emit('toDB', {
									what: 'places',
								});
								bus.$emit('toDB', {
									what: 'images_upload',
									data: filesArray,
								});
							}
						})
						.catch(error => {
							this.$store.dispatch('setMessage',
								'При загрузке файлов произошла ошибка. ' + error
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
								this.currentPlace.userid ==
									this.$store.state.user.id
						) {
							this.deletePlace(this.currentPlace);
						}
						break;
					case 'add folder' :
						this.$router.push({name: 'HomeFolder'}).catch(() => {});
						break;
					case 'edit mode' :
						(this.$root as Vue & {foldersEditMode: boolean}).foldersEditMode =
							!(this.$root as Vue & {foldersEditMode: boolean}).foldersEditMode;
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
							name: 'HomeExport',
							params: {mime: 'application/gpx+xml'},
						}).catch(() => {});
						break;
					case 'save' :
						bus.$emit('toDBCompletely');
						break;
					case 'help' :
						this.$router.push({name: 'HomeText', params: {what: 'about'}});
						break;
					case 'revert' :
						document.location.reload();
						break;
					case 'quit' :
						bus.$emit('toDBCompletely');
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
		sidebarDragStop(event: Event) {
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
				for (let place of this.$store.state.places) {
					let regexp = new RegExp(
						(event.target as HTMLInputElement).value, 'i'
					);
					if (
						(event.target as HTMLInputElement).value.length > 1 &&
						regexp.test(place.name)
					) {
						this.setCurrentPlace(place);
					}
				}
			}
		},
	},
});
</script>
