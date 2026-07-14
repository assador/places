<template>
	<div class="action-button-group">
		<button
			class="action-button"
			:title="mainStore.t.i.hints.centerTo"
			@click="() => { if (!centerTo()) mainStore.setMessage('Ахахаха!!!', 3); }"
		>
			<span class="icon icon-cross" />
		</button>
		<button
			v-if="common.compact === 2"
			class="action-button"
			:title="mainStore.t.i.hints.hideCells"
			@click="hideCells"
		>
			<span class="icon icon-expand" />
		</button>
	</div>
</template>

<script setup lang="ts">
import { ref, Ref, inject } from 'vue';
import { common } from '@/services/common';
import { useMainStore } from '@/stores/main';
import { Point } from '@/types';

const mainStore = useMainStore();

const cells = inject<Ref<{
	top: boolean,
	right: boolean,
	bottom: boolean,
	left: boolean,
}>>('cells', ref({
	top: false,
	right: false,
	bottom: false,
	left: false,
}));

const centerTo = (): boolean => {
	let point: Point | undefined = undefined;
	if (mainStore.mode === 'routes') {
		const route = mainStore.currentRoute;
		if (route && route.choosing !== null) {
			const pointDesc = route.points[route.choosing];
			if (pointDesc) point = mainStore.getPointById(pointDesc.id);
		}
	} else {
		const place = mainStore.currentPlace;
		if (place?.pointid) {
			point = mainStore.getPointById(place.pointid);
		}
		if (!point && mainStore.currentPointId) {
			point = mainStore.getPointById(mainStore.currentPointId);
		}
	}
	if (point) {
		mainStore.center = {
			latitude: point.latitude,
			longitude: point.longitude,
		};
		return true;
	}
	return false;
};
const hideCells = () => {
	cells.value = {
		top: false,
		right: false,
		bottom: false,
		left: false,
	}
};
</script>
