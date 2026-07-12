<template>
	<div class="action-button-group">
		<input
			id="import-from-file-input"
			ref="importFromFileInput"
			name="jsonFile"
			type="file"
			accept=".json,.gpx,text/xml,application/json"
			@change="importFromFile();"
		/>
		<ControlsState v-if="common.compact !== 2" />
		<button
			id="actions-install"
			class="action-button"
			:title="mainStore.t.i.hints.install"
			:disabled="!installPWAEnabled"
			@click="installPWA"
		>
			<span class="icon icon-save" />
			<span>{{ mainStore.t.i.buttons.install }}</span>
		</button>
		<button
			id="actions-import"
			class="action-button"
			:title="mainStore.t.i.hints.importPlaces"
			accesskey="i"
			@click="importFromFileInput.click()"
		>
			<span class="icon icon-import" />
			<span>{{ mainStore.t.i.buttons.import }}</span>
		</button>
		<button
			id="actions-export"
			class="action-button"
			:title="mainStore.t.i.hints.exportPlaces"
			accesskey="e"
			@click="router.push({ name: 'HomeExport' })"
		>
			<span class="icon icon-export" />
			<span>{{ mainStore.t.i.buttons.export }}</span>
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
import { Ref, inject, nextTick } from 'vue';
import { useMainStore } from '@/stores/main';
import { useRouter } from 'vue-router';
import { common } from '@/services/common';
import { logout } from '@/services/auth';
import type { usePWAInstall } from '@/shared/usepwainstall';
import ControlsState from '@/components/controls/ControlsState.vue';

const { installPWAEnabled, installPWA } = inject<ReturnType<typeof usePWAInstall>>('pwa');
const importFromFileInput = inject<Ref<HTMLElement | null>>('importFromFileInput');

const mainStore = useMainStore();
const router = useRouter();

const importFromFile = async () => {
	const input = importFromFileInput.value as HTMLInputElement;
	const file = input.files[0] ?? null;
	if (!file) return;
	const mime = file.type;
	if (mime !== 'application/json' && mime !== 'application/gpx+xml') {
		mainStore.setMessage(mainStore.t.m.popup.invalidImportFileType);
		return;
	}
	const reader = new FileReader();
	reader.onload = async (event: ProgressEvent<FileReader>) => {
		await nextTick();
		mainStore.addImported({ mime, text: event.target?.result as string });
		input.value = '';
	};
	reader.readAsText(file);
};
</script>
