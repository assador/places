<template>
	<div class="action-button-group">
		<button
			class="action-button"
			:class="{ 'button-pressed': mainStore.markersShow }"
			:title="mainStore.t.i.hints.shMarkers"
			@click="mainStore.markersShowHide()"
		>
			<span class="icon icon-geomark-1" />
		</button>
		<button
			class="action-button"
			:class="{ 'button-pressed': mainStore.centerMarkerShow }"
			:title="mainStore.t.i.hints.shCenter"
			@click="mainStore.centerMarkerShowHide()"
		>
			<span class="icon icon-circle-circle" />
		</button>
	</div>
</template>

<script setup lang="ts">
import { useMainStore } from '@/stores/main';

const mainStore = useMainStore();
</script>
