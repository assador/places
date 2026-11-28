<template>
	<li
		:id="
			(instanceid === 'popupexporttree' ? 'to-export-' : '') +
			'tree-menu-folder-' + folder.id
		"
		:srt="folder.srt"
		:title="mainStore.t.s.desc[folder.description as DictionaryDescKey]"
		:data-entity-id="folder.id === null ? 'null' : folder.id"
		:data-entity-type="folder.type"
		:data-entity-context="props.what"
		class="folder"
		:class="{
			'folder_open': folder.open,
			'folder_closed': !folder.open,
			'unparented': !folder.parent,
		}"
	>
		<div
			:id="folder.virtual && folder.context === 'settingsvoc'
				? 'settings-header'
				: undefined
			"
			class="folder-subs"
			:class="{
				'folder_editable': common.folderEditability,
				'folder-subs-to-export': folder.virtual && instanceid === 'popupexporttree',
			}"
		>

<!-- SEC Folder  -->

			<div
				class="tree-folder sorting-area-onto"
				:class="{
					back_added: folder.added,
					back_updated: folder.updated,
					back_deleted: folder.deleted,
					back_error: !isFolder(folder),
					highlighted:
						String(folder.id) === dragTargetId &&
						folder.context === dragTargetContext &&
						mainStore.currentDrag?.position === 'onto'
					,
				}"
				@pointermove="onPointerMove"
				@pointerup.stop.prevent="onPointerUp"
				@pointercancel="onPointerUp"
				@contextmenu.stop.prevent="e => common.toggleEntityMenuPopup(
					e,
					folder.id ? folders[folder.id] : adminStore.trees[folder.context],
					props.what,
				)"
			>
				<div
					:id="'tree-menu-folder-link-' + folder.id"
					class="tree-folder__content"
				>
					<div
						v-if="props.editable"
						class="tree-folder__drag dragging-area icon icon-expand"
						:class="{
							draggable: !folder.virtual && props.editable,
						}"
						@pointerdown="e => onPointerDown(e, {
							id: folder.id,
							type: folder.type,
							context: props.what,
							nondraggable: folder.virtual || !props.editable,
						})"
					/>
					<div
						class="tree-folder__arrow"
						@pointerup.stop.prevent="adminStore.folderOpenClose({ folder })"
					>
						<div
							class="icon icon-triangle"
							:class="folder.open ? 'icon-triangle_down' : 'icon-triangle_right'"
						/>
					</div>
					<h2
						v-if="folder.virtual"
						class="color-01"
					>
						{{ mainStore.t.i.captions[folder.context] }}
					</h2>
					<div
						v-else
						class="tree-folder__fields"
					>
						<input
							type="text"
							class="tree-folder__name"
							:value="folder.name"
							:title="mainStore.t.s.name[folder.name as DictionaryNameKey]"
							:placeholder="mainStore.t.i.captions.name"
							@change="e => {
								if (!props.editable) return;
								adminStore.changeFolder({
									entity: folder,
									change: { name: (e.currentTarget as HTMLInputElement).value },
								});
							}"
							@click.stop.prevent
						/>
						<input
							type="text"
							class="tree-folder__description"
							:value="folder.description"
							:title="mainStore.t.s.desc[folder.description as DictionaryDescKey]"
							:placeholder="mainStore.t.i.captions.description"
							@change="e => {
								if (!props.editable) return;
								adminStore.changeFolder({
									entity: folder,
									change: { description: (e.currentTarget as HTMLInputElement).value },
								});
							}"
							@click.stop.prevent
						/>
						<input
							type="number"
							class="tree-folder__srt"
							:value="folder.srt"
							:title="mainStore.t.i.captions.srt"
							@change="e => {
								if (!props.editable) return;
								adminStore.changeFolder({
									entity: folder,
									change: { srt: Number((e.currentTarget as HTMLInputElement).value) },
								});
							}"
							@click.stop.prevent
						/>
						<div class="tree-folder__ids">
							ID:
							<strong>{{ folder.id }}</strong>
							{{ mainStore.t.i.text.of }}
							<strong>{{ folder.parent ?? 'null' }}</strong>
						</div>
						<div class="tree-folder__status">
							<span v-if="folder.added">A</span>
							<span v-if="folder.updated">U</span>
							<span v-if="folder.deleted">D</span>
						</div>
						<div
							class="tree-folder__menu icon icon-menu"
							@click.stop.prevent="e => common.toggleEntityMenuPopup(
								e,
								folder,
								props.what,
							)"
						/>
					</div>
				</div>
			</div>
		</div>
		<div class="folder-subfolders">
			<ul
				v-if="folder.children && Object.keys(folder.children).length"
				class="margin_bottom_0"
			>
				<TreeSubfolder
					v-for="(child, index) in folder.children"
					:key="`${index}-${child.id}`"
					:instanceid="instanceid"
					:editable="props.editable"
					:what="props.what"
					:folder="child"
					:parent="folder"
				/>
			</ul>
		</div>

