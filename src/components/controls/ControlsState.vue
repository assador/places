<template>
	<div class="action-button-group">
		<button
			id="actions-offline"
			class="action-button"
			:class="{ 'button-pressed': mainStore.offlineMode }"
			:title="mainStore.offlineMode
				? `${mainStore.t.i.buttons.modeOff} ${mainStore.t.i.inputs.offline}`
				: `${mainStore.t.i.buttons.modeOn} ${mainStore.t.i.inputs.offline}`
			"
			accesskey="o"
			@click="offlineMode = !offlineMode"
		>
			<span class="icon icon-net-swith" />
			<span>
				{{
					mainStore.offlineMode
						? mainStore.t.i.inputs.offline
						: mainStore.t.i.inputs.online
				}}
			</span>
			<span
				:class="`indicator-online ${
					offlineMode ? 'color-grey' : mainStore.online ? 'color-green' : 'color-red'
				}`"
				:title="offlineMode || !mainStore.online
					? mainStore.t.i.text.offline + '\n' + mainStore.t.i.text.offlineSaving
					: mainStore.t.i.text.online + '\n' + mainStore.t.i.text.onlineSaving
				"
			/>
		</button>
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
			:disabled="mainStore.saved || mainStore.saving"
			:title="
				(!mainStore.saved ? (mainStore.t.i.hints.notSaved + '. ') : '') +
				mainStore.t.i.hints.saveToDb
			"
			accesskey="s"
			@click="() => {
				if (!mainStore.user) return;
				if (mainStore.user.testaccount) {
					mainStore.setMessage(mainStore.t.m.popup.testOnSave, 8);
				}
				db.saveEntities();
			}"
		>
			<span
				v-if="!mainStore.saving"
				class="icon icon-upload"
			/>
			<span
				v-else
				class="icon icon-eye-open-circled spinner"
			/>
			<span>{{ mainStore.t.i.buttons.save }}</span>
		</button>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useMainStore } from '@/stores/main';
import * as db from '@/services/db';

const mainStore = useMainStore();

const offlineMode = computed({
	get: () => mainStore.offlineMode,
	set: (newValue) => {
		mainStore.setOffline(newValue);
	},
});
</script>

<style lang="scss" scoped>
#actions-offline {
	position: relative;
	.indicator-online {
		display: block !important;
		position: absolute;
		top: -3px; right: -3px;
		width: 12px; height: 12px;
		border-radius: 999999px;
	}
}
#bottom-basic #actions-offline {
	margin-right: 12px;
}
</style>
