<template>
	<Popup
		:show="common.popupProps.show && common.pointInfo !== null"
		:position="common.popupProps.position"
		:closeOnClick="false"
		class="point-info messages"
		@update:show="handlePopupUpdate"
	>
		<template #popupSlot>
			<a
				href="javascript:void(0)"
				class="point-info-copy"
				@click.stop="copyCoords(common.pointInfo.point)"
			>
				{{ mainStore.t.i.text[copied ? 'copied' : 'copy'] }}
			</a>
			<div class="point-info-content">
				<h3 v-if="common.pointInfo.name">
					<span class="un_color">
						{{ mainStore.t.i.captions[isPlace(common.pointInfo.of) ? 'place' : 'point'] }}:
					</span>
					<span class="color-01">
						{{ common.pointInfo.name }}
					</span>
				</h3>
				<div v-if="common.pointInfo">
					<div class="nobr">
						<span class="un_color">
							{{ mainStore.t.i.captions.latitude }}:
						</span>
						<span class="color-01">
							{{ latitude2string(common.pointInfo.point.latitude) }}°
						</span>
					</div>
					<div class="nobr">
						<span class="un_color">
							{{ mainStore.t.i.captions.longitude }}:
						</span>
						<span class="color-01">
							{{ longitude2string(common.pointInfo.point.longitude) }}°
						</span>
					</div>
					<div v-if="common.pointInfo.point.altitude" class="nobr">
						<span class="un_color">
							{{ mainStore.t.i.captions.altitude }}:
						</span>
						<span class="color-01">
							{{ common.pointInfo.point.altitude }}
							{{ mainStore.t.i.text.m }}
						</span>
					</div>
					<div class="nobr">
						<span class="un_color">
							{{ mainStore.t.i.captions.distanceFromMapCenter }}:
						</span>
						<span class="color-01">
							{{ distanceFromCenter }}
							{{ mainStore.t.i.text.km }}
						</span>
					</div>
					<div v-if="mainStore.currentPoint" class="nobr">
						<span class="un_color">
							{{ mainStore.t.i.captions.distanceFromCurrent }}:
						</span>
						<span class="color-01">
							{{ distanceFromCurrent }}
							{{ mainStore.t.i.text.km }}
						</span>
					</div>
				</div>
				<div class="point-info-controls">
					<div
						v-if="common.pointInfo.of"
						class="point-info-common"
					>
						<div
							v-if="isPlace(common.pointInfo.of)"
							class="images-add"
							@click.stop="inputUploadFiles.click()"
						>
							<button
								:title="mainStore.t.i.buttons.addPhotos"
								class="button-iconed icon icon-plus-circled"
							/>
							<input
								ref="inputUploadFiles"
								type="file"
								name="files"
								accept="image/*"
								capture="environment"
								multiple
								class="images-add__input"
								@change="addImages(common.pointInfo.of, inputUploadFiles)"
							/>
						</div>
						<input
							v-if="common.pointInfo.of && common.pointInfo.of.id !== 'tempspack'"
							type="text"
							class="point-info-common__name"
							:value="common.pointInfo.name"
							:placeholder="mainStore.t.i.captions.untitled"
							@change="e => updateName((e.target as HTMLInputElement).value.trim())"
						/>
						<button
							v-if="isPlace(common.pointInfo.of)"
							class="button-iconed icon icon-cross-45-circled"
							:title="mainStore.t.i.buttons.deletePlace"
							@click.stop="deletePlace(common.pointInfo.of.id)"
						/>
						<button
							v-else-if="common.pointInfo.of && common.pointInfo.of.id !== 'tempspack'"
							class="button-iconed icon icon-cross-45-circled"
							:title="mainStore.t.i.buttons.deletePoint"
							@click.stop="deletePoint(common.pointInfo.index, common.pointInfo.of)"
						/>
					</div>
					<div
						v-if="confirmPlaceDelete?.show"
						class="point-info-confirm"
					>
						<button @click.stop="confirmPlaceDelete.accept()">
							{{ mainStore.t.i.buttons.yes }}
						</button>
						<h4 class="margin_bottom_0">
							{{ confirmPlaceDelete.message }}
						</h4>
						<button @click.stop="confirmPlaceDelete.cancel()">
							{{ mainStore.t.i.buttons.no }}
						</button>
					</div>
					<div
						v-if="confirmPointDelete?.show"
						class="point-info-confirm"
					>
						<button @click.stop="confirmPointDelete.accept()">
							{{ mainStore.t.i.buttons.yes }}
						</button>
						<h4 class="margin_bottom_0">
							{{ confirmPointDelete.message }}
						</h4>
						<button @click.stop="confirmPointDelete.cancel()">
							{{ mainStore.t.i.buttons.no }}
						</button>
					</div>
					<div class="point-info-buttons">
						<button
							v-if="!isPlace(common.pointInfo.of)"
							@click.stop="placeFromPoint"
						>
							{{ mainStore.t.i.buttons.makePlace }}
						</button>
					</div>
				</div>
			</div>
		</template>
	</Popup>