<!-- SEC SettingsVoc  -->

		<div
			v-if="rowsArray.length"
			class="folder-items table table-1"
			:class="{
				'folder_open': folder.open,
				'folder_closed': !folder.open,
				'unparented': !folder.id,
			}"
			:style="{
				gridTemplateColumns: [
					'auto', 'auto', 'auto', 'auto',
					...keysArray.map(getColumnWidth),
				].join(' '),
			}"
		>
			<div class="tree-item formed">
				<div />
				<div />
				<div>
					<input
						type="checkbox"
						:checked="checked === 1"
						.indeterminate="checked === 2"
						:title="mainStore.t.i.buttons[checked ? 'uncheckAll' : 'checkAll']"
						@change="checkAll(checked === 2 ? true : !checked)"
					/>
				</div>
				<div />
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

<!-- SEC SettingsVocRec  -->

			<TreeBranchSettingsVocRecs
				:what="props.what"
				:rows="rowsArray"
				:editable="props.editable"
				:reverse="isReverse"
			/>

		</div>
		<div
			v-if="!folder.virtual && props.editable"
			class="sorting-area sorting-area-before"
			:class="{
				'sorting-area-border-top':
					folder.id === dragTargetId &&
					mainStore.currentDrag?.type === 'folder' &&
					mainStore.currentDrag?.position === 'before'
			}"
		/>
		<div
			v-if="!folder.virtual && props.editable"
			class="sorting-area sorting-area-after"
			:class="{
				'sorting-area-border-bottom':
					folder.id === dragTargetId &&
					mainStore.currentDrag?.type === 'folder' &&
					mainStore.currentDrag?.position === 'after'
			}"
		/>
	</li>
</template>

<script lang="ts">
export default {
	name: 'TreeSubfolder',
};
</script>

<script setup lang="ts">
import { ref, Ref, computed, inject } from 'vue';
import { useMainStore } from '@/stores/main';
import { useAdminStore } from '@/stores/admin';
import { Dictionary, Folder, FolderContext } from '@/types';
import { SettingsVocRec } from '@/types/settings';
import { isFolder } from '@/guards';
import { SettingsVocRecFields, useSettingsVocRecFields } from '@/shared/settings';
import { common } from '@/services/common';
import { usePointerDnD } from '@/services/dnd';
import TreeBranchSettingsVocRecs from '@/components/tree/TreeBranchSettingsVocRecs.vue';

interface TreeBranchProps {
	instanceid?: string | null;
	editable?: boolean;
	what: FolderContext;
	folder: Folder;
	parent: Folder | null;
}
const props = withDefaults(defineProps<TreeBranchProps>(), {
	instanceid: null,
	editable: true,
});

const mainStore = useMainStore();
const adminStore = useAdminStore();

const isReverse = ref(false);

type DictionaryNameKey = keyof Dictionary['s']['name'];
type DictionaryDescKey = keyof Dictionary['s']['desc'];

const folders = computed((): Record<string, Folder> => {
	return adminStore.treeParams[props.what].folders;
});
const entities = computed((): Record<string, SettingsVocRec> => {
	const recs: Record<string, SettingsVocRec> = {};
	const dict = adminStore.settings.usersvoc;
	for (const id in dict) {
		if (!Object.hasOwn(dict, id)) continue;
		const s = dict[id];
		if (s.folderid === props.folder.id) recs[id] = s;
	}
	return recs;
});

const settingsVocRecFields = useSettingsVocRecFields();
const hiddenFields = ref<Partial<Record<keyof SettingsVocRecFields, boolean>>>({
});
const keysArray = computed(() =>
    (Object.keys(settingsVocRecFields.value) as (keyof SettingsVocRec)[])
        .filter(key => settingsVocRecFields.value[key] && !hiddenFields.value[key])
);
const rowsArray = computed(() => {
	const key = adminStore.settingsSortBy;
	const by = settingsVocRecFields.value[key]?.sortBy ?? key;
	return adminStore.getSorted({
		what: 'settings',
		by,
		of: entities.value,
	}) as SettingsVocRec[];
});

