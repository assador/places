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
				@click="$store.dispatch('clearMessage');"
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
					:title="(!$store.state.saved ? 'Не сохранено. ' : '') + 'Сохранить в БД'"
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
					<Tree
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
			<ExtMap
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
								@change="$store.commit('changePlace', {place: currentPlace, change: {updated: true}});"
							>
						</dd>
						<dd v-else-if="field == 'time'">
							<input
								:id="'detailed-' + field"
								v-model="currentPlace[field]"
								type="datetime-local"
								:disabled="$root.currentPlaceCommon"
								class="fieldwidth_100"
								@change="$store.commit('changePlace', {place: currentPlace, change: {updated: true}});"
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
									@change="$store.commit('changePlace', {place: currentPlace, change: {updated: true}});"
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
								@change="$store.commit('changePlace', {place: currentPlace, change: {updated: true}});"
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
							@change="$store.commit('setHomePlace', ($event.target.checked ? currentPlace.id : null)); $root.homeToDB($event.target.checked ? currentPlace : {});"
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
					class="actions-button button-pressed"
					title="Показать / скрыть все свои геометки"
					@click="$refs.extmap.placemarksShowHide();"
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
					:class="'actions-button' + ($refs.extmap && $refs.extmap.commonPlacemarksShow ? ' button-pressed' : '')"
					title="Показать / скрыть все другие геометки"
					@click="$refs.extmap.commonPlacemarksShowHide();"
				>
					◎
				</button>
				<button
					id="centerPlacemarkShowHideButton"
					:class="'actions-button' + ($refs.extmap && $refs.extmap.centerPlacemarkShow ? ' button-pressed' : '')"
					title="Показать / скрыть метку центра карты"
					@click="$refs.extmap.centerPlacemarkShowHide();"
				>
					◈
				</button>
			</div>
		</div>
		<div
			id="bottom-basic"
			class="app-cell"
		>
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
		<router-view />
	</div>
</template>

