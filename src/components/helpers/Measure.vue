<template>
	<div
		v-if="mainStore.measure.show"
		class="helpers-measure"
	>
		<div class="helpers-measure-header">
			<h2 class="color-01">{{ mainStore.t.i.captions.measure }}</h2>
			<span v-if="mainStore.measure.points.length > 1">
				<span class="imp_02">
					{{ mainStore.measure.distance.toFixed(3) }}
				</span>
				{{ mainStore.t.i.text.km }}
			</span>
			<span v-else>
				{{ mainStore.t.i.captions.measureChoose }}
				<span class="help" :title="mainStore.t.i.hints.measure" />
			</span>
		</div>
		<Points type="measure" />
	</div>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { useMainStore } from '@/stores/main';
import Points from '@/components/Points.vue';

const mainStore = useMainStore();

watch(() => mainStore.measure.points, () => mainStore.measureDistance(), { deep: true });
watch(() => mainStore.points, () => mainStore.measureDistance(), { deep: true });
watch(() => mainStore.temps, () => mainStore.measureDistance(), { deep: true });
</script>

<style lang="scss" scoped>
.helpers-measure {
	&-header {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 8px;
		margin-bottom: 12px;
		align-items: baseline;
		* {
			margin: 0;
		}
	}
}
</style>
