<template>
	<div class="action-button-group">
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
	</div>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import { useMainStore } from '@/stores/main';

const changeMode = inject<(mode: string) => void>('changeMode', () => {});

const mainStore = useMainStore();
</script>
