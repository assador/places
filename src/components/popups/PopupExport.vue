<template>
	<transition name="fade">
		<div
			v-if="popuped"
			class="popup popup-export"
		>
			<div class="popup-content centered">
				<h1>
					{{ mainStore.t.i.captions.exportPlaces }}
				</h1>
				<form
					class="popup-export__form"
					@submit.prevent="e => exportPlaces(
						selectedToExport,
						(e.currentTarget as HTMLFormElement).elements['mime'].value
					)"
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
import { ref, inject, onMounted, onUnmounted } from 'vue';
import { useMainStore } from '@/stores/main';
import { useRouter, useRoute } from 'vue-router';
import Tree from '@/components/tree/Tree.vue';

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
	popuped.value = true;
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
	max-height: 100%;
}
.popup-export__tree {
	margin: 0 auto;
	padding-right: 12px;
	text-align: left;
	overflow: auto;
}
.popup-export__buttons {
	display: flex;
	gap: 12px;
	justify-content: center;
}
</style>
