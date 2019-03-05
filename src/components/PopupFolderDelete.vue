<template>
	<div>
		<div class="folder-new centered">
			<div class="brand">
				<h1 class="margin_bottom_0">Удаление папки</h1>
				<p>Укажите, что делать с содержимым удаляемой папки</p>
			</div>
			<form class="folder-delete__form" @submit.prevent="deleteFolder">
				<fieldset class="margin_bottom">
					<label>
						<input name="content" type="radio" v-model="keepContent" value="keep" />
						<span>Оставить содержимое в корне</span>
					</label>
					<label>
						<input name="content" type="radio" v-model="keepContent" value="delete" />
						<span>Удалить содержимое</span>
					</label>
				</fieldset>
				<div style="text-align: center;">
					<fieldset>
						<button type="submit">Удалить папку</button>
						<button type="button" @click="$parent.showPopup({show: false}, $event);">Отмена</button>
					</fieldset>
				</div>
			</form>
			<a href="javascript:void(0);" class="close" @click="$parent.showPopup({show: false}, $event);">×</a>
		</div>
	</div>
</template>

<script>
export default {
	props: ["data"],
	data: function() {return {
		keepContent: "keep",
		toSetCurrentPlace: false,
	}},
	computed: {
		deleteFolder: (event) => function(event) {
			this.toSetCurrentPlace = false;
			this.$store.commit("changeFolder", {
				folder: this.data,
				change: {deleted: true},
			});
			if(this.keepContent === "delete") {
				this.deleteNestedFolders(this.data.id);
				this.$store.state.folders.forEach(function(folder) {
					if(folder.parent === null) {
						document.getElementById("folders-list-root").appendChild(document.getElementById("places-menu-folder-" + folder.id));
					}
				}.bind(this));
			}
			if(this.keepContent === "keep") {
				this.$store.state.places.forEach(function(place) {
					if(place.folderid === this.data.id) {
						this.$store.commit("changePlace", {
							place: place,
							change: {folderid: null, updated: true},
						});
					}
				}.bind(this));
				this.$store.state.folders.forEach(function(folder) {
					if(folder.parent === this.data.id) {
						this.$store.commit("changeFolder", {
							folder: folder,
							change: {parent: null, updated: true},
						});
						document.getElementById("folders-list-root").appendChild(document.getElementById("places-menu-folder-" + folder.id));
					}
				}.bind(this));
			}
			this.$parent.toDB();
			this.$parent.toDB("folders", JSON.stringify(this.$store.state.folders));
			this.$store.commit("deletePlacesMarkedAsDeleted");
			this.$store.commit("deleteFoldersMarkedAsDeleted");
			if(this.toSetCurrentPlace) {
				let firstPlaceInRoot = this.$store.state.places.find(p => p.folderid === null);
				if(typeof(firstPlaceInRoot) === "undefined") {
					this.$parent.setCurrentPlace(this.$store.state.places[0]);
				} else {
					this.$parent.setCurrentPlace(firstPlaceInRoot);
				}
			}
			this.$parent.showPopup({show: false}, event);
		},
		deleteNestedPlaces: (folderId) => function(folderId) {
			this.$store.state.places.forEach(function(place) {
				if(place.folderid === folderId) {
					this.$store.commit("changePlace", {
						place: place,
						change: {deleted: true},
					});
					if(place.id === this.$parent.currentPlace.id) {
						this.toSetCurrentPlace = true;
					}
				}
			}.bind(this));
		},
		deleteNestedFolders: (folderId) => function(folderId) {
			this.deleteNestedPlaces(folderId);
			this.$store.state.folders.forEach(function(folder) {
				if(folder.parent === folderId) {
					this.$store.commit("changeFolder", {
						folder: folder,
						change: {deleted: true, parent: null},
					});
					document.getElementById("folders-list-root").appendChild(document.getElementById("places-menu-folder-" + folder.id));
					this.deleteNestedFolders(folder.id);
				}
			}.bind(this));
		},
	},
}
</script>
