<template>
	<li
		:id="
			(instanceid === 'popupexporttree' ? 'to-export-' : '') +
			'places-menu-folder-' + folder.id
		"
		:srt="folder.srt"
		:title="folder.description"
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
			:id="folder.virtual && folder.context === 'places'
				? 'places-header'
				: (folder.virtual && folder.context === 'routes'
					? 'routes-header'
					: undefined
				)
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
					:id="'to-export-places-menu-folder-checkbox-' + folder.id"
					name="folderCheckbox"
					type="checkbox"
					class="tree-item-checkbox"
					:checked="common.foldersCheckedIds.has(folder.id)"
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
					'places-menu-folder-link-' + folder.id
				"
				class="folder-button__content"
			>
				<input
					:value="folder.name"
					:placeholder="mainStore.t.i.captions.name"
					class="folder-button__name fieldwidth_100"
					@change="e => {
						mainStore.changeFolder({
							folder: folder,
							change: { name: (e.currentTarget as HTMLInputElement).value },
						});
					}"
					@click.stop.prevent
				/>
				<textarea
					:value="folder.description"
					rows="2"
					:placeholder="mainStore.t.i.captions.description"
					class="folder-button__description fieldwidth_100"
					@change="e => {
						mainStore.changeFolder({
							folder: folder,
							change: { description: (e.currentTarget as HTMLInputElement).value },
						});
					}"
					@click.stop.prevent
				/>
			</div>

<!-- SEC folder-button  -->

			<div
				v-if="!common.folderEditability"
				class="folder-button sorting-area-onto"
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
					mainStore.folders[folder.id] ?? mainStore.trees[folder.context],
					props.what,
				)"
			>
				<div
					:id="
						(instanceid === 'popupexporttree' ? 'to-export-' : '') +
						'places-menu-folder-link-' + folder.id
					"
					class="folder-button__content"
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
						{{ folder.name }}
					</div>
				</div>
			</div>
			<div
				v-if="
					folder.virtual &&
					instanceid !== 'popupexporttree' &&
					[ 'places', 'routes' ].includes(folder.context)
				"
				class="control-buttons"
			>
				<button
					class="button-iconed icon icon-plus-circled"
					:class="{ 'button-pressed': !Object.keys(mainStore[folder.context]).length }"
					:title="
						folder.context === 'places'
							? mainStore.t.i.hints.addPlace
							: mainStore.t.i.hints.addRoute
					"
					@click.stop.prevent
					@pointerdown.stop
					@pointerup.stop="() => {
						if (folder.context === 'places') {
							mainStore.upsertPlace();
							focusCurrent(currentPlaceNameInputRef);
						} else if (folder.context === 'routes') {
							mainStore.upsertRoute();
							focusCurrent(currentRouteNameInputRef);
						}
					}"
				/>
			</div>
		</div>
		<div class="folder-subfolders">
			<ul
				v-if="folder.children && Object.keys(folder.children).length"
				class="margin_bottom_0"
			>
				<TreeSubfolder
					v-for="child in folder.children"
					:key="child.id"
					:instanceid="instanceid"
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
			class="folder-places"
			:class="{
				'folder_open': folder.open,
				'folder_closed': !folder.open,
				'unparented': !folder.id,
			}"
		>

