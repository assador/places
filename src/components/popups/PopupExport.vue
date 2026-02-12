<template>
	<div :class="'popup ' + (popuped ? 'appear' : 'disappear')">
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
						Object.keys(mainStore.places).length ||
						Object.keys(mainStore.folders).length
					"
					id="popup-export__tree"
					class="menu"
				>
					<Tree
						instanceid="popupexporttree"
						what="places"
						:data="mainStore.trees.places || {}"
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
							@click="close()"
						>
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
import { ref, inject, onMounted, onUnmounted } from 'vue';
import { useMainStore } from '@/stores/main';
import { useRouter, useRoute } from 'vue-router';
import Tree from '@/components/tree/Tree.vue';

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

const close = (): void => {
	router.replace(route.matched[route.matched.length - 2].path);
};
const keyup = (event: KeyboardEvent): void => {
	if (event.key === 'Escape') close();
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
		f.classList.remove('folder_open');
	}
	document.addEventListener('keyup', keyup, false);
});
onUnmounted(() => {
	document.removeEventListener('keyup', keyup);
});
</script>
