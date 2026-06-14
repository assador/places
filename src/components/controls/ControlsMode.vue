<template>
	<button
		id="mode-normal"
		class="action-button"
		:class="{ 'button-pressed': mainStore.mode === 'normal' }"
		:title="mainStore.t.i.captions.modeNormal"
		accesskey="m"
		@click="changeMode('normal')"
	>
		<span class="icon icon-geomark-1" />
		<span>{{ mainStore.t.i.buttons.normal }}</span>
	</button>
	<button
		id="mode-routes"
		class="action-button"
		:class="{ 'button-pressed': mainStore.mode === 'routes' }"
		:title="mainStore.t.i.captions.modeRoutes"
		accesskey="m"
		@click="changeMode('routes')"
	>
		<span class="icon icon-route" />
		<span>{{ mainStore.t.i.buttons.routes }}</span>
	</button>
	<button
		id="mode-measure"
		class="action-button"
		:class="{ 'button-pressed': mainStore.mode === 'measure' }"
		:title="mainStore.t.i.captions.modeMeasure"
		accesskey="m"
		@click="changeMode('measure')"
	>
		<span class="icon icon-ruler" />
		<span>{{ mainStore.t.i.buttons.measure }}</span>
	</button>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import { useMainStore } from '@/stores/main';

const changeMode = inject<(mode: string) => void>('changeMode');

const mainStore = useMainStore();
</script>

<style lang="scss" scoped>
.action-button {
	display: flex;
	flex-flow: column nowrap;
	gap: 4px;
	align-items: center;
	justify-content: center;
	min-width: 0;
	padding: 2px 0 0 0;
}
.icon {
	&, &::before {
		width: 15px; height: 15px;
	}
}
#bottom-basic .action-button {
	padding: 0;
	& > :not(.icon) {
		display: none;
	}
}
</style>