</template>

<script setup lang="ts">
import { ref, shallowRef, computed, watch } from 'vue';
import { useMainStore } from '@/stores/main';
import { Point, Route, Measure } from '@/types';
import { isPlace, isRoute } from '@/guards';
import { common, addImages } from '@/services/common';
import { ConfirmInstance } from '@/services/confirm';
import { roundTo, distanceOnSphere } from '@/shared/common';
import { point2coords, latitude2string, longitude2string } from '@/shared/converters';
import Popup from '@/components/popups/Popup.vue';

const mainStore = useMainStore();

const inputUploadFiles = ref<HTMLInputElement | null>(null);

const copied = ref(false);
const copyCoords = async (point: Point) => {
	await navigator.clipboard.writeText(
		point2coords(point, mainStore.t.i.text.m, mainStore.t.i.text.h)
	);
	copied.value = true;
	setTimeout(() => copied.value = false, 2000);
};
const distanceFromCenter = computed(() => roundTo(distanceOnSphere(
	mainStore.center.latitude,
	mainStore.center.longitude,
	common.pointInfo.point.latitude,
	common.pointInfo.point.longitude,
), 3));
const distanceFromCurrent = computed(() => roundTo(distanceOnSphere(
	mainStore.currentPoint.latitude,
	mainStore.currentPoint.longitude,
	common.pointInfo.point.latitude,
	common.pointInfo.point.longitude,
), 3));

const placeFromPoint = () => {
	const place = mainStore.upsertPlaceFromPointInfo(common.pointInfo);
	if (place) {
		common.setPointInfo({
			id: place.pointid,
			context: common.pointInfo.context,
			entity: place,
		});
	}
}
const updateName = (name: string) => {
	if (!common.pointInfo || !common.pointInfo.of) return;
	if (isPlace(common.pointInfo.of)) {
		mainStore.changePlace({
			entity: common.pointInfo.of,
			change: { name: name },
		});
	} else if (isRoute(common.pointInfo.of)) {
		const updatedPoints = common.pointInfo.of.points.map(p =>
			p.id === common.pointInfo.point.id ? { ...p, name: name } : p,
		);
		mainStore.changeRoute({
			entity: common.pointInfo.of,
			change: { points: updatedPoints },
		});
	} else if (common.pointInfo.of.type === 'measure') {
		mainStore.measure.points[common.pointInfo.index].name = name;
	}
};
const confirmPlaceDelete = shallowRef<ConfirmInstance | null>(null);
const confirmPointDelete = shallowRef<ConfirmInstance | null>(null);

const clearConfirms = () => {
	confirmPlaceDelete.value?.cancel();
	confirmPointDelete.value?.cancel();
	confirmPlaceDelete.value = null;
	confirmPointDelete.value = null;
}
const clear = () => {
	clearConfirms();
	common.clearPointInfo();
}
const handlePopupUpdate = (show: boolean) => {
	common.popupProps.show = show;
	if (!show) clear();
};
watch(() => mainStore.currentPointId, id => {
	if (id !== common.pointInfo?.point.id) common.popupProps.show = false;
});

const deletePlace = async (id: string) => {
	const confirm = new ConfirmInstance();
	confirmPlaceDelete.value = confirm;

	const isConfirmed = await confirm.open(mainStore.t.i.captions.sure);
	if (isConfirmed) {
		common.popupProps.show = false;
		mainStore.deleteEntities({ [id]: mainStore.places[id] });
	}
	confirmPlaceDelete.value = null;
}
const deletePoint = async (index: number, entity: Route | Measure) => {
	const confirm = new ConfirmInstance();
	confirmPointDelete.value = confirm;

	const isConfirmed = await confirm.open(mainStore.t.i.captions.sure);
	if (isConfirmed) {
		common.popupProps.show = false;
		mainStore.removePointFromPoints({ index, entity });
	}
	confirmPointDelete.value = null;
}
</script>

<style lang="scss">
.point-info {
	padding: 40px 20px 10px 20px !important;
	text-align: right;
	h3 {
		text-align: center;
		margin-bottom: 0 !important;
	}
	&-degminsecalt, &-copy {
		margin-top: 12px;
	}
	&-copy {
		display: block;
		position: absolute;
		top: -6px; left: 10px;
	}
	&-content {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	&-controls {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}
	&-common {
		display: flex;
		flex-wrap: nowrap;
		gap: 8px;
		align-items: stretch;
		& > *:not(&__name) {
			flex: 0 1 auto;
		}
		&__name {
			flex: 1 0 auto;
		}
		.images-add {
			display: flex;
			gap: 12px;
			align-items: center;
			cursor: pointer;
		}
		.images-add__input {
			display: none;
		}
	}
	&-buttons {
		display: flex;
		gap: 8px;
		&:empty {
			display: none;
		}
	}
	&-confirm {
		text-align: center;
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: 8px;
		align-items: center;
	}
}
</style>
