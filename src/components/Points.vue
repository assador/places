<template>
	<div class="points folder margin_bottom">
		<div class="folder-subs points-header">
			<div
				class="icon icon-triangle"
				:class="opened ? 'icon-triangle_down' : 'icon-triangle_right'"
			/>
			<h2 @click="opened = !opened">
				<template v-if="type === 'temps'">
					{{ mainStore.t.i.captions.pointsIndependent }}
				</template>
				<template v-else-if="type === 'route'">
					{{ mainStore.t.i.captions.pointsRoute }}
				</template>
				<template v-else-if="type === 'measure'">
					{{ mainStore.t.i.captions.pointsMeasure }}
				</template>
				<template v-else>
					{{ mainStore.t.i.captions.points }}
				</template>
			</h2>
			<div
				v-if="type === 'temps'"
				class="folder-button__control button-iconed icon"
				:class="'icon-geomark-' + (!mainStore.tempsPlacemarksShow ? '0' : '1') + '-circled'"
				:title="
					(mainStore.tempsPlacemarksShow
						? mainStore.t.i.hints.hide
						: mainStore.t.i.hints.show
					) + ' ' +
					mainStore.t.i.hints.placemarksOnMap
				"
				@click.stop="
					mainStore.tempsPlacemarksShow = !mainStore.tempsPlacemarksShow
				"
			/>
			<div v-else />
			<div
				v-if="type === 'temps'"
				class="control-buttons"
			>
				<button
					class="button-iconed icon icon-plus-circled"
					:title="mainStore.t.i.hints.addTemp"
					@click="mainStore.upsertPoint({ where: mainStore.temps })"
				/>
				<button
					class="button-iconed icon icon-cross-45-circled"
					:title="mainStore.t.i.hints.deleteAllTemps"
					@click="mainStore.deleteAllTemps()"
				/>
			</div>
			<div
				v-else-if="type === 'route'"
				class="control-buttons"
			>
				<button
					class="button-iconed icon icon-plus-circled"
					:title="mainStore.t.i.hints.addRoutePoint"
					@click="() => {
						mainStore.upsertPoint({
							where: mainStore.points,
							whom: mainStore.currentRoute,
						});
					}"
				/>
			</div>
			<div
				v-else-if="type === 'measure'"
				class="control-buttons"
			>
				<button
					class="button-iconed icon icon-plus-circled"
					:title="mainStore.t.i.hints.addTemp"
					@click="() => {
						const point = mainStore.upsertPoint({ where: mainStore.temps });
						mainStore.addPointToPoints(point, mainStore.measure);
					}"
				/>
				<button
					class="button-iconed icon icon-cross-45-circled"
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
				type === 'route' && mainStore.currentRoute.points.length > 0 ||
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
								{{ pointInfo.name }}
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
				v-if="type === 'route'"
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
					popupProps.position.bottom = 'auto';
					popupProps.position.top = e.clientY + 5;
					popupProps.position.right = (
						type === 'route'
						? (
							e.view.document.documentElement.clientWidth -
							e.clientX + 5
						)
						: 'auto'
					);
					popupProps.position.left = (
						type === 'route'
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

<!-- SEC Buttons: Temps -->

			<button
				v-if="type === 'temps'"
				v-for="(temp, idx) in mainStore.lonelyTemps"
				:class="mainStore.currentPoint?.id === temp.id ? 'button-pressed' : ''"
				@click.prevent="mainStore.setCurrentPoint(temp.id)"
				@contextmenu.prevent="e => {
					if (
						mainStore.mode === 'measure' ||
						mainStore.mode === 'routes'
					) {
						mainStore.addPointToPoints(temp);
						return;
					}
					pointInfo.point = temp;
					pointInfo.name = (idx + 1).toString();
					popupProps.show = true;
					popupProps.position.right = 'auto';
					popupProps.position.bottom = 'auto';
					popupProps.position.top = e.clientY + 5;
					popupProps.position.left = e.clientX + 5;
				}"
			>
				<span>{{ idx + 1 }}</span>
				<span
					class="button-iconed icon icon-cross-45-circled"
					:title="mainStore.t.i.hints.deleteTemp"
					@click.stop="mainStore.deleteTemp(temp.id)"
				/>
			</button>

<!-- SEC Buttons: Measure -->
 
			<button
				v-else-if="type === 'measure'"
				v-for="(point, idx) in mainStore.measure.points"
				:key="idx"
				:data-point="point.id"
				:data-pointidx="idx"
				:data-pointof="'measure'"
				:title="
