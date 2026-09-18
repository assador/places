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
			:id="folder.virtual && folder.context === 'settings'
				? 'settings-header'
				: undefined
			"
			class="folder-subs"
			:class="{
				'folder_editable': common.folderEditability,
				'folder-subs-to-export': folder.virtual && instanceid === 'popupexporttree',
			}"
		>
			<div
				v-if="common.folderEditability"
				class="icon icon-triangle"
				:class="folder.open ? 'icon-triangle_down' : 'icon-triangle_right'"
				@pointerdown.stop
				@pointerup.stop
				@click.stop="mainStore.folderOpenClose({ folder })"
			/>
			<label
				v-if="instanceid === 'popupexporttree'"
				class="tree-item-checkbox-container"
			>
				<input
					:id="'to-export-tree-menu-folder-checkbox-' + folder.id"
					name="folderCheckbox"
					type="checkbox"
					class="tree-item-checkbox"
					:checked="common.foldersCheckedIds.has(folder.id ?? 'null')"
					@change="e => selectFolderToExport(
						folder.id,
						(e.currentTarget as HTMLInputElement).checked,
					)"
				/>
			</label>
			<div
				v-if="common.folderEditability"
				:id="
					(instanceid === 'popupexporttree' ? 'to-export-' : '') +
					'tree-menu-folder-link-' + folder.id
				"
				class="tree-folder__content"
			>
				<input
					:value="mainStore.t.s.name[folder.name as DictionaryNameKey]"
					:placeholder="mainStore.t.i.captions.name"
					class="tree-folder__name fieldwidth_100"
					@change="e => {
						if (!props.editable) return;
						mainStore.changeFolder({
							entity: folder,
							change: { name: (e.currentTarget as HTMLInputElement).value },
						});
					}"
					@click.stop.prevent
				/>
				<textarea
					:value="mainStore.t.s.desc[folder.description as DictionaryDescKey]"
					rows="2"
					:placeholder="mainStore.t.i.captions.description"
					class="tree-folder__description fieldwidth_100"
					@change="e => {
						if (!props.editable) return;
						mainStore.changeFolder({
							entity: folder,
							change: { description: (e.currentTarget as HTMLInputElement).value },
						});
					}"
					@click.stop.prevent
				/>
			</div>

<!-- SEC Folder  -->

			<div
				v-if="!common.folderEditability"
				class="tree-folder sorting-area-onto"
				:class="{
					draggable: !folder.virtual,
					highlighted:
						String(folder.id) === dragTargetId &&
						folder.context === dragTargetContext &&
						mainStore.currentDrag?.position === 'onto'
					,
				}"
				@pointerdown="e => onPointerDown(e, {
					id: folder.id,
					type: folder.type,
					context: props.what,
					nondraggable: folder.virtual,
				})"
			    @pointermove="onPointerMove"
			    @pointerup="e => onPointerUp(e, () => mainStore.folderOpenClose({ folder }))"
			    @pointercancel="onPointerUp"
				@contextmenu.stop.prevent="e => common.toggleEntityMenuPopup(
					e,
					folder.id ? folders[folder.id] : mainStore.trees[folder.context],
					props.what,
				)"
			>
				<div
					:id="
						(instanceid === 'popupexporttree' ? 'to-export-' : '') +
						'tree-menu-folder-link-' + folder.id
					"
					class="tree-folder__content"
				>
					<div
						class="icon icon-triangle"
						:class="folder.open ? 'icon-triangle_down' : 'icon-triangle_right'"
					/>
					<h2
						v-if="folder.virtual"
						class="color-01"
					>
						{{ mainStore.t.i.captions[folder.context] }}
					</h2>
					<div v-else>
						{{ mainStore.t.s.name[folder.name as DictionaryNameKey] }}
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
		<div
			:id="
				(instanceid === 'popupexporttree' ? 'to-export-folder-' : '') +
				folder.id
			"
			class="folder-items"
			:class="{
				'folder_open': folder.open,
				'folder_closed': !folder.open,
				'unparented': !folder.id,
			}"
		>