const columnWidths: Record<string, string> = {
	id: '3em',
	folderid: '6em',
	srt: '6em',
	public: '4em',
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
	for (const row of rowsArray.value) {
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
	for (const row of rowsArray.value) {
		check(row.id, val);
	}
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
			changeFolder: adminStore.changeFolder,
			getSrts: adminStore.getSrts,
			treeParams: adminStore.treeParams,
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
@use '@/assets/styles/tree/settingsvoc';
ul {
	padding-left: 0;
}
.folder {
	display: flex;
	flex-direction: column;
	position: relative;
	padding-left: 23px;
	&::before {
		display: none;
	}
	& > .folder-subs {
		display: flex;
		z-index: 20;
	}
	&.unparented {
		padding: 0;
	} // So poetic and sad!
	&.folder_open:is(
		.points,
		#tree-menu-folder-null
	) > .folder-subs:has(~ .folder-subfolders *),
	#settings-header:has(~ .folder-items:not(:empty)) {
		margin-bottom: 12px;
	}
	&.folder-root {
		> .folder-subfolders > * > .folder {
			padding: 0;
		}
	}
	&_editable {
		display: grid !important;
		grid-template-columns: auto 1fr;
		align-items: start !important;
		margin: 6px 0;
		.control-buttons {
			flex: 0 1 auto;
			flex-flow: column wrap;
		}
		.tree-folder {
			margin: 0 -8px 8px -1px;
			&__content {
				display: flex;
				flex-direction: column;
				gap: 8px;
			}
			input, textarea {
				display: block;
			}
		}
		input, textarea {
			min-width: 0;
		}
		&#settings-header {
			grid-template-columns: auto 1fr auto;
		}
	}
	.folder-distances {
		margin-top: -6px;
		align-self: end;
		text-align: right;
	}
}
.folder_closed {
	> .folder-subfolders {
		display: none;
	}
	> .folder-items {
		display: none !important;
	}
}
.folder_open {
	> .folder-subfolders {
		display: block;
	}
	&::before {
		content: '';
		display: block;
		position: absolute;
		top: 1.5em; bottom: 2px; left: 0;
		width: 1px;
		margin: 0;
		float: none;
	}
}
.tree-folder {
	position: relative;
	flex: 1 0 auto;
	display: flex;
	flex-flow: row nowrap;
	margin: 0 -4px;
	z-index: 0;
	touch-action: none;
	user-select: none;
	h2 {
		line-height: 1;
	}
	&__content {
		flex: 1 0 auto;
		display: flex;
		gap: 4px;
		padding: 4px;
		min-height: 1lh;
		align-items: center;
		cursor: pointer;
	}
	&__drag, &__menu {
		width: 16px; height: 16px;
		opacity: 0.2;
		z-index: 30;
		cursor: pointer;
	}
	&__arrow {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 100%;
		cursor: pointer;
		.icon-triangle {
			cursor: pointer;
		}
	}
	&__fields {
		--tree-gap: 8px;
		--tree-number-width: 6em;
		flex: 1 0 auto;
		display: grid;
		grid-template-columns:
			minmax(0, max(0px, calc(
				100% - 50vw - var(--tree-gap)
			)))
			minmax(0, 1fr)
			minmax(0, var(--tree-number-width))
			auto
			auto
			auto
		;
		gap: var(--tree-gap);
		align-items: center;
		padding-left: 4px;
		cursor: auto;
	}
	&__ids, &__status {
		white-space: nowrap;
		text-align: right;
	}
	&__ids {
		width: 80px;
	}
	&__status {
		width: 30px;
	}
}
@media (pointer: coarse) {
	.tree-folder {
		padding-top: 4px;
		padding-bottom: 4px;
	}
}
.folder-subs {
	display: flex;
	gap: 8px;
	align-items: center;
	&-to-export {
		margin-bottom: 12px;
	}
}
.folder-items {
	display: grid !important;
	grid-template-columns: auto 1fr;
	padding: 6px 0;
}
:not(:is(.folder-root)) > .folder-items:is(:not(.unparented)) {
	display: block;
	margin-left: 50px;
}
#settings-header {
	z-index: 10;
	&.folder-subs {
		z-index: 20;
	}
	.control-buttons {
		justify-content: end;
	}
	.tree-folder {
		grid-template-columns: 1fr auto;
		&__description {
			height: 44px;
		}
	}
}
.sorting-area {
	position: absolute;
	right: 0; left: 0;
	height: 4px;
	z-index: 20;
	-webkit-tap-highlight-color: transparent;
	-webkit-touch-callout: none;
}
.sorting-area-before {
	top: 0; bottom: auto;
}
.sorting-area-after {
	top: auto; bottom: -1px;
}
.dragging .dragging-area {
	z-index: 0;
}
</style>
