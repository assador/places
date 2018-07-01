<template>
	<div id="app" class="table" @click="showPopup({show: false}, $event);">
		<div id="top" :class="'app-row' + ' sbm-top-' + sidebarMode.top">
			<div id="top-left" :class="'app-cell' + ' sbm-top-' + sidebarMode.top + ' sbm-left-' + sidebarMode.left" class="fieldwidth_100 fontsize_n">
				<h3 class="fonsize_n">Координаты центра карты</h3>
				<input v-model="$store.state.center.latitude" placeholder="latitude" title="latitude" class="fieldwidth_100 margin_bottom_1" />
				<input v-model="$store.state.center.longitude" placeholder="longitude" title="longitude" class="fieldwidth_100" />
			</div>
			<div id="top-basic" :class="'app-cell' + ' sbm-top-' + sidebarMode.top">
				<h1>The Places</h1>
				<p>Yet another geo placemarks viewer and editor service</p>
			</div>
			<div id="top-right" :class="'app-cell' + ' sbm-top-' + sidebarMode.top + ' sbm-right-' + sidebarMode.right">
				<button class="actions-button" @click="$refs.ym.appendPlace();" title="Добавить место в центре карты">+</button>
				<button class="actions-button" @click="$store.commit('removePlace', currentIndex); setCurrentPlace(currentIndex);" title="Удалить текущее место">×</button>
				<button class="actions-button" @click="saveToFile();" title="Сохранить на диск">⭱</button>
				<button class="actions-button" @click="setPlacesToDB();" title="Сохранить в БД">⭻</button>
			</div>
		</div>
		<div class="app-row" id="basic">
			<div id="basic-left" :class="'app-cell' + ' sbm-left-' + sidebarMode.left" v-on:wheel="movePlaceButton($event);">
				<button
					:id="place.id"
					:key="place.id"
					class="place-button block_01 fieldwidth_100"
					v-for="place in sortObjects($store.state.places, 'srt')"
					@click="setCurrentPlace($store.state.places.indexOf(place));"
				>
					<h2 class="margin_bottom_1">{{ place.name }}</h2>
					<div>{{ place.latitude }}, {{ place.longitude }}</div>
				</button>
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
				<dl class="place-detailed">
					<template v-for="field in Object.keys(currentPlace)" :key="field">
						<dt>{{ $store.state.placeFields[field] }}:</dt>
						<dd v-if="field == 'srt' || field == 'id' || field == 'latitude' || field == 'longitude'">
							<input v-model="currentPlace[field]" class="fieldwidth_100" type="text" value="currentPlace[field]" />
						</dd>
						<dd v-else-if="field == 'images'" class="dd-images row_01">
							<a v-for="image in currentPlace[field]" href="javascript:void(0);" @click="showPopup({show: true, type: 'image', data: image}, $event);" class="col-6">
								<div class="block_02">
									<img
										class="border_1"
										:src="$store.state.dirs.upload.images.small + image.file"
										:alt="currentPlace.name"
										:title="currentPlace.name"
									/>
									<a
										class="dd-images__delete button"
										href="javascript:void(0);"
										@click="deleteFiles(currentPlace[field], [image], $event);"
									>
										×
									</a>
								</div>
							</a>
						</dd>
						<dd v-else>
							<textarea v-model="currentPlace[field]" class="fieldwidth_100">{{ currentPlace[field] }}</textarea>
						</dd>
					</template>
					<div class="images-add">
						<div class="images-add__div button">Добавить фотографии</div>
						<input class="images-add__input" ref="inputUploadFiles" name="files" type="file" multiple @change="uploadFiles($event);" />
					</div>
				</dl>
			</div>
		</div>
		<div id="bottom" :class="'app-row' + ' sbm-bottom-' + sidebarMode.bottom">
			<div id="bottom-left" :class="'app-cell' + ' sbm-bottom-' + sidebarMode.bottom + ' sbm-left-' + sidebarMode.left">
			</div>
			<div id="bottom-basic" :class="'app-cell' + ' sbm-bottom-' + sidebarMode.bottom">
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
import axios from 'axios'
import { mapGetters } from 'vuex'
export default {
	data() {return {
		places: this.$store.state,
		currentId: null,
		currentIndex: 0,
		currentPlace: {},
		popuped: "disappear",
		popupComponent: "popup-text",
		popupData: {},
		sidebarMode: {top: 2, right: 2, bottom: 1, left: 2},
	}},
	watch: {
		"$store.state.ready": function(ready) {
			if(ready) {
				window.addEventListener("load", function() {
					this.$refs.ym.showMap(0, 0);
					this.$store.commit("modifyPlaces", this.sortObjects(this.$store.state.places, 'srt'));
					this.setCurrentPlace(this.currentIndex);
				}.bind(this), false);
			}
		},
	},
	computed: {
		...mapGetters(['getPlace', 'getIndexById']),
		setCurrentPlace: i => function(i) {
			if(document.getElementById(this.currentId)) {
				document.getElementById(this.currentId).classList.remove("active");
			}
			if(!this.$store.state.places[i]) {
				i--;
				if(!this.$store.state.places[i]) {
					return;
				}
			}
			this.currentId = this.$store.state.places[i].id;
			this.currentIndex = i;
			this.currentPlace = this.getPlace(this.currentIndex);
			this.$store.commit("changeCenter", {
				latitude: this.currentPlace.latitude,
				longitude: this.currentPlace.longitude,
			});
			this.$refs.ym.mrk.placeIndex = this.currentIndex;
			document.getElementById(this.currentId).classList.add("active");
		},
		sortObjects: (array, field) => function(array, field) {
			let sorted = array.slice().sort(function(a, b) {
				return a[field] - b[field];
			});
			if(this.currentId == null) {
				this.currentIndex = 0;
			} else {
				this.currentIndex = this.getIndexById(this.currentId);
			}
			return sorted;
		},
		movePlaceButton: (event) => function(event) {
			let active = document.getElementById("basic-left").querySelector(".active");
			if(event.deltaY > 0 && active.nextElementSibling) {
				this.$store.commit("swapPlacesValues", {
					indexes: [this.currentIndex, this.currentIndex + 1],
					values: ["srt"],
				});
				this.currentIndex++;
			}
			if(event.deltaY < 0 && active.previousElementSibling) {
				this.$store.commit("swapPlacesValues", {
					indexes: [this.currentIndex, this.currentIndex - 1],
					values: ["srt"],
				});
				this.currentIndex--;
			}
			this.$refs.ym.mrk.placeIndex = this.currentIndex;
			this.$store.commit("modifyPlaces", this.sortObjects(this.$store.state.places, 'srt'));
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
		},
		showPopup: (opts, event) => function(opts, event) {
			event.stopPropagation();
			switch(opts.type) {
				case "image" :
					this.popupComponent = "popup-image";
					this.popupData = opts.data;
					break;
				default :
					this.popupComponent = "popup-text";
					this.popupData = "";
			}
			this.popuped = opts["show"] ? "appear" : "disappear";
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
		setPlacesToDB: () => function() {
			let placesRequest = new XMLHttpRequest();
			placesRequest.open("POST", "/backend/set_places.php", true);
			placesRequest.onreadystatechange = function(event) {
				if(placesRequest.readyState == 4) {
					if(placesRequest.status == 200) {
						alert("Ваши изменения сохранены в базе данных.");
					} else {
						alert("Не могу внести данные в БД.");
					}
				}
			};
			placesRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			placesRequest.send("places=" + JSON.stringify(this.$store.state.places));
		},
		uploadFiles: (event) => function(event) {
			event.preventDefault();
			let data = new FormData(), files = this.$refs.inputUploadFiles.files;
			for(var i = 0; i < files.length; i++) {
				data.append("file_" + i , files[i]);
			}
			axios.post("/backend/upload.php", data)
				.then((response) => {
					let i = 0, filesArray = [...files].map(function(file) {
						return {
							id: i,
							file: file.name,
							size: file.size,
							type: file.type,
							lastmodified: file.lastModified,
							places_id: this.currentId,
						};
					}.bind(this));
					this.$store.commit("changePlace", {
						index: this.currentIndex,
						change: {images: this.$store.state.places[this.currentIndex].images
							? this.$store.state.places[this.currentIndex].images.concat(filesArray)
							: filesArray
						},
					});
				});
		},
		deleteFiles: (inarray, files, event) => function(inarray, files, event) {
			event.stopPropagation();
			let data = new FormData();
			for(var i = 0; i < files.length; i++) {
				data.append("file_" + i , files[i].file);
				inarray.splice(inarray.indexOf(files[i]), 1);
			}
			axios.post("/backend/delete.php", data)
				.then((response) => {
					this.$store.commit("changePlace", {
						index: this.currentIndex,
						change: {images: inarray},
					});
				});
		},
	},
}
</script>
