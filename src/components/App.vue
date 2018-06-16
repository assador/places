<template>
	<div id="app" class="table">
		<div id="top" :class="'app-row' + ' sbm-top-' + sidebarMode.top">
			<div id="top-left" :class="'app-cell' + ' sbm-top-' + sidebarMode.top + ' sbm-left-' + sidebarMode.left">
				<input v-model="$store.state.center.latitude" placeholder="latitude" title="latitude" class="fieldwidth_100 fontsize_n margin_bottom_1" />
				<input v-model="$store.state.center.longitude" placeholder="longitude" title="longitude" class="fieldwidth_100 fontsize_n" />
			</div>
			<div id="top-basic" :class="'app-cell' + ' sbm-top-' + sidebarMode.top">
				<h1>Geo Store</h1>
			</div>
			<div id="top-right" :class="'app-cell' + ' sbm-top-' + sidebarMode.top + ' sbm-right-' + sidebarMode.right">
				<button class="actions-button" @click="$refs.ym.appendPlace();" title="Добавить место в центре карты">+</button>
				<button class="actions-button" @click="$store.commit('removePlace', currentIndex); setCurrentPlace(currentIndex);" title="Удалить текущее место">×</button>
				<button class="actions-button" @click="saveToFile();" title="Сохранить на диск">⭳</button>
			</div>
		</div>
		<div class="app-row" id="basic">
			<div id="basic-left" :class="'app-cell' + ' sbm-left-' + sidebarMode.left">
				<button :id="place.id" :key="place.id" class="place-button block_01 fieldwidth_100" v-for="place in $store.state.places" @click="setCurrentPlace($store.state.places.indexOf(place));">
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
				<yandexmap
					ref="ym"
					:id="currentPlace.id"
					:name="currentPlace.name"
					:description="currentPlace.description"
					:image="currentPlace.image"
					:latitude="currentPlace.latitude"
					:longitude="currentPlace.longitude"
					:centerLatitude="$store.state.center.latitude"
					:centerLongitude="$store.state.center.longitude"
				>
				</yandexmap>
			</div>
			<div id="basic-right" :class="'app-cell' + ' sbm-right-' + sidebarMode.right">
				<dl class="place-detailed">
					<template v-for="field in Object.keys(currentPlace)" :key="field">
						<dt>{{ field }}:</dt>
						<dd v-if="field == 'image'" style="margin: 7px 0 0 0; padding: 0;">
							<img
								class="border_1"
								:src="currentPlace[field]"
								:alt="currentPlace.name"
								:title="currentPlace.name"
							/>
						</dd>
						<dd v-else>
							<textarea v-model="currentPlace[field]">{{ currentPlace[field] }}</textarea>
						</dd>
					</template>
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
	</div>
</template>

<script>
import { mapGetters } from 'vuex'
export default {
	data() {return {
		places: this.$store.state,
		currentId: null,
		currentIndex: 0,
		currentPlace: {},
		sidebarMode: {top: 2, right: 2, bottom: 1, left: 2},
	}},
	watch: {
		"$store.state.ready": function(ready) {
			if(ready) {
				window.addEventListener("load", function() {
					this.$refs.ym.showMap(0, 0);
					this.setCurrentPlace(this.currentIndex);
					this.$refs.ym.fitMap();
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
			if(this.$refs.ym.map != null) {
				this.$refs.ym.fitMap();
			}
		},
		showPopup: (show, event) => function(show, event) {
			event.stopPropagation();
			let popup = document.getElementById("detailed");
			popup.classList.remove(show ? "disappear" : "appear");
			popup.classList.add(show ? "appear" : "disappear");
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
	},
}
</script>
