<template>
	<div
		:class="'popup ' + (popuped ? 'appear' : 'disappear')"
		@click="e => close(e)"
	>
		<div class="popup-content centered">
			<div class="brand">
				<h1 class="margin_bottom_0">
					{{ mainStore.t.i.captions.exportPlaces }}
				</h1>
			</div>
			<p class="margin_bottom_0">
				{{ mainStore.t.i.text.specifyFormatToExport }}:
			</p>
			<form
				class="popup-export__form"
				@click="e => {
					e.stopPropagation();
					mainStore.idleTime = 0;
				}"
				@submit.prevent="e => exportPlaces(
					selectedToExport,
					(e.target as HTMLFormElement).elements['mime'].value
				)"
			>
				<fieldset class="margin_bottom">
					<label>
						<input
							name="mime"
							type="radio"
							:checked="true"
							value="application/gpx+xml"
						/>
						&#160;
						<span>GPX</span>
					</label>
					<p>
						{{ mainStore.t.i.text.descGpx }}
					</p>
					<label>
						<input
							name="mime"
							type="radio"
							value="application/json"
						/>
						&#160;
						<span>JSON</span>
					</label>
					<p>
						{{ mainStore.t.i.text.descJson }}
					</p>
				</fieldset>
				<p>{{ mainStore.t.i.text.specifyPlacesToExport }}:</p>
				<div
					v-if="
						Object.keys(mainStore.places).length > 0 ||
						Object.keys(mainStore.folders).length > 0
					"
					id="popup-export__tree"
					class="menu"
					@click="e => e.stopPropagation()"
				>
					<places-tree
						instanceid="popupexporttree"
						:data="mainStore.tree || {}"
					/>
				</div>
				<div style="text-align: center;">
					<fieldset>
						<button type="submit">
							{{ mainStore.t.i.buttons.export }}
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
import { ref, inject, onMounted, onUnmounted } from 'vue';
import { useMainStore } from '@/stores/main';;
import { useRouter, useRoute } from 'vue-router';
import PlacesTree from './PlacesTree.vue';
import { constants } from '../shared/constants';

export interface IPlacesPopupExportProps {
	mime?: string;
}
/*
const props = withDefaults(defineProps<IPlacesPopupExportProps>(), {
	mime: 'application/json',
});
*/
const mainStore = useMainStore();
const router = useRouter();
const route = useRoute();

const popuped = ref(false);

const selectedToExport = inject('selectedToExport');
const exportPlaces = inject<typeof exportPlaces>('exportPlaces');

const close = (event?: Event): void => {
	if (event) event.stopPropagation();
	router.replace(route.matched[route.matched.length - 2].path);
};
const keyup = (event: Event): void => {
	switch (
		(constants.shortcuts as Record<string, string>)
			[(event as KeyboardEvent).code]
	) {
		case 'close' :
			close(event);
			break;
	}
};

onMounted(() => {
	window.setTimeout(() => {
		popuped.value = true;
	}, 1);
	for (
		const f of
		document.getElementById('popup-export__tree')!
			.getElementsByClassName('folder')
	) {
		f.classList.add('folder_closed');
		f.classList.remove('folder_opened');
	}
	document.addEventListener('keyup', keyup, false);
});
onUnmounted(() => {
	document.removeEventListener('keyup', keyup);
});
</script>
