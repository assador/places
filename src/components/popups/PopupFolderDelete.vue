<template>
	<div :class="'popup ' + (popuped ? 'appear' : 'disappear')">
		<div class="popup-content centered">
			<div class="brand">
				<h1 class="margin_bottom_0">
					{{ mainStore.t.i.captions.deletingFolder }}
				</h1>
				<p class="margin_bottom_0">
					«{{ folder ? folder.name : '' }}»
				</p>
			</div>
			<p class="margin_bottom_0 center">
				<strong>{{ mainStore.t.i.text.folderDeletingIrreversible }}</strong>
				<br />
				{{ mainStore.t.i.text.whatToDoWithFolder }}:
			</p>
			<form
				class="folder-delete__form margin_bottom_0"
				@submit.prevent="deleteFolder()"
			>
				<fieldset class="margin_bottom">
					<label>
						<input
							v-model="keepContent"
							name="content"
							type="radio"
							value="keep"
						/>
						<span>{{ mainStore.t.i.inputs.leaveContentInRoot }}</span>
					</label>
					<label>
						<input
							v-model="keepContent"
							name="content"
							type="radio"
							value="delete"
						/>
						<span>{{ mainStore.t.i.inputs.deleteContent }}</span>
					</label>
				</fieldset>
				<div style="text-align: center;">
					<fieldset>
						<button type="submit">
							{{ mainStore.t.i.buttons.deleteFolder }}
						</button>
						&#160;
						<button type="button" @click="close()">
							{{ mainStore.t.i.buttons.cancel }}
						</button>
					</fieldset>
				</div>
			</form>
			<a
				href="javascript:void(0);"
				class="close"
				@click="close()"
			>
				×
			</a>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, Ref, onMounted, onUnmounted } from 'vue';
import { useMainStore } from '@/stores/main';
import { useRouter, useRoute } from 'vue-router';
import { Place, Route, Folder } from '@/stores/types';

export interface IPlacesPopupFolderDeleteProps {
	id: string;
	type?: string;
}
const props = withDefaults(defineProps<IPlacesPopupFolderDeleteProps>(), {
	id: undefined,
	type: 'places',
});

const mainStore = useMainStore();
const router = useRouter();
const route = useRoute();

const keepContent = ref('keep');
const popuped = ref(false);
const folder = ref(mainStore.folders[props.id]);
const subfolders = ref({} as Record<string, Folder>);

const close = (): void => {
	router.replace(route.matched[route.matched.length - 2].path);
};
const keyup = (event: KeyboardEvent): void => {
	if (event.key === 'Escape') close();
};
const markNestedAsDeleted = (folder: Folder): void => {
	// Mark items in the current folder being deleted as deleted
	for (
		const object of
		Object.values(mainStore[props.type] as Record<string, Place | Route>)
	) {
		if (object.folderid === folder.id) object.deleted = true;
	}
	if (folder.children) {
		for (const subfolder of Object.values(folder.children)) {
			subfolders.value[subfolder.id] = subfolder;
			subfolders.value[subfolder.id].deleted = true;
			markNestedAsDeleted(subfolder);
		}
	}
	mainStore.saved = false;
};
const deleteFolder = (): void => {
	mainStore.backup = false;
	folder.value.deleted = true;
	if (keepContent.value === 'delete') {
		markNestedAsDeleted(folder.value);
		if (mainStore.homePlace && mainStore.homePlace.deleted) {
			mainStore.setHomePlace(null);
		}
		const current: Ref<Place | Route | null> = ref(null);
		switch (props.type) {
			case 'places':
				current.value = mainStore.currentPlace;
				break;
			case 'routes':
				current.value = mainStore.currentRoute;
				break;
		}
		if (current.value && current.value.deleted) {
			if (!Object.keys(mainStore[props.type]).length) {
				mainStore.setCurrentPlace(null);
			} else if (mainStore.homePlace && !mainStore.homePlace.deleted) {
				mainStore.setCurrentPlace(mainStore.homePlace.id);
			} else {
				const itemsInRoot: Ref<Place[] | Route[]> = ref(
					Object.values(mainStore[props.type] as Place[] | Route[]).filter(
						item => (
							item['folderid'] === 'root' ||
							item['folderid'] === 'routesroot'
						)
					).sort(
						(a, b) => (a as Place | Route).srt - (b as Place | Route).srt
					)
				);
				if (itemsInRoot.value[0] && !itemsInRoot.value[0].deleted) {
					mainStore.setCurrentPlace((itemsInRoot.value[0] as Place).id);
				} else if (
					!Object.values(mainStore[props.type] as Place[] | Route[])[0].deleted
				) {
					mainStore.setCurrentPlace((Object.values(mainStore[props.type])[0] as Place).id);
				} else {
					mainStore.setCurrentPlace(null);
				}
			}
		}
	} else if (keepContent.value === 'keep') {
		// Move subitems to the root
		for (const item of Object.values(mainStore[props.type])) {
			if (item['folderid'] === folder.value.id) {
				item['folderid'] = props.type === 'routes' ? 'routesroot' : 'root';
				item['updated'] = true;
			}
		}
		for (const item of Object.values(mainStore.folders)) {
			if (item.parent === folder.value.id) {
				item['parent'] = props.type === 'routes' ? 'routesroot' : 'root';
				item['updated'] = true;
			}
		}
	}
	mainStore.deleteObjects();
	mainStore.backup = true;
	mainStore.backupState();
	close();
};

onMounted(() => {
	document.addEventListener('keyup', keyup, false);
	window.setTimeout(() => popuped.value = true, 1);
});
onUnmounted(() => {
	document.removeEventListener('keyup', keyup);
});
</script>