// TODO Get the name and description of the Entity referencing the Point and put it in this attribute
					(false && point.name ? `${point.name}&#013;` : '') +
					(point.description ? point.description : '')
				"
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
						mainStore.measure.points[mainStore.measure.choosing].id
							? 'button-pressed' : ''
				"
				@click.prevent="mainStore.setCurrentPoint(point.id)"
				@contextmenu.prevent="e => {
					pointInfo.point = mainStore.getPointById(point.id);
					pointInfo.name = point.name;
					popupProps.show = true;
					popupProps.position.right = 'auto';
					popupProps.position.bottom = 'auto';
					popupProps.position.top = e.clientY + 5;
					popupProps.position.left = e.clientX + 5;
				}"
			>
				<span
					:data-point="point.id"
					:data-pointidx="idx"
					:data-pointof="'measure'"
					@dragenter="highlighted = point.id"
				>
					{{ point.name }}
				</span>
				<span
					:data-point="point.id"
					:data-pointidx="idx"
					:data-pointof="'measure'"
					:title="mainStore.t.i.hints.deletePoint"
					class="button-iconed icon icon-cross-45-circled"
					@dragenter="highlighted = point.id"
					@click.stop="mainStore.deleteTemp(point.id)"
				/>
			</button>

<!-- SEC Buttons: Route -->
 
			<button
				v-else-if="type === 'route'"
				v-for="(pn, idx) in mainStore.currentRoute.points"
				:key="pn.id"
				:data-point="pn.id"
				:data-pointidx="idx"
				:data-pointof="'route'"
				:draggable="true"
				@dragstart="e => handleDragStart(e, 'points')"
				@dragenter="e => {
					highlighted = pn.id;
					handleDragEnter(e);
				}"
				@dragend="highlighted = null"
				@drop="handleDrop"
				:class="
					pn.id === highlighted ||
					pn.id === mainStore.currentPoint?.id
						? 'button-pressed' : ''
				"
				@click.prevent="() => {
					pointInfo.point = mainStore.getPointById(pn.id);
					mainStore.setCurrentPoint(pointInfo.point);
				}"
				@contextmenu.prevent="e => {
					pointInfo.point = mainStore.getPointById(pn.id);
					if (mainStore.mode === 'measure') {
						mainStore.addPointToPoints(pointInfo.point);
						return;
					}
					pointInfo.name = pn.name;
					popupProps.show = true;
					popupProps.position.left = 'auto';
					popupProps.position.bottom = 'auto';
					popupProps.position.top = e.clientY + 5;
					popupProps.position.right =
						e.view.document.documentElement.clientWidth -
						e.clientX + 5;
				}"
			>
				<span
					:data-point="pn.id"
					:data-pointidx="idx"
					:data-pointof="'route'"
					@dragenter="highlighted = pn.id"
				>
					{{ pn.name }}
				</span>
				<span
					:data-point="pn.id"
					:data-pointidx="idx"
					:data-pointof="'route'"
					:title="mainStore.t.i.hints.deleteRoutePoint"
					class="button-iconed icon icon-cross-45-circled"
					@dragenter="highlighted = pn.id"
					@click.stop="
						mainStore.deleteObjects({
							objects: { [pointInfo.point.id]: pointInfo.point }
						})
					"
				/>
			</button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue';
import { useMainStore } from '@/stores/main';
import {
	latitude2string,
	longitude2string,
	point2coords,
	IPlacesPopupProps,
} from '@/shared';
import { Point, PointName } from '@/stores/types';
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

const pointInfo = inject<PointName>('pointInfo');
const popupProps = inject<IPlacesPopupProps>('popupProps');

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
		case 'route':
			idsArray.value = mainStore.currentRoute !== null
				? mainStore.currentRoute.points.map(p => p.id) : []
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
.points {
	&:has(.points-list-buttons:empty) {
		margin-bottom: 0 !important;
	}
}
.points-header {
	display: grid;
	grid-template-columns: 8px 1fr auto auto;
	gap: 8px;
	align-items: start;
	margin-bottom: 12px;
	.icon-triangle {
		margin: 7px 0;
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
		overflow: hidden;
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
.icon-triangle {
	width: 10px; height: 10px;
	min-width: 0; min-height: 0;
	line-height: 0;
	&::before {
		background-color: var(--color-23);
	}
}
</style>
