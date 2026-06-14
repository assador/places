<template>
	<button
		class="action-button"
		:title="mainStore.t.i.hints.centerTo"
		@click="centerTo"
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
</template>

<script setup lang="ts">
import { Ref, inject } from 'vue';
import { common } from '@/services/common';
import { useMainStore } from '@/stores/main';

const mainStore = useMainStore();

const cells = inject<Ref<{
	top: boolean,
	right: boolean,
	bottom: boolean,
	left: boolean,
}>>('cells');

const centerTo = () => {
	if (mainStore.currentPoint) {
		mainStore.center = {
			latitude: mainStore.currentPoint.latitude,
			longitude: mainStore.currentPoint.longitude,
		};
	}
}
const hideCells = () => {
	cells.value = {
		top: false,
		right: false,
		bottom: false,
		left: false,
	}
};
</script>

<style lang="scss" scoped>
</style>