<!-- SEC Setting  -->

			<template
				v-for="object in entities"
				:key="object.id"
			>
				<label
					v-if="isSetting(object)"
					:id="'setting-' + object.id"
					:type="object.type"
					:srt="object.srt"
					:title="mainStore.t.s.name[object.name as DictionaryNameKey]"
					class="tree-item draggable"
					:class="{
						active: false,
						chosen: false,
						dragging: dragging,
					}"
					:data-entity-id="object.id"
					:data-entity-type="object.type"
					:data-entity-context="props.what"
				>
					<span
						v-if="instanceid === 'popupexporttree'"
						class="tree-item-checkbox-container"
						>
						<input
							:id="'to-export-setting-checkbox-' + object.id"
							name="settingCheckbox"
							type="checkbox"
							class="to-export-setting-checkbox tree-item-checkbox"
							:checked="mainStore.selectedToExport[props.what].includes(object.id)"
							@change="e => mainStore.selectToExport(
								props.what,
								object.id,
								(e.currentTarget as HTMLInputElement).checked,
							)"
							@click.stop
						/>
					</span>
					<span
						class="tree-item__content"
						:class="{ placeholder: !object.name }"
					>
						<span class="tree-item__name">
							{{
								mainStore.t.s.name[object.name as DictionaryNameKey] ||
								mainStore.t.i.captions.untitled
							}}
						</span>
						<span class="tree-item__control">
							<select
								v-if="object.enum?.length"
								:value="mainStore.settings.user[object.id].val"
								@change="e => {
									mainStore.changeSetting({
										entity: object,
										change: { val: (e.currentTarget as HTMLSelectElement).value },
									});
								}"
							>
								<option
									v-for="(o, i) in object.enum"
									:key="i"
									:value="o.val"
								>
									{{ mainStore.t.s.extra[o.extra as DictionaryExtraKey] ?? o.val }}
								</option>
							</select>
						</span>
					</span>
					<span
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
					<span
						class="sorting-area sorting-area-before"
						:class="{
							'sorting-area-border-top':
								object.id === dragTargetId &&
								object.type === mainStore.currentDrag?.type &&
								mainStore.currentDrag?.position === 'before'
						}"
					/>
					<span
						class="sorting-area sorting-area-after"
						:class="{
							'sorting-area-border-bottom':
								object.id === dragTargetId &&
								object.type === mainStore.currentDrag?.type &&
								mainStore.currentDrag?.position === 'after'
						}"
					/>
				</label>
			</template>
		</div>
		<div
			v-if="!folder.virtual"
			class="sorting-area sorting-area-before"
			:class="{
				'sorting-area-border-top':
					folder.id === dragTargetId &&
					mainStore.currentDrag?.type === 'folder' &&
					mainStore.currentDrag?.position === 'before'
			}"
		/>
		<div
			v-if="!folder.virtual"
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
import _ from 'lodash';
import { ref, Ref, computed, inject, watch } from 'vue';
import { useMainStore } from '@/stores/main';
import {
	Dictionary,
	Folder,
	FolderContext,
} from '@/types';
import { Setting } from '@/types/settings';
import { isSetting } from '@/guards';
import { common } from '@/services/common';
import { usePointerDnD, handleDrop } from '@/services/dnd';

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
	parent: null,
});

const mainStore = useMainStore();

type DictionaryNameKey = keyof Dictionary['s']['name'];
type DictionaryDescKey = keyof Dictionary['s']['desc'];
type DictionaryExtraKey = keyof Dictionary['s']['extra'];

