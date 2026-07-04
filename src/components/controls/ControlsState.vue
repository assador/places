<template>
	<div class="action-button-group">
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
	</div>
</template>

<script setup lang="ts">
import { useMainStore } from '@/stores/main';
import * as db from '@/services/db';

const mainStore = useMainStore();
</script>
