<template>
	<div>
		<div class="popup-content centered">
			<div class="brand">
				<h1 class="margin_bottom_0">
					Удаление папки
				</h1>
				<p class="margin_bottom_0">
					«{{ data.folder.name }}»
				</p>
			</div>
			<p class="margin_bottom_0">
				Укажите, что делать с содержимым удаляемой папки:
			</p>
			<form
				class="folder-delete__form margin_bottom_0"
				@click="$event.stopPropagation(); $store.commit('setIdleTime', 0);"
				@submit.prevent="deleteFolder($event)"
			>
				<fieldset class="margin_bottom">
					<label>
						<input
							v-model="keepContent"
							name="content"
							type="radio"
							value="keep"
						>
						<span>Оставить содержимое в корне</span>
					</label>
					<label>
						<input
							v-model="keepContent"
							name="content"
							type="radio"
							value="delete"
						>
						<span>Удалить содержимое (без возможности отмены)</span>
					</label>
				</fieldset>
				<div style="text-align: center;">
					<fieldset>
						<button type="submit">
							Удалить папку
						</button>
						&#160;
						<button
							type="button"
							@click="$root.showPopup({show: false}, $event);"
						>
							Отмена
						</button>
					</fieldset>
				</div>
			</form>
			<a
				href="javascript:void(0);"
				class="close"
				@click="$root.showPopup({show: false}, $event);"
			>
				×
			</a>
		</div>
	</div>
</template>

<script>
import { bus } from '../shared/bus'
import { constants } from '../shared/constants'
import { mapState } from 'vuex'
export default {
	props: ['data'],
	data() {
		return {
			keepContent: 'keep',
		}
	},
	computed: {
		...mapState(['currentPlace', 'currentPlaceIndex']),
	},
	mounted() {
		document.addEventListener('keyup', this.keyup, false);
	},
	beforeDestroy() {
		document.removeEventListener('keyup', this.keyup, false);
	},
	methods: {
		deleteFolder(event) {
			if (this.keepContent !== 'delete') {
				this.$store.commit('backupState');
			}
			if (this.keepContent === 'delete') {
				this.markNestedAsDeleted(this.data.folder);
				this.$store.state.places.forEach(place => {
					if (place.deleted) {
						this.$root.deleteImages(place.images, true);
						if (this.$store.state.homePlace === place) {
							this.$store.commit('setHomePlace', null);
						}
					}
				});
				if (
					this.currentPlace &&
					this.currentPlace.deleted
				) {
					if (this.$store.state.places.length > 0) {
						let firstRootPlace;
						if (this.$store.state.homePlace) {
							bus.$emit(
								'setCurrentPlace',
								{place: this.$store.state.homePlace}
							);
						} else if (
							!!(firstRootPlace = this.$store.state.places.find(
								p => p.folderid === 'root'
							))
						) {
							bus.$emit(
								'setCurrentPlace',
								{place: firstRootPlace}
							);
						} else {
							let firstPlaceInState;
							bus.$emit(
								'setCurrentPlace',
								{place:
									!(firstPlaceInState =
										this.$store.state.places.find(
											p => !p.deleted
										)
									) ? null : firstPlaceInState
								}
							);
						}
					} else {
						bus.$emit('setCurrentPlace', {place: null});
					}
				}
			}
			if (this.keepContent === 'keep') {
				// Move subplaces and subfolders to the root
				this.$store.state.places.forEach((place) => {
					if (place.folderid === this.data.folder.id) {
						this.$store.commit('changePlace', {
							place: place,
							change: {folderid: 'root', updated: true},
							backup: false,
						});
					}
				});
				if (Array.isArray(this.data.folder.children)) {
					while (this.data.folder.children.length > 0) {
						this.$store.dispatch('moveFolder', {
							folder: this.data.folder.children[0],
							targetId: 'root',
							backup: false,
						});
					}
				}
			}
			this.$store.commit('changeFolder', {
				folder: this.data.folder,
				change: {deleted: true},
				backup: false,
			});
			if (!this.$store.state.inUndoRedo) {
				bus.$emit('toDB', {what: 'places'});
				bus.$emit('toDB', {what: 'folders'});
			} else {
				bus.$emit('toDBCompletely');
				this.$store.commit('outUndoRedo');
			}
			if (this.keepContent !== 'delete') {
				this.$store.commit('backupState');
			}
			this.$store.commit('deletePlacesMarkedAsDeleted');
			this.$store.commit('deleteFoldersMarkedAsDeleted');
			bus.$emit('homeRefresh');
			this.$root.showPopup({show: false}, event);
		},
		markNestedAsDeleted(folder) {
			// Mark places and folders in the currently deleted folder as deleted
			this.$store.state.places.forEach((place) => {
				if (place.folderid === folder.id) {
					this.$store.commit('changePlace', {
						place: place,
						change: {deleted: true},
						backup: false,
					});
				}
			});
			if (Array.isArray(folder.children)) {
				for (let i = 0; i < folder.children.length; i++) {
					this.$store.commit('changeFolder', {
						folder: folder.children[i],
						change: {deleted: true},
						backup: false,
					});
					this.markNestedAsDeleted(folder.children[i]);
				}
			}
		},
		keyup(event) {
			switch (constants.shortcuts[event.keyCode]) {
				case 'close' :
					this.$root.showPopup({show: false}, event);
					break;
			}
		},
	},
}
</script>
