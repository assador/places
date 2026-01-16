<template>
	<div :class="'popup ' + (popuped ? 'appear' : 'disappear')">
		<div class="popup-content centered">
			<div class="brand">
				<h1 class="margin_bottom_0">
					{{ mainStore.t.i.captions.newFolder }}
				</h1>
			</div>
			<form
				class="folder-new__form margin_bottom_0"
				@click="e => e.stopPropagation()"
				@submit.prevent="appendFolder({
					parentId: parentId,
					name: folderName ? folderName : '',
					description: folderDescription ? folderDescription : '',
				});"
			>
				<table class="table_form">
					<tbody>
						<tr>
							<th>{{ mainStore.t.i.captions.name }}:</th>
							<td>
								<input
									id="folderName"
									v-model="folderName"
									class="fieldwidth_100"
									required
									type="text"
								/>
							</td>
						</tr>
						<tr>
							<th>{{ mainStore.t.i.captions.description }}:</th>
							<td>
								<textarea
									id="folderDescription"
									v-model="folderDescription"
									class="fieldwidth_100"
								/>
							</td>
						</tr>
						<tr class="back_0">
							<th />
							<td style="padding-top: 18px; vertical-align: top;">
								<button type="submit">
									{{ mainStore.t.i.buttons.createFolder }}
								</button>
								&#160;
								<button @click="close()">
									{{ mainStore.t.i.buttons.cancel }}
								</button>
							</td>
						</tr>
						<tr class="back_0">
							<th />
							<td style="padding-top: 18px;">
								{{ message }}
							</td>
						</tr>
					</tbody>
				</table>
			</form>
			<a
				href="javascript:void(0)"
				class="close"
				@click="close()"
			>
				×
			</a>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, onUpdated, nextTick } from 'vue';
import { useMainStore } from '@/stores/main';
import { useRouter, useRoute } from 'vue-router';
import { makeFieldsValidatable } from '@/shared/fields_validate';
import { Folder } from '@/stores/types';

const mainStore = useMainStore();

export interface IPlacesPopupFolderProps {
	parentId?: string;
}
const props = withDefaults(defineProps<IPlacesPopupFolderProps>(), {
	parentId: 'root',
});

const folderName = ref('');
const folderDescription = ref('');
const message = ref('');
const popuped = ref(false);

const router = useRouter();
const route = useRoute();

const close = (): void => {
	router.replace(route.matched[route.matched.length - 2].path);
};
const keyup = (event: KeyboardEvent): void => {
	if (event.key === 'Escape') close();
};
const appendFolder = (payload: { parentId: string, name: string, description: string }): void => {
	const { parentId, name, description } = payload;
	if (
		mainStore.serverConfig.rights.folderscount < 0 ||
		mainStore.serverConfig.rights.folderscount > Object.keys(mainStore.folders).length ||
		mainStore.user.testaccount
	) {
		let srt = 1;
		let parentFolder: Folder;
		switch (parentId) {
			case 'root':
				parentFolder = mainStore.tree;
				break;
			case 'tracksroot':
				parentFolder = mainStore.treeTracks;
				break;
			default:
				parentFolder = mainStore.folders[parentId] ?? mainStore.tree;
				break;
		}
		if (parentFolder.children) {
			srt =
				Object.values(parentFolder.children)
					[Object.values(parentFolder.children).length - 1].srt + 1;
		}
		const newFolder: Folder = {
			id: crypto.randomUUID(),
			parent: parentId,
			name: name,
			description: description,
			srt: Number(srt) || 0,
			geomarks: 1,
			builded: false,
			type: 'folder',
			added: true,
			deleted: false,
			updated: false,
			opened: false,
			userid: sessionStorage.getItem('places-useruuid'),
		};
		mainStore.addFolder({ folder: newFolder });
		message.value = mainStore.t.m.paged.folderCreated;
		folderName.value = '';
		folderDescription.value = '';
		document.getElementById('folderName')!.focus();
	} else {
		message.value = mainStore.t.m.paged.foldersCountExceeded;
	}
};

onMounted(async () => {
	popuped.value = true;
	await nextTick();
	makeFieldsValidatable(mainStore.t);
	document.getElementById('folderName')!.focus();
	document.addEventListener('keyup', keyup, false);
});
onUnmounted(() => {
	document.removeEventListener('keyup', keyup);
});
onUpdated(() => {
	makeFieldsValidatable(mainStore.t);
});
</script>
