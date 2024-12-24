<template>
	<div
		:class="'popup ' + (popuped ? 'appear' : 'disappear')"
		@click="e => close(e)"
	>
		<div class="popup-content centered">
			<div class="brand">
				<h1 class="margin_bottom_0">
					{{ mainStore.t.i.captions.newFolder }}
				</h1>
			</div>
			<form
				class="folder-new__form margin_bottom_0"
				@click="e => e.stopPropagation()"
				@submit.prevent="appendFolder(folderName ? folderName : '', folderDescription ? folderDescription : '');"
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
								>
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
								<button @click="e => close(e)">
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
				@click="e => close(e)"
			>
				×
			</a>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, onUpdated } from 'vue';
import { useMainStore } from '@/stores/main';;
import { useRouter, useRoute } from 'vue-router';
import { constants } from '../shared/constants';
import { generateRandomString } from '../shared/common';
import { makeFieldsValidatable } from '../shared/fields_validate';
import { Folder } from '@/stores/types';

const folderName = ref('');
const folderDescription = ref('');
const message = ref('');
const popuped = ref(false);

const mainStore = useMainStore();
const router = useRouter();
const route = useRoute();

const currentPlace = computed(() => mainStore.currentPlace);

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
const appendFolder = (name: string, description: string): void => {
	const treeFlat = mainStore.treeFlat;
	if (
		mainStore.serverConfig.rights.folderscount < 0 ||
		mainStore.serverConfig.rights.folderscount > treeFlat.length - 1 ||
		// length - 1 because there is a root folder too
		mainStore.user.testaccount
	) {
		let srt = 1;
		if (
			Object.keys(
				treeFlat[
					currentPlace.value ? currentPlace.value.folderid : 'root'
				].children || []
			).length
		) {
			srt = Math.ceil(Math.max(
				...Object.keys(
					treeFlat[
						currentPlace.value ? currentPlace.value.folderid : 'root'
					].children
				).map(
					(id: string) =>
						treeFlat[
							currentPlace.value ? currentPlace.value.folderid : 'root'
						].children[id].srt
				)
			)) + 1;
		}
		const newFolder: Folder = {
			id: generateRandomString(32) as string,
			parent: currentPlace.value
				? currentPlace.value.folderid
				: 'root',
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
			userid: sessionStorage.getItem('places-userid'),
		};
		mainStore.addFolder({folder: newFolder});
		message.value = mainStore.t.m.paged.folderCreated;
		folderName.value = '';
		folderDescription.value = '';
		document.getElementById('folderName')!.focus();
	} else {
		message.value = mainStore.t.m.paged.foldersCountExceeded;
	}
};

onMounted(() => {
	popuped.value = true;
	makeFieldsValidatable(mainStore.t);
	document.getElementById('folderName')!.focus();
	document.addEventListener('keyup', keyup, false);
});
onBeforeUnmount(() => {
	document.removeEventListener('keyup', keyup, false);
});
onUpdated(() => {
	makeFieldsValidatable(mainStore.t);
});
</script>
