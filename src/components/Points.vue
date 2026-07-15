<template>
	<div class="points margin_bottom">
		<div class="points-header">
			<div
				class="icon icon-triangle"
				:class="open ? 'icon-triangle_down' : 'icon-triangle_right'"
			/>
			<h2 @click="open = !open">
				<template v-if="context === 'temps'">
					{{ mainStore.notMeasureFatTemps.name }}
				</template>
				<template v-else-if="context === 'routes'">
					{{ mainStore.t.i.captions.pointsRoute }}
				</template>
				<template v-else-if="context === 'measure'">
					{{ mainStore.t.i.captions.pointsMeasure }}
				</template>
				<template v-else>
					{{ mainStore.t.i.captions.points }}
				</template>
			</h2>
			<div
				v-if="context === 'temps'"
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
				v-else-if="context === 'routes'"
				class="control-buttons"
			>
				<button
					class="button-iconed icon icon-plus-circled"
					:title="mainStore.t.i.hints.addRoutePoint"
					@click="() => {
						if (mainStore.currentRoute) mainStore.upsertPoint({
							where: mainStore.points,
							whom: mainStore.currentRoute,
						});
					}"
				/>
			</div>
			<div
				v-else-if="context === 'measure'"
				class="control-buttons"
			>
				<button
					class="button-iconed icon icon-plus-circled"
					:title="mainStore.t.i.hints.addPoint"
					@click="() => {
						const point = mainStore.upsertPoint({ where: mainStore.temps });
						if (point) mainStore.addPointToPoints({
							point: point,
							entity: mainStore.measure,
						});
					}"
				/>
				<button
					class="button-iconed icon icon-cross-45-circled"
					:title="mainStore.t.i.buttons.clear"
					@click="mainStore.deleteAllMeasurePoints()"
				/>
			</div>
		</div>
		<div
			v-if="points.length"
			:class="{ open: open, closed: !open }"
		>
			<div class="points-info">
				<div
					v-if="context === 'routes'"
					:title="
						distance + ' ' +
						mainStore.t.i.text.km + ' ' +
						mainStore.t.i.text.betweenPointsInFolder
					"
					class="points-distance"
				>
					<span class="un_color">{{ mainStore.t.i.captions.total }}: </span>
					<span class="color-01">{{ distance }}</span>
					<span class="un_color"> {{ mainStore.t.i.text.km }}</span>
				</div>
				<a
					v-if="mainStore.currentPointId"
					href="javascript:void(0)"
					@pointerup="e => {
						const fat = points.find(p => p.id === mainStore.currentPointId);
						if (fat) {
							if (common.pointInfo?.point.id === fat.point.id) {
								common.togglePopup(calculatePopupPosition(e));
							} else {
								common.setPointInfo({
									id: fat.point.id,
									context,
									entity: of ?? undefined,
								});
								common.showPopup(calculatePopupPosition(e));
							}
						}
					}"
					@contextmenu.stop.prevent
				>
					{{ mainStore.t.i.captions.coords }}
				</a>
			</div>
			<div
				class="points-list-buttons"
				:class="{ dragging: dragging }"
			>

<!-- SEC Buttons -->
				<button
					v-for="fat in points"
					:key="fat.key"
					:data-entity-id="fat.point.id"
					:data-entity-type="'point'"
					:data-entity-index="fat.index"
					:data-entity-context="props.context"
					:data-entity-parent-id="of?.id"
					:title="fat.name"
					class="point-button"
					:class="{ 'button-pressed': fat.id === mainStore.currentPointId }"
					@pointerdown.stop.prevent="(e: PointerEvent) => {
						if (props.context !== 'temps') onPointerDown(e, {
							id: fat.point.id,
							index: fat.index,
							type: fat.point.type,
							context: props.context,
							parentId: of?.id,
						});
					}"
					@pointermove="(e: PointerEvent) => {
						if (props.context !== 'temps') onPointerMove(e);
					}"
					@pointerup="(e: PointerEvent) => {
						if (props.context !== 'temps') onPointerUp(e, () => {
							mainStore.setCurrentPoint(fat.point);
						});
					}"
					@pointercancel="(e: PointerEvent) => {
						if (props.context !== 'temps') onPointerUp(e);
					}"
					@contextmenu.stop.prevent="e => {
						if (common.pointInfo?.point.id === fat.point.id) {
							common.togglePopup(calculatePopupPosition(e));
						} else {
							common.setPointInfo({
								id: fat.point.id,
								context,
								entity: of ?? undefined,
							});
							common.showPopup(calculatePopupPosition(e));
						}
					}"
				>
					<span>
						{{ fat.name }}
					</span>
					<span
						:title="mainStore.t.i.hints.deletePoint"
						class="button-iconed icon icon-cross-45-circled"
						@pointerdown.stop
						@pointerup.stop
						@click.stop="() => {
							if (fat.index !== undefined) removePoint(fat.index, fat.point.id);
						}"
					/>
					<span
						v-if="props.context !== 'temps'"
						class="sorting-area-before"
						:class="{
							highlighted:
								fat.point.id === dragTargetId &&
								mainStore.currentDrag?.position === 'before'
						}"
					/>
					<span
						v-if="props.context !== 'temps'"
						class="sorting-area-after"
						:class="{
							highlighted:
								fat.point.id === dragTargetId &&
								mainStore.currentDrag?.position === 'after'
						}"
					/>
				</button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useMainStore } from '@/stores/main';
