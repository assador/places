<template>
	<div class="points folder margin_bottom">
		<div class="folder-subs points-header">
			<h2
				:class="'child-basiccolor ' + (opened ? 'icon-opened' : 'icon-closed')"
				@click="opened = !opened"
			>
				{{ mainStore.t.i.captions.points }}
			</h2>
			<div
				v-if="type === 'temps'"
				class="folder-button__control button-iconed icon"
				:class="'icon-geomark-' + (!mainStore.tempsPlacemarksShow ? '0' : '1')"
				:title="
					(mainStore.tempsPlacemarksShow
						? mainStore.t.i.hints.hide
						: mainStore.t.i.hints.show
					) + ' ' +
					mainStore.t.i.hints.placemarksOnMap
				"
				@click="e => {
					e.stopPropagation();
					mainStore.tempsPlacemarksShow = 
						!mainStore.tempsPlacemarksShow;
				}"
			/>
			<div
				v-if="type === 'temps'"
				class="control-buttons"
			>
				<button
					class="button-iconed icon icon-plus"
					:title="mainStore.t.i.hints.addTemp"
					@click="mainStore.addTemp()"
				/>
				<button
					class="button-iconed icon icon-cross-45"
					:title="mainStore.t.i.hints.deleteAllTemps"
					@click="mainStore.deleteAllTemps()"
				/>
			</div>
			<div
				v-else-if="type === 'tracks'"
				class="control-buttons"
			>
				<button
					class="button-iconed icon icon-plus"
					:title="mainStore.t.i.hints.addTrackPoint"
					@click="mainStore.addTrackPoint()"
				/>
			</div>
		</div>
		<div :class="
			'points-list-buttons folder-subfolders ' +
			(opened ? 'opened' : 'closed')
		">
			<button
				v-if="type === 'temps'"
				v-for="(temp, id) in mainStore.temps"
				:class="temp.id === mainStore.currentPoint.id ? 'button-pressed' : ''"
				@click="e => {
					e.preventDefault();
					mainStore.choosePoint(temp);
				}"
				@contextmenu="e => {
					e.preventDefault();
					mainStore.choosePoint(temp, mainStore.mode);
				}"
			>
				<span>{{ temp.name }}</span>
				<span
					class="button-iconed icon icon-cross-45"
					:title="mainStore.t.i.hints.deleteTemp"
					@click="e => {
						e.stopPropagation();
						mainStore.deleteTemp(id);
					}"
				/>
			</button>
			<button
				v-else-if="type === 'tracks'"
				v-for="(point, idx) of mainStore.trackPoints(mainStore.currentTrack)"
				:key="point.id"
				:data-point="point.id"
				:data-pointidx="idx"
				:draggable="true"
				@dragstart="e => handleDragStart(e, 'points')"
				@dragenter="e => {
					highlighted = point.id;
					handleDragEnter(e);
				}"
				@dragend="highlighted = null"
				@drop="handleDrop"
				:class="
					point.id === highlighted ||
					point.id ===
						mainStore.currentTrack.points[mainStore.currentTrack.choosing]
							? 'button-pressed' : ''
				"
				@click="e => {
					e.preventDefault();
					mainStore.choosePoint(point);
				}"
				@contextmenu="e => {
					e.preventDefault();
					mainStore.choosePoint(point, mainStore.mode);
				}"
			>
				<span
					:data-point="point.id"
					:data-pointidx="idx"
					@dragenter="highlighted = point.id"
				>
					{{ point.name }}
				</span>
				<span
					:data-point="point.id"
					:data-pointidx="idx"
					:title="mainStore.t.i.hints.deleteTrack"
					class="button-iconed icon icon-cross-45"
					@dragenter="highlighted = point.id"
					@click="e => {
						e.stopPropagation();
						mainStore.deleteTrackPoint(point, mainStore.currentTrack);
					}"
				/>
			</button>
		</div>
		<div
			:title="distance + mainStore.t.i.hints.distanceBetweenPointsInFolder"
			class="points-distance"
		>
			<span class="un_color">{{ mainStore.t.i.captions.total }}: </span>
			<span class="color-01">{{ distance }}</span>
			<span class="un_color"> {{ mainStore.t.i.text.km }}</span>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue';
import { useMainStore } from '@/stores/main';

export interface IPlacesPointsProps {
	type?: string;
}
const props = withDefaults(defineProps<IPlacesPointsProps>(), {
	type: 'temps',
});

const handleDragStart = inject('handleDragStart') as (...args: any[]) => any;
const handleDragEnter = inject('handleDragEnter') as (...args: any[]) => any;
const handleDrop = inject('handleDrop') as (...args: any[]) => any;

const mainStore = useMainStore();

const opened = ref(true);
const highlighted = ref(null);

const distance = computed(() => {
	const idsArray = ref([]);
	const where = ref('points');
	switch (props.type) {
		case 'temps':
			idsArray.value = Object.keys(mainStore.temps);
			where.value = 'temps';
			break;
		case 'tracks':
			idsArray.value = mainStore.currentTrack !== null
				? mainStore.currentTrack.points : []
			;
			where.value = 'points';
			break;
	}
	return (
		Math.round(
			mainStore.distanceBetweenPoints(idsArray.value, where.value)
		* 1000) / 1000
	);
});
</script>

<style lang="scss" scoped>
.points-header {
	display: flex;
	gap: 8px;
	align-items: center;
	margin-bottom: 12px;
	&::before {
		margin-left: 0;
		width: 1em;
		margin-right: 8px;
	}
	& > * {
		cursor: pointer;
	}
	.folder-button__description {
		height: 44px;
	}
	h2 {
		flex: 1 0 auto;
		margin: 0;
		&::before {
			display: inline-block;
			width: 1em;
			font-size: 1rem;
		}
		&.icon-opened::before {
			content: '\25e4';
		}
		&.icon-closed::before {
			content: '\25e2';
		}
	}
	.control-buttons {
		flex: 0 1 auto;
		align-self: flex-start;
		justify-content: right;
	}
	&:has(+ .folder-subfolders .points-list-buttons:empty) {
		margin-bottom: 0 !important;
	}
}
.points-list-buttons {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
	gap: 8px;
	button {
		display: grid;
		grid-template-columns: 1fr auto;
		align-items: center;
		margin: 0;
		padding: 0 0 0 4px;
		flex: 1 0 auto;
		& > *:last-child {
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 8px 6px;
			line-height: 0;
		}
	}
	&.closed {
		display: none;
	}
}
.points-distance {
	margin-top: 8px;
}
</style>
