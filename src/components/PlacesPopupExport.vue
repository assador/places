<template>
	<div
		:class="'popup ' + (popuped ? 'appear' : 'disappear')"
		@click="e => close(e)"
	>
		<div class="popup-content centered">
			<div class="brand">
				<h1 class="margin_bottom_0">
					{{ store.state.main.t.i.captions.exportPlaces }}
				</h1>
			</div>
			<p class="margin_bottom_0">
				{{ store.state.main.t.i.text.specifyFormatToExport }}:
			</p>
			<form
				class="popup-export__form"
				@click="e => {
					e.stopPropagation();
					store.commit('main/setIdleTime', 0);
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
						>
						&#160;
						<span>GPX</span>
					</label>
					<p>
						{{ store.state.main.t.i.text.descGpx }}
					</p>
					<label>
						<input
							name="mime"
							type="radio"
							value="application/json"
						>
						&#160;
						<span>JSON</span>
					</label>
					<p>
						{{ store.state.main.t.i.text.descJson }}
					</p>
				</fieldset>
				<p>{{ store.state.main.t.i.text.specifyPlacesToExport }}:</p>
				<div
					v-if="
						Object.keys(store.state.main.places).length > 0 ||
						Object.keys(store.state.main.folders).length > 0
					"
					id="popup-export__tree"
					class="menu"
					@click="e => e.stopPropagation()"
				>
					<places-tree
						instanceid="popupexporttree"
						:data="store.state.main.tree || {}"
					/>
				</div>
				<div style="text-align: center;">
					<fieldset>
						<button type="submit">
							{{ store.state.main.t.i.buttons.export }}
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
import { ref, inject, onMounted, onBeforeUnmount, onBeforeUpdate } from 'vue';
import { useStore } from 'vuex';
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
const store = useStore();
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
			[(event as KeyboardEvent).keyCode]
	) {
		case 'close' :
			close(event);
			break;
	}
};

onMounted(() => {
	popuped.value = true;
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
onBeforeUpdate(() => {
	popuped.value = true;
});
onBeforeUnmount(() => {
	document.removeEventListener('keyup', keyup, false);
});
</script>