<!-- SEC place/route-button  -->

			<label
				v-for="object in (props.what === 'places' ? places : routes)"
				:id="
					(instanceid === 'popupexporttree' ? 'to-export-place-' : '') +
					object.id
				"
				:key="object.id"
				:type="object.type"
				:srt="object.srt"
				:title="object.description"
				class="place-button block_01 draggable"
				:class="{
					active:
						props.what === 'places' &&
						mainStore.currentPlaceId &&
						object.id == mainStore.currentPlaceId ||
						props.what === 'routes' &&
						mainStore.currentRouteId &&
						object.id == mainStore.currentRouteId
					,
					chosen:
						mainStore.mode === 'measure' &&
						mainStore.measure.points.find(p => p.id === object.id)
					,
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
						:id="'to-export-place-checkbox-' + object.id"
						name="placeCheckbox"
						type="checkbox"
						class="to-export-place-checkbox tree-item-checkbox"
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
					class="place-button__content"
					:class="{ placeholder: !object.name }"
				>
					{{ object.name || mainStore.t.i.captions.untitled }}
				</span>
				<span
					class="dragging-area"
					@pointerdown.stop="e => onPointerDown(e, {
						id: object.id,
						type: object.type,
						context: props.what,
					})"
				    @pointermove.stop="onPointerMove"
				    @pointerup.stop="e => onPointerUp(e, () => {
						if (instanceid === 'popupexporttree') return;
						if (props.what === 'places') {
							mainStore.setCurrentPlace(object as Place);
						} else if (props.what === 'routes') {
							mainStore.setCurrentRoute(object as Route);
						}
					})"
					@pointercancel.stop="onPointerUp"
					@contextmenu.stop.prevent="e => common.toggleEntityMenuPopup(e, object, props.what)"
				>
					{{ object.name || mainStore.t.i.captions.untitled }}
				</span>
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
		</div>
		<div
			v-if="folder.open && (
				props.what === 'places' && placesDistance ||
				props.what === 'routes' && routesDistance.include
			)"
			:title="
				mainStore.t.i.captions.measure + (
					props.what === 'places' ? ' ' + mainStore.t.i.text.betweenPointsInFolder :
					props.what === 'routes' ? ' ' + mainStore.t.i.text.betweenRoutesInFolder :
					''
				)

			"
			class="folder-distances"
		>
			<span class="un_color">{{ mainStore.t.i.captions.total }}: </span>
			<template v-if="props.what === 'places'">
				<span class="color-01">{{ placesDistance }}</span>
			</template>
			<template v-if="props.what === 'routes'">
				<span
					:title="mainStore.t.i.text.excludeFlights"
					class="color-01"
				>
					{{ routesDistance.exclude }}
				</span> /
				<span
					:title="mainStore.t.i.text.includeFlights"
					class="color-01"
				>
					{{ routesDistance.include }}
				</span>
			</template>
			<span class="un_color"> {{ mainStore.t.i.text.km }}</span>
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
import { Ref, computed, inject, watch } from 'vue';
import { useMainStore } from '@/stores/main';
import {
	Place,
	Route,
	Folder,
	FolderContext,
} from '@/types';
import { common } from '@/services/common';
import { usePointerDnD } from '@/services/dnd';
import { roundTo } from '@/shared/common';

export interface IPlacesTreeNodeProps {
	instanceid?: string;
	what: FolderContext;
	folder?: Folder;
	parent?: Folder;
}
const props = withDefaults(defineProps<IPlacesTreeNodeProps>(), {
	instanceid: null,
	what: 'places',
	folder: null,
	parent: null,
});

const mainStore = useMainStore();

const focusCurrent = inject<(input: HTMLElement | null) => void>('focusCurrent');
const currentPlaceNameInputRef = inject<HTMLElement>('currentPlaceNameInputRef');
const currentRouteNameInputRef = inject<HTMLElement>('currentRouteNameInputRef');

const places = computed(() =>
	_.chain(mainStore.places)
	.filter(p =>
		p.show && !p.deleted &&
		(p.folderid === props.folder.id || !p.folderid && props.folder.virtual)
	)
	.sortBy('srt')
	.value()
);
const routes = computed(() =>
	_.chain(mainStore.routes)
	.filter(r =>
		r.show && !r.deleted &&
		(r.folderid === props.folder.id || !r.folderid && props.folder.virtual)
	)
	.sortBy('srt')
	.value()
);
const placesDistance = computed(() => {
	return roundTo(mainStore.distanceBetweenPoints(
		places.value.map(place => place.pointid)
	), 3);
});
const routesDistance = computed(() => {
	const include = roundTo(mainStore.distanceBetweenPoints(
		routes.value.map(route => route.points.map(pn => pn.id)).flat()
	), 3);
	const exclude = roundTo(routes.value.reduce((s, r) =>
		s + mainStore.distanceBetweenPoints(r.points.map(p => p.id)
	), 0), 3);
	return { include: include, exclude: exclude };
});
const selectFolderToExport = (id: string, select: boolean): void => {
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
			const directFolderId = mainStore[props.what][id]?.folderid;
			if (directFolderId) {
				checkedFolders.add(directFolderId);
				const ancestors = mainStore.getAncestors(directFolderId);
				for (const ancestorId of ancestors) {
					checkedFolders.add(ancestorId);
				}
			}
		}
	}
	common.foldersCheckedIds = checkedFolders;
}, { deep: true, immediate: true });

