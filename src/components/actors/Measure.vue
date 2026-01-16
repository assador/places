<template>
	<div
		v-if="mainStore.measure.show"
		class="control-measure"
	>
		<dt>
			<span v-if="mainStore.measure.points.length > 1">
				{{ mainStore.t.i.captions.measure }}:
				<span class="imp_02">
					{{ mainStore.measure.distance.toFixed(3) }}
				</span>
				{{ mainStore.t.i.text.km }}
			</span>
			<span v-else>
				{{ mainStore.t.i.captions.measureChoose }}
				<span class="help" :title="mainStore.t.i.hints.measure" />
			</span>
		</dt>
		<dd
			v-for="(id, index) in mainStore.measure.points"
			:key="index"
			draggable
			:data-places-measure-point-id="id"
			class="draggable"
			@dragstart="e => handleDragStart(e, 'measure')"
			@dragenter="handleDragEnter"
			@drop="handleDrop"
		>
			<span v-if="mainStore.temps[id]">
				{{ `${mainStore.t.i.captions.measurePoint} ${mainStore.tempIndexById(id) + 1}` }}
			</span>
			<span v-else-if="mainStore.places[id] || mainStore.commonPlaces[id]">
				{{
					(mainStore.places[id]
						? mainStore.places[id]
						: mainStore.commonPlaces[id]
					).name
				}}
			</span>
			<span class="control-buttons">
				<button
					:title="mainStore.t.i.buttons.specify"
					class="button-iconed"
					:class="mainStore.measure.choosing === index ? 'button-pressed' : ''"
					@click="
						mainStore.measure.choosing =
							mainStore.measure.choosing === index
								? mainStore.measure.points.length
								: index
					"
				>
					<span>↪</span>
				</button>
				<button
					class="button-iconed icon icon-cross-45"
					:title="mainStore.t.i.buttons.clear"
					@click="
						mainStore.measure.points.splice(index, 1);
						mainStore.measure.choosing = mainStore.measure.points.length;
					"
				/>
			</span>
		</dd>
		<dd
			v-if="mainStore.measure.points.length > 0"
			class="control-measure-clearall"
		>
			<strong>
				{{ mainStore.t.i.buttons.clearAll }}
			</strong>
			<button
				class="button-iconed icon icon-cross-45"
				:title="mainStore.t.i.buttons.clearAll"
				@click="
					mainStore.measure.points.length = 0;
					mainStore.measure.choosing = 0;
				"
			/>
		</dd>
	</div>
</template>

<script setup lang="ts">
import { watch, inject } from 'vue';
import { useMainStore } from '@/stores/main';

const handleDragStart = inject('handleDragStart') as (...args: any[]) => any;
const handleDragEnter = inject('handleDragEnter') as (...args: any[]) => any;
const handleDrop = inject('handleDrop') as (...args: any[]) => any;

const mainStore = useMainStore();

watch(() => mainStore.measure.points, () => mainStore.measureDistance(), { deep: true });
watch(() => mainStore.points, () => mainStore.measureDistance(), { deep: true });
watch(() => mainStore.temps, () => mainStore.measureDistance(), { deep: true });
</script>

<style lang="scss" scoped>
.control-measure {
	strong {
		text-align: right;
	}
	dd {
		display: flex;
		flex-flow: row wrap;
		justify-content: flex-end;
		gap: 8px;
		margin-top: 8px;
		padding-left: 0;
		align-items: center;
		> *, .actions-button {
			flex: 0 1 auto;
			&:first-child {
				flex: 1 1 auto;
				min-width: 3em;
			}
		}
	}
	.control-buttons button {
		width: 22px;
	}
}
</style>
