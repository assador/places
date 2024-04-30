<template>
	<div
		:class="'popup ' + (popuped ? 'appear' : 'disappear')"
		@click="e => close(e)"
	>
		<div class="popup-content centered">
			<div class="brand">
				<h1 class="margin_bottom_0">
					{{ store.state.main.t.i.captions.deletingFolder }}
				</h1>
				<p class="margin_bottom_0">
					«{{ folder ? folder.name : '' }}»
				</p>
			</div>
			<p class="margin_bottom_0">
				{{ store.state.main.t.i.text.whatToDoWithFolder }}:
			</p>
			<form
				class="folder-delete__form margin_bottom_0"
				@click="e => e.stopPropagation()"
				@submit.prevent="e => deleteFolder(e)"
			>
				<fieldset class="margin_bottom">
					<label>
						<input
							v-model="keepContent"
							name="content"
							type="radio"
							value="keep"
						>
						<span>{{ store.state.main.t.i.inputs.leaveContentInRoot }}</span>
					</label>
					<label>
						<input
							v-model="keepContent"
							name="content"
							type="radio"
							value="delete"
						>
						<span>{{ store.state.main.t.i.inputs.deleteContent }}</span>
					</label>
				</fieldset>
				<div style="text-align: center;">
					<fieldset>
						<button type="submit">
							{{ store.state.main.t.i.buttons.deleteFolder }}
						</button>
						&#160;
						<button
							type="button"
							@click="e => close(e)"
						>
							{{ store.state.main.t.i.buttons.cancel }}
						</button>
					</fieldset>
				</div>
			</form>
			<a
				href="javascript:void(0);"
				class="close"
				@click="e => close(e)"
			>
				×
			</a>
		</div>
	</div>
</template>

<script setup lang="ts">
import {
	ref,
	computed,
	watch,
	onMounted,
	onBeforeUnmount,
	onBeforeUpdate,
} from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useStore } from 'vuex';
import { emitter } from '../shared/bus';
import { constants } from '../shared/constants';
import { Place, Folder } from '@/store/types';

export interface IPlacesPopupFolderDeleteProps {
	folderId?: string;
}
const props = withDefaults(defineProps<IPlacesPopupFolderDeleteProps>(), {
	folderId: '',
});

const keepContent = ref('keep');
const popuped = ref(false);
const folder = ref({} as Folder);
const places = ref({} as Record<string, Place>);
const folders = ref({} as Record<string, Folder>);

const store = useStore();
const router = useRouter();
const route = useRoute();

const currentPlace = computed(() => store.state.main.currentPlace);

const open = (event?: Event): void => {
	if (event) event.stopPropagation();
	folder.value = store.getters['main/treeFlat'][props.folderId];
	if (!folder.value) {
		router.back();
	}
};
const close = (event: Event): void => {
	if (event) event.stopPropagation();
	router.replace(route.matched[route.matched.length - 2].path);
};
const keyup = (event: Event): void => {
	if (
		(constants.shortcuts as Record<string, string>)
			[(event as KeyboardEvent).keyCode] === 'close'
	) close(event);
};
const markNestedAsDeleted = (folderCont: Folder): void => {
	// Mark places and folders in the currently deleted folder as deleted
	for (const id in store.state.main.places) {
		if (store.state.main.places[id].folderid === folderCont.id) {
			store.commit('main/changePlace', {
				place: store.state.main.places[id],
				key: 'deleted',
				value: true,
			});
			places.value[id] = store.state.main.places[id];
		}
	}
	if (folderCont.children) {
		for (const id in folderCont.children) {
			store.commit('main/changeFolder', {
				folder: folderCont.children[id],
				key: 'deleted',
				value: true,
			});
			folders.value[id] = folderCont.children[id];
			markNestedAsDeleted(folderCont.children[id]);
		}
	}
};
const deleteFolder = async (event: Event): Promise<void> => {
	if (keepContent.value !== 'delete') {
		store.commit('main/backupState');
	}
	if (keepContent.value === 'delete') {
		markNestedAsDeleted(folder.value);
		if (store.state.main.homePlace && store.state.main.homePlace.deleted) {
			await store.dispatch('main/setHomePlace', null);
		}
		if (currentPlace.value && currentPlace.value.deleted) {
			if (Object.keys(store.state.main.places).length) {
				if (store.state.main.homePlace && !store.state.main.homePlace.deleted) {
					emitter.emit(
						'setCurrentPlace',
						{place: store.state.main.homePlace}
					);
				} else {
					let firstPlaceInRoot: Place;
					for (const id in store.state.main.places) {
						if (store.state.main.places[id].folderid === 'root') {
							if (firstPlaceInRoot) {
								if (store.state.main.places[id].srt < firstPlaceInRoot.srt) {
									firstPlaceInRoot = store.state.main.places[id];
								}
							} else {
								firstPlaceInRoot = store.state.main.places[id];
							}
						}
					}
					if (firstPlaceInRoot && !firstPlaceInRoot.deleted) {
						emitter.emit(
							'setCurrentPlace',
							{place: firstPlaceInRoot}
						);
					} else if (
						!store.state.main.places[
							Object.keys(store.state.main.places)[0]
						].deleted
					) {
						emitter.emit(
							'setCurrentPlace',
							{place: store.state.main.places[
								Object.keys(store.state.main.places)[0]
							]}
						);
					} else {
						emitter.emit('setCurrentPlace', {place: null});
					}
				}
			} else {
				emitter.emit('setCurrentPlace', {place: null});
			}
		}
		await store.dispatch('main/deletePlaces', {places: places.value});
		await store.dispatch('main/deleteFolders', {folders: folders.value});
	} else if (keepContent.value === 'keep') {
		// Move subplaces and subfolders to the root
		for (const id in store.state.main.places) {
			if (store.state.main.places[id].folderid === folder.value.id) {
				await store.dispatch('main/changePlace', {
					place: store.state.main.places[id],
					change: {
						folderid: 'root',
						updated: true,
					},
				});
				places.value[id] = store.state.main.places[id];
			}
		}
		if (folder.value.children) {
			while (Object.keys(folder.value.children).length) {
				folders.value[Object.keys(folder.value.children)[0]] =
					folder.value.children[
						Object.keys(folder.value.children)[0]
					]
				;
				await store.dispatch('main/moveFolder', {
					folder: folder.value.children[
						Object.keys(folder.value.children)[0]
					],
					targetId: 'root',
					todb: false,
				})
			}
		}
		if (!store.state.main.inUndoRedo) {
			emitter.emit('toDB', {
				what: 'places',
				data: Object.values(places.value),
			});
			emitter.emit('toDB', {
				what: 'folders',
				data: Object.values(folders.value),
			});
		} else {
			emitter.emit('toDBCompletely');
			store.commit('main/outUndoRedo');
		}
	}
	store.dispatch('main/deleteFolders', {folders: {[folder.value.id]: folder.value}});
	emitter.emit('refreshMapMarks');
	close(event);
};

watch(() => props.folderId, () => {
	open();
});
onMounted(() => {
	open();
	document.addEventListener('keyup', keyup, false);
});
onBeforeUpdate(() => {
	popuped.value = true;
});
onBeforeUnmount(() => {
	document.removeEventListener('keyup', keyup, false);
});
</script>
