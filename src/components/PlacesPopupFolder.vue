<template>
	<div
		:class="'popup ' + (popuped ? 'appear' : 'disappear')"
		@click="e => close(e)"
	>
		<div class="popup-content centered">
			<div class="brand">
				<h1 class="margin_bottom_0">
					{{ store.state.main.t.i.captions.newFolder }}
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
							<th>{{ store.state.main.t.i.captions.name }}:</th>
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
							<th>{{ store.state.main.t.i.captions.description }}:</th>
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
									{{ store.state.main.t.i.buttons.createFolder }}
								</button>
								&#160;
								<button @click="e => close(e)">
									{{ store.state.main.t.i.buttons.cancel }}
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
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';
import { constants } from '../shared/constants';
import { generateRandomString } from '../shared/common';
import { makeFieldsValidatable } from '../shared/fields_validate';
import { Folder } from '@/store/types';

const folderName = ref('');
const folderDescription = ref('');
const message = ref('');
const popuped = ref(false);

const store = useStore();
const router = useRouter();
const route = useRoute();

const currentPlace = computed(() => store.state.main.currentPlace);

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
	const treeFlat = store.getters['main/treeFlat'];
	if (
		store.state.main.serverConfig.rights.folderscount < 0 ||
		store.state.main.serverConfig.rights.folderscount > treeFlat.length - 1 ||
		// length - 1 because there is a root folder too
		store.state.main.user.testaccount
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
		store.dispatch('main/addFolder', {folder: newFolder});
		message.value = store.state.main.t.m.paged.folderCreated;
		folderName.value = '';
		folderDescription.value = '';
		document.getElementById('folderName')!.focus();
	} else {
		message.value = store.state.main.t.m.paged.foldersCountExceeded;
	}
};

onMounted(() => {
	popuped.value = true;
	makeFieldsValidatable(store.state.main.t);
	document.getElementById('folderName')!.focus();
	document.addEventListener('keyup', keyup, false);
});
onBeforeUnmount(() => {
	document.removeEventListener('keyup', keyup, false);
});
onUpdated(() => {
	makeFieldsValidatable(store.state.main.t);
});
</script>
