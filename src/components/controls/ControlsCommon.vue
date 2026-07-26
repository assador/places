<template>
	<div class="action-button-group">
		<ControlsState v-if="common.compact !== 2" />
		<button
			id="actions-exchange"
			class="action-button"
			:title="mainStore.t.i.hints.exchange"
			accesskey="e"
			@click="showPopupExchange = true"
		>
			<span class="icon icon-exchange" />
			<span>{{ mainStore.t.i.buttons.exchange }}</span>
		</button>
		<button
			id="actions-install"
			class="action-button"
			:title="mainStore.t.i.hints.install"
			:disabled="!pwa?.installPWAEnabled"
			@click="() => { if (pwa) pwa.installPWA(); }"
		>
			<span class="icon icon-download" />
			<span>{{ mainStore.t.i.buttons.install }}</span>
		</button>
		<button
			id="actions-about"
			class="action-button"
			:title="mainStore.t.i.hints.about"
			accesskey="h"
			@click="
				router.push({
					name: 'HomeText',
					params: { what: 'about' },
				});
			"
		>
			<span class="icon icon-empty">?</span>
			<span>{{ mainStore.t.i.buttons.help }}</span>
		</button>
		<button
			id="actions-exit"
			class="action-button"
			:title="mainStore.t.i.hints.exit"
			accesskey="q"
			@click="() => {
				$nextTick(async () => {
					if (await logout()) router.push({ name: 'Auth' });
				});
			}"
		>
			<span class="icon icon-exit" />
			<span>{{ mainStore.t.i.buttons.exit }}</span>
		</button>
	</div>
</template>

<script setup lang="ts">
import { Ref, inject } from 'vue';
import { useMainStore } from '@/stores/main';
import { useRouter } from 'vue-router';
import { common } from '@/services/common';
import { logout } from '@/services/auth';
import type { usePWAInstall } from '@/shared/usepwainstall';
import ControlsState from '@/components/controls/ControlsState.vue';

const pwa = inject<ReturnType<typeof usePWAInstall>>('pwa');

const mainStore = useMainStore();
const router = useRouter();

const showPopupExchange = inject<Ref<boolean>>('showPopupExchange');
</script>
