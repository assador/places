<template>
	<template
		v-for="n in props.array.length"
		:key="n"
	>
		<template v-for="object in [getSetting(n)]" :key="object.id">
			<div
				:id="'setting-' + object.id"
				:type="object.type"
				:srt="object.srt"
				:title="mainStore.t.s.name[object.name as DictionaryNameKey]"
				class="tree-item"
				:class="{
					active: object.checked,
					chosen: false,
					back_1: object.added || object.updated || object.deleted,
					draggable: props.editable,
					dragging: dragging,
				}"
				:data-entity-id="object.id"
				:data-entity-type="object.type"
				:data-entity-context="props.what"
			>
				<div class="setting-actions">
					<input
						type="checkbox"
						v-model="object.checked"
					/>
				</div>
				<template
					v-for="key in keysArray"
					:key="key"
				>
					<div
						v-if="key === 'enum'"
						:class="{ back_1: key === adminStore.settingsSortBy }"
					>
						<select
							v-if="object.enum?.length"
							v-model="object.baseval"
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
							{{ object.baseval }}
						</span>
					</div>
					<div
						v-else-if="key === 'valtype'"
						:class="{ back_1: key === adminStore.settingsSortBy }"
					>
						<select v-model="object.valtype">
							<option
								v-for="(t, k) in types"
								:key="k"
								:value="k"
							>
								{{ t }}
							</option>
						</select>
					</div>
					<div
						v-else-if="key === 'srt'"
						:class="{ back_1: key === adminStore.settingsSortBy }"
					>
						<input
							v-model="object.srt"
							type="number"
						/>
					</div>
					<div
						v-else
						:class="{ back_1: key === adminStore.settingsSortBy }"
					>
						<input
							:value="object[key]"
							:type="
								['id', 'folderid'].includes(key)
								? 'number' : 'text'
							"
							@input="object.folderid = ($event.target as HTMLInputElement).value"
						/>
					</div>
				</template>
				<div
					v-if="props.editable"
					class="dragging-area icon icon-expand"
					@pointerdown.stop="e => onPointerDown(e, {
						id: object.id,
						type: object.type,
						context: props.what,
					})"
				    @pointermove.stop="onPointerMove"
				    @pointerup.stop="e => onPointerUp(e, () => {})"
					@pointercancel.stop="onPointerUp"
				/>
			</div>
		</template>
	</template>
</template>

<script setup lang="ts">
import { ref, Ref, computed, inject } from 'vue';
import { FolderContext, Dictionary } from '@/types';
import { SettingsVocRec } from '@/types/settings';
import { usePointerDnD } from '@/services/dnd';
import { useMainStore } from '@/stores/main';
import { useAdminStore } from '@/stores/admin';

interface TreeBranchProps {
	editable?: boolean;
	what: FolderContext;
	array: SettingsVocRec[];
}
const props = withDefaults(defineProps<TreeBranchProps>(), {
	editable: true,
});
type DictionaryNameKey = keyof Dictionary['s']['name'];

const mainStore = useMainStore();
const adminStore = useAdminStore();

const isReverse = ref(false);

const types = {
	0: 'null',
	1: 'boolean',
	2: 'number',
	3: 'string',
} as const;

type Field<K extends keyof SettingsVocRec> = {
	enabled: boolean;
	caption: string;
	formatter?: (value: Exclude<SettingsVocRec[K], undefined>) => unknown;
};
type Fields = {
	[K in keyof SettingsVocRec]?: Field<K>;
};

const fields = ref<Fields>({
	id            : { enabled: true, caption: mainStore.t.i.captions.id },
	name          : { enabled: true, caption: mainStore.t.i.captions.name },
	description   : { enabled: true, caption: mainStore.t.i.captions.description },
	valtype       : { enabled: true, caption: mainStore.t.i.captions.type },
	enum          : { enabled: true, caption: mainStore.t.i.captions.default },
	folderid      : { enabled: true, caption: mainStore.t.i.captions.folder },
	srt           : { enabled: true, caption: mainStore.t.i.captions.srt },
});

const keysArray = computed(() =>
	(Object.keys(fields.value) as (keyof SettingsVocRec)[])
		.filter(key => fields.value[key]?.enabled)
);

const getSetting = (n: number) =>
	props.array[isReverse.value ? props.array.length - n : n - 1]
;

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
