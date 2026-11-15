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
				class="tree-folder"
			    @pointerup.stop.prevent="adminStore.folderOpenClose({ folder })"
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
						class="icon icon-triangle"
						:class="folder.open ? 'icon-triangle_down' : 'icon-triangle_right'"
					/>
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
							:value="folder.name"
							:title="mainStore.t.s.name[folder.name as DictionaryNameKey]"
							:placeholder="mainStore.t.i.captions.name"
							class="tree-folder__name"
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
							:value="folder.description"
							:title="mainStore.t.s.desc[folder.description as DictionaryDescKey]"
							:placeholder="mainStore.t.i.captions.description"
							class="tree-folder__description"
							@change="e => {
								if (!props.editable) return;
								adminStore.changeFolder({
									entity: folder,
									change: { description: (e.currentTarget as HTMLInputElement).value },
								});
							}"
							@click.stop.prevent
						/>
					</div>
				</div>
				<div
					v-if="props.editable"
					class="dragging-area icon icon-expand sorting-area-onto"
					:class="{
						draggable: !folder.virtual && props.editable,
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
						nondraggable: folder.virtual || !props.editable,
					})"
				    @pointermove="onPointerMove"
				    @pointerup.stop.prevent="e => onPointerUp(e)"
				    @pointercancel="onPointerUp"
				/>
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
			class="folder-items table table-1"
			:class="{
				'folder_open': folder.open,
				'folder_closed': !folder.open,
				'unparented': !folder.id,
			}"
			:style="`grid-template-columns: auto repeat(${keysArray.length}, auto);`"
		>
			<div class="tree-item">
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
					@click="sortBy(key)"
				>
					<div
						v-if="key === adminStore.settingsSortBy"
						class="icon icon-triangle"
						:class="isReverse ? 'icon-triangle_down' : 'icon-triangle_up'"
					/>
					<button
						v-if="fields[key]"
						type="button"
						class="link"
					>
						{{ fields[key].caption }}
					</button>
				</h3>
			</div>

<!-- SEC Setting  -->

			<template
				v-for="n in settingsArray.length"
				:key="n"
			>
				<template v-for="object in [getSetting(n)]" :key="object.id">
					<label
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
						<span class="setting-actions">
							<input
								type="checkbox"
								:checked="object.checked"
							/>
						</span>
						<template
							v-for="key in keysArray"
							:key="key"
						>
							<span v-if="key === 'enum'">
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
							</span>
							<span
								v-else
								:class="{ impvalue: key === adminStore.settingsSortBy }"
							>
								{{ getFieldValue(object, key) }}
							</span>
						</template>
						<span
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
						<span
							v-if="props.editable"
							class="sorting-area sorting-area-before"
							:class="{
								'sorting-area-border-top':
									object.id === dragTargetId &&
									object.type === mainStore.currentDrag?.type &&
									mainStore.currentDrag?.position === 'before'
							}"
						/>
						<span
							v-if="props.editable"
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
			</template>
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
import {
	Dictionary,
	Folder,
	FolderContext,
} from '@/types';
import { SettingsVocRec } from '@/types/settings';
import { common } from '@/services/common';
import { usePointerDnD } from '@/services/dnd';

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
const adminStore = useAdminStore();

const isReverse = ref(false);

type DictionaryNameKey = keyof Dictionary['s']['name'];
type DictionaryDescKey = keyof Dictionary['s']['desc'];

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
	valtype       : { enabled: true, caption: mainStore.t.i.captions.login },
	enum          : { enabled: true, caption: mainStore.t.i.captions.default },
	folderid      : { enabled: true, caption: mainStore.t.i.captions.folder },
	srt           : { enabled: true, caption: mainStore.t.i.captions.srt },
});

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
const keysArray = computed(() =>
	(Object.keys(fields.value) as (keyof SettingsVocRec)[])
		.filter(key => fields.value[key]?.enabled)
);
const settingsArray = computed(() => {
	return (adminStore.getSorted({
		what: 'settings',
		by: adminStore.settingsSortBy,
		of: entities.value,
	}) as SettingsVocRec[]);
});

const getSetting = (n: number) =>
	settingsArray.value[isReverse.value ? settingsArray.value.length - n : n - 1]
;
const getFieldValue = (user: SettingsVocRec, key: keyof SettingsVocRec): unknown => {
	const field = fields.value[key];
	const value = user[key];

	if (field?.formatter && value !== undefined) {
		return field.formatter(value as never);
	}
	return typeof value === 'boolean'
		? (!value ? mainStore.t.i.text.no : mainStore.t.i.text.yes)
		: value
	;
};
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
	for (const id in adminStore.settings.usersvoc) {
		if (!Object.hasOwn(adminStore.settings.usersvoc, id)) continue;
		const current = Boolean(adminStore.settings.usersvoc[id].checked);
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
	for (const id in adminStore.settings.usersvoc) {
		if (!Object.hasOwn(adminStore.settings.usersvoc, id)) continue;
		check(id, val);
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
ul {
	padding-left: 0;
}
.folder {
	display: flex;
	flex-direction: column;
	position: relative;
	padding-left: 28px;
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
.tree-folder {
	flex: 1 0 auto;
	display: flex;
	flex-flow: row nowrap;
	z-index: 0;
	&__content {
		flex: 1 0 auto;
		display: flex;
		gap: 8px;
		padding: 4px 0 4px 30px;
		align-items: baseline;
		cursor: pointer;
	}
	&__fields {
		display: flex;
		gap: 8px;
		align-items: baseline;
		cursor: defalut;
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
	border-left: 1px solid var(--color-60);
}
:not(:is(.folder-root)) > .folder-items:is(:not(.unparented)) {
	display: block;
	margin-left: 7px;
}
.tree-item {
	padding: 4px 8px 4px 48px;
	align-items: baseline;
	&:hover {
		box-shadow: none;
	}
	&:is(:not(.back_1)):hover {
		background: none;
	}
	&__name {
		text-align: right;
	}
	&__reset {
		top: 5px;
		cursor: pointer;
	}
	.dragging-area {
		top: 17px; left: 20px;
		transform: none;
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
.table {
	overflow: auto;
	.impvalue {
		margin-top: -0.3rem;
		font-size: 1.5em;
	}
	&-column-caption {
		display: flex;
		gap: 8px;
		align-items: baseline;
		cursor: pointer;
	}
	& > * {
		cursor: pointer;
	}
	&.table-2 > * > :first-child {
		margin-bottom: 12px;
	}
}
.setting-actions {
	display: flex;
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
	top: 50%; right: auto; bottom: auto; left: 0;
	transform: translateY(-50%);
	width: 16px; height: 16px;
	opacity: 0.2;
	z-index: 30;
	cursor: pointer;
}
.dragging .dragging-area {
	z-index: 0;
}
</style>
