<template>
	<input
		id="import-from-file-input"
		ref="importFromFileInput"
		name="jsonFile"
		type="file"
		accept=".json,.gpx,text/xml,application/json"
		@change="importFromFile();"
	/>
	<button
		id="actions-undo"
		:disabled="mainStore.stateBackupsIndex < 1"
		class="action-button"
		:title="mainStore.t.i.hints.undo"
		accesskey="z"
		@click="mainStore.undo();"
	>
		<span class="icon icon-undo" />
		<span>{{ mainStore.t.i.buttons.undo }}</span>
	</button>
	<button
		id="actions-redo"
		:disabled="mainStore.stateBackupsIndex === mainStore.stateBackups.length - 1"
		class="action-button"
		:title="mainStore.t.i.hints.redo"
		accesskey="y"
		@click="mainStore.redo();"
	>
		<span class="icon icon-redo" />
		<span>{{ mainStore.t.i.buttons.redo }}</span>
	</button>
	<button
		id="actions-save"
		class="action-button"
		:class="{ 'button-pressed': !mainStore.saved }"
		:disabled="mainStore.saved"
		:title="
			(!mainStore.saved ? (mainStore.t.i.hints.notSaved + '. ') : '') +
			mainStore.t.i.hints.saveToDb
		"
		accesskey="s"
		@click="() => {
			if (mainStore.user.testaccount) {
				mainStore.setMessage(mainStore.t.m.popup.testOnSave, 8);
			}
			db.saveAll();
		}"
	>
		<span class="icon icon-save" />
		<span>{{ mainStore.t.i.buttons.save }}</span>
	</button>
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
</template>

<script setup lang="ts">
import { Ref, inject, nextTick } from 'vue';
import { useMainStore } from '@/stores/main';
import { useRouter } from 'vue-router';
import * as db from '@/services/db';
import { logout } from '@/services/auth';

const { installPWAEnabled, installPWA } = inject('pwa') as any;
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

<style lang="scss" scoped>
.action-button {
	display: flex;
	flex-flow: column nowrap;
	gap: 4px;
	align-items: center;
	justify-content: center;
	min-width: 0 !important;
	padding: 2px 0 0 0;
}
.icon {
	&, &::before {
		width: 15px; height: 15px;
	}
}
</style>
