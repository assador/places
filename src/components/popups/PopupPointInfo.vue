<template>
	<Popup
		:show="common.popupProps.show"
		:position="common.popupProps.position"
		:closeOnClick="false"
		class="point-coordinates messages"
		@update:show="handlePopupUpdate"
	>
		<template #popupSlot>
			<a
				href="javascript:void(0)"
				class="point-coordinates-copy"
				@click="copyCoords(common.pointInfo?.point)"
			>
				{{ mainStore.t.i.text[copied ? 'copied' : 'copy'] }}
			</a>
			<h3 v-if="common.pointInfo?.name">
				<span class="un_color">
					{{ mainStore.t.i.captions.measurePoint }}:
				</span>
				<span class="color-01">
					{{ common.pointInfo.name }}
				</span>
			</h3>
			<template v-if="common.pointInfo">
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
			</template>
			<div v-if="common.pointInfo?.point.altitude" class="nobr">
				<span class="un_color">
					{{ mainStore.t.i.captions.altitude }}:
				</span>
				<span class="color-01">
					{{ common.pointInfo.point.altitude }}
					{{ mainStore.t.i.text.m }}
				</span>
			</div>
			<div
				v-if="common.pointInfo?.of && isPlace(common.pointInfo.of)"
				class="point-coordinates-controls margin_top"
			>
				<input
					type="text"
					:value="mainStore.places[common.pointInfo.of.id]?.name"
					:placeholder="mainStore.t.i.inputs.placeName"
					@change="mainStore.changePlace({
						entity: mainStore.places[common.pointInfo.of.id],
						change: { name: ($event.target as HTMLInputElement).value.trim() },
					})"
				/>
				<button
					class="button-iconed icon icon-cross-45-circled"
					:title="mainStore.t.i.buttons.deletePlace"
					@click="deletePlace(common.pointInfo.of.id)"
				/>
			</div>
			<div
				v-if="confirmPlaceDelete?.show"
				class="point-coordinates-confirm margin_top"
			>
				<button @click="confirmPlaceDelete.accept()">
					{{ mainStore.t.i.buttons.yes }}
				</button>
				<h4 class="margin_bottom_0">
					{{ confirmPlaceDelete.message }}
				</h4>
				<button @click="confirmPlaceDelete.cancel()">
					{{ mainStore.t.i.buttons.no }}
				</button>
			</div>
		</template>
	</Popup>
</template>

<script setup lang="ts">
import { ref, shallowRef, watch } from 'vue';
import { useMainStore } from '@/stores/main';
import { Point } from '@/types';
import { isPlace } from '@/guards';
import { common } from '@/services/common';
import { ConfirmInstance } from '@/services/confirm';
import { point2coords, latitude2string, longitude2string } from '@/shared/converters';
import Popup from '@/components/popups/Popup.vue';

const mainStore = useMainStore();

const copied = ref(false);
const copyCoords = async (point: Point) => {
	await navigator.clipboard.writeText(
		point2coords(point, mainStore.t.i.text.m, mainStore.t.i.text.h)
	);
	copied.value = true;
	setTimeout(() => copied.value = false, 2000);
};

const confirmPlaceDelete = shallowRef<ConfirmInstance | null>(null);
const confirmRoutePointDelete = shallowRef<ConfirmInstance | null>(null);

const clearConfirms = () => {
	confirmPlaceDelete.value?.cancel();
	confirmRoutePointDelete.value?.cancel();
	confirmPlaceDelete.value = null;
	confirmRoutePointDelete.value = null;
}
const clear = () => {
	clearConfirms();
	common.clearPointInfo();
}
const handlePopupUpdate = (show: boolean) => {
	common.popupProps.show = show;
	if (!show) clear();
};
watch(() => mainStore.currentPointId, () => {
	common.popupProps.show = false;
});

const deletePlace = async (id: string) => {
	const confirm = new ConfirmInstance();
	confirmPlaceDelete.value = confirm;

	const isConfirmed = await confirm.open(mainStore.t.i.captions.sure);
	if (isConfirmed) {
		common.popupProps.show = false;
		mainStore.deleteObjects({ [id]: mainStore.places[id] });
	}
	confirmPlaceDelete.value = null;
}
</script>

<style lang="scss">
.point-coordinates {
	&-controls {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 8px;
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