const folders = computed((): Record<string, Folder> => {
	return mainStore.treeParams[props.what].folders;
});
const settings = computed((): Setting[] => {
	const array: Setting[] = [];
	const dict = mainStore.settings.user;
	for (const id in dict) {
		if (!Object.hasOwn(dict, id)) continue;
		const s = dict[id];
		if (s.folderid === props.folder.id) array.push(s);
	}
	return _.chain(array).sortBy('srt').value();
});
const entities = computed((): Setting[] => {
	switch (props.what) {
		case 'settings':
			return settings.value;
		default:
			return [];
	}
});
const selectFolderToExport = (id: string | null, select: boolean): void => {
	const currentArray = mainStore.selectedToExport[props.what];
	const descendantsSet = mainStore.getDescendants(id, props.what);
	if (select) {
		mainStore.selectedToExport[props.what] = [
			...new Set(currentArray).union(descendantsSet),
		];
	} else {
		mainStore.selectedToExport[props.what] = [
			...new Set(currentArray).difference(descendantsSet),
		];
	}
};
watch(() => mainStore.selectedToExport[props.what], (newIds) => {
	const checkedFolders = new Set<string>();
	if (newIds) {
		for (const id of newIds) {
			const directFolderId =
				props.what === 'settings'
					? mainStore[props.what].user[id]?.folderid
					: mainStore[props.what][id]?.folderid
			;
			if (directFolderId) {
				checkedFolders.add(directFolderId);
				const ancestors = mainStore.getAncestors(directFolderId, props.what);
				for (const ancestorId of ancestors) {
					checkedFolders.add(ancestorId);
				}
			}
		}
	}
	common.foldersCheckedIds = checkedFolders;
}, { deep: true, immediate: true });

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
	    handleDrop,
	    canAcceptDrop,
	    updateHighlights,
	    onDragStateChange: (value) => { dragging.value = value; },
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
ul {
	padding-left: 0;
}
.folder {
	display: flex;
	flex-direction: column;
	position: relative;
	padding-left: 16px;
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
		.icon-triangle {
			margin-top: 6px;
			cursor: pointer;
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
.tree-item, .tree-folder {
	position: relative;
	gap: 8px;
	align-items: center;
	touch-action: none;
	user-select: none;
	h2 {
		line-height: 1;
	}
	&__content {
		min-height: 1lh;
	}
	&__controls {
		display: flex;
		gap: 8px;
		padding: 2px 0 3px 0;
		flex-wrap: wrap;
		align-items: start;
		justify-content: right;
		z-index: 40;
	}
}
.folder-items {
	display: grid !important;
	grid-template-columns: auto 1fr;
	padding: 6px 0;
}
.tree-item {
	grid-column: span 2;
	display: grid;
	grid-template-columns: subgrid;
	&:hover {
		background: none;
		box-shadow: none;
	}
	padding: 4px 0 4px 30px;
	.dragging-area {
		top: 50%; right: auto; bottom: auto; left: 0;
		transform: translateY(-50%);
		width: 16px; height: 16px;
		opacity: 0.2;
	}
	&__content {
		grid-column: span 2;
		display: grid;
		grid-template-columns: subgrid;
		gap: 8px;
		align-items: baseline;
	}
	&__name {
		text-align: right;
	}
}
.tree-folder {
	flex: 1 0 auto;
	display: flex;
	flex-flow: row nowrap;
	z-index: 0;
	cursor: pointer;
	&__content {
		display: flex;
		gap: 8px;
		align-items: baseline;
	}
}
@media (pointer: coarse) {
	.tree-folder {
		padding-top: 4px;
		padding-bottom: 4px;
	}
}
:not(:is(.folder-root)) > .folder-items:is(:not(.unparented)) {
	display: block;
	margin-left: 18px;
}
.folder-subs {
	display: flex;
	gap: 8px;
	align-items: center;
	&-to-export {
		margin-bottom: 12px;
	}
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
.icon-triangle {
	flex: 0 0 10px;
	width: 10px; height: 10px;
	min-width: 0; min-height: 0;
	line-height: 0;
	&::before {
		background-color: var(--color-23);
	}
}
.tree-item .tree-item-checkbox-container {
	margin-right: 8px;
}
.sorting-area {
	position: absolute;
	right: 0; left: 0;
	height: 4px;
	z-index: 20;
	-webkit-tap-highlight-color: transparent;
	-webkit-touch-callout: none;
	user-select: none;
}
.sorting-area-before {
	top: 0; bottom: auto;
}
.sorting-area-after {
	top: auto; bottom: -1px;
}
.dragging-area {
	position: absolute;
	top: 0; right: 0; bottom: 0; left: 0;
	z-index: 30;
	opacity: 0;
	cursor: pointer;
}
.dragging .dragging-area {
	z-index: 0;
}
</style>
