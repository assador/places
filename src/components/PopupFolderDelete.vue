<template>
	<div>
		<div class="popup-content centered">
			<div class="brand">
				<h1 class="margin_bottom_0">Удаление папки</h1>
				<p class="margin_bottom_0">«{{ data.folder.name }}»</p>
			</div>
			<p class="margin_bottom_0">Укажите, что делать с содержимым удаляемой папки:</p>
			<form
				class="folder-delete__form margin_bottom_0"
				@click="$event.stopPropagation(); $store.commit('setIdleTime', 0);"
				@submit.prevent="deleteFolder"
			>
				<fieldset class="margin_bottom">
					<label>
						<input name="content" type="radio" v-model="keepContent" value="keep" />
						<span>Оставить содержимое в корне</span>
					</label>
					<label>
						<input name="content" type="radio" v-model="keepContent" value="delete" />
						<span>Удалить содержимое (без возможности отмены)</span>
					</label>
				</fieldset>
				<div style="text-align: center;">
					<fieldset>
						<button type="submit">Удалить папку</button>
						<button type="button" @click="$root.showPopup({show: false}, $event);">Отмена</button>
					</fieldset>
				</div>
			</form>
			<a href="javascript:void(0);" class="close" @click="$root.showPopup({show: false}, $event);">×</a>
		</div>
	</div>
</template>

<script>
import {bus} from "../shared/bus.js"
export default {
	props: ["data"],
	data: function() {return {
		keepContent: "keep",
	}},
	computed: {
		deleteFolder: (event) => function(event) {
			this.$store.commit("changeFolder", {
				folder: this.data.folder,
				change: {deleted: true},
				backup: false,
			});
			if(this.keepContent === "delete") {
				this.markNestedAsDeleted(this.data.folder);
			}
			if(this.keepContent === "keep") {
				// Delete places in the currently deleted folder
				this.$store.state.places.forEach((place) => {
					if(place.folderid === this.data.folder.id) {
						this.$store.commit("changePlace", {
							place: place,
							change: {folderid: "root", updated: true},
							backup: false,
						});
					}
				});
				if(Array.isArray(this.data.folder.children)) {
					while(this.data.folder.children.length > 0) {
						this.$store.dispatch("moveFolder", {
							folder: this.data.folder.children[0],
							targetId: "root",
							backup: false,
						});
					}
				}
			}
			if(!this.$store.state.inUndoRedo) {
				bus.$emit("toDB", {what: "places"});
				bus.$emit("toDB", {what: "folders"});
			} else {
				bus.$emit("toDBCompletely");
				this.$store.commit("outUndoRedo");
			}
			this.$store.state.places.forEach((place) => {
				if(place.updated) {
					this.$store.commit("changePlace", {
						place: place,
						change: {updated: false},
						backup: false,
					});
				}
			});
			this.$store.state.folders.forEach((folder) => {
				if(folder.updated) {
					this.$store.commit("changeFolder", {
						folder: folder,
						change: {updated: false},
						backup: false,
					});
				}
			});
			this.$store.state.places.forEach((place) => {
				if(place.deleted) {
					this.$root.deleteFiles(place.images);
				}
			});
			this.$store.commit("deletePlacesMarkedAsDeleted");
			this.$store.commit("deleteFoldersMarkedAsDeleted");
			if(this.$store.state.places.length > 0) {
				if(this.$store.state.homePlace) {
					this.$parent.setCurrentPlace(this.$store.state.homePlace);
				} else {
					let firstPlaceInRoot = this.$store.state.places.find(p => p.folderid === null);
					if(!firstPlaceInRoot) {
						this.$parent.setCurrentPlace(this.$store.state.places[0]);
					} else {
						this.$parent.setCurrentPlace(firstPlaceInRoot);
					}
				}
			}
			if(this.keepContent !== "delete") {
				this.$store.commit("backupState");
			}
			bus.$emit("homeRefresh");
			this.$root.showPopup({show: false}, event);
		},
		markNestedAsDeleted: (folder) => function(folder) {
			// Delete places in the currently deleted folder
			this.$store.state.places.forEach((place) => {
				if(place.folderid === folder.id) {
					this.$store.commit("changePlace", {
						place: place,
						change: {deleted: true},
						backup: false,
					});
				}
			});
			if(Array.isArray(folder.children)) {
				for(let i = 0; i < folder.children.length; i++) {
					this.$store.commit("changeFolder", {
						folder: folder.children[i],
						change: {deleted: true},
						backup: false,
					});
					this.markNestedAsDeleted(folder.children[i]);
				}
			}
		},
	},
}
</script>