<script>
import _ from 'lodash'
import { constants } from '../shared/constants'
import { mapState } from 'vuex'
import commonFunctions from '../shared/common.ts'
import { makeFieldsValidatable } from '../shared/fields_validate'
import { bus } from '../shared/bus'
import axios from 'axios'
import Tree from './Tree.vue'
import ExtMap from './ExtMap.vue'
export default {
	components: {
		Tree,
		ExtMap,
	},
	data() {
		return {
			state: this.$store.state,
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
			sidebarDrag: {what: null, x: 0, y: 0, w: 0, h: 0},
			compact: false,
			linkEditing: false,
		}
	},
	computed: {
		...mapState(['currentPlace', 'currentPlaceIndex']),
		orderedImages() {
			return this.currentPlace ? _.orderBy(this.currentPlace.images, 'srt') : [];
		},
		geomarksVisibility() {
			let geomarksVisibility = {};
			for (let p of this.$store.state.places) {
				geomarksVisibility[p.id] = p.geomark;
			}
			return geomarksVisibility;
		},
		stateReady() {
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
		bus.$on('setCurrentPlace', (payload) => {
			this.setCurrentPlace(payload.place, payload.common);
		});
	},
	mounted() {
		if (this.stateReady) {
			this.stateReadyChanged();
		}
		this.$store.commit('setIdleTime', 0);
		makeFieldsValidatable();
	},
	beforeDestroy() {
		document.removeEventListener('dragover', this.$root.handleDragOver, false);
		document.removeEventListener('drop', this.$root.handleDrop, false);
		document.removeEventListener('keyup', this.keyup, false);
		bus.$off('setCurrentPlace');
	},
	methods: {
		blur() {
			let el = this.$el.querySelector(':focus');
			if (el) el.blur();
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
							p => p.folderid === 'root'
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
				this.$root.currentPlaceCommon = false;
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
					this.$root.currentPlaceCommon = true;
				}
				if (this.$refs.extmap) {
					if (this.$refs.extmap.map) {
						this.$refs.extmap.map.destroy();
					}
					if (this.currentPlace) {
						this.$refs.extmap.showMap(
							this.currentPlace.latitude,
							this.currentPlace.longitude
						);
					} else {
						this.$refs.extmap.showMap(
							constants.map.initial.latitude,
							constants.map.initial.longitude
						);
					}
				}
				document.addEventListener('dragover', this.$root.handleDragOver, false);
				document.addEventListener('drop', this.$root.handleDrop, false);
				document.addEventListener('keyup', this.keyup, false);
				window.addEventListener('resize', this.windowResize, false);
				if (this.$store.state.user.testaccount) {
					setTimeout(() => {
						this.$store.dispatch("setMessage", `
							Вы авторизовались под тестовым аккаунтом;
							невозможны сохранение изменений в базу данных
							и загрузка файлов, в том числе фотографий.
						`);
					}, 3000);
				}
				this.windowResize();
			}
		},
		openTreeToCurrentPlace() {
			if (!this.$root.currentPlaceCommon) {
				let folder, folderid = this.currentPlace.folderid;
				while (folderid) {
					folder = commonFunctions.findInTree(
						this.$root.folderRoot,
						'children',
						'id',
						folderid
					);
					if (!folder) {
						break;
					}
					this.$store.commit('folderOpenClose', {
						folder: folder,
						opened: true,
					});
					folderid = folder.parent;
				}
			}
		},
		setCurrentPlace(place) {
			if (this.currentPlace) {
				if (
					!this.$root.currentPlaceCommon &&
					this.$refs.extmap.mrks[this.currentPlace.id]
				) {
					this.$refs.extmap.mrks[this.currentPlace.id].options.set(
						'iconColor', this.$refs.extmap.privatePlacemarksColor
					);
				} else if (
					this.$refs.extmap.commonMrks[this.currentPlace.id]
				) {
					this.$refs.extmap.commonMrks[this.currentPlace.id].options.set(
						'iconColor', this.$refs.extmap.commonPlacemarksColor
					);
				}
			}
			if (!place) {
				this.$store.commit('setCurrentPlace', null);
				return;
			}
			this.$store.commit('setCurrentPlaceIndex', this.$store.state.places.indexOf(place));
			this.$store.commit('setCurrentPlace', place);
			this.$root.currentPlaceCommon = (
				this.currentPlace.userid !== this.$store.state.user.id
					? true
					: false
			);
			if (
				!this.rootcurrentPlaceCommon &&
				this.$refs.extmap.mrks[this.currentPlace.id]
			) {
				this.$refs.extmap.mrks[this.currentPlace.id].options.set(
					'iconColor', this.$refs.extmap.activePlacemarksColor
				);
			} else if (
				this.$refs.extmap.commonMrks[this.currentPlace.id]
			) {
				this.$refs.extmap.commonMrks[this.currentPlace.id].options.set(
					'iconColor', this.$refs.extmap.activePlacemarksColor
				);
			}
			this.openTreeToCurrentPlace();
			this.$store.commit('changeCenter', {
				latitude: this.currentPlace.latitude,
				longitude: this.currentPlace.longitude,
			});
		},
		appendPlace() {
			let data = new FormData();
			data.append('userid', this.$store.state.user.id);
			data.append('need', 'visiting');
			axios.post('/backend/get_groups.php', data)
				.then(response => {
					if (
						constants.rights.placescounts[response.data] < 0 ||
						constants.rights.placescounts[response.data] > this.$store.state.places.length ||
						this.$store.state.user.testaccount
					) {
						let newPlace = {
							type: 'place',
							userid: sessionStorage.getItem('places-userid'),
							name: '',
							description: '',
							link: '',
							latitude: this.$refs.extmap.map.getCenter()[0].toFixed(7),
							longitude: this.$refs.extmap.map.getCenter()[1].toFixed(7),
							altitudecapability: null,
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
											function(place) {
												return place.srt;
											}
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
						this.$store.commit('addPlace', newPlace);
						this.$refs.extmap.appendPlacemark(
							this.$refs.extmap.mrks,
							newPlace,
							'private'
						);
						this.setCurrentPlace(
							this.$store.state.places[
								this.$store.state.places.length - 1
							]
						);
						document.getElementById('detailed-name').classList.add('highlight');
						document.getElementById('detailed-name').focus();
						setTimeout(function() {
							document.getElementById('detailed-name').classList.remove('highlight');
						}, 500);
						return newPlace;
					} else {
						this.$store.dispatch('setMessage', `
							Превышено максимально допустимое для вашей текущей
							роли количство мест.<br />Дождитесь перехода
							в следующую роль или обратитесь к администрации
							сервиса по адресу<br /><a href="mailto:` +
							+ constants.from + `">` + constants.from + `</a>.
						`);
					}
				});
		},
		deletePlace(place, backup) {
			if (!this.$store.state.stateBackups.length) {
				this.$store.commit('backupState');
			}
			if (this.$store.state.homePlace === place) {
				this.$store.commit('setHomePlace', null);
			}
			this.$store.commit('removePlace', {
				place: place,
				change: {deleted: true},
				backup: false,
			});
			this.$root.deleteImages(place.images, true);
			if (this.$store.state.places.length > 0) {
				let firstRootPlace;
				if (document.getElementById(place.id).nextElementSibling) {
					this.setCurrentPlace(
						this.$store.state.places.find(
							p => p.id === document.getElementById(place.id).nextElementSibling.id
						)
					);
				} else if (document.getElementById(place.id).previousElementSibling) {
					this.setCurrentPlace(
						this.$store.state.places.find(
							p => p.id === document.getElementById(place.id).previousElementSibling.id
						)
					);
				} else if (this.$store.state.homePlace) {
					this.setCurrentPlace(this.$store.state.homePlace);
				} else if (
					!!(firstRootPlace = this.$store.state.places.find(
						p => p.folderid === 'root'
					))
				) {
					this.setCurrentPlace(firstRootPlace);
				} else {
					let firstPlaceInState;
					this.setCurrentPlace(
						!(firstPlaceInState =
							this.$store.state.places.find(
								p => !p.deleted
							)
						) ? null : firstPlaceInState
					);
				}
			} else {
				this.setCurrentPlace(null);
			}
			this.$refs.extmap.map.geoObjects.remove(this.$refs.extmap.mrks[place.id]);
			this.$store.commit('deletePlace', place);
		},
		commonPlacesShowHide(show = null) {
			this.commonPlacesShow =
				show === null
					? !this.commonPlacesShow
					: show
			;
			this.$refs.extmap.commonPlacemarksShow = this.commonPlacesShow;
			for (let key in this.$refs.extmap.commonMrks) {
				if (!this.$refs.extmap.commonPlacemarksShow) {
					this.$refs.extmap.commonMrks[key].options.set('visible', false);
				} else {
					this.$refs.extmap.commonMrks[key].options.set('visible', true);
				}
			}
		},
		importFromFile() {
			let mime = this.$refs.inputImportFromFile.files[0].type;
			let reader = new FileReader();
			reader.onload = (event) => {
				this.$nextTick(() => {
					this.$store.dispatch('setPlaces', {
						text: event.target.result,
						mime: mime,
					});
					document.getElementById('inputImportFromFile').value = '';
				});
			};
			if (mime == 'application/json' || mime == 'application/gpx+xml') {
				reader.readAsText(this.$refs.inputImportFromFile.files[0]);
			} else {
				this.$store.dispatch('setMessage',
					'Недопустимый тип импортируемого файла. Допускаются только JSON и GPX.'
				);
			}
		},
		uploadFiles(event) {
			event.preventDefault();
			if (this.$store.state.user.testaccount) {
				this.$store.dispatch('setMessage',
					'Тестовый аккаунт не позволяет загрузку файлов.'
				);
			} else {
				let
					data = new FormData(),
					files = this.$refs.inputUploadFiles.files,
					filesArray = [],
					rndname,
					srt
				;
				if (
					this.currentPlace &&
					this.currentPlace.images.length > 0
				) {
					let storeImages = this.currentPlace.images;
					srt = commonFunctions.sortObjects(storeImages, 'srt').pop().srt;
				} else {
					srt = 0;
				}
				for (let i = 0; i < files.length; i++) {
					if (!constants.mimes[files[i].type]) {
						this.$store.dispatch('setMessage',
							'Файл ' +
							files[i].name +
							' не является картинкой и загружен не будет.'
						);
					} else if (files[i].size > constants.uploadsize) {
						this.$store.dispatch('setMessage',
							'Файл ' +
							files[i].name +
							' слишком большого размера и загружен не будет.'
						);
					} else {
						files[i].rndname = commonFunctions.generateRandomString(32);
						data.append(files[i].rndname, files[i]);
						filesArray.push({
							id: files[i].rndname,
							file:
								files[i].rndname +
								"." +
								constants.mimes[files[i].type]
							,
							size: files[i].size,
							type: files[i].type,
							lastmodified: files[i].lastModified,
							srt: ++srt,
							placeid: this.currentPlace.id
								? this.currentPlace.id
								: null,
						});
					}
				}
				if (filesArray.length > 0) {
					document.getElementById('images-uploading').classList.remove('hidden');
					data.append('userid', this.$store.state.user.id);
					axios.post('/backend/upload.php', data)
						.then(response => {
							document.getElementById('images-add__input').value = '';
							document.getElementById('images-uploading').classList.add('hidden');
							for (let i = 0; i < filesArray.length; i++) {
								if (!response.data[1].find(f => f.id === filesArray[i].id)) {
									filesArray.splice(i, 1);
									i--;
								}
							}
							let images = this.currentPlace.images
								? this.currentPlace.images.concat(filesArray)
								: filesArray
							;
							this.$store.commit('changePlace', {
								place: this.currentPlace,
								change: {images: images, updated: true},
							});
							/*
							 * Проверка накопленных кодов ошибок и замечаний
							 * в процессе выполнения /dist/backend/upload.php
							 */
							response.data[0].forEach((code) => {
								switch (code) {
									case 2 :
										this.$store.dispatch('setMessage',
											'Тестовый аккаунт не позволяет загрузку файлов.'
										);
										break;
									case 3 :
										this.$store.dispatch('setMessage',
											'Некоторые файлы не являются картинками и загружены не были.'
										);
										break;
									case 4 :
										this.$store.dispatch('setMessage',
											'Некоторые файлы слишком большого размеры и загружены не были.'
										);
										break;
								}
							});
							if (response.data[1].length > 0) {
								this.$store.dispatch('setMessage', 'Файлы успешно загружены.');
								bus.$emit('toDB', {
									what: 'places',
								});
								bus.$emit('toDB', {
									what: 'images_upload',
									data: JSON.stringify(filesArray),
								});
							}
						})
						.catch(error => {
							this.$store.dispatch('setMessage',
								'При загрузке файлов произошла ошибка.'
							);
						});
				}
			}
		},
		keyup(event) {
			if (event.altKey && event.shiftKey) {
				if (constants.shortcuts[event.keyCode]) {
					this.blur();
				}
				switch (constants.shortcuts[event.keyCode]) {
					case 'add' :
						let newPlace = this.appendPlace();
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
						this.$root.foldersEditMode = !this.$root.foldersEditMode;
						if (
							document.getElementById('actions-edit-folders')
								.classList.contains('button-pressed')
						) {
							document.getElementById('actions-edit-folders')
								.classList.remove('button-pressed')
							;
						} else {
							document.getElementById('actions-edit-folders')
								.classList.add('button-pressed')
							;
						}
						break;
					case 'import' :
						document.getElementById('inputImportFromFile').click();
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
						this.$router.push({name: 'HomeText', params: {what: 'about'}}).catch(() => {});
						break;
					case 'revert' :
						document.location.reload(true);
						break;
					case 'quit' :
						bus.$emit('toDBCompletely');
						this.exit();
						break;
					case 'other' :
						this.commonPlacesShowHide();
						break;
					case 'placemarks' :
						this.$refs.extmap.placemarksShowHide();
						break;
					case 'other placemarks' :
						this.$refs.extmap.commonPlacemarksShowHide();
						break;
					case 'center' :
						this.$refs.extmap.centerPlacemarkShowHide();
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
				document.getElementById('sbs-left').style.marginLeft = 0;
				document.getElementById('sbs-top').style.marginTop = 0;
				document.getElementById('sbs-bottom').style.marginBottom = 0;
				this.compact = false;
			} else {
				if (this.compact) {
					this.sidebarSize.top = parseInt(window.getComputedStyle(
						document.getElementById('top-left')
					).height);
				}
				this.sidebarSize.right = parseInt(window.getComputedStyle(
					document.getElementById('top-right')
				).width);
				this.sidebarSize.bottom = (this.compact
					? parseInt(window.getComputedStyle(
						document.getElementById('basic-basic')
					).height)
					: '1fr'
				);
				this.sidebarSize.left = parseInt(window.getComputedStyle(
					document.getElementById('top-left')
				).width);
				document.getElementById('sbs-left').style.marginLeft =
					this.sidebarSize.left + 'px'
				;
				document.getElementById('sbs-top').style.marginTop =
					-parseInt(window.getComputedStyle(
						document.getElementById('basic-left')
					).height) + 'px'
				;
				document.getElementById('sbs-bottom').style.marginBottom =
					this.sidebarSize.bottom + 'px'
				;
				this.compact = true;
			}
			document.getElementById('grid').classList.remove('loading-grid');
		},
		sidebarDragStart(event, what) {
			event.preventDefault();
			this.sidebarDrag.what = what;
			if (event.changedTouches) {
				this.sidebarDrag.x = event.changedTouches[0].pageX;
				this.sidebarDrag.y = event.changedTouches[0].pageY;
			} else {
				this.sidebarDrag.x = event.screenX;
				this.sidebarDrag.y = event.screenY;
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
		documentMouseOver(event) {
			if (this.sidebarDrag.what !== null) {
				switch (this.sidebarDrag.what) {
					case 'top' :
						this.sidebarSize.top = this.sidebarDrag.h - this.sidebarDrag.y +
								(event.changedTouches ? event.changedTouches[0].pageY : event.screenY)
						;
						break;
					case 'bottom' :
						this.sidebarSize.bottom = this.sidebarDrag.h + this.sidebarDrag.y -
								(event.changedTouches ? event.changedTouches[0].pageY : event.screenY)
						;
						break;
					case 'left' :
						this.sidebarSize.left = this.sidebarDrag.w - this.sidebarDrag.x +
								(event.changedTouches ? event.changedTouches[0].pageX : event.screenX)
						;
						break;
					case 'right' :
						this.sidebarSize.right = this.sidebarDrag.w + this.sidebarDrag.x -
								(event.changedTouches ? event.changedTouches[0].pageX : event.screenX)
						;
						break;
				}
			}
		},
		sidebarDragStop(event) {
			this.sidebarDrag.what = null;
			if (this.compact) {
				this.windowResize();
			}
		},
		// Search and select a place by name
		selectPlaces(event) {
			if (event.keyCode == 27) {
				event.target.value = '';
			} else {
				for (let place of this.$store.state.places) {
					let regexp = new RegExp(event.target.value, 'i');
					if (event.target.value.length > 1 && regexp.test(place.name)) {
						this.setCurrentPlace(place);
					}
				}
			}
		},
	},
}
</script>
