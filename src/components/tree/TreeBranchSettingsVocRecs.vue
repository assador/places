<template>
	<template
		v-for="n in props.rows.length"
		:key="n"
	>
		<template v-for="object in [getSetting(n)]" :key="object.id">
			<div
				:id="'setting-' + object.id"
				:type="object.type"
				:srt="object.srt"
				:title="
					mainStore.t.s.name[object.name as DictionaryNameKey] +
					(!isValidSettingsVocRec(object) ? (
						'\n' + mainStore.t.m.errors.other.incorrectFields
					) : null)
				"
				class="tree-item formed"
				:class="{
					active: object.checked,
					chosen: false,
					back_added: object.added,
					back_updated: object.updated,
					back_deleted: object.deleted,
					back_error: !isValidSettingsVocRec(object),
					draggable: props.editable,
					dragging: dragging,
				}"
				:data-entity-id="object.id"
				:data-entity-type="object.type"
				:data-entity-context="props.what"
			>
				<div
					v-if="props.editable"
					class="setting-drag dragging-area icon icon-expand"
					@pointerdown.stop="e => onPointerDown(e, {
						id: object.id,
						type: object.type,
						context: props.what,
					})"
				    @pointermove.stop="onPointerMove"
				    @pointerup.stop="e => onPointerUp(e, () => {})"
					@pointercancel.stop="onPointerUp"
				/>
				<div
					class="setting-menu icon icon-menu"
					@click.stop.prevent="e => common.toggleEntityMenuPopup(
						e,
						object,
						props.what,
					)"
				/>
				<div class="setting-actions">
					<input
						type="checkbox"
						v-model="object.checked"
					/>
				</div>
				<div class="setting-status">
					<span v-if="object.added">A</span>
					<span v-if="object.updated">U</span>
					<span v-if="object.deleted">D</span>
				</div>
				<template
					v-for="key in keysArray"
					:key="key"
				>
					<div
						v-if="key === 'id'"
						class="tree-item__id"
					>
						{{ object.id }}
					</div>
					<div
						v-else-if="key === 'baseval'"
						class="tree-item__baseval"
					>
						<select
							v-if="object.enum?.length"
							:class="{ focused: key === adminStore.settingsSortBy }"
							:value="object.baseval"
							@change="changeValue(object, 'baseval', $event)"
						>
							<option
								v-for="(opt, idx) in object.enum"
								:key="idx"
								:value="opt.val"
							>
								{{ opt.val }}
							</option>
						</select>
						<span v-else>
							<input
								type="text"
								:class="{ focused: key === adminStore.settingsSortBy }"
								:value="object.baseval"
								@change="changeValue(object, 'baseval', $event)"
							/>
						</span>
						<span
							class="setting-menu icon icon-menu"
							@click.stop.prevent="e => common.toggleEntityMenuPopup(
								e,
								object,
								props.what,
							)"
						/>
					</div>
					<div v-else-if="key === 'valtype'">
						<select
							:class="{ focused: key === adminStore.settingsSortBy }"
							:value="object.valtype"
							@change="changeValue(object, 'valtype', $event)"
						>
							<option
								v-for="(t, k) in types"
								:key="k"
								:value="k"
							>
								{{ t }}
							</option>
						</select>
					</div>
					<div v-else-if="key === 'srt' || key === 'folderid'">
						<input
							type="number"
							:class="{ focused: key === adminStore.settingsSortBy }"
							:value="object[key]"
							@change="changeValue(object, key, $event)"
						/>
					</div>
					<div v-else-if="key === 'public'">
						<input
							type="checkbox"
							:checked="object.public"
							@change="changeValue(
								object,
								'public',
								$event,
								($event.target as HTMLInputElement).checked
							)"
						/>
					</div>
					<div v-else>
						<input
							type="text"
							:class="{ focused: key === adminStore.settingsSortBy }"
							:value="object[key]"
							@change="changeValue(object, key, $event)"
						/>
					</div>
				</template>
			</div>
		</template>
	</template>
</template>

