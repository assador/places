<template>
	<div
		id="grid"
		@mousemove="documentMouseOver($event);"
		@touchmove="documentMouseOver($event);"
		@mouseup="sidebarDragStop($event);"
		@touchend="sidebarDragStop($event);"
		class="loading-grid"
		:style="compact ? ('grid-template-columns: ' + sidebarSize.left + 'px auto; grid-template-rows: auto ' + sidebarSize.top + 'px 1fr ' + (compact === -1 ? '1fr' : (this.sidebarSize.bottom + (typeof(sidebarSize.bottom) === 'number' ? 'px'  : ''))) +  ' auto;') : ('grid-template-rows: ' + sidebarSize.top + 'px 1fr ' + sidebarSize.bottom + 'px; grid-template-columns: ' + sidebarSize.left + 'px 1fr ' + sidebarSize.right + 'px;')"
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
					:disabled="!($store.state.user && $store.state.currentPlace && $store.state.currentPlace.userid == $store.state.user.id)"
					@click="deletePlace($store.state.currentPlace);"
				>
					×
				</button>
				<button
					id="actions-append-folder"
					class="actions-button"
					title="Добавить папку"
					@click="$root.showPopup({show: true, type: 'folder'}, $event);"
				>
					П+
				</button>
				<button
					id="actions-edit-folders"
					class="actions-button"
					title="Редактировать папки"
					@click="$root.foldersEditMode = !$root.foldersEditMode; if($event.target.classList.contains('button-pressed')) {$event.target.classList.remove('button-pressed');} else {$event.target.classList.add('button-pressed');}"
				>
					ПР
				</button>
			</div>
			// Input field to search the places by name
			<input placeholder="Поиск по названию мест" title="Поиск по названию мест" class="find-places-input fieldwidth_100 fontsize_n" @keyup="selectPlaces" />
		</div>
		<div
			id="top-basic"
			class="app-cell"
		>
			<div>
				<div class="brand">
					<h1 class="basiccolor margin_bottom_0">Места — <a href="javascript:void(0);" @click="account();" v-html="$store.state.user ? $store.state.user.login : 'o_O'"></a></h1>
					<div>Сервис просмотра и редактирования библиотек геометок</div>
				</div>
			</div>
			<div
				id="message-main"
				class="message invisible"
				v-html="$store.state.message"
				@click="$store.dispatch('clearMessage', true);"
			>
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
				/>
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
					@click="toDBCompletely();"
				>
					↯
				</button>
				<button
					id="actions-import"
					class="actions-button"
					title="Импортировать геометки"
					onclick="document.getElementById('inputImportFromFile').click();"
				>
					↲
				</button>
				<button
					id="actions-export"
					class="actions-button"
					title="Экспортировать свои геометки"
					@click="exportToFile();"
				>
					↱
				</button>
				<button
					id="actions-about"
					class="actions-button"
					title="О «Местах», справка"
					@click="$root.showAbout($event);"
				>
					?
				</button>
				<button
					id="actions-exit"
					class="actions-button"
					title="Выйти"
					@click="toDBCompletely(); exit();"
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
				<div v-if="$store.state.places.length > 0 || $store.state.folders.length > 0" id="places-menu">
					<tree id="placesMenu" :data="folderRoot || {}"></tree>
				</div>
				<div v-if="$store.state.commonPlaces.length > 0 && commonPlacesShow">
					<h2 class="basiccolor">Другие места</h2>
					<div class="margin_bottom">
						<div
							v-for="commonPlace in $store.state.commonPlaces"
							v-if="$store.state.commonPlaces.indexOf(commonPlace) >= commonPlacesOnPageCount * (commonPlacesPage - 1) && $store.state.commonPlaces.indexOf(commonPlace) < commonPlacesOnPageCount * commonPlacesPage"
							:id="commonPlace.id"
							:key="commonPlace.id"
							:class="'place-button block_01' + (commonPlace === $store.state.currentPlace ? ' active' : '')"
							@click="setCurrentPlace(commonPlace, true);"
						>
							{{ commonPlace.name }}
						</div>
					</div>
					<div class="margin_bottom">
						<a
							v-for="(page, index) in commonPlacesPagesCount"
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
		<div class="app-cell" id="basic-basic">
			<extmap
				ref="extmap"
				:id="$store.state.currentPlace ? $store.state.currentPlace.id : null"
				:name="$store.state.currentPlace ? $store.state.currentPlace.name : ''"
				:description="$store.state.currentPlace ? $store.state.currentPlace.description : ''"
				:link="$store.state.currentPlace ? $store.state.currentPlace.link : ''"
				:images="$store.state.currentPlace ? $store.state.currentPlace.images : []"
				:latitude="$store.state.currentPlace ? $store.state.currentPlace.latitude : constants.map.initial.latitude"
				:longitude="$store.state.currentPlace ? $store.state.currentPlace.longitude : constants.map.initial.longitude"
				:altitudecapability="$store.state.currentPlace ? $store.state.currentPlace.altitudecapability : ''"
				:time="$store.state.currentPlace ? $store.state.currentPlace.time : ''"
				:centerLatitude="$store.state.center ? $store.state.center.latitude : constants.map.initial.latitude"
				:centerLongitude="$store.state.center ? $store.state.center.longitude : constants.map.initial.longitude"
			>
			</extmap>
			<div
				id="sbs-top"
				:style="'left: -' + sidebarSize.left + 'px; right: -' + sidebarSize.right + 'px;'"
				@mousedown="sidebarDragStart($event, 'top');"
				@touchstart="sidebarDragStart($event, 'top');"
			>
			</div>
			<div
				id="sbs-right"
				:style="'top: -' + (sidebarSize.top + (compact ? 0 : sidebarSize.left)) + 'px; bottom: -' + sidebarSize.bottom + 'px;'"
				@mousedown="sidebarDragStart($event, 'right');"
				@touchstart="sidebarDragStart($event, 'right');"
			>
			</div>
			<div
				id="sbs-bottom"
				:style="'left: -' + sidebarSize.left + 'px; right: -' + sidebarSize.right + 'px;'"
				@mousedown="sidebarDragStart($event, 'bottom');"
				@touchstart="sidebarDragStart($event, 'bottom');"
			>
			</div>
			<div
				id="sbs-left"
				:style="'top: -' + (sidebarSize.top + (compact > 500 ? 0 : sidebarSize.left)) + 'px; bottom: -' + sidebarSize.bottom + 'px;'"
				@mousedown="sidebarDragStart($event, 'left');"
				@touchstart="sidebarDragStart($event, 'left');"
			>
			</div>
		</div>
		<div
			id="basic-right"
			class="app-cell"
		>
			<div>
				<dt v-if="$store.state.currentPlace">
					<dl v-for="field in Object.keys($store.state.currentPlace)" :key="field" class="place-detailed margin_bottom_0">
						<dt v-if="field == 'link'" class="place-detailed__link-dt">
							<a
								v-if="!linkEditing && $store.state.currentPlace[field].trim()"
								:href="$store.state.currentPlace[field].trim()"
								target="_blank"
							>
								{{ $store.state.placeFields[field] }}
							</a>
							<span v-else>
								{{ $store.state.placeFields[field] }}:
							</span>
							<a
								class="place-detailed__link-edit"
								href="javascript:void(0);"
								@click="linkEditing = !linkEditing;"
							>
								🖍
							</a>
						</dt>
						<dt v-else-if="!(field == 'images' && $store.state.currentPlace.images.length == 0) && !(field == 'common' && currentPlaceCommon) && field != 'link' && field != 'show' && field != 'type' && field != 'id' && field != 'folderid' && field != 'userid' && field != 'added' && field != 'deleted' && field != 'updated' && field != 'common'">
							{{ $store.state.placeFields[field] }}:
						</dt>
						<dd v-if="field == 'srt' || field == 'link' && (linkEditing || !$store.state.currentPlace[field].trim()) || field == 'latitude' || field == 'longitude' || field == 'altitudecapability'">
							<input
								type="text"
								:id="'detailed-' + field"
								:disabled="currentPlaceCommon"
								v-model.number.trim="$store.state.currentPlace[field]"
								@focus="validatable();"
								@change="$store.commit('changePlace', {place: $store.state.currentPlace, change: {updated: true}});"
								class="fieldwidth_100"
							/>
						</dd>
						<dd v-else-if="field == 'time'">
							<input
								type="datetime-local"
								:id="'detailed-' + field"
								:disabled="currentPlaceCommon"
								v-model="$store.state.currentPlace[field]"
								@change="$store.commit('changePlace', {place: $store.state.currentPlace, change: {updated: true}});"
								class="fieldwidth_100"
							/>
						</dd>
						<dd v-else-if="!(field == 'common' && currentPlaceCommon) && field != 'show' && field != 'type' && field != 'id' && field != 'folderid' && field != 'userid' && field != 'added' && field != 'deleted' && field != 'updated' && field == 'common'" class="margin_bottom">
							<label>
								<input
									type="checkbox"
									:id="'detailed-' + field"
									:disabled="currentPlaceCommon"
									v-model="$store.state.currentPlace[field]"
									@change="$store.commit('changePlace', {place: $store.state.currentPlace, change: {updated: true}});"
								/>
								Место видно другим
							</label>
						</dd>
						<dd v-else-if="field == 'images' && $store.state.currentPlace.images.length > 0" id="place-images">
							<div class="dd-images">
								<div
									v-for="image in orderedImages"
									:id="image.id"
									:key="image.id"
									:class="'place-image' + (currentPlaceCommon ? '' : ' draggable')"
									:draggable="currentPlaceCommon ? false : true"
									@click="$root.showPopup({show: true, type: 'image', data: image}, $event);"
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
											:onerror="'this.src = \'' + constants.dirs.uploads.images.orphanedsmall + image.file + '\''"
											:alt="$store.state.currentPlace.name"
											:title="$store.state.currentPlace.name"
										/>
										<div
											class="dd-images__delete button"
											draggable="false"
											v-if="!currentPlaceCommon"
											@click="$event.stopPropagation(); $store.commit('setIdleTime', 0); deleteFiles(Array.from($store.state.currentPlace.images), [image], $event);"
										>
											×
										</div>
									</div>
								</div>
							</div>
						</dd>
						<dd v-else-if="field != 'common' && field != 'link' && field != 'images' && field != 'show' && field != 'type' && field != 'id' && field != 'folderid' && field != 'userid' && field != 'added' && field != 'deleted' && field != 'updated'">
							<textarea
								:id="'detailed-' + field"
								:disabled="currentPlaceCommon"
								:placeholder="field == 'name' ? 'Название места' : (field == 'description' ? 'Описание места' : '')"
								v-model.trim="$store.state.currentPlace[field]"
								@change="$store.commit('changePlace', {place: $store.state.currentPlace, change: {updated: true}});"
								class="fieldwidth_100"
							>
								{{ $store.state.currentPlace[field] }}
							</textarea>
						</dd>
					</dl>
				</dt>
				<div v-if="$store.state.currentPlace && !$store.state.currentPlace.deleted && !currentPlaceCommon" class="images-add margin_bottom">
					<div class="images-add__div button">
						<span>Добавить фотографии</span>
						<input
							id="images-add__input"
							type="file"
							name="files"
							ref="inputUploadFiles"
							multiple
							@change="uploadFiles($event);"
							class="images-add__input"
						/>
					</div>
				</div>
				<div id="images-uploading" class="block_02 waiting hidden"><span>… загрузка …</span></div>
				<div v-if="$store.state.currentPlace && !currentPlaceCommon">
					<label>
						<input
							type="checkbox"
							id="checkbox-homeplace"
							:checked="$store.state.currentPlace === $store.state.homePlace ? 'checked' : ''"
							@change="$store.commit('setHomePlace', ($event.target.checked ? $store.state.currentPlace.id : null)); homeToDB($event.target.checked ? $store.state.currentPlace : {});"
						/>
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
					@click="$refs.extmap.placemarksShowHide();"
					title="Показать / скрыть все свои геометки"
				>
					◉
				</button>
				<button
					id="commonPlacesShowHideButton"
					class="actions-button"
					@click="commonPlacesShowHide();"
					title="Показать / скрыть все другие места и их геометки"
				>
					◪
				</button>
				<button
					id="commonPlacemarksShowHideButton"
					class="actions-button"
					@click="$refs.extmap.commonPlacemarksShowHide();"
					title="Показать / скрыть все другие геометки"
				>
					◎
				</button>
				<button
					id="centerPlacemarkShowHideButton"
					class="actions-button"
					@click="$refs.extmap.centerPlacemarkShowHide();"
					title="Показать / скрыть метку центра карты"
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
			<span class="nobr" style="margin-left: 1em;">
				Широта:
				<input
					v-model.number.trim="$store.state.center.latitude"
					placeholder="latitude"
					title="Широта"
				/>
			</span>
			<span class="nobr" style="margin-left: 1em;">
				Долгота:
				<input
					v-model.number.trim="$store.state.center.longitude"
					placeholder="longitude"
					title="Долгота"
				/>
			</span>
		</div>
		<div :class="'popup ' + $root.popuped" @click="$event => {if($root.popupComponent === 'popupfolder') {$refs.popup.close($event);} else {$root.showPopup({show: false}, $event);}}">
			<component
				ref="popup"
				:is="$root.popupComponent"
				:data="$root.popupData"
				:currentPlace="$store.state.currentPlace"
			>
			</component>
		</div>
	</div>
