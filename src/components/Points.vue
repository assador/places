<template>
	<div class="points folder margin_bottom">
		<div class="folder-subs points-header">
			<h2
				:class="opened ? 'icon-opened' : 'icon-closed'"
				@click="opened = !opened"
			>
				<template v-if="type === 'temps'">
					{{ mainStore.t.i.captions.pointsIndependent }}
				</template>
				<template v-else-if="type === 'track'">
					{{ mainStore.t.i.captions.pointsTrack }}
				</template>
				<template v-else>
					{{ mainStore.t.i.captions.points }}
				</template>
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
				v-else-if="type === 'track'"
				class="control-buttons"
			>
				<button
					class="button-iconed icon icon-plus"
					:title="mainStore.t.i.hints.addTrackPoint"
					@click="async () => await mainStore.addTrackPoint()"
				/>
			</div>
			<div
				v-else-if="type === 'measure'"
				class="control-buttons"
			>
				<button
					class="button-iconed icon icon-plus"
					:title="mainStore.t.i.hints.addTemp"
					@click="async () => {
						const point = await mainStore.addTemp();
						mainStore.choosePoint(point, 'measure');
					}"
				/>
				<button
					class="button-iconed icon icon-cross-45"
					:title="mainStore.t.i.buttons.clearAll"
					@click="() => {
						mainStore.measure.points.length = 0;
						mainStore.measure.choosing = 0;
					}"
				/>
			</div>
		</div>
		<div
			v-if="
				type === 'temps' && Object.keys(mainStore.temps).length > 0 ||
				type === 'track' && mainStore.currentTrack.points.length > 0 ||
				type === 'measure' && mainStore.measure.points.length > 0
			"
			class="points-info"
		>
			<Teleport to="#container">
				<Popup
					:show="popupProps.show"
					:position="popupProps.position"
					:closeOnClick="false"
					class="points-coordinates messages"
					@update:show="popupProps.show = $event"
				>
					<template v-slot:slot>
						<a
							v-if="!copied"
							href="javascript:void(0)"
							class="points-coordinates-copy"
							@click="copyCoords(pointInfo.point)"
						>
							{{ mainStore.t.i.text.copy }}
						</a>
						<div
							v-else
							class="points-coordinates-copy"
						>
							{{ mainStore.t.i.text.copied }}
						</div>
						<h3>
							<span class="un_color">
								{{ mainStore.t.i.captions.measurePoint }}:
							</span>
							<span class="color-01">
								{{ pointInfo.point?.name }}
							</span>
						</h3>
						<div class="nobr">
							<span class="un_color">
								{{ mainStore.t.i.captions.latitude }}:
							</span>
							<span class="color-01">
								{{ latitude2string(pointInfo.point?.latitude) }}°
							</span>
						</div>
						<div class="nobr">
							<span class="un_color">
								{{ mainStore.t.i.captions.longitude }}:
							</span>
							<span class="color-01">
								{{ longitude2string(pointInfo.point?.longitude) }}°
							</span>
						</div>
						<div
							v-if="
								pointInfo.point &&
								Object.hasOwn(pointInfo.point, 'altitude') &&
								!isNaN(pointInfo.point.altitude)
							"
							class="nobr"
						>
							<span class="un_color">
								{{ mainStore.t.i.captions.altitude }}:
							</span>
							<span class="color-01">
								{{ pointInfo.point?.altitude }}
								{{ mainStore.t.i.text.m }}
							</span>
						</div>
					</template>
				</Popup>
			</Teleport>
			<div
				v-if="type === 'track'"
				:title="distance + mainStore.t.i.hints.distanceBetweenPointsInFolder"
				class="points-distance"
			>
				<span class="un_color">{{ mainStore.t.i.captions.total }}: </span>
				<span class="color-01">{{ distance }}</span>
				<span class="un_color"> {{ mainStore.t.i.text.km }}</span>
			</div>
			<a
				v-if="mainStore.currentPoint"
				href="javascript:void(0)"
				@click="e => {
					pointInfo.point = mainStore.currentPoint;
					popupProps.show = !popupProps.show;
					popupProps.position.top = e.clientY + 5;
					popupProps.position.right = (
						type === 'track'
						? (
							e.view.document.documentElement.clientWidth -
							e.clientX + 5
						)
						: 'auto'
					);
					popupProps.position.left = (
						type === 'track'
						? 'auto'
						: e.clientX + 5
					);
				}"
			>
				{{ mainStore.t.i.captions.coords }}
			</a>
		</div>
		<div :class="
			'points-list-buttons folder-subfolders ' +
			(opened ? 'opened' : 'closed')
		">
			<button
				v-if="type === 'temps'"
				v-for="(temp, id) in mainStore.temps"
				:class="
					mainStore.currentPoint &&
					mainStore.currentPoint.id === temp.id
						? 'button-pressed' : ''
				"
				@click.prevent="mainStore.choosePoint(temp)"
				@contextmenu.prevent="mainStore.choosePoint(temp, mainStore.mode)"
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
				v-else-if="type === 'track'"
				v-for="(point, idx) in mainStore.trackPoints(mainStore.currentTrack)"
				:key="point.id"
				:data-point="point.id"
				:data-pointidx="idx"
				:data-pointof="'track'"
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
					point.id === mainStore.currentPoint.id
						? 'button-pressed' : ''
				"
				@click.prevent="() => {
					pointInfo.point = point;
					mainStore.choosePoint(point);
				}"
				@contextmenu.prevent="e => {
					pointInfo.point = point;
					popupProps.show = !popupProps.show;
					popupProps.position.top = e.clientY + 5;
					popupProps.position.right =
						e.view.document.documentElement.clientWidth -
						e.clientX + 5;
				}"
			>
				<span
					:data-point="point.id"
					:data-pointidx="idx"
					:data-pointof="'track'"
					@dragenter="highlighted = point.id"
				>
					{{ point.name }}
				</span>
				<span
					:data-point="point.id"
					:data-pointidx="idx"
					:data-pointof="'track'"
					:title="mainStore.t.i.hints.deleteTrack"
					class="button-iconed icon icon-cross-45"
					@dragenter="highlighted = point.id"
					@click="e => {
						e.stopPropagation();
						mainStore.deleteTrackPoint(point, mainStore.currentTrack);
					}"
				/>
			</button>
			<button
				v-else-if="type === 'measure'"
				v-for="(id, idx) in mainStore.measure.points"
				:key="id"
				:data-point="id"
				:data-pointidx="idx"
				:data-pointof="'measure'"
				:draggable="true"
				@dragstart="e => handleDragStart(e, 'points')"
				@dragenter="e => {
					highlighted = id;
					handleDragEnter(e);
				}"
				@dragend="highlighted = null"
				@drop="handleDrop"
				:class="
					id === highlighted ||
					id ===
						mainStore.measure.points[mainStore.measure.choosing]
							? 'button-pressed' : ''
				"
				@click.prevent="mainStore.choosePoint(mainStore.getPointById(id))"
				@contextmenu.prevent="
					mainStore.choosePoint(
						mainStore.getPointById(id), mainStore.mode
					)
				"
			>
				<span
					:data-point="id"
					:data-pointidx="idx"
					:data-pointof="'measure'"
					@dragenter="highlighted = id"
				>
					{{ mainStore.getPointById(id)?.name }}
				</span>
				<span
					:data-point="id"
					:data-pointidx="idx"
					:data-pointof="'measure'"
					:title="mainStore.t.i.hints.deleteTrack"
					class="button-iconed icon icon-cross-45"
					@dragenter="highlighted = id"
					@click="e => {
						e.stopPropagation();
						mainStore.measure.points.splice(idx, 1);
						if (idx > mainStore.measure.points.length - 1) {
							mainStore.measure.choosing = mainStore.measure.points.length - 1
						};
					}"
				/>
			</button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue';
