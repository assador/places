<template>
	<div class="action-button-group">
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
			@click="e => upsertHere(e)"
		>
			<span class="icon icon-plus-net" />
		</button>
	</div>
</template>

<script setup lang="ts">
import { useMainStore } from '@/stores/main';
import { useGeolocation } from '@/services/geolocation';
import { common } from '@/services/common';
import { calculatePopupPosition } from '@/shared/common';

const mainStore = useMainStore();
const geoLocation = useGeolocation();

const upsertHere = async (e: PointerEvent) => {
	const info = await mainStore.upsertEntityWithCurrentLocation(mainStore.mode);
	if (info && !(info instanceof Error) && info.id) {
		common.setPointInfo({ id: info.id, entity: info.of ?? undefined });
		common.showPopup(calculatePopupPosition(e));
	}
}
</script>
