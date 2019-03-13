<template>
	<div
		class="table"
		@mousemove="documentMouseOver($event);"
		@mouseup="sidebarDragStop($event);"
	>
		<div
			id="top"
			class="app-row"
			:style="'height: ' + sidebarSize.top + 'px;' + (sidebarSize.top < 80 ? ' display: none;' : '')"
		>
			<div
				id="top-left"
				class="app-cell fieldwidth_100"
				:style="'width: ' + sidebarSize.left + 'px;' + (sidebarSize.top < 80 || sidebarSize.left < 120 ? ' display: none;' : '')"
			>
				<div class="control-buttons">
					<button
						id="actions-append"
						class="actions-button"
						title="Добавить место в центре карты"
						@click="let newPlace = $refs.ym.appendPlace(); toDB(); $store.commit('changePlace', {place: newPlace, change: {added: false}});"
					>
						+
					</button>
					<button
						id="actions-delete"
						class="actions-button"
						title="Удалить текущее место"
						:disabled="currentPlaceCommon"
						@click="showPopup({show: true, type: 'placeDelete', data: currentPlace}, $event);"
					>
						×
					</button>
					<button
						id="actions-append-folder"
						class="actions-button"
						title="Добавить папку"
						@click="showPopup({show: true, type: 'folder'}, $event);"
					>
						П+
					</button>
					<button
						id="actions-edit-folders"
						class="actions-button"
						title="Редактировать папки"
						@click="foldersEditMode = !foldersEditMode; if($event.target.classList.contains('button-pressed')) {$event.target.classList.remove('button-pressed');} else {$event.target.classList.add('button-pressed');}"
					>
						ПР
					</button>
				</div>
				<input placeholder="Поиск по названию мест" title="Поиск по названию мест" class="find-places-input fieldwidth_100 fontsize_n" @keyup="selectPlaces" />
			</div>
			<div
				id="top-basic"
				class="app-cell"
			>
				<div>
					<div class="brand">
						<h1 class="basiccolor margin_bottom_0">Места — <a href="javascript:void(0);" @click="account();" v-html="$store.state.user.login"></span></h1>
						<div>Сервис просмотра и редактирования библиотек геометок</div>
					</div>
					<div class="message">
						<span v-html="getMessage"></span>
					</div>
				</div>
			</div>
			<div
				id="top-right"
				class="app-cell"
				:style="'width: ' + sidebarSize.right + 'px;' + (sidebarSize.top < 80 || sidebarSize.right < 120 ? ' display: none;' : '')"
			>
				<div class="control-buttons">
					<input
						id="inputImportFromFile"
						ref="inputImportFromFile"
						name="jsonFile"
						type="file"
						@change="importFromFile();"
					/>
					<button
						id="actions-import"
						class="actions-button"
						title="Импортировать геометки из JSON-файла"
						onclick="document.getElementById('inputImportFromFile').click();"
					>
						↲
					</button>
					<button
						id="actions-export"
						class="actions-button"
						title="Экспортировать свои геометки в JSON-файл"
						@click="exportToFile();"
					>
						↱
					</button>
					<button
						id="actions-save"
						class="actions-button"
						title="Сохранить в БД"
						@click="toDB(); toDB('folders', JSON.stringify($store.state.folders));"
					>
						↯
					</button>
					<button
						id="actions-about"
						class="actions-button"
						title="О «Местах», справка"
						@click="showAbout($event);"
					>
						?
					</button>
					<button
						id="actions-exit"
						class="actions-button"
						title="Выйти"
						@click="toDB(); toDB('folders', JSON.stringify($store.state.folders)); exit();"
					>
						↪
					</button>
				</div>
			</div>
		</div>
		<div class="app-row" id="basic">
			<div
				id="basic-left"
				class="app-cell"
				:style="'width: ' + sidebarSize.left + 'px;' + (sidebarSize.left < 120 ? ' display: none;' : '')"
			>
				<div id="basic-left__places" class="scrollable">
					<div v-if="$store.state.places.length > 0 || $store.state.folders.length > 0" id="places-menu" class="hidden">
						<ul class="margin_bottom_0">
							<li class="places-menu-folder places-menu-folder_opened places-menu-folder_root">
								<h2
									id="places-menu-folder-link-root"
									class="folder-button basiccolor"
									onclick="if(this.parentNode.classList.contains('places-menu-folder_closed')) {this.parentNode.classList.remove('places-menu-folder_closed'); this.parentNode.classList.add('places-menu-folder_opened');} else {this.parentNode.classList.remove('places-menu-folder_opened'); this.parentNode.classList.add('places-menu-folder_closed');}"
									@dragstart="handleDragStart"
									@dragenter="handleDragEnter"
									@dragleave="handleDragLeave"
								>
									Мои места
								</h2>
								<ul id="folders-list-root">
									<li
										v-for="folder in $store.state.folders"
										:key="folder.id"
										:id="'places-menu-folder-' + folder.id"
										:title="folder.description"
										class="places-menu-folder places-menu-folder_closed"
									>
										<a
											v-if="!foldersEditMode"
											:id="'places-menu-folder-link-' + folder.id"
											href="javascript: void(0);"
											class="folder-button"
											draggable="true"
											onclick="if(this.parentNode.classList.contains('places-menu-folder_closed')) {this.parentNode.classList.remove('places-menu-folder_closed'); this.parentNode.classList.add('places-menu-folder_opened');} else {this.parentNode.classList.remove('places-menu-folder_opened'); this.parentNode.classList.add('places-menu-folder_closed');}"
											@dragstart="handleDragStart"
											@dragenter="handleDragEnter"
											@dragleave="handleDragLeave"
										>
											{{ folder.name }}
											<div
												class="folder-button__dragenter-area folder-button__dragenter-area_top"
												@dragenter="handleDragEnter"
											>
											</div>
											<div
												class="folder-button__dragenter-area folder-button__dragenter-area_bottom"
												@dragenter="handleDragEnter"
											>
											</div>
										</a>
										<span
											v-if="foldersEditMode"
											:id="'places-menu-folder-link-' + folder.id"
											class="folder-button"
											onclick="if(this.parentNode.classList.contains('places-menu-folder_closed')) {this.parentNode.classList.remove('places-menu-folder_closed'); this.parentNode.classList.add('places-menu-folder_opened');} else {this.parentNode.classList.remove('places-menu-folder_opened'); this.parentNode.classList.add('places-menu-folder_closed');}"
										>
											<input
												v-model="folder.name"
												placeholder="Название"
												class="folder-button__name fieldwidth_100"
												@change="$store.commit('changeFolder', {folder: folder, change: {updated: true}}); toDB('folders', JSON.stringify([folder])); $store.commit('changeFolder', {folder: folder, change: {updated: false}});"
												onclick="event.stopPropagation();"
											/>
											<a
												class="folder-button__delete"
												title="Удалить папку"
												@click="$event.stopPropagation(); showPopup({show: true, type: 'folderDelete', data: folder}, $event);"
											>
												×
											</a>
											<textarea
												v-model="folder.description"
												rows="2"
												placeholder="Описание"
												class="folder-button__description fieldwidth_100"
												@change="$store.commit('changeFolder', {folder: folder, change: {updated: true}}); toDB('folders', JSON.stringify([folder])); $store.commit('changeFolder', {folder: folder, change: {updated: false}});"
												onclick="event.stopPropagation();"
											></textarea>
										</span>
										<div :id="folder.id" class="places-menu-item">
											<div
												v-for="(place, index) in $store.state.places"
												v-if="place.folderid === folder.id && place.show"
												:key="place.id"
												:id="place.id"
												:index="index"
												:srt="place.srt"
												:title="place.description"
												:class="'place-button block_01 draggable' + (place === currentPlace ? ' active' : '')"
												draggable="true"
												@click="setCurrentPlace(place);"
												@dragstart="handleDragStart"
											>
												{{ place.name }}
												<div
													class="place-button__dragenter-area place-button__dragenter-area_top"
													@dragenter="handleDragEnter"
												>
												</div>
												<div
													class="place-button__dragenter-area place-button__dragenter-area_bottom"
													@dragenter="handleDragEnter"
												>
												</div>
											</div>
										</div>
									</li>
								</ul>
								<div id="places-menu-item-root" class="places-menu-item">
									<div
										v-for="(place, index) in $store.state.places"
										v-if="place.folderid === null && place.show"
										:key="place.id"
										:id="place.id"
										:index="index"
										:srt="place.srt"
										:title="place.description"
										:class="'place-button block_01 draggable' + (place === currentPlace ? ' active' : '')"
										draggable="true"
										@click="setCurrentPlace(place);"
										@dragstart="handleDragStart"
									>
										{{ place.name }}
										<div
											class="place-button__dragenter-area place-button__dragenter-area_top"
											@dragenter="handleDragEnter"
										>
										</div>
										<div
											class="place-button__dragenter-area place-button__dragenter-area_bottom"
											@dragenter="handleDragEnter"
										>
										</div>
									</div>
								</div>
							</li>
						</ul>
					</div>
					<div v-if="$store.state.commonPlaces.length > 0 && commonPlacesShow">
						<h2 class="basiccolor">Другие места</h2>
						<div
							v-for="commonPlace in $store.state.commonPlaces"
							:id="commonPlace.id"
							:key="commonPlace.id"
							:class="'place-button block_01' + (commonPlace === currentPlace ? ' active' : '')"
							@click="setCurrentPlace(commonPlace, true);"
						>
							{{ commonPlace.name }}
						</div>
					</div>
				</div>
			</div>
			<div class="app-cell" id="basic-basic">
				<mapyandex
					ref="ym"
					:id="currentPlace.id"
					:name="currentPlace.name"
					:description="currentPlace.description"
					:images="currentPlace.images"
					:latitude="currentPlace.latitude"
					:longitude="currentPlace.longitude"
					:centerLatitude="$store.state.center.latitude"
					:centerLongitude="$store.state.center.longitude"
				>
				</mapyandex>
				<div
					class="sbs-top"
					:style="'left: -' + sidebarSize.left + 'px; right: -' + sidebarSize.right + 'px;'"
					@mousedown="sidebarDragStart('top', $event);"
				>
				</div>
				<div
					class="sbs-right"
					:style="'top: -' + sidebarSize.top + 'px; bottom: -' + sidebarSize.bottom + 'px;'"
					@mousedown="sidebarDragStart('right', $event);"
				>
				</div>
				<div
					class="sbs-bottom"
					:style="'left: -' + sidebarSize.left + 'px; right: -' + sidebarSize.right + 'px;'"
					@mousedown="sidebarDragStart('bottom', $event);"
				>
				</div>
				<div
					class="sbs-left"
					:style="'top: -' + sidebarSize.top + 'px; bottom: -' + sidebarSize.bottom + 'px;'"
					@mousedown="sidebarDragStart('left', $event);"
				>
				</div>
			</div>
			<div
				id="basic-right"
				class="app-cell"
				:style="'width: ' + sidebarSize.right + 'px;' + (sidebarSize.right < 120 ? ' display: none;' : '')"
			>
				<div class="scrollable">
					<dl class="place-detailed margin_bottom_0">
						<template v-for="field in Object.keys(currentPlace)" v-if="!currentPlace.deleted" :key="field">
							<dt v-if="!(field == 'images' && currentImages.length == 0) && !(field == 'common' && currentPlaceCommon) && field != 'show' && field != 'id' && field != 'folderid' && field != 'userid' && field != 'added' && field != 'deleted' && field != 'updated'">
								{{ $store.state.placeFields[field] }}:
							</dt>
							<dd v-if="field != 'show' && field != 'id' && field != 'folderid' && field != 'userid' && field != 'added' && field != 'deleted' && field != 'updated' && (field == 'srt' || field == 'latitude' || field == 'longitude')">
								<input
									type="text"
									:id="'detailed-' + field"
									:disabled="currentPlaceCommon"
									v-model.number.trim="currentPlace[field]"
									@focus="validatable();"
									@keyup="if(field === 'srt') {sortPlaceElementInMenu(currentPlace);}"
									@change="$store.commit('changePlace', {place: currentPlace, change: {updated: true}}); toDB(); $store.commit('changePlace', {place: currentPlace, change: {updated: false}});"
									class="fieldwidth_100"
								/>
							</dd>
							<dd v-else-if="!(field == 'common' && currentPlaceCommon) && field != 'show' && field != 'id' && field != 'folderid' && field != 'userid' && field != 'added' && field != 'deleted' && field != 'updated' && field == 'common'">
								<label>
									<input
										type="checkbox"
										:id="'detailed-' + field"
										:disabled="currentPlaceCommon"
										v-model="currentPlace[field]"
										@change="$store.commit('changePlace', {place: currentPlace, change: {updated: true}}); toDB(); $store.commit('changePlace', {place: currentPlace, change: {updated: false}});"
									/>
									Место видимо другим
								</label>
							</dd>
							<dd v-else-if="field == 'images' && currentImages.length > 0 && field != 'show' && field != 'id' && field != 'folderid' && field != 'userid' && field != 'added' && field != 'deleted' && field != 'updated'" id="place-images">
								<div class="dd-images row_01">
									<div
										v-for="(image, index) in currentImages"
										:id="image.id"
										:index="index"
										:key="image.id"
										:class="'place-image col-' + gridMode + (currentPlaceCommon ? '' : ' draggable')"
										:draggable="currentPlaceCommon ? false : true"
										@click="showPopup({show: true, type: 'image', data: image}, $event);"
										@dragstart="handleDragStart"
										@dragenter="handleDragEnter"
									>
										<div
											class="block_02"
										>
											<img
												class="image-thumbnail border_1"
												draggable="false"
												:src="$store.state.dirs.uploads.images.small + image.file"
												:alt="currentPlace.name"
												:title="currentPlace.name"
											/>
											<div
												class="dd-images__delete button"
												draggable="false"
												v-if="!currentPlaceCommon"
												@click="currentPlaceCommon ? $event.stopPropagation() : deleteFiles(Array.from(currentImages), [image], $event);"
											>
												×
											</div>
										</div>
									</div>
								</div>
							</dd>
							<dd v-else-if="field != 'common' && field != 'images' && field != 'show' && field != 'id' && field != 'folderid' && field != 'userid' && field != 'added' && field != 'deleted' && field != 'updated'">
								<textarea
									:id="'detailed-' + field"
									:disabled="currentPlaceCommon"
									v-model.trim="currentPlace[field]"
									@change="$store.commit('changePlace', {place: currentPlace, change: {updated: true}}); toDB(); $store.commit('changePlace', {place: currentPlace, change: {updated: false}});"
									class="fieldwidth_100"
								>
									{{ currentPlace[field] }}
								</textarea>
							</dd>
						</template>
						<div v-if="!currentPlace.deleted && !currentPlaceCommon" class="images-add">
							<div class="images-add__div button">Добавить фотографии</div>
							<input
								type="file"
								name="files"
								ref="inputUploadFiles"
								multiple
								@change="uploadFiles($event);"
								class="images-add__input"
							/>
						</div>
					</dl>
				</div>
			</div>
		</div>
		<div
			id="bottom"
			class="app-row"
			:style="'height: ' + sidebarSize.bottom + 'px;' + (sidebarSize.bottom < 60 ? ' display: none;' : '')"
		>
			<div
				id="bottom-left"
				class="app-cell"
				:style="'width: ' + sidebarSize.left + 'px;' + (sidebarSize.bottom < 60 || sidebarSize.left < 120 ? ' display: none;' : '')"
			>
				<button
					id="placemarksShowHideButton"
					class="actions-button button-pressed"
					@click="$refs.ym.placemarksShowHide();"
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
					@click="$refs.ym.commonPlacemarksShowHide();"
					title="Показать / скрыть все другие геометки"
				>
					◎
				</button>
				<button
					id="centerPlacemarkShowHideButton"
					class="actions-button"
					@click="$refs.ym.centerPlacemarkShowHide();"
					title="Показать / скрыть метку центра карты"
				>
					◈
				</button>
			</div>
			<div
				id="bottom-basic"
				class="app-cell"
			>
				<span class="imp">
					Координаты центра карты
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
			<div
				id="bottom-right"
				class="app-cell"
				:style="'width: ' + sidebarSize.right + 'px;' + (sidebarSize.bottom < 60 || sidebarSize.right < 120 ? ' display: none;' : '')"
			>
			</div>
		</div>
		<div :class="'popup ' + popuped" @click="showPopup({show: false}, $event);">
			<component
				ref="popup"
				:is="popupComponent"
				:data="popupData"
				:currentPlace="currentPlace"
			>
			</component>
		</div>
	</div>
