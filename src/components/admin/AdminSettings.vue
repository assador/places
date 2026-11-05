<template>
	<div class="admin-settings__header">
		<h1 class="margin_bottom_0">{{ mainStore.t.i.captions.settings }}</h1>
		<div class="control-panel">
			<button
				:title="mainStore.t.i.buttons.viewTable"
				@click="treeMode = 1"
			>
				<img src="@/assets/icons/dark/list.svg" />
			</button>
			<button
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
		<table class="table_form">
			<tbody>
				<tr class="back_0">
					<th />
					<td colspan="2">
						<Tree
							instanceid="settingstree"
							what="settings"
							:editable="false"
						/>
					</td>
				</tr>
				<tr class="settings-form-buttons back_0">
					<th />
					<td>
						<button type="submit">
							{{ mainStore.t.i.buttons.save }}
						</button>
					</td>
					<td>
						<button
							type="button"
							:title="mainStore.t.s.extra.resetUserSettingsVoc"
							@click="adminStore.resetUserSettingsVoc()"
						>
							{{ mainStore.t.i.buttons.reset }}
						</button>
					</td>
				</tr>
			</tbody>
		</table>
	</form>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { saveSettingsUsersVoc } from '@/services/db';
import { useMainStore } from '@/stores/main';
import { useAdminStore } from '@/stores/admin';

const mainStore = useMainStore();
const adminStore = useAdminStore();

const treeMode = ref(1);

const settingsSubmit = (): void => {
	saveSettingsUsersVoc();
};
onMounted(() => {
	mainStore.setSettingsGroups().then(() => mainStore.trees.settings.open = true);
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
</style>
