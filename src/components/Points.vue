<template>
	<div
		:class="
			'points folder margin_bottom ' +
			(opened ? 'folder_opened' : 'folder_closed')
		"
	>
		<div class="folder-subs points-header">
			<div
				class="folder-button"
				@click="opened = !opened"
			>
				<div class="folder-button__content">
					<h2>{{ mainStore.t.i.captions.points }}</h2>
				</div>
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
			</div>
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
		<div class="folder-subfolders">
			<div class="points-list-buttons">
				<button
					v-if="type === 'temps'"
					v-for="(temp, id) in mainStore.temps"
					:class="temp === mainStore.currentTemp ? 'button-pressed' : ''"
					@click="emitter.emit('choosePoint', {point: temp})"
					@contextmenu="e => {
						e.preventDefault();
						emitter.emit('choosePoint', {
							point: temp,
							mode: mainStore.mode,
						});
					}"
				>
					<span>{{ Object.keys(mainStore.temps).indexOf(id) + 1 }}</span>
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
					v-for="
						(point, index) of
						mainStore.trackAllPointsArray(mainStore.currentTrack)
					"
					:class="
						point.point === mainStore.currentTrackPoint
							? 'button-pressed' : ''
					"
					@click="emitter.emit('choosePoint', {point: point.point})"
					@contextmenu="e => {
						e.preventDefault();
						emitter.emit('choosePoint', {
							point: point.point,
							mode: mainStore.mode,
						});
					}"
				>
					<span>{{ index + 1 }}</span>
					<span
						class="button-iconed icon icon-cross-45"
						:title="mainStore.t.i.hints.deleteTrack"
						@click="e => {
							e.stopPropagation();
							mainStore.deleteTrackPoint(
								mainStore.currentTrack, point.point.id
							);
						}"
					/>
				</button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, Ref } from 'vue';
import { useMainStore } from '@/stores/main';
import { emitter } from '@/shared/bus';

export interface IPlacesPointsProps {
	type?: string;
}
const props = withDefaults(defineProps<IPlacesPointsProps>(), {
	type: 'temps',
});
const mainStore = useMainStore();

const opened = ref(true);
</script>

<style lang="scss" scoped>
.points-header {
	gap: 8px;
	.folder-button {
		margin-left: -2px;
		&::before {
			margin-left: 0;
			width: 1em;
			margin-right: 8px;
		}
		.folder-button__description {
			height: 44px;
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
	display: flex;
	flex-flow: row wrap;
	gap: 8px;
	button {
		display: grid;
		grid-template-columns: 1fr auto;
		align-items: center;
		width: 40px;
		margin: 0;
		padding: 0 0 0 4px;
		& > *:last-child {
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 8px 6px;
			line-height: 0;
		}
	}
}
</style>
