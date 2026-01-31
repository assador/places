<template>
	<button
		v-if="installPWAEnabled"
		id="prompt-button"
		class="important"
		@click="installPWA"
	>
		{{ mainStore.t.i.buttons.installPWA }}
	</button>
</template>

<script setup lang="ts">
import { usePWAInstall } from '@/shared';
import { useMainStore } from '@/stores/main';

const mainStore = useMainStore();

const { installPWAEnabled, installPWA } = usePWAInstall();
</script>

<style lang="scss" scoped>
#prompt-button {
	margin-top: 18px;
}
</style>
