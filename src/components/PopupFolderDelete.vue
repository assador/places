<template>
	<div
		:class="'popup ' + (popuped ? 'appear' : 'disappear')"
		@click="close($event)"
	>
		<div class="popup-content centered">
			<div class="brand">
				<h1 class="margin_bottom_0">
					{{ $store.state.t.i.captions.deletingFolder }}
				</h1>
				<p class="margin_bottom_0">
					«{{ folder ? folder.name : '' }}»
				</p>
			</div>
			<p class="margin_bottom_0">
				{{ $store.state.t.i.text.whatToDoWithFolder }}:
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
						<span>{{ $store.state.t.i.inputs.leaveContentInRoot }}</span>
					</label>
					<label>
						<input
							v-model="keepContent"
							name="content"
							type="radio"
							value="delete"
						>
						<span>{{ $store.state.t.i.inputs.deleteContent }}</span>
					</label>
				</fieldset>
				<div style="text-align: center;">
					<fieldset>
						<button type="submit">
							{{ $store.state.t.i.buttons.deleteFolder }}
						</button>
						&#160;
						<button
							type="button"
							@click="close($event);"
						>
							{{ $store.state.t.i.buttons.cancel }}
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
import { Place, Folder } from '@/store/types';

export default Vue.extend({
	props: {
		folderId: {
			type: String,
			default: '',
		},
	},
	data() {
		return {
			keepContent: 'keep',
			popuped: false,
			folder: {} as Folder,
			places: {} as Record<string, Place>,
			folders: {} as Record<string, Folder>,
		}
	},
	computed: {
		...mapState(['currentPlace']),
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
			this.folder = this.$store.getters.treeFlat[this.folderId];
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
		async deleteFolder(event: Event) {
			if (this.keepContent !== 'delete') {
				this.$store.commit('backupState');
			}
			if (this.keepContent === 'delete') {
				this.markNestedAsDeleted(this.folder);
				if (
					this.$store.state.homePlace &&
					this.$store.state.homePlace.deleted
				) {
					await this.$store.dispatch('setHomePlace', null);
				}
				if (
					this.currentPlace &&
					this.currentPlace.deleted
				) {
					if (Object.keys(this.$store.state.places).length) {
						if (
							this.$store.state.homePlace &&
							!this.$store.state.homePlace.deleted
						) {
							bus.$emit(
								'setCurrentPlace',
								{place: this.$store.state.homePlace}
							);
						} else {
							let firstPlaceInRoot: Place;
							for (const id in this.$store.state.places) {
								if (this.$store.state.places[id].folderid === 'root') {
									if (firstPlaceInRoot) {
										if (this.$store.state.places[id].srt < firstPlaceInRoot.srt) {
											firstPlaceInRoot = this.$store.state.places[id];
										}
									} else {
										firstPlaceInRoot = this.$store.state.places[id];
									}
								}
							}
							if (firstPlaceInRoot && !firstPlaceInRoot.deleted) {
								bus.$emit(
									'setCurrentPlace',
									{place: firstPlaceInRoot}
								);
							} else if (
								!this.$store.state.places[
									Object.keys(this.$store.state.places)[0]
								].deleted
							) {
								bus.$emit(
									'setCurrentPlace',
									{place: this.$store.state.places[
										Object.keys(this.$store.state.places)[0]
									]}
								);
							} else {
								bus.$emit('setCurrentPlace', {place: null});
							}
						}
					} else {
						bus.$emit('setCurrentPlace', {place: null});
					}
				}
				await this.$store.dispatch('deletePlaces', {places: this.places});
				await this.$store.dispatch('deleteFolders', {folders: this.folders});
			} else if (this.keepContent === 'keep') {
				// Move subplaces and subfolders to the root
				for (const id in this.$store.state.places) {
					if (this.$store.state.places[id].folderid === this.folder.id) {
						await this.$store.dispatch('changePlace', {
							place: this.$store.state.places[id],
							change: {
								folderid: 'root',
								updated: true,
							},
						});
						this.places[id] = this.$store.state.places[id];
					}
				}
				if (this.folder.children) {
					while (Object.keys(this.folder.children).length) {
						this.folders[Object.keys(this.folder.children)[0]] =
							this.folder.children[
								Object.keys(this.folder.children)[0]
							]
						;
						await this.$store.dispatch('moveFolder', {
							folder: this.folder.children[
								Object.keys(this.folder.children)[0]
							],
							targetId: 'root',
							todb: false,
						})
					}
				}
				if (!this.$store.state.inUndoRedo) {
					bus.$emit('toDB', {
						what: 'places',
						data: Object.values(this.places),
					});
					bus.$emit('toDB', {
						what: 'folders',
						data: Object.values(this.folders),
					});
				} else {
					bus.$emit('toDBCompletely');
					this.$store.commit('outUndoRedo');
				}
			}
			this.$store.dispatch('deleteFolders', {folders: {[this.folder.id]: this.folder}});
			bus.$emit('refreshMapMarks');
			this.close(event);
		},
		markNestedAsDeleted(folder: Folder) {
			// Mark places and folders in the currently deleted folder as deleted
			for (const id in this.$store.state.places) {
				if (this.$store.state.places[id].folderid === folder.id) {
					this.$store.commit('changePlace', {
						place: this.$store.state.places[id],
						key: 'deleted',
						value: true,
					});
					this.places[id] = this.$store.state.places[id];
				}
			}
			if (folder.children) {
				for (const id in folder.children) {
					this.$store.commit('changeFolder', {
						folder: folder.children[id],
						key: 'deleted',
						value: true,
					});
					this.folders[id] = folder.children[id];
					this.markNestedAsDeleted(folder.children[id]);
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
