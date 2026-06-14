<template>
	<button
		id="actions-places"
		class="action-button"
		:class="{ 'button-pressed': mainStore.placesShow.show }"
		:title="mainStore.t.i.captions.places"
		accesskey="p"
		@click="() => mainStore.placesShow.show = !mainStore.placesShow.show"
	>
		<span class="icon icon-geomark-1" />
		<span>{{ mainStore.t.i.buttons.places }}</span>
	</button>
	<button
		id="actions-routes"
		class="action-button"
		:class="{ 'button-pressed': mainStore.routesShow.show }"
		:title="mainStore.t.i.captions.routes"
		accesskey="t"
		@click="() => mainStore.routesShow.show = !mainStore.routesShow.show"
	>
		<span class="icon icon-route" />
		<span>{{ mainStore.t.i.buttons.routes }}</span>
	</button>
	<button
		id="actions-points"
		class="action-button"
		:class="{ 'button-pressed': mainStore.tempsShow.show }"
		:title="mainStore.t.i.buttons.pointsTemporary"
		accesskey="t"
		@click="() => mainStore.tempsShow.show = !mainStore.tempsShow.show"
	>
		<span class="icon icon-geomark-3" />
		<span>{{ mainStore.t.i.buttons.points }}</span>
	</button>
	<button
		id="actions-range"
		class="action-button actions-button_bigger"
		:class="{ 'button-pressed': mainStore.rangeShow }"
		:title="mainStore.t.i.buttons.range"
		accesskey="r"
		@click="() => {
			mainStore.rangeShow = !mainStore.rangeShow;
			mainStore.rangeShow
				? mainStore.showInRange(mainStore.range)
				: mainStore.showInRange(null)
		}"
	>
		<span class="icon icon-compas" />
		<span>{{ mainStore.t.i.buttons.range }}</span>
	</button>
	<button
		id="actions-edit-folders"
		class="action-button"
		:class="{ 'button-pressed': common.folderEditability }"
		:title="mainStore.t.i.hints.editFolders"
		accesskey="c"
		@click="common.toggleFolderEditability"
	>
		<span class="icon icon-empty icon-empty-small">A|</span>
		<span>{{ mainStore.t.i.buttons.editFolders }}</span>
	</button>
</template>

<script setup lang="ts">
import { common } from '@/services/common';
import { useMainStore } from '@/stores/main';

const mainStore = useMainStore();
</script>

<style lang="scss" scoped>
.action-button {
	display: flex;
	flex-flow: column nowrap;
	gap: 4px;
	align-items: center;
	justify-content: center;
	min-width: 0 !important;
	padding: 2px 0 0 0;
}
.icon {
	&, &::before {
		width: 15px; height: 15px;
	}
}
</style>