import { useMainStore } from '@/stores/main';
import {
	IPlacesPopupProps,
	latitude2string,
	longitude2string,
	point2coords
} from '@/shared';
import { Point } from '@/stores/types';
import Popup from '@/components/popups/Popup.vue';

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
const pointInfo = ref({
	point: null,
});
const popupProps = ref<IPlacesPopupProps>({
	show: false,
	position: {
		top: 'auto',
		right: 'auto',
		bottom: 'auto',
		left: 'auto',
	},
});

const copied = ref(false);
const copyCoords = async (point: Point) => {
	await navigator.clipboard.writeText(
		point2coords(point, mainStore.t.i.text.m, mainStore.t.i.text.h)
	);
	copied.value = true;
	setTimeout(() => copied.value = false, 2000);
};

const distance = computed(() => {
	const idsArray = ref([]);
	const where = ref('points');
	switch (props.type) {
		case 'temps':
			idsArray.value = Object.keys(mainStore.temps);
			where.value = 'temps';
			break;
		case 'track':
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
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(0, auto));
	gap: 8px;
	align-items: start;
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
		display: flex;
		gap: 8px;
		align-items: baseline;
		margin: 0;
		&::before {
			display: inline-block;
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
.points-info {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
	gap: 8px;
	align-items: start;
	margin: -8px 0 8px 0;
	:last-child {
		text-align: right;
	}
}
.points-coordinates {
	padding: 30px 20px 10px 20px;
	text-align: right;
	h3 {
		text-align: center;
		margin-bottom: 8px;
	}
	&-degminsecalt, &-copy {
		margin-top: 12px;
	}
	&-copy {
		display: block;
		position: absolute;
		top: -6px; left: 10px;
	}
}
</style>