<script setup lang="ts">
import { ref, Ref, computed, inject } from 'vue';
import { FolderContext, Dictionary } from '@/types';
import { SettingsVocRec } from '@/types/settings';
import { SettingsVocRecFields, useSettingsVocRecFields } from '@/shared/settings';
import { isValidSettingsVocRec } from '@/guards';
import { common } from '@/services/common';
import { usePointerDnD } from '@/services/dnd';
import { useMainStore } from '@/stores/main';
import { useAdminStore } from '@/stores/admin';

interface TreeBranchProps {
	what: FolderContext;
	rows: SettingsVocRec[];
	editable?: boolean;
	reverse?: boolean;
}
const props = withDefaults(defineProps<TreeBranchProps>(), {
	editable: true,
	reverse: false,
});
type DictionaryNameKey = keyof Dictionary['s']['name'];

const mainStore = useMainStore();
const adminStore = useAdminStore();

const types = {
	0: 'null',
	1: 'boolean',
	2: 'number',
	3: 'string',
} as const;

const settingsVocRecFields = useSettingsVocRecFields();
const hiddenFields = ref<Partial<Record<keyof SettingsVocRecFields, boolean>>>({
});
const keysArray = computed(() =>
    (Object.keys(settingsVocRecFields.value) as (keyof SettingsVocRec)[])
        .filter(key => settingsVocRecFields.value[key] && !hiddenFields.value[key])
);

const getSetting = (n: number) =>
	props.rows[props.reverse ? props.rows.length - n : n - 1]
;

const changeValue = <K extends keyof SettingsVocRec>(
	o: SettingsVocRec,
	k: K,
	e: Event,
	r?: unknown,
) => {
	const raw = (e.target as HTMLInputElement).value;
	const field = settingsVocRecFields.value[k];
	const value = r !== undefined ? r : (field?.parser ? field.parser(raw) : raw);
	adminStore.changeSettingsVocRec({
		entity: o,
		change: { [k]: value } as Pick<SettingsVocRec, K>,
	});
};

// SEC DnD

const dragging = inject<Ref<boolean>>('dragging', ref(false));
const dragTargetId = inject<Ref<string | null>>('dragTargetId', ref(null));
const dragTargetContext = inject<Ref<string | null>>('dragTargetContext', ref(null));

const canAcceptDrop = (target: HTMLElement): boolean => {
	const { entityId, entityContext, entityType } = target.dataset;
	if (!entityType || !mainStore.currentDrag) return false;
	return (
		mainStore.currentDrag.context === entityContext &&
		!(mainStore.currentDrag.id === entityId && mainStore.currentDrag.type === entityType) &&
		!(mainStore.currentDrag.type === 'folder' && entityType === 'setting')
	);
};
const updateHighlights = (target: HTMLElement | null): void => {
	dragTargetId.value = null;
	if (!target || !mainStore.currentDrag) return;
	const area = target.closest('.sorting-area-onto, .sorting-area-before, .sorting-area-after');
	if (area) {
		const item = area.closest('[data-entity-id]') as HTMLElement;
		if (!item || !item.dataset.entityId || !item.dataset.entityContext) return;
		dragTargetId.value = item.dataset.entityId;
		dragTargetContext.value = item.dataset.entityContext;
		if (area.classList.contains('sorting-area-onto')) mainStore.currentDrag.position = 'onto';
		else if (area.classList.contains('sorting-area-before')) mainStore.currentDrag.position = 'before';
		else if (area.classList.contains('sorting-area-after')) mainStore.currentDrag.position = 'after';
	}
};

const noop = () => {};

const dnd = computed(() => {
	if (!props.editable) return null;
	return usePointerDnD({
	    canAcceptDrop,
	    updateHighlights,
	    onDragStateChange: (value) => { dragging.value = value; },
		overrides: {
			treeParams: adminStore.treeParams,
			changeFolder: adminStore.changeFolder,
		}
	});
});
const onPointerDown = computed(() => dnd.value?.onPointerDown || noop);
const onPointerMove = computed(() => dnd.value?.onPointerMove || noop);

const onPointerUp = computed(() => {
	if (dnd.value) return dnd.value.onPointerUp;
	return (_event: PointerEvent, click?: () => void) => click?.();
});
</script>

<style lang="scss" scoped>
@use '@/assets/styles/tree-settingsvoc';
</style>
