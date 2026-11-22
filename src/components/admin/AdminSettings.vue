<template>
	<div class="admin-settings__header">
		<h1 class="margin_bottom_0">{{ mainStore.t.i.captions.settings }}</h1>
	</div>
	<div class="admin-settings__voc"
	>
		<div class="admin-settings__voc__tree">
			<Tree
				instanceid="settingsvoctree"
				what="settingsvoc"
				:editable="true"
			/>
		</div>
		<div
			v-if="orphansArray.length"
			class="admin-settings__voc__orphans"
		>
			<h2>{{ mainStore.t.i.captions.orphans }}</h2>
			<div
				class="folder-items table table-1"
				:style="{
					gridTemplateColumns: [
						'auto', 'auto', 'auto',
						...keysArray.map(getColumnWidth),
					].join(' '),
				}"
			>
				<div class="tree-item formed">
					<div /><div />
					<div>
						<input
							type="checkbox"
							:checked="checked === 1"
							.indeterminate="checked === 2"
							:title="mainStore.t.i.buttons[checked ? 'uncheckAll' : 'checkAll']"
							@change="checkAll(checked === 2 ? true : !checked)"
						/>
					</div>
					<h3
						v-for="key in keysArray"
						:key="key"
						class="table-column-caption margin_bottom_0"
						:class="'tree-item__' + key"
						@click="sortBy(key)"
					>
						<div
							v-if="key === adminStore.settingsSortBy"
							class="icon icon-triangle"
							:class="isReverse ? 'icon-triangle_down' : 'icon-triangle_up'"
						/>
						<button
							v-if="settingsVocRecFields[key]"
							type="button"
							class="link"
						>
							{{
								key === 'public'
								? settingsVocRecFields[key].caption.slice(0, 3) + '.'
								: settingsVocRecFields[key].caption
							}}
						</button>
					</h3>
				</div>
				<TreeBranchSettingsVocRecs
					:what="'settingsvoc'"
					:rows="orphansArray"
					:editable="true"
					:reverse="isReverse"
				/>
			</div>
		</div>
		<div v-if="!adminStore.isValidSettingsVoc">
			{{ mainStore.t.m.errors.other.incorrectFields }}
		</div>
		<div class="admin-settings__voc__buttons">
			<button
				type="button"
				:disabled="!adminStore.isValidSettingsVoc"
				@click="settingsSubmit"
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
		</div>
	</div>
	<PopupEntityMenu />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { SettingsVocRec } from '@/types/settings';
import { SettingsVocRecFields, useSettingsVocRecFields } from '@/shared/settings';
import { saveSettingsAdmin } from '@/services/db';
import { hasOwnKeys } from '@/shared/common';
import { ennobleError } from '@/shared/response';
import { useMainStore } from '@/stores/main';
import { useAdminStore } from '@/stores/admin';
import Tree from '@/components/tree/Tree.vue';
import TreeBranchSettingsVocRecs from '@/components/tree/TreeBranchSettingsVocRecs.vue';
import PopupEntityMenu from '@/components/popups/PopupEntityMenu.vue';

const mainStore = useMainStore();
const adminStore = useAdminStore();

const isReverse = ref(false);

const settingsVocRecFields = useSettingsVocRecFields();
const hiddenFields = ref<Partial<Record<keyof SettingsVocRecFields, boolean>>>({
});
const keysArray = computed(() =>
    (Object.keys(settingsVocRecFields.value) as (keyof SettingsVocRec)[])
        .filter(key => settingsVocRecFields.value[key] && !hiddenFields.value[key])
);
const groupIdsArray = computed(() => {
	const array: string[] = [];
	for (const id in adminStore.settings.groups) {
		if (!Object.hasOwn(adminStore.settings.groups, id)) continue;
		array.push(id);
	}
	return array;
});
const orphansArray = computed(() => {
	const array: SettingsVocRec[] = [];
	for (const id in adminStore.settings.usersvoc) {
		if (!Object.hasOwn(adminStore.settings.usersvoc, id)) continue;
		const s = adminStore.settings.usersvoc[id];
		if (s.folderid !== null && !groupIdsArray.value.includes(s.folderid)) array.push(s);
	}
	return array;
});

const columnWidths: Record<string, string> = {
	id: '6em',
	folderid: '6em',
	srt: '7em',
};
const getColumnWidth = (key: string) => columnWidths[key] ?? 'minmax(0, 1fr)';

const sortBy = (key: keyof SettingsVocRec): void => {
	if (key !== adminStore.settingsSortBy) {
		adminStore.settingsSortBy = key;
	} else {
		isReverse.value = !isReverse.value;
	}
};

const check = (id: string, val: boolean): void => {
	adminStore.settings.usersvoc[id].checked = val;
};
const checked = computed((): number => {
	let prev: boolean | undefined;
	for (const row of orphansArray.value) {
		const current = Boolean(row.checked);
		if (prev === undefined) {
			prev = current;
			continue;
		} else {
			if (current !== prev) return 2;
		}
		prev = current;
	}
	return Number(prev);
});
const checkAll = (val: boolean): void => {
	for (const row of orphansArray.value) {
		check(row.id, val);
	}
};

const settingsSubmit = (): void => {
	saveSettingsAdmin();
};

onMounted(async () => {
	if (!hasOwnKeys(adminStore.settings.groups)) {
		mainStore.setBusy(true);
		try {
			await adminStore.setSettingsGroups();
			adminStore.trees.settingsvoc.open = true;
		} catch (error) {
			mainStore.setMessage(ennobleError(error));
		} finally {
			mainStore.setBusy(false);
		}
	}
	if (!hasOwnKeys(adminStore.settings.usersvoc)) {
		mainStore.setBusy(true);
		try {
			await adminStore.setUserSettingsVoc();
		} catch (error) {
			mainStore.setMessage(ennobleError(error));
		} finally {
			mainStore.setBusy(false);
		}
	}
});
</script>

<style lang="scss" scoped>
@use '@/assets/styles/tree-settingsvoc';
.admin-settings {
	&__header {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 12px;
		align-items: center;
	}
	&__voc {
		display: flex;
		flex-direction: column;
		gap: 20px;
		&__buttons {
			display: flex;
			gap: 8px;
			justify-content: space-between;
		}
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
