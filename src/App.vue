<template>
	<div
		ref="container"
		id="container"
		:class="['colortheme-' + mainStore.colortheme]"
	>
		<div id="popup-root" />
		<PopupConfirm />
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
import { usePWAInstall } from '@/shared/usepwainstall';

import { PopupProps } from '@/types';

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
</script>

<style lang="scss">
@use '@/assets/styles/style.scss';
@use '@/assets/styles/layout.scss';
</style>
