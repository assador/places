<template>
	<div class="table" @click="showPopup({show: false}, $event);">
		<div id="top" :class="'app-row' + ' sbm-top-' + sidebarMode.top">
			<div id="top-left" :class="'app-cell' + ' sbm-top-' + sidebarMode.top + ' sbm-left-' + sidebarMode.left" class="fieldwidth_100 fontsize_n">
				<h3 class="margin_bottom_1">Поиск по названию мест:</h3>
				<input title="Поиск по названию мест" class="fieldwidth_100 margin_bottom_1" @keyup="selectPlaces" />
			</div>
			<div id="top-basic" :class="'app-cell' + ' sbm-top-' + sidebarMode.top">
				<div class="brand">
					<h1>Места</h1>
					<p>Сервис просмотра и редактирования библиотек геометок</p>
				</div>
				<div class="message">
					<span v-html="getMessage"></span>
				</div>
			</div>
			<div id="top-right" :class="'app-cell' + ' sbm-top-' + sidebarMode.top + ' sbm-right-' + sidebarMode.right">
				<button class="actions-button" @click="$refs.ym.appendPlace();" title="Добавить место в центре карты">+</button>
				<button class="actions-button" @click="deletePlace(currentIndex);" title="Удалить текущее место">×</button>
				<button class="actions-button" @click="saveToFile();" title="Сохранить на диск">⭱</button>
				<button class="actions-button" @click="toDB();" title="Сохранить в БД">⭻</button>
				<button class="actions-button" @click="showAbout();" title="О «Местах», справка">?</button>
				<button class="actions-button" @click="exit();" title="Выйтм">↪</button>
			</div>
		</div>
		<div class="app-row" id="basic">
			<div id="basic-left" :class="'app-cell' + ' sbm-left-' + sidebarMode.left">
				<div id="basic-left__places" class="scrollable">
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
						<h2 class="margin_bottom_0">{{ place.name }}</h2>
<!--						<div>{{ place.latitude }}, {{ place.longitude }}</div>-->
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
								<input v-model.number.trim="currentPlace[field]" :id="'detailed-' + field" @click="validatable();" class="fieldwidth_100" type="text" value="currentPlace[field]" />
							</dd>
							<dd v-else-if="field != 'show' && field != 'id' && field != 'userid' && field != 'added' && field != 'deleted' && field != 'updated' && field == 'images'" id="place-images" class="dd-images row_01">
								<div
									v-for="image in sortObjects(currentImages, 'srt')"
									:id="image.id"
									:key="image.id"
									:class="'col-' + gridMode + ' draggable'"
									draggable="true"
									@click="showPopup({show: true, type: 'image', data: image}, $event);"
									@dragstart="handleDragStart"
									@dragenter="handleDragEnter"
								>
									<div
										class="block_02"
									>
										<img
											class="border_1"
											:src="$store.state.dirs.upload.images.small + image.file"
											:alt="currentPlace.name"
											:title="currentPlace.name"
										/>
										<div
											class="dd-images__delete button"
											draggable="false"
											@click="deleteFiles(Array.from(currentImages), [image], $event);"
										>
											×
										</div>
									</div>
								</div>
							</dd>
							<dd v-else-if="field != 'show' && field != 'id' && field != 'userid' && field != 'added' && field != 'deleted' && field != 'updated'">
								<textarea v-model.trim="currentPlace[field]" :id="'detailed-' + field" class="fieldwidth_100">{{ currentPlace[field] }}</textarea>
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
			</div>
			<div id="bottom-basic" :class="'app-cell' + ' sbm-bottom-' + sidebarMode.bottom">
				<span class="imp">Координаты центра карты</span>
				<span style="margin-left: 1em;">Широта:</span>
				<input v-model.number.trim="$store.state.center.latitude" placeholder="latitude" title="latitude" />
				<span style="margin-left: 1em;">Долгота:</span>
				<input v-model.number.trim="$store.state.center.longitude" placeholder="longitude" title="longitude" />
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
		bus.$once("placesFilled", () => {
			if(this.$refs.ym) {this.$refs.ym.showMap(55.7512848, 37.6190706);}
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
			window.setTimeout(function() {
				this.$store.commit("setMessage", "Не забывайте сохранять изменения в базу данных");
			}.bind(this), 5000);
		});
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
				switch(this.draggingElement.parentNode.id) {
					case "basic-left__places" :
						parent = this.$store.state.places;
						break;
					case "place-images" :
						parent = this.currentImages;
						break;
					default :
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
					if(!this.$store.state.places[i].name.includes(event.target.value)) {
						this.$store.commit("hide", i);
					} else {
						this.$store.commit("show", i);
					}
				}
			}
		},
	},
	computed: {
		...mapGetters(["getPlace", "getImages", "getMessage", "getImagesCount", "getIndexById"]),
		exit: () => function() {
			this.$store.commit("unload");
			bus.$emit("loggedChange", "auth");
		},
		setCurrentPlace: index => function(index) {
			if(document.getElementById(this.currentId)) {
				document.getElementById(this.currentId).classList.remove("active");
			}
			if(!this.$store.state.places[index]) {
				index--;
				if(!this.$store.state.places[index]) {
					return;
				}
			}
			this.currentId = this.$store.state.places[index].id;
			this.currentIndex = index;
			this.currentPlace = this.getPlace(this.currentIndex);
			this.currentImages = this.getImages(this.currentIndex);
			this.$store.commit("changeCenter", {
				latitude: this.currentPlace.latitude,
				longitude: this.currentPlace.longitude,
			});
			if(this.$refs.ym) {this.$refs.ym.mrk.placeIndex = this.currentIndex;}
		},
		deletePlace: index => function(index) {
			this.$store.commit("removePlace", index);// setCurrentPlace(currentIndex);
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
		saveToFile: () => function() {
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
					placesRequest.send("id=" + localStorage.getItem("user-id") + "&todo=" + todo + (data != "undefined" ? ("&data=" + data) : ""));
				} else {
					this.$store.commit("setMessage", "Некоторые поля заполнены некорректно");
					reject(new Error("Некоторые поля заполнены некорректно"));
				}
			});
		},
		uploadFiles: (event) => function(event) {
			event.preventDefault();
			let data = new FormData(), files = this.$refs.inputUploadFiles.files;
			for(var i = 0; i < files.length; i++) {
				data.append("file_" + i, files[i]);
			}
			axios.post("/backend/upload.php", data)
				.then(response => {
					let id = this.getImagesCount, srt;
					if(Object.keys(this.currentImages).length > 0) {
						let storeImages = this.currentImages;
						srt = this.sortObjects(storeImages, "srt").pop().srt;
					} else {
						srt = 0;
					}
					let filesArray = [...files].map(function(file) {
						return {
							id: ++id,
							file: file.name,
							size: file.size,
							type: file.type,
							lastmodified: file.lastModified,
							srt: ++srt,
							placeid: this.currentId,
						};
					}.bind(this));
					let images = this.currentImages
						? this.currentImages.concat(filesArray)
						: filesArray
					;
					this.currentImages = images;
					this.$store.commit("updateImagesCount", id);
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
