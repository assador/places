<template>
	<div class="points folder margin_bottom">
		<div class="folder-subs points-header">
			<div
				class="icon icon-triangle"
				:class="open ? 'icon-triangle_down' : 'icon-triangle_right'"
			/>
			<h2 @click="open = !open">
				<template v-if="type === 'temps'">
					{{ mainStore.t.i.captions.pointsTemporary }}
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
					mainStore.t.i.hints.onMap
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
						mainStore.addPointToPoints({
							point: point,
							entity: mainStore.measure,
						});
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
				type === 'temps' && Object.keys(mainStore.temps).length ||
				type === 'measure' && mainStore.measure.points.length ||
				type === 'route' && mainStore.currentRoute?.points.length
			"
			class="points-info"
		>
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
		<div
			class="points-list-buttons folder-subfolders"
			:class="{ open: open, closed: !open, dragging: dragging }"
		>

<!-- SEC Buttons: Temps -->

			<button
				v-if="type === 'temps'"
				v-for="(temp, idx) in mainStore.lonelyTemps"
				:class="{ 'button-pressed': mainStore.currentPoint?.id === temp.id }"
				@click.prevent="mainStore.setCurrentPoint(temp.id)"
				@contextmenu.prevent="e => {
					if (pointInfo.point?.id === temp.id) {
						popupProps.show = !popupProps.show;
						return;
					}
					if (mainStore.mode === 'measure') {
						mainStore.addPointToPoints({
							point: temp,
							entity: mainStore.measure,
						});
						return;
					}
					if (mainStore.mode === 'routes') {
						mainStore.addPointToPoints({
							point: temp,
							entity: mainStore.currentRoute,
						});
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
				:data-entity-id="point.id"
				:data-entity-type="'point'"
				:data-entity-index="idx"
				:data-entity-context="'measure'"
				:title="
// TODO Get the name and description of the Entity referencing the Point and put it in this attribute
					(false && point.name ? `${point.name}&#013;` : '') +
					(point.description ? point.description : '')
				"
				:draggable="true"
				@dragstart="e => {
					dragging = true;
					handleDragStart(e, point, idx, 'measure')
				}"
				@dragend="() => {
					dragging = false;
					highlightedLeft = null;
					highlightedRight = null;
				}"
				@dragover.prevent
				@drop.prevent.stop="handleDropExt"
				:class="
					point.id === highlighted ||
					point.id ===
						mainStore.measure.points[mainStore.measure.choosing].id
							? 'button-pressed' : ''
				"
				@click.prevent="mainStore.setCurrentPoint(point.id)"
				@contextmenu.prevent="e => {
					if (pointInfo.point?.id === point.id) {
						popupProps.show = !popupProps.show;
						return;
					}
					pointInfo.point = mainStore.getPointById(point.id);
					pointInfo.name = point.name;
					popupProps.show = true;
					popupProps.position.right = 'auto';
					popupProps.position.bottom = 'auto';
					popupProps.position.top = e.clientY + 5;
					popupProps.position.left = e.clientX + 5;
				}"
			>
				<span>
					{{ point.name }}
				</span>
				<span
					:title="mainStore.t.i.hints.deletePoint"
					class="button-iconed icon icon-cross-45-circled"
					@dragover.prevent
					@click.stop="mainStore.removePointFromPoints({
						point: mainStore.temps[point.id],
						entity: mainStore.measure,
					})"
				/>
				<span
					class="sorting-area-left"
					:class="{ highlighted: point.id === highlightedLeft }"
					@dragenter="highlightedLeft = point.id"
					@dragleave="highlightedLeft = null"
					@drop="e => handleDrop(e, { before: true })"
				/>
				<span
					class="sorting-area-right"
					:class="{ highlighted: point.id === highlightedRight }"
					@dragenter="highlightedRight = point.id"
					@dragleave="highlightedRight = null"
					@drop="e => handleDrop(e, { before: false })"
				/>
			</button>

