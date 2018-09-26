<template>
	<div class="table" @click="showPopup({show: false}, $event);">
		<div id="top" :class="'app-row' + ' sbm-top-' + sidebarMode.top">
			<div id="top-left" :class="'app-cell' + ' sbm-top-' + sidebarMode.top + ' sbm-left-' + sidebarMode.left" class="fieldwidth_100 fontsize_n">
				<input placeholder="Поиск по названию мест" title="Поиск по названию мест" class="fieldwidth_100" style="margin-top: 8px;" @keyup="selectPlaces" />
			</div>
			<div id="top-basic" :class="'app-cell' + ' sbm-top-' + sidebarMode.top">
				<div class="brand">
					<h1 class="basiccolor margin_bottom_0">Места — <a href="javascript:void(0);" @click="account();" v-html="getLogin"></span></h1>
					<p>Сервис просмотра и редактирования библиотек геометок</p>
				</div>
				<div class="message">
					<span v-html="getMessage"></span>
				</div>
			</div>
			<div id="top-right" :class="'app-cell' + ' sbm-top-' + sidebarMode.top + ' sbm-right-' + sidebarMode.right">
				<button id="actions-append" class="actions-button" @click="$refs.ym.appendPlace();" title="Добавить место в центре карты">+</button>
				<button id="actions-delete" class="actions-button" @click="deletePlace(currentIndex);" title="Удалить текущее место">×</button>
				<input id="inputImportFromFile" ref="inputImportFromFile" name="jsonFile" type="file" @change="importFromFile($event);" />
				<button id="actions-import" class="actions-button" onclick="document.getElementById('inputImportFromFile').click();" title="Импортировать геометки из JSON-файла">↲</button>
				<button id="actions-export" class="actions-button" @click="exportToFile();" title="Экспортировать свои геометки в JSON-файл">↱</button>
				<button id="actions-save" class="actions-button" @click="toDB();" title="Сохранить в БД">↯</button>
				<button id="actions-about" class="actions-button" @click="showAbout();" title="О «Местах», справка">?</button>
				<button id="actions-refresh" class="actions-button" onclick="document.location.reload(true);" title="Вернуться к версии в БД">↺</button>
				<button id="actions-exit" class="actions-button" @click="exit();" title="Выйти">↪</button>
			</div>
		</div>
		<div class="app-row" id="basic">
			<div id="basic-left" :class="'app-cell' + ' sbm-left-' + sidebarMode.left">
				<div id="basic-left__places" class="scrollable">
					<div v-if="$store.state.places.length > 0">
						<h2 class="basiccolor" @click="debug();">Мои места</h2>
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
				<div class="sbas-top">
					<a href="javascript:void(0);" class="sba-u" @click="changeSidebarMode('top', 'smaller');"></a>
					<a href="javascript:void(0);" class="sba-d" @click="changeSidebarMode('top', 'bigger');"></a>
				</div>
				<div :class="'sbas-right' + (!sidebarMode.right ? ' sbas-0' : '')">
					<a href="javascript:void(0);" class="sba-l" @click="changeSidebarMode('right', 'bigger');"></a>
					<a href="javascript:void(0);" class="sba-r" @click="changeSidebarMode('right', 'smaller');"></a>
				</div>
				<div :class="'sbas-bottom' + (!sidebarMode.bottom ? ' sbas-0' : '')">
					<a href="javascript:void(0);" class="sba-u" @click="changeSidebarMode('bottom', 'bigger');"></a>
					<a href="javascript:void(0);" class="sba-d" @click="changeSidebarMode('bottom', 'smaller');"></a>
				</div>
				<div class="sbas-left">
					<a href="javascript:void(0);" class="sba-l" @click="changeSidebarMode('left', 'smaller');"></a>
					<a href="javascript:void(0);" class="sba-r" @click="changeSidebarMode('left', 'bigger');"></a>
				</div>
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
			</div>
			<div id="basic-right" :class="'app-cell' + ' sbm-right-' + sidebarMode.right">
				<div class="scrollable">
					<dl class="place-detailed margin_bottom_0">
						<template v-for="field in Object.keys(currentPlace)" :key="field">
							<dt v-if="field != 'show' && field != 'id' && field != 'userid' && field != 'added' && field != 'deleted' && field != 'updated'">{{ $store.state.placeFields[field] }}:</dt>
							<dd v-if="field != 'show' && field != 'id' && field != 'userid' && field != 'added' && field != 'deleted' && field != 'updated' && (field == 'srt' || field == 'latitude' || field == 'longitude')">
								<input :disabled="currentPlaceCommon" @focus="updateCurrentTrue();" v-model.number.trim="currentPlace[field]" :id="'detailed-' + field" @click="validatable();" class="fieldwidth_100" type="text" value="currentPlace[field]" />
							</dd>
							<dd v-else-if="field != 'show' && field != 'id' && field != 'userid' && field != 'added' && field != 'deleted' && field != 'updated' && field == 'common'">
								<label>
									<input :disabled="currentPlaceCommon" @focus="updateCurrentTrue();" v-model="currentPlace[field]" :id="'detailed-' + field" type="checkbox" />
									Место видимо другим
								</label>
							</dd>
							<dd v-else-if="field != 'show' && field != 'id' && field != 'userid' && field != 'added' && field != 'deleted' && field != 'updated' && field == 'images'" id="place-images">
								<div class="dd-images row_01">
									<div
										v-for="image in sortObjects(currentImages, 'srt')"
										:id="image.id"
										:key="image.id"
										:class="'col-' + gridMode + (currentPlaceCommon ? '' : ' draggable')"
										:draggable="currentPlaceCommon ? false : true"
										@click="showPopup({show: true, type: 'image', data: image}, $event);"
										@dragstart="currentPlaceCommon ? {} : handleDragStart"
										@dragenter="currentPlaceCommon ? {} : handleDragEnter"
									>
										<div
											class="block_02"
										>
											<img
												class="border_1"
												draggable="false"
												:src="$store.state.dirs.upload.images.small + image.file"
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
							<dd v-else-if="field != 'show' && field != 'id' && field != 'userid' && field != 'added' && field != 'deleted' && field != 'updated'">
								<textarea :disabled="currentPlaceCommon" @focus="updateCurrentTrue();" v-model.trim="currentPlace[field]" :id="'detailed-' + field" class="fieldwidth_100">{{ currentPlace[field] }}</textarea>
							</dd>
						</template>
						<div class="images-add">
							<div class="images-add__div button">Добавить фотографии</div>
							<input class="images-add__input" ref="inputUploadFiles" name="files" type="file" multiple @change="uploadFiles($event);" />
						</div>
					</dl>
				</div>
			</div>
		</div>
		<div id="bottom" :class="'app-row' + ' sbm-bottom-' + sidebarMode.bottom">
			<div id="bottom-left" :class="'app-cell' + ' sbm-bottom-' + sidebarMode.bottom + ' sbm-left-' + sidebarMode.left">
				<button id="placemarksShowHideButton" class="actions-button button-pressed" @click="$refs.ym.placemarksShowHide();" title="Показать / скрыть все свои геометки">◉</button>
				<button id="commonPlacesShowHideButton" class="actions-button" @click="commonPlacesShowHide();" title="Показать / скрыть все другие места и их геометки">◪</button>
				<button id="commonPlacemarksShowHideButton" class="actions-button" @click="$refs.ym.commonPlacemarksShowHide();" title="Показать / скрыть все другие геометки">◎</button>
				<button id="centerPlacemarkShowHideButton" class="actions-button" @click="$refs.ym.centerPlacemarkShowHide();" title="Показать / скрыть метку центра карты">◈</button>
			</div>
			<div id="bottom-basic" :class="'app-cell' + ' sbm-bottom-' + sidebarMode.bottom">
				<span class="imp">Координаты центра карты</span>
				<span class="nobr" style="margin-left: 1em;">Широта: <input v-model.number.trim="$store.state.center.latitude" placeholder="latitude" title="latitude" /></span>
				<span class="nobr" style="margin-left: 1em;">Долгота: <input v-model.number.trim="$store.state.center.longitude" placeholder="longitude" title="longitude" /></span>
			</div>
			<div id="bottom-right" :class="'app-cell' + ' sbm-bottom-' + sidebarMode.bottom + ' sbm-right-' + sidebarMode.right">
			</div>
		</div>
		<div :class="'popup ' + popuped">
			<component
				:is="popupComponent"
				:data="popupData"
				:currentPlace="currentPlace"
			>
			</component>
		</div>
	</div>
