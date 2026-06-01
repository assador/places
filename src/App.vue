<template>
	<div
		ref="container"
		id="container"
		:class="['colortheme-' + mainStore.colortheme]"
	>
		<div id="popup-root" />
		<PopupConfirm
			v-if="confirm.show"
			:callback="confirm.callback"
			:arguments="confirm.args"
			:message="confirm.message"
		/>
		<Popup
			v-if="isMounted"
			:show="mainStore.busy"
			:position="popupBusy.position"
			:closeButton="false"
			:closeOnClick="false"
		>
			<template #popupSlot>
				<div class="spinner icon icon-eye-open-circled" />
			</template>
		</Popup>
		<router-view />
	</div>
</template>

<script setup lang="ts">
import { ref, provide, onMounted } from 'vue'
import { useMainStore } from '@/stores/main';

import { confirm } from '@/services/confirm';
import { usePWAInstall } from '@/shared/usepwainstall';
import {
	handleFolderDropped,
	handlePlaceRouteDropped,
	handlePointInListDropped,
	handleImageDropped,
} from '@/shared/dnd';

import { DragHandler, PopupProps } from '@/types';

import PopupConfirm from '@/components/popups/PopupConfirm.vue';
import Popup from '@/components/popups/Popup.vue';

const pwa = usePWAInstall();
provide('pwa', pwa);

const mainStore = useMainStore();

const popupBusy = ref<PopupProps>({
	show: false,
	position: {
		top: '0',
		right: '0',
		bottom: '0',
		left: '0',
	},
});
const isMounted = ref(false);

// SEC Lifecycle

onMounted(() => {
	isMounted.value = true;
	mainStore.$onAction(({
		after,
	}): void => {
		after(() => {
			mainStore.idleTime = 0;
		});
	});
	mainStore.restoreObjectsAsLinks();
});

// SEC DnD

const handleDrop = (target: HTMLElement) => {
	const payload = mainStore.currentDrag;
	if (!payload) return;
	const handlers: Record<string, DragHandler> = {
		folder: handleFolderDropped,
		place: handlePlaceRouteDropped,
		route: handlePlaceRouteDropped,
		point: handlePointInListDropped,
		image: handleImageDropped,
	};
	const handler = handlers[payload.type];
	if (handler) handler(payload, target);
	mainStore.currentDrag = null;
};
provide('handleDrop', handleDrop);
</script>

<style lang="scss">
@use '@/assets/styles/style.scss';
@use '@/assets/styles/layout.scss';
</style>