<!-- SEC Buttons: Route -->
 
			<button
				v-else-if="type === 'route'"
				v-for="(pn, idx) in mainStore.currentRoute?.points.filter(p =>
					mainStore.getPointById(p.id) &&
					!mainStore.getPointById(p.id).deleted
				)"
				:key="pn.id"
				:data-entity-id="pn.id"
				:data-entity-type="'point'"
				:data-entity-index="idx"
				:data-entity-context="'routes'"
				:data-entity-parent-id="mainStore.currentRoute.id"
				:draggable="true"
				@dragstart="e => {
					dragging = true;
					handleDragStart(
						e, pn, idx, 'routes', mainStore.currentRoute.id
					)
				}"
				@dragend="() => {
					dragging = false;
					highlightedLeft = null;
					highlightedRight = null;
				}"
				@dragover.prevent
				@drop.prevent.stop="handleDropExt"
				:class="{
					'button-pressed': pn.id === mainStore.currentPoint?.id,
				}"
				@click.prevent="() => {
					pointInfo.point = mainStore.getPointById(pn.id);
					mainStore.setCurrentPoint(pointInfo.point);
				}"
				@contextmenu.prevent="e => {
					if (pointInfo.point?.id === pn.id) {
						popupProps.show = !popupProps.show;
						return;
					}
					pointInfo.point = mainStore.getPointById(pn.id);
					if (mainStore.mode === 'measure') {
						mainStore.addPointToPoints({
							point: pointInfo.point,
							entity: mainStore.measure,
						});
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
				<span>
					{{ pn.name }}
				</span>
				<span
					:title="mainStore.t.i.hints.deleteRoutePoint"
					class="button-iconed icon icon-cross-45-circled"
					@click.stop="() => {
						const point = mainStore.getPointById(pn.id);
						mainStore.deleteObjects({ [point.id]: point });
					}"
				/>
				<span
					class="sorting-area-left"
					:class="{ highlighted: pn.id === highlightedLeft }"
					@dragenter="highlightedLeft = pn.id"
					@dragleave="highlightedLeft = null"
					@drop="($e: DragEventCustom) => $e.dragBefore = true"
				/>
				<span
					class="sorting-area-right"
					:class="{ highlighted: pn.id === highlightedRight }"
					@dragenter="highlightedRight = pn.id"
					@dragleave="highlightedRight = null"
					@drop="($e: DragEventCustom) => $e.dragBefore = false"
				/>
			</button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, Ref, computed, inject } from 'vue';
import { useMainStore } from '@/stores/main';
import { IPlacesPopupProps } from '@/shared';
import { PointName, DragEventCustom, DragEntityPayload } from '@/stores/types';

export interface IPlacesPointsProps {
	type?: string;
}
const props = withDefaults(defineProps<IPlacesPointsProps>(), {
	type: 'temps',
});

const handleDrop = inject<typeof handleDrop>('handleDrop');

const mainStore = useMainStore();

const open = ref(true);
const highlighted = ref(null);

const pointInfo = inject<Ref<PointName>>('pointInfo')!;
const popupProps = inject<Ref<IPlacesPopupProps>>('popupProps')!;

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
			mainStore.distanceBetweenPoints(idsArray.value)
		* 1000) / 1000
	);
});

// SEC DnD

const canAcceptDrop = (target: HTMLElement): boolean => {
	const { currentDrag } = mainStore;
	const { entityId, entityContext } = target.dataset;
	return !(
		currentDrag.id === entityId ||
		currentDrag.context !== entityContext
	);
};
const handleDropExt = (event: DragEventCustom) => {
	const target = event.currentTarget as HTMLElement;
	if (!canAcceptDrop(target)) return;
	handleDrop(event);
};
const handleDragStart = (
	event: DragEvent,
	pn: PointName,
	index: number,
	context: 'measure' | 'routes',
	parentId?: string,
) => {
	const entity = mainStore.getPointById(pn.id);
	mainStore.currentDrag = {
		id: entity.id,
		type: entity.type,
		index: index,
		context: context,
		parentId: parentId,
	};
	const payload: DragEntityPayload = { ...mainStore.currentDrag };
	event.dataTransfer?.setData('application/my-app-dnd', JSON.stringify(payload));
};
const dragging = ref(false);
const highlightedLeft = ref(null);
const highlightedRight = ref(null);
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
	&.dragging :is(.sorting-area-left, .sorting-area-right) {
		z-index: 30;
	}
	button {
		position: relative;
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
		* {
			z-index: 20;
		}
		.sorting-area-left, .sorting-area-right {
			position: absolute;
			top: 0; bottom: 0;
			z-index: 10;
		}
		.sorting-area-left {
			left: 0; right: 50%;
		}
		.sorting-area-right {
			right: 0; left: 50%;
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
.icon-triangle {
	width: 10px; height: 10px;
	min-width: 0; min-height: 0;
	line-height: 0;
	&::before {
		background-color: var(--color-23);
	}
}
</style>