</template>

<script>
import {bus} from "../shared/bus.js"
import mapyandex from "./MapYandex.vue"
import popupimage from "./PopupImage.vue"
import popuptext from "./PopupText.vue"
import axios from "axios"
import {mapGetters} from "vuex"
export default {
	data() {return {
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
		sidebarMode: {top: 1, right: 2, bottom: 1, left: 2},
		gridMode: 6,
		crossSidebarGrid: [12, 6, 4],
	}},
	components: {
		mapyandex,
		popupimage,
		popuptext,
	},
	mounted: function() {
		bus.$on("placesFilled", () => {
			if(this.$refs.ym && this.$refs.ym.map) {
				this.$refs.ym.map.destroy();
			}
			if(this.$refs.ym) {
				this.$refs.ym.showMap(55.7512848, 37.6190706);
			}
			if(this.$store.state.already) {
				window.addEventListener("load", function() {
					this.setCurrentPlace(this.currentIndex);
					document.addEventListener("dragover", this.handleDragOver, false);
					document.addEventListener("drop", this.handleDrop, false);
				}.bind(this), false);
			} else {
				this.setCurrentPlace(this.currentIndex);
			}
			this.$store.commit("modifyPlaces", this.sortObjects(this.$store.state.places, "srt"));
			this.$store.commit("modifyCommonPlaces", this.sortObjects(this.$store.state.commonPlaces, "srt"));
		});
		setTimeout(function() {
			this.$store.commit("setMessage", "Не забывайте сохранять изменения в базу данных");
		}.bind(this), 5000);
	},
	methods: {
		validatable: function() {
			if(!this.firstValidatable) {
				make_fields_validatable();
				this.firstValidatable = true;
			}
		},
		handleDragStart: function(event) {
			event.dataTransfer.setData("text/plain", null);
			this.draggingElement = event.target;
		},
		handleDragEnter: function(event) {
			event.preventDefault();
			if(event.target.draggable) {
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
	watch: {
		currentPlace: {
			handler(value) {
				if(this.updateCurrent) {
					this.$store.commit("changePlace", {
						index: this.currentIndex,
						change: {updated: true},
					});
					this.updateCurrent = false;
				}
			},
			deep: true,
		},
	},
	computed: {
		...mapGetters(["getPlace", "getImages", "getLogin", "getMessage", "getImagesCount", "getIndexById"]),
		updateCurrentTrue: () => function() {
			this.updateCurrent = true;
		},
		debug: () => function() {
			console.dir(this.$store.state.places);
			console.dir(this.$store.state.commonPlaces);
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
			this.currentId = !common
				? this.$store.state.places[index].id
				: this.$store.state.commonPlaces[index].id
			;
			this.currentIndex = index;
			this.currentPlace = this.getPlace(this.currentIndex, common);
			this.currentImages = this.getImages(this.currentIndex, common);
			this.$store.commit("changeCenter", {
				latitude: this.currentPlace.latitude,
				longitude: this.currentPlace.longitude,
			});
			if(this.$refs.ym) {this.$refs.ym.mrk.placeIndex = this.currentIndex;}
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
		changeSidebarMode: (sidebar, mode, ceiling) => function(sidebar, mode, ceiling) {
			let modeCurrent = this.sidebarMode[sidebar];
			let modeToSet = null;
			ceiling = ceiling ? ceiling : 3;
			if(mode === "bigger") {
				if(modeCurrent < ceiling) {
					modeToSet = modeCurrent + 1;
				} else {
					modeToSet = ceiling;
				}
			} else if(mode === "smaller") {
				if(modeCurrent > 0) {
					modeToSet = modeCurrent - 1;
				} else {
					modeToSet = 0;
				}
			}
			if(modeToSet === null) {modeToSet = mode;}
			this.sidebarMode[sidebar] = modeToSet;
			this.gridMode = this.crossSidebarGrid[this.sidebarMode.right - 1];
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
		importFromFile: (event) => function(event) {
			event.preventDefault();
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
		},
		uploadFiles: (event) => function(event) {
			event.preventDefault();
			let data = new FormData(), files = this.$refs.inputUploadFiles.files, rndname, ext;
			for(var i = 0; i < files.length; i++) {
				files[i].rndname = generateRandomString(32);
				ext = files[i].name.match(/\.([^.]+)$/);
				files[i].ext = ext == null ? "" : ext[1];
				data.append(files[i].rndname + "_" + files[i].ext, files[i]);
			}
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
		},
		deleteFiles: (inarray, files, event) => function(inarray, files, event) {
			event.stopPropagation();
			let data = new FormData();
			for(var i = 0; i < files.length; i++) {
				data.append("file_" + i, files[i].file);
				inarray.splice(inarray.indexOf(files[i]), 1);
				this.currentImages = inarray;
			}
			axios.post("/backend/delete.php", data)
				.then(response => {
					this.$store.commit("changePlace", {
						index: this.currentIndex,
						change: {images: inarray},
					});
					this.toDB("images_delete", JSON.stringify(files));
				});
		},
	},
}
</script>