</template>

<script>
import _ from "lodash"
import {constants} from "../shared/constants.js"
import {bus} from "../shared/bus.js"
import tree from "./Tree.vue"
import extmap from "./ExtMap.vue"
import popupimage from "./PopupImage.vue"
import popuptext from "./PopupText.vue"
import popupfolder from "./PopupFolder.vue"
import popupfolderdelete from "./PopupFolderDelete.vue"
import axios from "axios"
import {mapGetters} from "vuex"
export default {
	components: {
		tree,
		extmap,
		popupimage,
		popuptext,
		popupfolder,
		popupfolderdelete,
	},
	data: function() {return {
		state: this.$store.state,
		constants: constants,
		placesFilled: false,
		firstValidatable: false,
		commonPlacesPage: 1,
		commonPlacesPagesCount: 0,
		commonPlacesOnPageCount: constants.commonplacesonpagecount,
		commonPlacesShow: false,
		currentPlace: null,
		currentPlaceCommon: false,
		sidebarSize: {
			top: constants.sidebars.top,
			right: constants.sidebars.right,
			bottom: constants.sidebars.bottom,
			left: constants.sidebars.left,
		},
		sidebarDrag: {what: null, x: 0, y: 0, w: 0, h: 0},
		compact: false,
		folderRoot: null,
		linkEditing: false,
	}},
	mounted: function() {
		bus.$on("placesFilled", happens => {
			this.folderRoot = {
				id: "root",
				name: "Мои места",
				children: this.$store.state.folders,
				opened: true,
			};
			this.currentPlaceCommon = this.$parent.currentPlaceCommon;
			if(this.$store.state.places.length > 0) {
				if(this.$store.state.currentPlaceIndex > -1) {
					this.setCurrentPlace(
						this.$store.state.currentPlace,
						this.currentPlaceCommon
					);
					// No matter how idiotic it looks
				} else if(this.$store.state.homePlace) {
					this.setCurrentPlace(this.$store.state.homePlace);
				} else {
					let firstPlaceInRoot = this.$store.state.places.find(
						p => p.folderid === null
					);
					if(!firstPlaceInRoot) {
						this.setCurrentPlace(this.$store.state.places[0]);
					} else {
						this.setCurrentPlace(firstPlaceInRoot);
					}
				}
			}
			if(happens === "importing") {
				this.$nextTick(function() {
					this.toDBCompletely();
				});
			}
			if(this.$refs.extmap && this.$refs.extmap.map) {
				this.$refs.extmap.map.destroy();
			}
			if(this.$refs.extmap) {
				if(this.$store.state.currentPlace) {
					this.$refs.extmap.showMap(
						this.$store.state.currentPlace.latitude,
						this.$store.state.currentPlace.longitude
					);
				} else {
					this.$refs.extmap.showMap(
						constants.map.initial.latitude,
						constants.map.initial.longitude
					);
				}
			}
			this.commonPlacesPagesCount = Math.ceil(
				this.$store.state.commonPlaces.length / this.commonPlacesOnPageCount
			);
			document.addEventListener("dragover", this.$root.handleDragOver, false);
			document.addEventListener("drop", this.$root.handleDrop, false);
			document.addEventListener("keyup", this.keyup, false);
			window.addEventListener("resize", this.windowResize, false);
			if(this.$store.state.user.testaccount) {
				setTimeout(() => {
					this.$store.dispatch("setMessage",
						"Вы авторизовались под тестовым аккаунтом; " +
						"невозможны сохранение изменений в базу данных " +
						"и загрузка файлов, в том числе фотографий"
					);
				}, 3000);
			}
			this.windowResize();
			this.placesFilled = true;
		});
		bus.$on("homeRefresh", () => {
			this.$refs.extmap.mrks = {};
			this.$refs.extmap.map.geoObjects.removeAll();
			this.$store.state.places.forEach((place) => {
				this.$refs.extmap.appendPlacemark(this.$refs.extmap.mrks, place, "private");
			});
			if(this.$store.state.currentPlace) {
				if(
					!this.currentPlaceCommon
					&& this.$refs.extmap.mrks[this.$store.state.currentPlace.id]
				) {
					this.$refs.extmap.mrks[this.$store.state.currentPlace.id].options.set(
						"iconColor", this.$refs.extmap.activePlacemarksColor
					);
				} else if(this.$refs.extmap.commonMrks[this.$store.state.currentPlace.id]) {
					this.$refs.extmap.commonMrks[this.$store.state.currentPlace.id].options.set(
						"iconColor", this.$refs.extmap.activePlacemarksColor
					);
				}
			}
		});
		bus.$on("setCurrentPlace", (payload) => {
			this.setCurrentPlace(payload.place, payload.common);
		});
		bus.$on("toDB", (what) => {
			switch(what) {
				case "places" :
					this.toDB("places", JSON.stringify(this.$store.state.places));
					break;
				case "folders" :
					let plain = [];
					treeToPlain(this.folderRoot, "children", plain);
					this.toDB("folders", JSON.stringify(plain));
					break;
			}
		});
		bus.$on("toDBCompletely", () => {
			this.toDBCompletely();
		});
		sessionStorage.setItem("places-app-child-component", "home");
		this.$store.commit("setIdleTime", 0);
		if(this.$store.state.ready) {
			bus.$emit("placesFilled");
		}
	},
	beforeDestroy: function() {
		document.removeEventListener("dragover", this.$root.handleDragOver, false);
		document.removeEventListener("drop", this.$root.handleDrop, false);
		document.removeEventListener("keyup", this.keyup, false);
		bus.$off("placesFilled");
		bus.$off("homeRefresh");
		bus.$off("setCurrentPlace");
		bus.$off("toDB");
		bus.$off("toDBCompletely");
	},
	methods: {
		validatable: function() {
			if(!this.firstValidatable) {
				make_fields_validatable();
				this.firstValidatable = true;
			}
		},
		validate_field: function(value, type) {
			return validate_field(value, type);
		},
		keyup: function(event) {
			if(event.altKey && event.shiftKey) {
				if(constants.shortcuts[event.keyCode]) {
					this.blur();
				}
				switch(constants.shortcuts[event.keyCode]) {
					case "add" :
						let newPlace = this.appendPlace();
						break;
					case "delete" :
						if(
							this.$store.state.currentPlace
							&& this.$store.state.currentPlace.userid ==
								this.$store.state.user.id
						) {
							this.deletePlace(this.$store.state.currentPlace);
						}
						break;
					case "add folder" :
						this.$root.showPopup({show: true, type: "folder"}, event);
						break;
					case "edit mode" :
						this.$root.foldersEditMode = !this.$root.foldersEditMode;
						if(
							document.getElementById("actions-edit-folders")
								.classList.contains("button-pressed")
						) {
							document.getElementById("actions-edit-folders")
								.classList.remove("button-pressed")
							;
						} else {
							document.getElementById("actions-edit-folders")
								.classList.add("button-pressed")
							;
						}
						break;
					case "import" :
						document.getElementById("inputImportFromFile").click();
						break;
					case "export" :
						this.exportToFile();
						break;
					case "save" :
						this.toDBCompletely();
						break;
					case "help" :
						this.$root.showAbout();
						break;
					case "revert" :
						document.location.reload(true);
						break;
					case "quit" :
						this.toDBCompletely();
						this.exit();
						break;
					case "other" :
						this.commonPlacesShowHide();
						break;
					case "placemarks" :
						this.$refs.extmap.placemarksShowHide();
						break;
					case "other placemarks" :
						this.$refs.extmap.commonPlacemarksShowHide();
						break;
					case "center" :
						this.$refs.extmap.centerPlacemarkShowHide();
						break;
					case "undo" :
						this.$store.dispatch("undo");
						break;
					case "redo" :
						this.$store.dispatch("redo");
						break;
				}
			}
			if(this.$root.popuped === "appear") {
				switch(constants.shortcuts[event.keyCode]) {
					case "close" :
						if(this.$root.popupComponent === "popupfolder") {
							this.$refs.popup.close(event);
						} else {
							this.$root.showPopup({show: false}, event);
						}
						break;
					case "left" :
						if(this.$root.popupComponent === "popupimage") {
							this.$refs.popup.showImage(-1, event);
						}
						break;
					case "right" :
						if(this.$root.popupComponent === "popupimage") {
							this.$refs.popup.showImage(1, event);
						}
						break;
				}
			}
		},
		windowResize: function() {
			if(window.innerWidth > constants.compactWidth) {
				this.sidebarSize.top = constants.sidebars.top;
				this.sidebarSize.right = constants.sidebars.right;
				this.sidebarSize.bottom = constants.sidebars.bottom;
				this.sidebarSize.left = constants.sidebars.left;
				document.getElementById("sbs-left").style.marginLeft = 0;
				document.getElementById("sbs-top").style.marginTop = 0;
				document.getElementById("sbs-bottom").style.marginBottom = 0;
				this.compact = false;
			} else {
				if(this.compact) {
					this.sidebarSize.top = parseInt(window.getComputedStyle(
						document.getElementById("top-left")
					).height);
				}
				this.sidebarSize.right = parseInt(window.getComputedStyle(
					document.getElementById("top-right")
				).width);
				this.sidebarSize.bottom = (this.compact
					? parseInt(window.getComputedStyle(
						document.getElementById("basic-basic")
					).height)
					: "1fr"
				);
				this.sidebarSize.left = parseInt(window.getComputedStyle(
					document.getElementById("top-left")
				).width);
				document.getElementById("sbs-left").style.marginLeft =
					this.sidebarSize.left + "px"
				;
				document.getElementById("sbs-top").style.marginTop =
					-parseInt(window.getComputedStyle(
						document.getElementById("basic-left")
					).height) + "px"
				;
				document.getElementById("sbs-bottom").style.marginBottom =
					this.sidebarSize.bottom + "px"
				;
				this.compact = true;
			}
			document.getElementById("grid").classList.remove("loading-grid");
		},
		sidebarDragStart: function(event, what) {
			event.preventDefault();
			this.sidebarDrag.what = what;
			if(event.changedTouches) {
				this.sidebarDrag.x = event.changedTouches[0].pageX;
				this.sidebarDrag.y = event.changedTouches[0].pageY;
			} else {
				this.sidebarDrag.x = event.screenX;
				this.sidebarDrag.y = event.screenY;
			}
			switch(this.sidebarDrag.what) {
				case "top" :
					this.sidebarDrag.h = this.sidebarSize.top;
					break;
				case "bottom" :
					this.sidebarDrag.h = this.sidebarSize.bottom;
					break;
				case "left" :
					this.sidebarDrag.w = this.sidebarSize.left;
					break;
				case "right" :
					this.sidebarDrag.w = this.sidebarSize.right;
					break;
			}
		},
		documentMouseOver: function(event) {
			if(this.sidebarDrag.what !== null) {
				switch(this.sidebarDrag.what) {
					case "top" :
						this.sidebarSize.top = this.sidebarDrag.h - this.sidebarDrag.y +
							(event.changedTouches ? event.changedTouches[0].pageY : event.screenY)
						;
						break;
					case "bottom" :
						this.sidebarSize.bottom = this.sidebarDrag.h + this.sidebarDrag.y -
							(event.changedTouches ? event.changedTouches[0].pageY : event.screenY)
						;
						break;
					case "left" :
						this.sidebarSize.left = this.sidebarDrag.w - this.sidebarDrag.x +
							(event.changedTouches ? event.changedTouches[0].pageX : event.screenX)
						;
						break;
					case "right" :
						this.sidebarSize.right = this.sidebarDrag.w + this.sidebarDrag.x -
							(event.changedTouches ? event.changedTouches[0].pageX : event.screenX)
						;
						break;
				}
			}
		},
		sidebarDragStop: function(event) {
			this.sidebarDrag.what = null;
			if(this.compact) {
				this.windowResize();
			}
		},
		// Search and select a place by name
		selectPlaces: function(event) {
			if(event.keyCode == 27) {
				event.target.value = "";
			} else {
				for(let i = 0; i < this.$store.state.places.length; i++) {
					let regexp = new RegExp(event.target.value, "i");
					if(event.target.value.length > 1 && regexp.test(this.$store.state.places[i].name)) {
						this.setCurrentPlace(this.$store.state.places[i]);
					}
				}
			}
		},
	},
	watch: {
		getCurrentPlace: {
			deep: true,
			immediate: true,
			handler: function(place) {
				if(place) {
					this.currentPlace = {
						...place,
						images: place.images,
					};
					this.$nextTick(function() {
						if(
							place.userid == this.$store.state.user.id
							&& !place.name
							&& document.getElementById("detailed-name")
						) {
							document.getElementById("detailed-name").classList.add("highlight");
							document.getElementById("detailed-name").focus();
							setTimeout(function() {
								document.getElementById("detailed-name").classList.remove("highlight");
							}, 500);
						}
					});
				} else {
					this.currentPlace = null;
				}
			},
		},
	},
	computed: {
		...mapGetters(["getCurrentPlace", "getMessage"]),
		blur: () => function() {
			let el = this.$el.querySelector(":focus"); if(el) {el.blur();}
		},
		exit: () => function() {
			this.$store.dispatch("unload");
			bus.$emit("loggedChange", "auth");
		},
		account: () => function() {
			bus.$emit("loggedChange", "account");
		},
		orderedImages: function() {
			return this.currentPlace ? _.orderBy(this.currentPlace.images, "srt") : [];
		},
		setCurrentPlace: (place, common = false) => function(place, common = false) {
			this.currentPlaceCommon = common ? true : false;
			if(this.$store.state.currentPlace) {
				if(
					!this.currentPlaceCommon
					&& this.$refs.extmap.mrks[this.$store.state.currentPlace.id]
				) {
					this.$refs.extmap.mrks[this.$store.state.currentPlace.id].options.set(
						"iconColor", this.$refs.extmap.privatePlacemarksColor
					);
				} else if(
					this.$refs.extmap.commonMrks[this.$store.state.currentPlace.id]
				) {
					this.$refs.extmap.commonMrks[this.$store.state.currentPlace.id].options.set(
						"iconColor", this.$refs.extmap.commonPlacemarksColor
					);
				}
			}
			if(place) {
				/*
				 * Setting this.$store.state.currentPlace is not by commit
				 * because it and the place variable are the only common object.
				 */
				this.$store.state.currentPlace = place;
				for(let i = 0; i < this.$store.state.places.length; i++) {
					if(this.$store.state.places[i].id == place.id) {
						this.$store.commit("setCurrentPlaceIndex", i);
						break;
					}
				}
				if(
					!this.currentPlaceCommon
					&& this.$refs.extmap.mrks[this.$store.state.currentPlace.id]
				) {
					this.$refs.extmap.mrks[this.$store.state.currentPlace.id].options.set(
						"iconColor", this.$refs.extmap.activePlacemarksColor
					);
				} else if(
					this.$refs.extmap.commonMrks[this.$store.state.currentPlace.id]
				) {
					this.$refs.extmap.commonMrks[this.$store.state.currentPlace.id].options.set(
						"iconColor", this.$refs.extmap.activePlacemarksColor
					);
				}
				if(!this.currentPlaceCommon) {
					let folder, folderid = place.folderid;
					while(folderid) {
						folder = findInTree(
							this.folderRoot,
							"children",
							"id",
							folderid
						);
						this.$store.commit("folderOpenClose", {folder: folder, opened: true});
						folderid = (folder.parent === null ? "root" : folder.parent);
					}
				}
				this.$store.commit("changeCenter", {
					latitude: this.$store.state.currentPlace.latitude,
					longitude: this.$store.state.currentPlace.longitude,
				});
			} else {
				this.$store.state.currentPlace = null;
				this.$store.commit("setCurrentPlaceIndex", -1);
			}
		},
		appendPlace: () => function() {
			let data = new FormData();
			data.append("userid", this.$store.state.user.id);
			data.append("need", "visiting");
			axios.post("/backend/get_groups.php", data)
				.then(response => {
					if(
						constants.rights.placescounts[response.data] < 0
						|| constants.rights.placescounts[response.data] > this.$store.state.places.length
						|| this.$store.state.user.testaccount
					) {
						let newPlace = {
							type: "place",
							userid: sessionStorage.getItem("places-userid"),
							name: "",
							description: "",
							link: "",
							latitude: this.$refs.extmap.map.getCenter()[0].toFixed(7),
							longitude: this.$refs.extmap.map.getCenter()[1].toFixed(7),
							altitudecapability: null,
							time: new Date().toISOString().slice(0, -5),
							id: generateRandomString(32),
							folderid:
								this.$store.state.currentPlace
									? this.$store.state.currentPlace.folderid
									: "root"
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
							images: [],
							added: true,
							deleted: false,
							updated: false,
							show: true,
						};
						this.$store.commit("addPlace", newPlace);
						this.$refs.extmap.appendPlacemark(
							this.$refs.extmap.mrks,
							newPlace,
							"private"
						);
						this.setCurrentPlace(
							this.$store.state.places[
								this.$store.state.places.length - 1
							]
						);
						return newPlace;
					} else {
						this.$store.dispatch("setMessage",
							'Превышено максимально допустимое для вашей ' +
							'текущей роли количство мест<br />Дождитесь ' +
							'перехода в следующую роль, или обратитесь ' +
							'к администрации сервиса по адресу<br />' +
							'<a href="mailto:' + constants.from +
							'">' + constants.from + '</a>'
						);
					}
				});
		},
		deletePlace: (place, backup) => function(place, backup) {
			let finallyDeletePlace = place => {
				let firstRootPlace = this.$store.state.places.find(p => p.folderid === null);
				if(this.$store.state.places.length === 1) {
					this.$store.commit("setCurrentPlace", {});
				} else if(document.getElementById(place.id).nextElementSibling) {
					this.setCurrentPlace(
						this.$store.state.places.find(
							p => p.id === document.getElementById(place.id).nextElementSibling.id
						)
					);
				} else if(document.getElementById(place.id).previousElementSibling) {
					this.setCurrentPlace(
						this.$store.state.places.find(
							p => p.id === document.getElementById(place.id).previousElementSibling.id
						)
					);
				} else if(this.$store.state.homePlace) {
					this.setCurrentPlace(this.$store.state.homePlace);
				} else if(firstRootPlace) {
					this.setCurrentPlace(firstRootPlace);
				} else {
					this.setCurrentPlace(this.$store.state.places[0]);
				}
				this.$store.commit("removePlace", {
					place: place,
					change: {deleted: true},
					backup: (typeof(backup) === "undefined" || backup ? true : false),
				});
				this.$refs.extmap.map.geoObjects.remove(this.$refs.extmap.mrks[place.id]);
				this.$store.commit("deletePlace", place);
			}
			if(place.images.length > 0) {
				this.deleteFiles(Array.from(place.images), place.images)
					.then(response => {
						finallyDeletePlace(place);
					});
			} else {
				finallyDeletePlace(place);
			}
		},
		commonPlacesShowHide: (show = null) => function(show = null) {
			this.commonPlacesShow =
				show === null
					? !this.commonPlacesShow
					: show
			;
			this.$refs.extmap.commonPlacemarksShow = this.commonPlacesShow;
			for(let key in this.$refs.extmap.commonMrks) {
				if(!this.$refs.extmap.commonPlacemarksShow) {
					this.$refs.extmap.commonMrks[key].options.set("visible", false);
				} else {
					this.$refs.extmap.commonMrks[key].options.set("visible", true);
				}
			}
			if(!this.commonPlacesShow) {
				document.getElementById("commonPlacesShowHideButton").classList.remove("button-pressed");
				document.getElementById("commonPlacemarksShowHideButton").classList.remove("button-pressed");
			} else {
				document.getElementById("commonPlacemarksShowHideButton").classList.add("button-pressed");
				document.getElementById("commonPlacesShowHideButton").classList.add("button-pressed");
			}
		},
		importFromFile: () => function() {
			let type = this.$refs.inputImportFromFile.files[0].type;
			let reader = new FileReader();
			reader.onload = (event) => {
				this.$nextTick(() => {
					this.$store.dispatch("setPlaces", {text: event.target.result, type: type});
					document.getElementById("inputImportFromFile").value = "";
				});
			};
			if(type == "application/json" || type == "application/gpx+xml") {
				reader.readAsText(this.$refs.inputImportFromFile.files[0]);
			} else {
				this.$store.dispatch("setMessage",
					"Недопустимый тип импортируемого файла. Допускаются только JSON и GPX."
				);
			}
		},
		exportToFile: () => function() {
			const data = JSON.stringify({
				places: this.$store.state.places,
				folders: this.$store.state.folders,
			});
			const blob = new Blob([data], {type: "text/plain"});
			const e = document.createEvent("MouseEvents"),
			a = document.createElement("a");
			a.download = "places.json";
			a.href = window.URL.createObjectURL(blob);
			a.dataset.downloadurl = ["text/json", a.download, a.href].join(":");
			e.initEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
			a.dispatchEvent(e);
		},
		toDB: (todo, data) => function(todo, data) {
			if(!this.$store.state.user.testaccount) {
				if(!document.querySelector(".value_wrong")) {
					let placesRequest = new XMLHttpRequest();
					placesRequest.open("POST", "/backend/set_places.php", true);
					placesRequest.onreadystatechange = (event) => {
						if(placesRequest.readyState == 4) {
							if(placesRequest.status == 200) {
								this.$store.commit("setSaved", true);
								this.$store.dispatch("setMessage",
									"Изменения сохранены в базе данных"
								);
							} else {
								this.$store.dispatch("setMessage",
									"Не могу внести данные в БД"
								);
							}
						}
					};
					placesRequest.setRequestHeader(
						"Content-type", "application/x-www-form-urlencoded"
					);
					placesRequest.send(
						"id=" + sessionStorage.getItem("places-userid") +
						"&todo=" + (typeof(todo) !== "undefined"
							? todo
							: "places"
						) +
						"&data=" + (typeof(data) !== "undefined"
							? data
							: JSON.stringify(this.$store.state.places)
						)
					);
				} else {
					this.$store.dispatch("setMessage",
						"Некоторые поля заполнены некорректно"
					);
				}
			}
		},
		homeToDB: (place) => function(place) {
			if(!this.$store.state.user.testaccount) {
				let homeRequest = new XMLHttpRequest();
				homeRequest.open("POST", "/backend/set_home.php", true);
				homeRequest.onreadystatechange = (event) => {
					if(homeRequest.readyState == 4) {
						if(homeRequest.status == 200) {
							this.$store.commit("setSaved", true);
							this.$store.dispatch("setMessage",
								"Изменения сохранены в базе данных"
							);
						} else {
							this.$store.dispatch("setMessage",
								"Не могу внести данные в БД"
							);
						}
					}
				};
				homeRequest.setRequestHeader(
					"Content-type", "application/x-www-form-urlencoded"
				);
				homeRequest.send(
					"id=" + sessionStorage.getItem("places-userid") +
					"&data=" + place.id
				);
			}
		},
		toDBCompletely: () => function() {
			if(!this.$store.state.user.testaccount) {
				let placesRequest = new XMLHttpRequest();
				placesRequest.open("POST", "/backend/set_completely.php", true);
				placesRequest.onreadystatechange = (event) => {
					if(placesRequest.readyState == 4) {
						if(placesRequest.status == 200) {
							this.$store.commit("setSaved", true);
							this.$store.dispatch("setMessage",
								"Изменения сохранены в базе данных"
							);
						} else {
							this.$store.dispatch("setMessage",
								"Не могу внести данные в БД"
							);
						}
					}
				};
				placesRequest.setRequestHeader(
					"Content-type", "application/x-www-form-urlencoded"
				);
				let plainFolders = [];
				treeToPlain(
					this.folderRoot,
					"children",
					plainFolders
				);
				placesRequest.send(
					"id=" + sessionStorage.getItem("places-userid") +
					"&data=" + (JSON.stringify({
						"places": this.$store.state.places,
						"folders": plainFolders,
					}))
				);
			}
		},
		uploadFiles: (event) => function(event) {
			event.preventDefault();
			if(this.$store.state.user.testaccount) {
				this.$store.dispatch("setMessage",
					"Тестовый аккаунт не позволяет загрузку файлов"
				);
			} else {
				let
					data = new FormData(),
					files = this.$refs.inputUploadFiles.files,
					filesArray = [],
					rndname,
					srt
				;
				if(
					this.$store.state.currentPlace
					&& this.$store.state.currentPlace.images.length > 0
				) {
					let storeImages = this.$store.state.currentPlace.images;
					srt = sortObjects(storeImages, "srt").pop().srt;
				} else {
					srt = 0;
				}
				for(let i = 0; i < files.length; i++) {
					if(!constants.mimes[files[i].type]) {
						this.$store.dispatch("setMessage",
							"Файл " +
							files[i].name +
							" не является картинкой и загружен не будет"
						);
					} else if(files[i].size > constants.uploadsize) {
						this.$store.dispatch("setMessage",
							"Файл " +
							files[i].name +
							" слишком большого размера и загружен не будет"
						);
					} else {
						files[i].rndname = generateRandomString(32);
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
							placeid: this.$store.state.currentPlace.id
								? this.$store.state.currentPlace.id
								: null,
						});
					}
				}
				if(filesArray.length > 0) {
					document.getElementById("images-uploading").classList.remove("hidden");
					data.append("userid", this.$store.state.user.id);
					axios.post("/backend/upload.php", data)
						.then(response => {
							document.getElementById("images-add__input").value = "";
							document.getElementById("images-uploading").classList.add("hidden");
							for(let i = 0; i < filesArray.length; i++) {
								if(!response.data[1].find(f => f.id === filesArray[i].id)) {
									filesArray.splice(i, 1);
									i--;
								}
							}
							let images = this.$store.state.currentPlace.images
								? this.$store.state.currentPlace.images.concat(filesArray)
								: filesArray
							;
							this.$store.commit("changePlace", {
								place: this.$store.state.currentPlace,
								change: {images: images, updated: true},
							});
							/*
							 * Проверка накопленных кодов ошибок и замечаний
							 * в процессе выполнения /dist/backend/upload.php
							 */
							response.data[0].forEach((code) => {
								switch(code) {
									case 2 :
										this.$store.dispatch("setMessage",
											"Тестовый аккаунт не позволяет загрузку файлов"
										);
										break;
									case 3 :
										this.$store.dispatch("setMessage",
											"Некоторые файлы не являются картинками и загружены не были"
										);
										break;
									case 4 :
										this.$store.dispatch("setMessage",
											"Некоторые файлы слишком большого размеры и загружены не были"
										);
										break;
								}
							});
							if(response.data[1].length > 0) {
								this.$store.dispatch("setMessage", "Файлы успешно загружены");
								this.toDB()
									.then(response => {
										this.toDB("images_upload", JSON.stringify(filesArray))
									});
							}
						})
						.catch(error => {
							this.$store.dispatch("setMessage",
								"При загрузке файлов произошла ошибка"
							);
						});
				}
			}
		},
		deleteFiles: (inarray, files, event) => function(inarray, files, event) {
			let data = new FormData();
			for(let i = 0; i < files.length; i++) {
				data.append("file_" + i, files[i].file);
				inarray.splice(inarray.indexOf(files[i]), 1);
			}
			data.append("userid", this.$store.state.user.id);
			if(!this.$store.state.user.testaccount) {
				axios.post("/backend/delete.php", data)
					.then(() => {
						this.$store.commit("changePlace", {
							place: this.$store.state.currentPlace,
							change: {images: inarray, updated: true},
						});
						this.toDB("images_delete", JSON.stringify(files));
					});
			}
		},
	},
}
</script>
