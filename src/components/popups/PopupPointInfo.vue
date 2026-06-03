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
			<div v-if="common.pointInfo?.of" class="point-coordinates-controls">
				<!-- Place/Route actions: common.pointInfo.of?.name -->
				<a
					href="javascript:void(0)"
					@click="() => {}"
				>
				</a>
			</div>
		</template>
	</Popup>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useMainStore } from '@/stores/main';
import { Point } from '@/types';
import { common } from '@/services/common';
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
const handlePopupUpdate = (show: boolean) => {
	common.popupProps.show = show;
	if (!show) common.clearPointInfo();
};
</script>

<style lang="scss">
</style>