// SEC DnD

const handleDrop = inject('handleDrop') as (...args: any[]) => any;

const dragging = inject<Ref<boolean>>('dragging');
const dragTargetId = inject<Ref<string | null>>('dragTargetId');
const dragTargetContext = inject<Ref<string | null>>('dragTargetContext');

const canAcceptDrop = (target: HTMLElement): boolean => {
	const { currentDrag } = mainStore;
	const { entityId, entityContext, entityType } = target.dataset;
	return !(
		currentDrag.id === entityId ||
		currentDrag.context !== entityContext ||
		(currentDrag.type === 'folder' && ['place', 'route'].includes(entityType))
	);
};
const updateHighlights = (target: HTMLElement | null) => {
	dragTargetId.value = null;
	if (!target || !mainStore.currentDrag) return;
	const area = target.closest('.sorting-area-onto, .sorting-area-before, .sorting-area-after');
	if (area) {
		const item = area.closest('[data-entity-id]') as HTMLElement;
		dragTargetId.value = item?.dataset.entityId;
		dragTargetContext.value = item?.dataset.entityContext;
		if (area.classList.contains('sorting-area-onto')) mainStore.currentDrag.position = 'onto';
		else if (area.classList.contains('sorting-area-before')) mainStore.currentDrag.position = 'before';
		else if (area.classList.contains('sorting-area-after')) mainStore.currentDrag.position = 'after';
	}
};
const { onPointerDown, onPointerMove, onPointerUp } = usePointerDnD({
    handleDrop,
    canAcceptDrop,
    updateHighlights,
    onDragStateChange: (value) => { dragging.value = value; },
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
		#places-menu-folder-null
	) > .folder-subs:has(~ .folder-subfolders *),
	:is(#places-header, #routes-header):has(~ .folder-places:not(:empty)) {
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
		.folder-button {
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
		&#places-header, &#routes-header {
			grid-template-columns: auto 1fr auto;
		}
	}
	.folder-distances {
		margin-top: -6px;
		align-self: end;
		text-align: right;
	}
	& > .sorting-area {
		height: 4px;
		z-index: 20;
		-webkit-tap-highlight-color: transparent;
		-webkit-touch-callout: none;
		user-select: none;
	}
	& > .sorting-area-before {
		top: 0; bottom: auto;
	}
	& > .sorting-area-after {
		top: auto; bottom: -1px;
	}
}
.folder_closed {
	> .folder-subfolders {
		display: none;
	}
	> .folder-places {
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
.place-button, .folder-button {
	display: grid;
	gap: 8px;
	align-items: start;
	justify-content: center;
	cursor: pointer !important;
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
.place-button {
	grid-template-columns: 1fr auto;
	&[class*="block_"] {
		margin: 7px 0 10px 0;
		padding: 4px 8px;
	}
	&[class*="block_"] .sorting-area-before {
		top: -6px;
	}
	&[class*="block_"] .sorting-area-after {
		bottom: -7px;
	}
}
.folder-button {
	grid-template-columns: 1fr auto;
	flex: 1 0 auto;
	z-index: 0;
	&__content {
		display: flex;
		gap: 8px;
		align-items: baseline;
	}
}
@media (pointer: coarse) {
	.folder-button {
		padding-top: 4px;
		padding-bottom: 4px;
	}
}
:not(:is(.folder-root)) > .folder-places:is(:not(.unparented )) {
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
#places-header, #routes-header {
	z-index: 10;
	&.folder-subs {
		z-index: 20;
	}
	.control-buttons {
		justify-content: end;
	}
	.folder-button {
		grid-template-columns: 1fr auto;
		.folder-button__description {
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
.place-button .tree-item-checkbox-container {
	margin-right: 8px;
}
.sorting-area {
	position: absolute;
	right: 0; left: 0;
	z-index: 10;
	cursor: pointer;
}
.sorting-area-before {
	top: 0; bottom: 50%;
}
.sorting-area-after {
	top: 50%; bottom: 0;
}
.dragging-area {
	position: absolute;
	top: 0; right: 0; bottom: 0; left: 0;
	z-index: 30;
	opacity: 0;
}
.dragging .dragging-area {
	z-index: 0;
}
</style>