import { common } from '@/services/common';
import { usePointerDnD, handleDrop } from '@/services/dnd';
import { calculatePopupPosition } from '@/shared/common';
import {
	Route,
	Measure,
	PointCollectionContext,
	FatPointDescription,
	PointDescription,
} from '@/types';

export interface IPointsProps {
	context?: PointCollectionContext;
}
const props = withDefaults(defineProps<IPointsProps>(), {
	context: 'temps',
});

const mainStore = useMainStore();
const open = ref(true);

const of = computed(() => {
	return (
		props.context === 'temps' ? mainStore.notMeasureFatTemps :
		props.context === 'routes' ? mainStore.currentRoute :
		props.context === 'measure' ? mainStore.measure :
		null
	);
});
const removePoint = (index: number, id: string) => {
	if (props.context === 'temps') {
		delete mainStore.temps[id];
	} else if (of.value) {
		mainStore.removePointFromPoints({
			index: index,
			entity: of.value as Route | Measure,
		});
	}
};
const points = computed<FatPointDescription[]>(() => {
	switch (props.context) {
		case 'temps':
			return mainStore.notMeasureFatTemps.points;
		case 'measure':
			return mainStore.measureFatPoints;
		case 'routes': {
			if (!of.value) return [];
			const pds: PointDescription[] = of.value.points;
			let points: FatPointDescription[] = [];
			for (let i = 0; i < pds.length; i++) {
				const p =  mainStore.getPointById(pds[i].id);
				if (p && !p.deleted) points.push({
					...pds[i],
					point: p,
					index: i,
					key: `${p.id}-${i}`,
				});
			}
			return points;
		}
		default:
			return [];
	}
});

const distance = computed(() => {
	const idsArray = ref<string[]>([]);
	const where = ref('points');
	switch (props.context) {
		case 'temps':
			idsArray.value = Object.keys(mainStore.temps);
			where.value = 'temps';
			break;
		case 'routes': {
			const route = mainStore.currentRoute;
			idsArray.value = route ? route.points.map((p: PointDescription) => p.id) : [];
			where.value = 'points';
			break;
		}
	}
	return (
		Math.round(
			mainStore.distanceBetweenPoints(idsArray.value)
		* 1000) / 1000
	);
});

// SEC DnD

const dragging = ref(false);
const dragTargetId = ref<string>();

const canAcceptDrop = (target: HTMLElement): boolean => {
	const { entityId, entityContext } = target.dataset;
	return (
		mainStore.currentDrag !== null &&
		mainStore.currentDrag.id !== entityId &&
		mainStore.currentDrag.context === entityContext
	);
};

const updateHighlights = (target: HTMLElement | null) => {
	if (!target || !mainStore.currentDrag) return;
	const area = target.closest('.sorting-area-before, .sorting-area-after');
	if (area) {
		const item = area.closest('[data-entity-id]') as HTMLElement;
		dragTargetId.value = item?.dataset.entityId;
		if (area.classList.contains('sorting-area-before')) mainStore.currentDrag.position = 'before';
		else if (area.classList.contains('sorting-area-after')) mainStore.currentDrag.position = 'after';
	}
};
const { onPointerDown, onPointerMove, onPointerUp } = usePointerDnD({
	handleDrop,
	canAcceptDrop,
	updateHighlights,
	onDragStateChange: (value) => { dragging.value = value; },
});
</script>

<style lang="scss" scoped>
.points {
	* {
		touch-action: none;
		user-select: none;
	}
	&:has(.points-list-buttons:empty) {
		margin-bottom: 0 !important;
	}
}
.points-header {
	display: grid;
	grid-template-columns: 8px 1fr auto;
	gap: 8px;
	align-items: start;
	margin-bottom: 12px;
	.icon-triangle {
		margin: 7px 0;
	}
	& > * {
		cursor: pointer;
	}
	h2 {
		display: flex;
		gap: 8px;
		align-items: baseline;
		margin: 0 !important;
	}
	.control-buttons {
		align-self: flex-start;
		justify-content: right;
	}
}
.points-list-buttons {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
	gap: 8px;
	&.dragging :is(.sorting-area-before, .sorting-area-after) {
		z-index: 30;
	}
	button {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: left;
		min-height: 30px;
		margin: 0;
		padding: 4px 20px 4px 4px;
		flex: 1 0 auto;
		.button-iconed {
			position: absolute;
			top: -1px; right: -2px;
			min-width: auto; min-height: auto;
			width: 20px; height: 20px;
		}
		& > *:last-child {
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 8px 6px;
			line-height: 0;
		}
		* {
			overflow: hidden;
			text-overflow: ellipsis;
			z-index: 20;
		}
		.sorting-area-before, .sorting-area-after {
			position: absolute;
			top: 0; bottom: 0;
			z-index: 10;
		}
		.sorting-area-before {
			left: 0; right: 50%;
		}
		.sorting-area-after {
			right: 0; left: 50%;
		}
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
.icon-triangle {
	width: 10px; height: 10px;
	min-width: 0; min-height: 0;
	line-height: 0;
	&::before {
		background-color: var(--color-23);
	}
}
.closed {
	display: none;
}
</style>
