<template>
	<div
		:class="'popup ' + (popuped ? 'appear' : 'disappear')"
		@click="e => close(e)"
	>
		<div class="popup-content centered">
			<div class="brand">
				<h1 class="margin_bottom_0">
					{{ mainStore.t.i.captions.deletingFolder }}
				</h1>
				<p class="margin_bottom_0">
					«{{ folder ? folder.name : '' }}»
				</p>
			</div>
			<p class="margin_bottom_0">
				{{ mainStore.t.i.text.whatToDoWithFolder }}:
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
						<span>{{ mainStore.t.i.inputs.leaveContentInRoot }}</span>
					</label>
					<label>
						<input
							v-model="keepContent"
							name="content"
							type="radio"
							value="delete"
						>
						<span>{{ mainStore.t.i.inputs.deleteContent }}</span>
					</label>
				</fieldset>
				<div style="text-align: center;">
					<fieldset>
						<button type="submit">
							{{ mainStore.t.i.buttons.deleteFolder }}
						</button>
						&#160;
						<button
							type="button"
							@click="e => close(e)"
						>
							{{ mainStore.t.i.buttons.cancel }}
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
import { useMainStore } from '@/stores/main';;
import { emitter } from '../shared/bus';
import { constants } from '../shared/constants';
import { Place, Folder } from '@/stores/types';

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

const mainStore = useMainStore();
const router = useRouter();
const route = useRoute();

const currentPlace = computed(() => mainStore.currentPlace);

const open = (event?: Event): void => {
	if (event) event.stopPropagation();
	folder.value = mainStore.treeFlat[props.folderId];
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
			[(event as KeyboardEvent).code] === 'close'
	) close(event);
};
const markNestedAsDeleted = (folderCont: Folder): void => {
	// Mark places and folders in the currently deleted folder as deleted
	for (const id in mainStore.places) {
		if (mainStore.places[id].folderid === folderCont.id) {
			mainStore.changePlaceMut({
				place: mainStore.places[id],
				key: 'deleted',
				value: true,
			});
			places.value[id] = mainStore.places[id];
		}
	}
	if (folderCont.children) {
		for (const id in folderCont.children) {
			mainStore.changeFolderMut({
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
	if (keepContent.value === 'delete') {
		markNestedAsDeleted(folder.value);
		if (mainStore.homePlace && mainStore.homePlace.deleted) {
			await mainStore.setHomePlace(null);
		}
		if (currentPlace.value && currentPlace.value.deleted) {
			if (Object.keys(mainStore.places).length) {
				if (mainStore.homePlace && !mainStore.homePlace.deleted) {
					emitter.emit(
						'choosePlace',
						{place: mainStore.homePlace}
					);
				} else {
					let firstPlaceInRoot: Place;
					for (const id in mainStore.places) {
						if (mainStore.places[id].folderid === 'root') {
							if (firstPlaceInRoot) {
								if (mainStore.places[id].srt < firstPlaceInRoot.srt) {
									firstPlaceInRoot = mainStore.places[id];
								}
							} else {
								firstPlaceInRoot = mainStore.places[id];
							}
						}
					}
					if (firstPlaceInRoot && !firstPlaceInRoot.deleted) {
						emitter.emit(
							'choosePlace',
							{place: firstPlaceInRoot}
						);
					} else if (
						!mainStore.places[
							Object.keys(mainStore.places)[0]
						].deleted
					) {
						emitter.emit(
							'choosePlace',
							{place: mainStore.places[
								Object.keys(mainStore.places)[0]
							]}
						);
					} else {
						emitter.emit('choosePlace', {place: null});
					}
				}
			} else {
				emitter.emit('choosePlace', {place: null});
			}
		}
		await mainStore.deletePlaces({places: places.value});
		await mainStore.deleteFolders({folders: folders.value});
	} else if (keepContent.value === 'keep') {
		// Move subplaces and subfolders to the root
		for (const id in mainStore.places) {
			if (mainStore.places[id].folderid === folder.value.id) {
				await mainStore.changePlace({
					place: mainStore.places[id],
					change: {
						folderid: 'root',
						updated: true,
					},
				});
				places.value[id] = mainStore.places[id];
			}
		}
		if (folder.value.children) {
			while (Object.keys(folder.value.children).length) {
				folders.value[Object.keys(folder.value.children)[0]] =
					folder.value.children[
						Object.keys(folder.value.children)[0]
					]
				;
				await mainStore.moveFolder({
					folder: folder.value.children[
						Object.keys(folder.value.children)[0]
					],
					targetId: 'root',
					todb: false,
				})
			}
		}
		if (!mainStore.inUndoRedo) {
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
			mainStore.inUndoRedo = false;
		}
	}
	mainStore.deleteFolders({folders: {[folder.value.id]: folder.value}});
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
	window.setTimeout(() => {
		popuped.value = true;
	}, 1);
});
onBeforeUnmount(() => {
	document.removeEventListener('keyup', keyup, false);
});
</script>
