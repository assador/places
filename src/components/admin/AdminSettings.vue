<template>
	<div class="admin-settings__header">
		<h1 class="margin_bottom_0">{{ mainStore.t.i.captions.settings }}</h1>
		<div class="control-panel">
			<button
				type="button"
				:title="mainStore.t.i.buttons.viewTable"
				@click="treeMode = 1"
			>
				<img src="@/assets/icons/dark/list.svg" />
			</button>
			<button
				type="button"
				:title="mainStore.t.i.buttons.viewTiles"
				@click="treeMode = 2"
			>
				<img src="@/assets/icons/dark/tiles.svg" />
			</button>
		</div>
	</div>
	<form
		class="settings-form"
		@submit.prevent="settingsSubmit"
	>
		<fieldset class="settings-voc-tree">
			<Tree
				instanceid="settingsvoctree"
				what="settingsvoc"
				:editable="true"
			/>
		</fieldset>
		<fieldset class="settings-form__buttons">
			<button
				type="submit"
			>
				{{ mainStore.t.i.buttons.save }}
			</button>
			<button
				type="button"
				:title="mainStore.t.s.extra.resetUserSettingsVoc"
				@click="adminStore.resetUserSettingsVoc()"
			>
				{{ mainStore.t.i.buttons.reset }}
			</button>
		</fieldset>
	</form>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { saveSettingsUsersVoc } from '@/services/db';
import { ennobleError } from '@/shared/response';
import { useMainStore } from '@/stores/main';
import { useAdminStore } from '@/stores/admin';
import Tree from '@/components/tree/Tree.vue';

const mainStore = useMainStore();
const adminStore = useAdminStore();

const treeMode = ref(1);

const settingsSubmit = (): void => {
	saveSettingsUsersVoc();
};

onMounted(async () => {
	mainStore.setBusy(true);
	try {
		await adminStore.setSettingsGroups();
		await adminStore.setUserSettingsVoc();
		adminStore.trees.settingsvoc.open = true;
	} catch (error) {
		mainStore.setMessage(ennobleError(error));
	} finally {
		mainStore.setBusy(false);
	}
});
</script>

<style lang="scss" scoped>
.admin-settings {
	&__header {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 12px;
		align-items: center;
	}
}
.control-panel {
	display: flex;
	gap: 12px;
	flex-wrap: wrap;
	button:not(:where(.link)) {
		min-width: 32px;
	}
}
.settings-form {
	display: flex;
	flex-direction: column;
	gap: 20px;
	&__buttons {
		display: flex;
		gap: 8px;
		justify-content: space-between;
	}
}
</style>
