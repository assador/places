<template>
	<button
		class="action-button"
		:title="mainStore.t.i.hints.getLocation"
		@click="geoLocation.centerTo()"
	>
		<span class="icon icon-center-net" />
	</button>
	<button
		class="action-button"
		:disabled="mainStore.mode === 'routes' && !mainStore.currentRoute"
		:title="
			`${mainStore.t.i.hints.getLocation}. ` +
			`${mainStore.t.i.hints[mainStore.mode === 'normal' ? 'addPlace' : 'addPoint']}.`
		"
		@click="async () => {
			await mainStore.upsertEntityWithCurrentLocation(mainStore.mode);
			if (mainStore.mode === 'normal') focusCurrent(currentPlaceNameInputRef);
		}"
	>
		<span class="icon icon-plus-net" />
	</button>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import { useMainStore } from '@/stores/main';
import { useGeolocation } from '@/services/geolocation';

const focusCurrent = inject<(input: HTMLElement | null) => void>('focusCurrent');
const currentPlaceNameInputRef = inject<HTMLElement | null>('currentPlaceNameInputRef');

const mainStore = useMainStore();
const geoLocation = useGeolocation();
</script>

<style lang="scss" scoped>
</style>