</template>

<script>
import {constants} from "../shared/constants.js"
import {bus} from "../shared/bus.js"
import mapyandex from "./MapYandex.vue"
import popupimage from "./PopupImage.vue"
import popuptext from "./PopupText.vue"
import popupfolder from "./PopupFolder.vue"
import popupfolderdelete from "./PopupFolderDelete.vue"
import popupplacedelete from "./PopupPlaceDelete.vue"
import axios from "axios"
import {mapGetters} from "vuex"
export default {
	components: {
		mapyandex,
		popupimage,
		popuptext,
		popupfolder,
		popupfolderdelete,
		popupplacedelete,
	},
	data: function() {return {
		state: this.$store.state,
		placesFilled: false,
		firstValidatable: false,
		currentPlace: {},
		currentImages: {},
		commonPlacesShow: false,
		currentPlaceCommon: false,
		needToUpdate: false,
		needToUpdateFolders: false,
		popuped: "disappear",
		popupComponent: "popuptext",
		popupData: {},
		draggingElement: null,
		foldersEditMode: false,
		sidebarSize: {
			top: constants.sidebars.top,
			right: constants.sidebars.right,
			bottom: constants.sidebars.bottom,
			left: constants.sidebars.left,
		},
		sidebarDrag: {what: null, x: 0, y: 0, w: 0, h: 0},
		gridMode: 6,
	}},
	mounted: function() {
		bus.$on("placesFilled", (happens) => {
			if(happens === "importing") {
				this.$nextTick(function() {
					this.buildMenu(this.$store.state.folders);
					this.toDB();
					this.toDB("folders", JSON.stringify(this.$store.state.folders));
				});
			}
			if(this.$refs.ym && this.$refs.ym.map) {
				this.$refs.ym.map.destroy();
			}
			if(this.$refs.ym) {
				this.$refs.ym.showMap(constants.map.initial.latitude, constants.map.initial.longitude);
			}
			document.addEventListener("dragover", this.handleDragOver, false);
			document.addEventListener("drop", this.handleDrop, false);
			document.addEventListener("keyup", this.keyup, false);
			this.placesFilled = true;
		});
		if(this.$store.state.user.testaccount) {
			setTimeout(function() {
				this.$store.commit("setMessage", "Вы авторизовались под тестовым аккаунтом; невозможны сохранение изменений в базу данных и загрузка файлов, в том числе фотографий");
			}.bind(this), 5000);
		}
	},
	updated: function() {
		if(
			this.placesFilled
			&& document.getElementById("places-menu")
			&& document.getElementById("places-menu").classList.contains("hidden")
		) {
			this.buildMenu(this.$store.state.folders);
			document.getElementById("places-menu").classList.remove("hidden");
		}
	},
	beforeDestroy: function() {
		document.removeEventListener("dragover", this.handleDragOver, false);
		document.removeEventListener("drop", this.handleDrop, false);
		document.removeEventListener("keyup", this.keyup, false);
		bus.$off("placesFilled");
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
				switch(constants.shortcuts[event.keyCode]) {
					case "add" :
						let newPlace = this.$refs.ym.appendPlace();
						this.toDB();
						this.$store.commit("changePlace", {
							place: newPlace,
							change: {added: false},
						});
						break;
					case "delete" :
						if(this.currentPlace.userid === this.$store.state.user.id) {
							this.showPopup({
								show: true,
								type: "placeDelete",
								data: this.currentPlace,
							}, event);
						}
						break;
					case "import" :
						document.getElementById("inputImportFromFile").click();
						break;
					case "export" :
						this.exportToFile();
						break;
					case "save" :
						this.toDB();
						this.toDB("folders", JSON.stringify(this.$store.state.folders));
						break;
					case "help" :
						this.showAbout();
						break;
					case "revert" :
						document.location.reload(true);
						break;
					case "quit" :
						this.toDB();
						this.toDB("folders", JSON.stringify(this.$store.state.folders));
						this.exit();
						break;
					case "other" :
						this.commonPlacesShowHide();
						break;
					case "placemarks" :
						this.$refs.ym.placemarksShowHide();
						break;
					case "other placemarks" :
						this.$refs.ym.commonPlacemarksShowHide();
						break;
					case "center" :
						this.$refs.ym.centerPlacemarkShowHide();;
						break;
				}
			}
			if(this.popuped === "appear") {
				switch(constants.shortcuts[event.keyCode]) {
					case "close" :
						this.showPopup({show: false}, event);
						break;
					case "left" :
						if(this.popupComponent == "popupimage") {
							this.$refs.popup.showImage(-1, event);
						}
						break;
					case "right" :
						if(this.popupComponent == "popupimage") {
							this.$refs.popup.showImage(1, event);
						}
						break;
				}
			}
		},
		handleDragStart: function(event) {
			event.dataTransfer.setData("text/plain", null);
			this.draggingElement = event.target;
		},
		handleDragEnter: function(event) {
			event.preventDefault();
			event.stopPropagation();
			if(this.draggingElement !== null && this.draggingElement !== event.target) {
				let
					srt = null,
					draggingIndex = this.getIndexById({
						parent: this.$store.state.places,
						id: this.draggingElement.id,
					}),
					targetPrev = event.target.parentNode.previousElementSibling,
					targetNext = event.target.parentNode.nextElementSibling,
					targetSrt = Number(event.target.parentNode.getAttribute("srt"))
				;
				if(
					this.draggingElement.classList.contains("place-button")
					&& event.target.parentNode.classList.contains("place-button")
					&& this.draggingElement != event.target.parentNode
				) {
					if(event.target.classList.contains("place-button__dragenter-area_top")) {
						if(!targetPrev) {
							srt = targetSrt / 2;
						} else if(targetPrev.id !== this.draggingElement.id) {
							let targetPrevSrt = Number(targetPrev.getAttribute("srt"));
							srt = (targetSrt - targetPrevSrt) / 2 + targetPrevSrt;
						}
					}
					if(event.target.classList.contains("place-button__dragenter-area_bottom")) {
						if(!targetNext) {
							srt = targetSrt + 1;
						} else if(targetNext.id !== this.draggingElement.id) {
							let targetNextSrt = Number(targetNext.getAttribute("srt"));
							srt = (targetNextSrt - targetSrt) / 2 + targetSrt;
						}
					}
					if(srt !== null) {
						this.$store.commit("changePlace", {
							place: this.$store.state.places[draggingIndex],
							change: {
								folderid:
									this.$store.state.places[
										event.target.parentNode.getAttribute("index")
									].folderid
								,
								srt: srt,
							},
						});
						this.sortPlaceElementInMenu(this.$store.state.places[draggingIndex]);
						this.needToUpdate = true;
					}
				}
				if(
					this.draggingElement.classList.contains("folder-button")
					&& event.target.classList.contains("folder-button__dragenter-area")
					&& this.draggingElement != event.target.parentNode
					&& !(
						event.target.classList.contains("folder-button__dragenter-area_bottom")
						&& event.target.parentNode.parentNode.classList.contains("places-menu-folder_opened")
					)
				) {
					let targetIndex = this.getIndexById({
						parent: this.$store.state.folders,
						id: event.target.parentNode.id.substr(24),
					});
					let targetPrevIndex = event.target.parentNode.parentNode.previousElementSibling
						? this.getIndexById({
							parent: this.$store.state.folders,
							id: event.target.parentNode.parentNode.previousElementSibling.id.substr(19),
						})
						: null;
					let targetNextIndex = event.target.parentNode.parentNode.nextElementSibling
						? this.getIndexById({
							parent: this.$store.state.folders,
							id: event.target.parentNode.parentNode.nextElementSibling.id.substr(19),
						})
						: null;
					if(event.target.classList.contains("folder-button__dragenter-area_top")) {
						if(targetPrevIndex === null) {
							srt = this.$store.state.folders[targetIndex].srt / 2;
						} else {
							srt =
								(
									this.$store.state.folders[targetIndex].srt -
									this.$store.state.folders[targetPrevIndex].srt
								) / 2
								+ this.$store.state.folders[targetPrevIndex].srt
							;
						}
						event.target.parentNode.parentNode.parentNode.insertBefore(
							this.draggingElement.parentNode,
							event.target.parentNode.parentNode
						);
					}
					if(event.target.classList.contains("folder-button__dragenter-area_bottom")) {
						if(targetNextIndex === null) {
							srt = this.$store.state.folders[targetIndex].srt + 1;
							event.target.parentNode.parentNode.parentNode.appendChild(
								this.draggingElement.parentNode
							);
						} else {
							srt =
								(
									this.$store.state.folders[targetNextIndex].srt -
									this.$store.state.folders[targetIndex].srt
								) / 2
								+ this.$store.state.folders[targetIndex].srt
							;
							event.target.parentNode.parentNode.parentNode.insertBefore(
								this.draggingElement.parentNode,
								event.target.parentNode.parentNode.nextElementSibling
							);
						}
					}
					let
						parentId = event.target.parentNode.parentNode.parentNode.id.substr(13),
						folder = this.$store.state.folders[
							this.getIndexById({
								parent: this.$store.state.folders,
								id: this.draggingElement.id.substr(24),
							})
						];
					this.$store.commit("changeFolder", {
						folder: folder,
						change: {
							parent: parentId === "root" ? null : parentId,
							srt: srt,
						},
					});
					this.needToUpdateFolders = true;
				}
				if(
					(
						this.draggingElement.classList.contains("folder-button")
						|| this.draggingElement.classList.contains("place-button")
					)
					&& event.target.classList.contains("folder-button")
					&& this.draggingElement != event.target
				) {
					event.target.classList.add("folder-button_parent");
				}
				if(
					this.draggingElement.classList
					&& this.draggingElement.classList.contains("place-image")
					&& event.target.classList
					&& event.target.classList.contains("place-image")
				) {
					this.$store.commit("swapValues", {
						parent: this.currentImages,
						indexes: [
							this.draggingElement.getAttribute("index"),
							event.target.getAttribute("index"),
						],
						values: ["srt"],
					});
					this.currentImages = sortObjects(this.currentImages, "srt");
					this.needToUpdate = true;
				}
			}
		},
		handleDragLeave: function(event) {
			event.preventDefault();
			event.stopPropagation();
			if(this.draggingElement !== null && this.draggingElement !== event.target) {
				if(
					(
						this.draggingElement.classList.contains("folder-button")
						|| this.draggingElement.classList.contains("place-button")
					)
					&& event.target.classList.contains("folder-button")
					&& this.draggingElement != event.target
				) {
					event.target.classList.remove("folder-button_parent");
				}
			}
		},
		handleDragOver: function(event) {
			event.preventDefault();
		},
		handleDrop: function(event) {
			event.preventDefault();
			event.stopPropagation();
			if(this.draggingElement !== null && this.draggingElement !== event.target) {
				if(
					this.draggingElement.classList.contains("place-button")
					&& event.target.parentNode.classList.contains("places-menu-folder")
				) {
					let container;
					event.target.parentNode.querySelectorAll(".places-menu-item").forEach(function(c) {
						if(c.parentNode === event.target.parentNode) {
							container = c;
							return;
						}
					});
					if(container) {
						let srt;
						if(container.children.length > 0) {
							srt =
								this.$store.state.places[this.getIndexById({
									parent: this.$store.state.places,
									id: container.children[container.children.length - 1].id,
								})].srt + 1
							;
						} else {
							srt = 1;
						}
						this.$store.commit("changePlace", {
							place:
								this.$store.state.places[this.getIndexById({
									parent: this.$store.state.places,
									id: this.draggingElement.id,
								})]
							,
							change: {
								folderid: container.id === "places-menu-item-root" ? null : container.id,
								srt: srt,
							},
						});
						this.sortPlaceElementInMenu(
							this.$store.state.places[this.getIndexById({
								parent: this.$store.state.places,
								id: this.draggingElement.id,
							})]
						);
						this.needToUpdate = true;
					}
				}
				if(
					(
						this.draggingElement.classList.contains("folder-button")
						|| this.draggingElement.classList.contains("place-button")
					)
					&& event.target.classList.contains("folder-button")
					&& this.draggingElement != event.target
				) {
					event.target.classList.remove("folder-button_parent");
				}
				if(
					this.draggingElement.classList.contains("folder-button")
					&& event.target.classList.contains("folder-button")
					&& this.draggingElement != event.target
				) {
					let
						targetId = event.target.id.substr(24),
						newUl = event.target.parentNode.querySelector("ul");
					if(!newUl) {
						newUl = event.target.parentNode.insertBefore(
							document.createElement("ul"),
							event.target.parentNode.firstChild.nextElementSibling
						);
						newUl.className = "margin_bottom_0";
					}
					newUl.appendChild(this.draggingElement.parentNode);
					this.$store.state.folders.forEach(function(folder) {
						if(folder.id === this.draggingElement.id.substr(24)) {
							this.$store.commit("changeFolder", {
								folder: folder,
								change: {parent: targetId === "root" ? null : targetId},
							});
							this.toDB("folders", JSON.stringify([folder]));
						}
					}.bind(this));
				}
			}
			this.draggingElement = null;
			if(this.needToUpdate) {
				this.toDB();
				this.needToUpdate = false;
			}
			if(this.needToUpdateFolders) {
				this.toDB("folders", JSON.stringify(this.$store.state.folders));
				this.needToUpdateFolders = false;
			}
		},
		sidebarDragStart: function(what, event) {
			event.preventDefault();
			this.sidebarDrag.what = what;
			this.sidebarDrag.x = event.screenX;
			this.sidebarDrag.y = event.screenY;
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
						this.sidebarSize.top = this.sidebarDrag.h - this.sidebarDrag.y + event.screenY;
						break;
					case "bottom" :
						this.sidebarSize.bottom = this.sidebarDrag.h + this.sidebarDrag.y - event.screenY;
						break;
					case "left" :
						this.sidebarSize.left = this.sidebarDrag.w - this.sidebarDrag.x + event.screenX;
						break;
					case "right" :
						this.sidebarSize.right = this.sidebarDrag.w + this.sidebarDrag.x - event.screenX;
						break;
				}
			}
		},
		sidebarDragStop: function(event) {
			event.preventDefault();
			this.sidebarDrag.what = null;
		},
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
		buildMenu: function(plain) {
			let tree = document.getElementById("folders-list-root"), parentLi, parentUl, treeLength = 0;
			plain.forEach(function(item) {
				if(item.parent !== null) {
					parentLi = document.getElementById("places-menu-folder-" + item.parent);
					if(parentLi !== null) {
						if(!document.getElementById("folders-list-" + item.parent)) {
							let parentUl = document.createElement("ul");
							parentUl.id = "folders-list-" + item.parent;
							parentUl.className = "margin_bottom_0";
							parentLi.insertBefore(parentUl, document.getElementById(item.parent));
						}
						document.getElementById("folders-list-" + item.parent).appendChild(
							document.getElementById("places-menu-folder-" + item.id)
						);
						treeLength++;
					}
				}
			});
		},
		sortPlaceElementInMenu: function(place) {
			for(var i = 0; i < this.$store.state.places.length; i++) {
				if(
					this.$store.state.places[i].folderid === place.folderid
					&& this.$store.state.places[i].srt > place.srt
				) {
					this.$store.state.places.splice(
						(i < 1 ? 0 : i - 1), 0,
						this.$store.state.places.splice(
							this.$store.state.places.indexOf(place), 1
						)[0]
					);
					return;
				}
			}
			this.$store.state.places.push(
				this.$store.state.places.splice(
					this.$store.state.places.indexOf(place), 1
				)[0]
			);
		},
	},
	computed: {
		...mapGetters(["getImages", "getMessage", "getImagesCount", "getIndexById"]),
		exit: () => function() {
			this.$store.dispatch("unload");
			bus.$emit("loggedChange", "auth");
		},
		account: () => function() {
			bus.$emit("loggedChange", "account");
		},
		setCurrentPlace: (place, common = false) => function(place, common = false) {
			if(Object.keys(this.currentPlace).length > 0) {
				if(!this.currentPlaceCommon) {
					this.$refs.ym.mrks[this.currentPlace.id].options.set("iconColor", this.$refs.ym.privatePlacemarksColor);
				} else {
					this.$refs.ym.commonMrks[this.currentPlace.id].options.set("iconColor", this.$refs.ym.commonPlacemarksColor);
				}
			}
			this.currentPlace = place;
			this.currentPlaceCommon = common ? true : false;
			if(!this.currentPlaceCommon) {
				this.$refs.ym.mrks[this.currentPlace.id].options.set("iconColor", this.$refs.ym.activePlacemarksColor);
			} else {
				this.$refs.ym.commonMrks[this.currentPlace.id].options.set("iconColor", this.$refs.ym.activePlacemarksColor);
			}
			if(!common) {
				let folder, folderid = place.folderid;
				while(folderid) {
					folder = document.getElementById("places-menu-folder-" + folderid);
					folder.classList.remove('places-menu-folder_closed');
					folder.classList.add('places-menu-folder_opened');
					folderid = this.$store.state.folders.find(f => f.id === folderid).parent;
				}
			}
			this.currentImages = this.getImages(this.currentPlace, common);
			this.$store.commit("changeCenter", {
				latitude: this.currentPlace.latitude,
				longitude: this.currentPlace.longitude,
			});
		},
		deletePlace: place => function(place) {
			let finallyDeletePlace = place => {
				this.$store.commit("removePlace", place);
				this.toDB();
				this.$refs.ym.map.geoObjects.remove(this.$refs.ym.mrks[place.id]);
				if(place.id === this.currentPlace.id) {
					if(document.getElementById(place.id).nextElementSibling) {
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
					} else {
						this.setCurrentPlace(
							this.$store.state.places.find(p => p.folderid === null)
						);
					}
				}
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
		commonPlacesShowHide: () => function() {
			this.commonPlacesShow = !this.commonPlacesShow;
			this.$refs.ym.commonPlacemarksShow = this.commonPlacesShow;
			for(let key in this.$refs.ym.commonMrks) {
				if(!this.$refs.ym.commonPlacemarksShow) {
					this.$refs.ym.commonMrks[key].options.set("visible", false);
				} else {
					this.$refs.ym.commonMrks[key].options.set("visible", true);
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
		showPopup: (opts, event) => function(opts, event) {
			event.stopPropagation();
			switch(opts.type) {
				case "text" :
					this.popupData = opts.data;
					this.popupComponent = "popuptext";
					break;
				case "image" :
					this.popupData = opts.data;
					this.popupComponent = "popupimage";
					break;
				case "folder" :
					this.popupData = opts.data;
					this.popupComponent = "popupfolder";
					break;
				case "folderDelete" :
					this.popupData = opts.data;
					this.popupComponent = "popupfolderdelete";
					break;
				case "placeDelete" :
					this.popupData = opts.data;
					this.popupComponent = "popupplacedelete";
					break;
			}
			this.popuped = opts["show"] ? "appear" : "disappear";
		},
		showAbout: (event) => function(event) {
			let aboutRequest = new XMLHttpRequest();
			aboutRequest.open("GET", "/about.htm", true);
			aboutRequest.onreadystatechange = function(event) {
				if(aboutRequest.readyState == 4) {
					if(aboutRequest.status == 200) {
						this.showPopup({
							show: true,
							type: "text",
							data:
								JSON.stringify(aboutRequest.responseText)
									.replace(/^\s*\"/, "")
									.replace(/\"\s*$/, "")
									.replace(/(?:\\(?=")|\\(?=\/)|\\t|\\n)/gi, "")
							,
						}, event);
					} else {
						this.$store.commit("setMessage", "Не могу найти справку");
					}
				}
			}.bind(this);
			aboutRequest.setRequestHeader("Content-type", "application/json");
			aboutRequest.send();
		},
		importFromFile: () => function() {
			let reader = new FileReader();
			reader.onload = function(event) {
				this.$nextTick(function() {
					this.$store.dispatch("setPlaces", reader.result);
					document.getElementById("inputImportFromFile").value = "";
				});
			}.bind(this);
			reader.readAsText(this.$refs.inputImportFromFile.files[0]);
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
				return new Promise((resolve, reject) => {
					if(!document.querySelector(".value_wrong")) {
						let placesRequest = new XMLHttpRequest();
						placesRequest.open("POST", "/backend/set_places.php", true);
						placesRequest.onreadystatechange = function(event) {
							if(placesRequest.readyState == 4) {
								if(placesRequest.status == 200) {
									this.$store.commit("setMessage", "Изменения сохранены в базе данных");
									resolve("Изменения сохранены в базе данных");
								} else {
									this.$store.commit("setMessage", "Не могу внести данные в БД");
									reject(new Error("Не могу внести данные в БД"));
								}
							}
						}.bind(this);
						placesRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
						placesRequest.send("id=" + localStorage.getItem("places-userid") + "&todo=" + (typeof(todo) !== "undefined" ? todo : "places") + "&data=" + (typeof(data) !== "undefined" ? data : JSON.stringify(this.$store.state.places)));
					} else {
						this.$store.commit("setMessage", "Некоторые поля заполнены некорректно");
					}
				});
			}
		},
		uploadFiles: (event) => function(event) {
			event.preventDefault();
			if(this.$store.state.user.testaccount) {
				this.$store.commit("setMessage", "Тестовый аккаунт не позволяет загрузку файлов");
			} else {
				let data = new FormData(), files = this.$refs.inputUploadFiles.files, rndname, ext;
				for(var i = 0; i < files.length; i++) {
					files[i].rndname = generateRandomString(32);
					ext = files[i].name.match(/\.([^.]+)$/);
					files[i].ext = ext == null ? "" : ext[1];
					data.append(files[i].rndname + "_" + files[i].ext, files[i]);
				}
				data.append("userid", this.$store.state.user.id);
				axios.post("/backend/upload.php", data)
					.then(response => {
						let filesArray = [], srt;
						if(Object.keys(this.currentImages).length > 0) {
							let storeImages = this.currentImages;
							srt = sortObjects(storeImages, "srt").pop().srt;
						} else {
							srt = 0;
						}
						for(var i = 0; i < files.length; i++) {
							filesArray.push({
								id: generateRandomString(32),
								file: files[i].rndname + (files[i].ext == "" ? "" : "." + files[i].ext),
								size: files[i].size,
								type: files[i].type,
								lastmodified: files[i].lastModified,
								srt: ++srt,
								placeid: this.currentPlace.id,
							});
						}
						let images = this.currentImages
							? this.currentImages.concat(filesArray)
							: filesArray
						;
						this.currentImages = images;
						this.$store.commit("changePlace", {
							place: this.currentPlace,
							change: {images: images},
						});
						this.$store.commit("setMessage", "Файлы успешно загружены");
						this.toDB()
							.then(response => {
								this.toDB("images_upload", JSON.stringify(filesArray))
							});
					})
					.catch(error => {
						this.$store.commit("setMessage", "При загрузке файлов произошла ошибка");
					});
			}
		},
		deleteFiles: (inarray, files, event) => function(inarray, files, event) {
			return new Promise((resolve, reject) => {
				if(event) {
					event.stopPropagation();
				}
				let data = new FormData();
				for(var i = 0; i < files.length; i++) {
					data.append("file_" + i, files[i].file);
					inarray.splice(inarray.indexOf(files[i]), 1);
					this.currentImages = inarray;
				}
				data.append("userid", this.$store.state.user.id);
				if(!this.$store.state.user.testaccount) {
					axios.post("/backend/delete.php", data)
						.then(response => {
							this.$store.commit("changePlace", {
								place: this.currentPlace,
								change: {images: inarray},
							});
							this.toDB("images_delete", JSON.stringify(files))
								.then(response => {
									resolve("Картинки успешно удалены");
								});
						});
				}
			});
		},
	},
}
</script>
