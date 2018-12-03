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
				class="app-cell fieldwidth_100 fontsize_n"
				:style="'width: ' + sidebarSize.left + 'px;' + (sidebarSize.top < 80 || sidebarSize.left < 120 ? ' display: none;' : '')"
			>
				<input placeholder="Поиск по названию мест" title="Поиск по названию мест" class="find-places-input fieldwidth_100" @keyup="selectPlaces" />
			</div>
			<div
				id="top-basic"
				class="app-cell"
			>
				<div>
					<div class="brand">
						<h1 class="basiccolor margin_bottom_0">Места — <a href="javascript:void(0);" @click="account();" v-html="getLogin"></span></h1>
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
				<button
					id="actions-append"
					class="actions-button"
					title="Добавить место в центре карты"
					@click="$refs.ym.appendPlace(); toDB(); makeUpdateCurrent(false);"
				>
					+
				</button>
				<button
					id="actions-delete"
					class="actions-button"
					title="Удалить текущее место"
					@click="if(currentPlace.userid == $store.state.user.id) {deletePlace(currentIndex); toDB(); makeUpdateCurrent(false);}"
				>
					×
				</button>
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
					@click="if($store.state.user.testaccount) {$store.commit('setMessage', 'Вы авторизовались под тестовым аккаунтом; невозможно сохранение изменений в базу данных');} else {toDB(); makeUpdateCurrent(false);}"
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
					id="actions-refresh"
					class="actions-button"
					title="Вернуться к версии в БД"
					onclick="document.location.reload(true);"
				>
					↺
				</button>
				<button
					id="actions-exit"
					class="actions-button"
					title="Выйти"
					@click="toDB(); makeUpdateCurrent(false); exit();"
				>
					↪
				</button>
			</div>
		</div>
		<div class="app-row" id="basic">
			<div
				id="basic-left"
				class="app-cell"
				:style="'width: ' + sidebarSize.left + 'px;' + (sidebarSize.left < 120 ? ' display: none;' : '')"
			>
				<div id="basic-left__places" class="scrollable">
					<div v-if="$store.state.places.length > 0">
						<h2 class="basiccolor">Мои места</h2>
						<div
							v-for="place in sortObjects($store.state.places, 'srt')"
							v-if="!place.deleted && place.show"
							:id="place.id"
							:key="place.id"
							:class="'place-button block_01 draggable' + (place.id == currentId ? ' active' : '')"
							draggable="true"
							@click="setCurrentPlace($store.state.places.indexOf(place));"
							@dragstart="handleDragStart"
							@dragenter="handleDragEnter"
						>
							<h3 class="fontsize_01 margin_bottom_0">{{ place.name }}</h3>
						</div>
					</div>
					<div v-if="$store.state.commonPlaces.length > 0 && commonPlacesShow">
						<h2 class="basiccolor">Другие места</h2>
						<div
							v-for="commonPlace in sortObjects($store.state.commonPlaces, 'srt')"
							:id="commonPlace.id"
							:key="commonPlace.id"
							:class="'place-button block_01' + (commonPlace.id == currentId ? ' active' : '')"
							@click="setCurrentPlace($store.state.commonPlaces.indexOf(commonPlace), true);"
						>
							<h3 class="fontsize_01 margin_bottom_0">{{ commonPlace.name }}</h3>
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
					class="sbs-right"
					:style="'top: -' + sidebarSize.top + 'px; bottom: -' + sidebarSize.bottom + 'px;'"
					@mousedown="sidebarDragStart('right', $event);"
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
							<dt v-if="!(field == 'images' && currentImages.length == 0) && !(field == 'common' && currentPlaceCommon) && field != 'show' && field != 'id' && field != 'userid' && field != 'added' && field != 'deleted' && field != 'updated'">
								{{ $store.state.placeFields[field] }}:
							</dt>
							<dd v-if="field != 'show' && field != 'id' && field != 'userid' && field != 'added' && field != 'deleted' && field != 'updated' && (field == 'srt' || field == 'latitude' || field == 'longitude')">
								<input
									type="text"
									:id="'detailed-' + field"
									:disabled="currentPlaceCommon"
									v-model.number.trim="currentPlace[field]"
									@click="validatable();"
									@change="makeUpdateCurrent(true);"
									@blur="if(updateCurrent) {toDB(); makeUpdateCurrent(false);}"
									class="fieldwidth_100"
								/>
							</dd>
							<dd v-else-if="!(field == 'common' && currentPlaceCommon) && field != 'show' && field != 'id' && field != 'userid' && field != 'added' && field != 'deleted' && field != 'updated' && field == 'common'">
								<label>
									<input
										type="checkbox"
										:id="'detailed-' + field"
										:disabled="currentPlaceCommon"
										v-model="currentPlace[field]"
										@change="toDB(); makeUpdateCurrent(false);"
									/>
									Место видимо другим
								</label>
							</dd>
							<dd v-else-if="field == 'images' && currentImages.length > 0 && field != 'show' && field != 'id' && field != 'userid' && field != 'added' && field != 'deleted' && field != 'updated'" id="place-images">
								<div class="dd-images row_01">
									<div
										v-for="image in sortObjects(currentImages, 'srt')"
										:id="image.id"
										:key="image.id"
										:class="'col-' + gridMode + (currentPlaceCommon ? '' : ' draggable')"
										:draggable="currentPlaceCommon ? false : true"
										@click="showPopup({show: true, type: 'image', data: image}, $event);"
										@dragstart="handleDragStart"
										@dragenter="handleDragEnter"
									>
										<div
											class="block_02"
										>
											<img
												class="border_1"
												draggable="false"
												:src="$store.state.dirs.uploads.images.small + image.file"
												:alt="currentPlace.name"
												:title="currentPlace.name"
											/>
											<div
												class="dd-images__delete button"
												draggable="false"
												@click="currentPlaceCommon ? $event.stopPropagation() : deleteFiles(Array.from(currentImages), [image], $event);"
											>
												×
											</div>
										</div>
									</div>
								</div>
							</dd>
							<dd v-else-if="field != 'common' && field != 'images' && field != 'show' && field != 'id' && field != 'userid' && field != 'added' && field != 'deleted' && field != 'updated'">
								<textarea
									:id="'detailed-' + field"
									:disabled="currentPlaceCommon"
									v-model.trim="currentPlace[field]"
									@change="makeUpdateCurrent(true);"
									@blur="if(updateCurrent) {toDB(); makeUpdateCurrent(false);}"
									class="fieldwidth_100"
								>
									{{ currentPlace[field] }}
								</textarea>
							</dd>
						</template>
						<div v-if="!currentPlace.deleted && !currentPlaceCommon && currentId" class="images-add">
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
			<div
				class="sbs-top"
				@mousedown="sidebarDragStart('top', $event);"
			>
			</div>
			<div
				class="sbs-bottom"
				@mousedown="sidebarDragStart('bottom', $event);"
			>
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
		<div :class="'popup ' + popuped">
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
import axios from "axios"
import {mapGetters} from "vuex"
export default {
	components: {
		mapyandex,
		popupimage,
		popuptext,
	},
	data: function() {return {
		firstValidatable: false,
		places: this.$store.state,
		currentId: null,
		currentIndex: 0,
		currentPlace: {},
		currentImages: {},
		commonPlacesShow: false,
		currentPlaceCommon: false,
		updateCurrent: false,
		popuped: "disappear",
		popupComponent: "popuptext",
		popupData: {},
		draggingElement: null,
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
		bus.$on("placesFilled", () => {
			if(this.$refs.ym && this.$refs.ym.map) {
				this.$refs.ym.map.destroy();
			}
			if(this.$refs.ym) {
				this.$refs.ym.showMap(constants.map.initial.latitude, constants.map.initial.longitude);
			}
			document.addEventListener("dragover", this.handleDragOver, false);
			document.addEventListener("drop", this.handleDrop, false);
			document.addEventListener("keyup", this.keyup, false);
			this.$store.commit("modifyPlaces", this.sortObjects(this.$store.state.places, "srt"));
			this.$store.commit("modifyCommonPlaces", this.sortObjects(this.$store.state.commonPlaces, "srt"));
		});
		if(this.$store.state.user.testaccount) {
			setTimeout(function() {
				this.$store.commit("setMessage", "Вы авторизовались под тестовым аккаунтом; невозможны сохранение изменений в базу данных и загрузка файлов, в том числе фотографий");
			}.bind(this), 5000);
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
		keyup: function(event) {
			if(event.altKey && event.shiftKey) {
				switch(constants.shortcuts[event.keyCode]) {
					case "add" :
						this.$refs.ym.appendPlace();
						this.toDB();
						this.makeUpdateCurrent(false);
						break;
					case "delete" :
						if(this.currentPlace.userid == this.$store.state.user.id) {
							this.deletePlace(this.currentIndex);
							this.toDB();
							this.makeUpdateCurrent(false);
						}
						break;
					case "import" :
						document.getElementById("inputImportFromFile").click();
						break;
					case "export" :
						this.exportToFile();
						break;
					case "save" :
						if(this.$store.state.user.testaccount) {
							this.$store.commit("setMessage", "Вы авторизовались под тестовым аккаунтом; невозможно сохранение изменений в базу данных");
						} else {
							this.toDB();
							this.makeUpdateCurrent(false);
						}
						break;
					case "help" :
						this.showAbout();
						break;
					case "revert" :
						document.location.reload(true);
						break;
					case "quit" :
						this.toDB();
						this.makeUpdateCurrent(false);
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
			if(this.popuped == "appear") {
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
			if(event.target.draggable && this.draggingElement != event.target) {
				this.makeUpdateCurrent(true);
				let parent;
				switch(this.draggingElement.parentNode.parentNode.id) {
					case "basic-left__places" :
						parent = this.$store.state.places;
						break;
					case "place-images" :
						parent = this.currentImages;
						break;
				}
				this.$store.commit("swapValues", {
					parent: parent,
					indexes: [
						this.getIndexById({parent: parent, id: this.draggingElement.id}),
						this.getIndexById({parent: parent, id: event.target.id}),
					],
					values: ["srt"],
				});
			}
		},
		handleDragOver: function(event) {
			event.preventDefault();
		},
		handleDrop: function(event) {
			event.preventDefault();
			if(this.updateCurrent) {
				this.toDB(); this.makeUpdateCurrent(false);
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
			event.preventDefault();
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
				for(let i = 0; i < this.$store.state.places.length; i++) {
					this.$store.commit("show", i);
				}
			} else {
				for(let i = 0; i < this.$store.state.places.length; i++) {
					let regexp = new RegExp(event.target.value, "i");
					if(!regexp.test(this.$store.state.places[i].name)) {
						this.$store.commit("hide", i);
					} else {
						this.$store.commit("show", i);
					}
				}
			}
		},
	},
	computed: {
		...mapGetters(["getPlace", "getImages", "getLogin", "getMessage", "getImagesCount", "getIndexById"]),
		makeUpdateCurrent: (update) => function(update) {
			if(this.currentIndex && this.currentIndex >= 0) {
				this.$store.commit("changePlace", {
					index: this.currentIndex,
					change: {updated: update},
				});
			}
			this.updateCurrent = update;
		},
		exit: () => function() {
			this.$store.dispatch("unload");
			bus.$emit("loggedChange", "auth");
		},
		account: () => function() {
			bus.$emit("loggedChange", "account");
		},
		setCurrentPlace: (index, common = false) => function(index, common = false) {
			this.currentPlaceCommon = common ? true : false;
			if(document.getElementById(this.currentId)) {
				document.getElementById(this.currentId).classList.remove("active");
			}
			if(!common && !this.$store.state.places[index]) {
				index--;
				if(!this.$store.state.places[index]) {
					return;
				}
			}
			if(this.currentId) {
				if(this.$store.state.places[this.currentIndex]) {
					this.$refs.ym.mrks[this.currentId].options.set("iconColor", this.$refs.ym.privatePlacemarksColor);
				} else {
					this.$refs.ym.commonMrks[this.currentId].options.set("iconColor", this.$refs.ym.commonPlacemarksColor);
				}
			}
			this.currentId = !common
				? this.$store.state.places[index].id
				: this.$store.state.commonPlaces[index].id
			;
			if(common) {
				this.$refs.ym.commonMrks[this.currentId].options.set("iconColor", this.$refs.ym.activePlacemarksColor);
			} else {
				this.$refs.ym.mrks[this.currentId].options.set("iconColor", this.$refs.ym.activePlacemarksColor);
			}
			this.currentIndex = index;
			this.currentPlace = this.getPlace(this.currentIndex, common);
			this.currentImages = this.getImages(this.currentIndex, common);
			this.$store.commit("changeCenter", {
				latitude: this.currentPlace.latitude,
				longitude: this.currentPlace.longitude,
			});
		},
		deletePlace: index => function(index) {
			this.$store.commit("removePlace", index);
			this.$refs.ym.map.geoObjects.remove(this.$refs.ym.mrks[this.$store.state.places[index].id]);
			for(var i = this.currentIndex + 1; i < this.$store.state.places.length; i++) {
				if(!this.$store.state.places[i].deleted) {
					this.setCurrentPlace(i);
					return;
				}
			}
			for(var i = this.currentIndex - 1; i >= 0; i--) {
				if(!this.$store.state.places[i].deleted) {
					this.setCurrentPlace(i);
					return;
				}
			}
		},
		sortObjects: (array, field) => function(array, field) {
			let sorted = array.slice().sort(function(a, b) {
				return a[field] - b[field];
			});
			if(this.currentId == null) {
				this.currentIndex = 0;
			} else {
				this.currentIndex = this.getIndexById({parent: this.$store.state.places, id: this.currentId});
			}
			return sorted;
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
				case "image" :
					this.popupComponent = "popupimage";
					this.popupData = opts.data;
					break;
				default :
					this.popupComponent = "popuptext";
					this.popupData = opts.data;
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
				this.$store.commit("reset");
				this.$store.dispatch("setPlaces", reader.result);
				document.getElementById("inputImportFromFile").value = "";
			}.bind(this);
			reader.readAsText(this.$refs.inputImportFromFile.files[0]);
		},
		exportToFile: () => function() {
			const data = JSON.stringify(this.$store.state.places);
			const blob = new Blob([data], {type: "text/plain"});
			const e = document.createEvent("MouseEvents"),
			a = document.createElement("a");
			a.download = "places.json";
			a.href = window.URL.createObjectURL(blob);
			a.dataset.downloadurl = ["text/json", a.download, a.href].join(":");
			e.initEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
			a.dispatchEvent(e);
		},
		toDB: (todo, data) => function(todo = "places", data = JSON.stringify(this.$store.state.places)) {
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
						placesRequest.send("id=" + localStorage.getItem("places-userid") + "&todo=" + todo + (data != "undefined" ? ("&data=" + data) : ""));
					} else {
						this.$store.commit("setMessage", "Некоторые поля заполнены некорректно");
						reject(new Error("Некоторые поля заполнены некорректно"));
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
							srt = this.sortObjects(storeImages, "srt").pop().srt;
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
								placeid: this.currentId,
							});
						}
						let images = this.currentImages
							? this.currentImages.concat(filesArray)
							: filesArray
						;
						this.currentImages = images;
						this.$store.commit("changePlace", {
							index: this.currentIndex,
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
			event.stopPropagation();
			if(this.$store.state.user.testaccount) {
				this.$store.commit("setMessage", "Тестовый аккаунт не позволяет удаление файлов");
			} else {
				let data = new FormData();
				for(var i = 0; i < files.length; i++) {
					data.append("file_" + i, files[i].file);
					inarray.splice(inarray.indexOf(files[i]), 1);
					this.currentImages = inarray;
				}
				data.append("userid", this.$store.state.user.id);
				axios.post("/backend/delete.php", data)
					.then(response => {
						this.$store.commit("changePlace", {
							index: this.currentIndex,
							change: {images: inarray},
						});
						this.toDB("images_delete", JSON.stringify(files));
					});
			}
		},
	},
}
</script>
