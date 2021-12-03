<template>
	<div
		:class="'popup ' + (popuped ? 'appear' : 'disappear')"
		@click="close($event)"
	>
		<div class="popup-content centered">
			<div class="brand">
				<h1 class="margin_bottom_0">
					Удаление папки
				</h1>
				<p class="margin_bottom_0">
					«{{ folder ? folder.name : '' }}»
				</p>
			</div>
			<p class="margin_bottom_0">
				Укажите, что делать с содержимым удаляемой папки:
			</p>
			<form
				class="folder-delete__form margin_bottom_0"
				@click="$event.stopPropagation();"
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
							@click="close($event);"
						>
							Отмена
						</button>
					</fieldset>
				</div>
			</form>
			<a
				href="javascript:void(0);"
				class="close"
				@click="close($event);"
			>
				×
			</a>
		</div>
	</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { bus } from '../shared/bus';
import { constants } from '../shared/constants';
import { mapState } from 'vuex';
import { Place, Image, Folder } from '@/store/types';

export default Vue.extend({
	props: ['folderId'],
	data() {
		return {
			keepContent: 'keep',
			popuped: false,
			folder: {} as Folder,
		}
	},
	computed: {
		...mapState(['currentPlace', 'currentPlaceIndex']),
	},
	watch: {
		folderId() {
			this.open();
		},
	},
	mounted() {
		this.open();
		document.addEventListener('keyup', this.keyup, false);
	},
	beforeUpdate() {
		this.popuped = true;
	},
	beforeDestroy() {
		document.removeEventListener('keyup', this.keyup, false);
	},
	methods: {
		open(event?: Event) {
			if (event) event.stopPropagation();
			this.folder =
				(this.$root as Vue & {foldersPlain: Record<string, Folder>})
					.foldersPlain[this.folderId];
			if (!this.folder) {
				this.$router.back();
			}
		},
		close(event: Event) {
			if (event) event.stopPropagation();
			this.$router.replace(
				this.$route.matched[this.$route.matched.length - 2].path
			);
		},
		deleteFolder(event: Event) {
			if (this.keepContent !== 'delete') {
				this.$store.commit('backupState');
			}
			if (this.keepContent === 'delete') {
				this.markNestedAsDeleted(this.folder);
				this.$store.state.places.forEach((place: Place) => {
					if (place.deleted && place.images) {
						(this.$root as Vue & {
							deleteImages(images: Array<Image>, family?: boolean): void
						}).deleteImages(place.images, true);
						if (this.$store.state.homePlace === place) {
							this.$store.dispatch('setHomePlace', null);
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
								(p: Place) => p.folderid === 'root'
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
											(p: Place) => !p.deleted
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
				this.$store.state.places.forEach((place: Place) => {
					if (place.folderid === this.folder.id) {
						this.$store.dispatch('changePlace', {
							place: place,
							change: {folderid: 'root'},
						});
					}
				});
				if (Array.isArray(this.folder.children)) {
					while (this.folder.children.length > 0) {
						this.$store.dispatch('moveFolder', {
							folder: this.folder.children[0],
							targetId: 'root',
							backup: false,
						});
					}
				}
			}
			this.$store.dispatch('changeFolder', {
				folder: this.folder,
				change: {deleted: true},
			});
			this.$store.commit('deletePlacesMarkedAsDeleted');
			this.$store.commit('deleteFoldersMarkedAsDeleted');
			bus.$emit('refreshMapMarks');
			this.close(event);
		},
		markNestedAsDeleted(folder: Folder) {
			// Mark places and folders in the currently deleted folder as deleted
			this.$store.state.places.forEach((place: Place) => {
				if (place.folderid === folder.id) {
					this.$store.commit('changePlace', {
						place: place,
						key: 'deleted',
						value: true,
					});
				}
			});
			if (Array.isArray(folder.children)) {
				for (let i = 0; i < folder.children.length; i++) {
					this.$store.commit('changeFolder', {
						folder: folder.children[i],
						key: 'deleted',
						value: true,
					});
					this.markNestedAsDeleted(folder.children[i]);
				}
			}
		},
		keyup(event: Event) {
			if (
				(constants.shortcuts as Record<string, string>)
					[(event as KeyboardEvent).keyCode] === 'close'
			)  this.close(event);
		},
	},
});
</script>
