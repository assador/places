<template>
	<transition name="fade">
		<div
			v-if="show"
			class="popup popup-export"
		>
			<div class="popup-content centered">
				<h1>
					{{ mainStore.t.i.captions.exportPlaces }}
				</h1>
				<form
					class="popup-export__form"
					@submit.prevent="handleExportSubmit"
				>
					<p class="margin_bottom_0">
						{{ mainStore.t.i.text.specifyFormatToExport }}:
					</p>
					<fieldset class="margin_bottom">
						<label>
							<input
								name="mime"
								type="radio"
								:checked="true"
								value="gpx"
							/>
							GPX
						</label>
						<p>
							{{ mainStore.t.i.text.descGpx }}
						</p>
						<label>
							<input
								name="mime"
								type="radio"
								value="json"
							/>
							JSON
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
						class="popup-export__tree menu"
					>
						<Tree instanceid="popupexporttree" what="places" />
					</div>
					<fieldset class="popup-export__buttons">
						<button type="submit">
							{{ mainStore.t.i.buttons.export }}
						</button>
						<button
							type="button"
							@click="close()"
						>
							{{ mainStore.t.i.buttons.cancel }}
						</button>
					</fieldset>
				</form>
			</div>
			<a
				href="javascript:void(0)"
				class="close"
				@click="close()"
			>
				×
			</a>
		</div>
	</transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useMainStore } from '@/stores/main';
import { useRouter, useRoute } from 'vue-router';
import { exportPlaces } from '@/shared/importexport';
import { ImportExportFormat } from '@/types';
import Tree from '@/components/tree/Tree.vue';

const mainStore = useMainStore();
const router = useRouter();
const route = useRoute();

const show = ref(false);

const close = (): void => {
	router.replace(route.matched[route.matched.length - 2].path);
};
const keyup = (event: KeyboardEvent): void => {
	if (event.key === 'Escape') close();
};
const handleExportSubmit = (e: Event) => {
	const formElement = e.currentTarget as HTMLFormElement;
	const formData = new FormData(formElement);
	const mimeType = formData.get('mime') as ImportExportFormat;
	exportPlaces(mimeType);
};

onMounted(() => {
	show.value = true;
	document.addEventListener('keyup', keyup, false);
});
onUnmounted(() => {
	document.removeEventListener('keyup', keyup);
});
</script>

<style lang="scss" scoped>
.popup-export__form {
	display: grid;
	grid-template-rows: auto auto auto 1fr auto;
	max-width: 600px; max-height: 100%;
	text-align: center;
	fieldset {
		margin: 1em;
	}
	label {
		display: block;
	}
}
.popup-export__tree {
	margin: 0 auto;
	padding: 1px 12px 1px 0;
	text-align: left;
	overflow: auto;
}
.popup-export__buttons {
	display: flex;
	gap: 12px;
	justify-content: center;
}
</style>
