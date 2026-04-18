<template>
	<ul class="tree">
		<TreeNode
			:instanceid="instanceid"
			:what="props.what"
			:folder="mainStore.trees[props.what]"
		/>
	</ul>
	<Popup
		:show="contextMenu.show"
		:position="contextMenu.position"
		:closeOnClick="contextMenu.closeOnClick"
		class="tree-item-popup messages"
		@update:show="contextMenu.show = $event"
	>
		<template #popupSlot>
			<h2 class="menu-link message border_1">
				{{ contextMenu.object.name }}
			</h2>
			<a
				class="menu-link message border_1"
				role="button" tabindex="0"
				@pointerdown.stop
				@pointerup.stop
				@click.stop="mainStore.showHideGeomarks({
					object: contextMenu.object,
					show: Number(isPlace(contextMenu.object)
						? !contextMenu.object.geomark
						: !contextMenu.object.geomarks
					),
				})"
			>
				<span
					class="icon"
					:class="`icon-geomark-${isPlace(contextMenu.object)
						? Number(contextMenu.object.geomark)
						: contextMenu.object.geomarks
					}-circled`"
				/>
				{{ `${
					(isPlace(contextMenu.object)
						? !contextMenu.object.geomark
						: !contextMenu.object.geomarks
					)
						? mainStore.t.i.hints.show
						: mainStore.t.i.hints.hide
				} ${mainStore.t.i.hints.onMap}` }}
			</a>
			<a
				class="menu-link message border_1"
				role="button" tabindex="0"
				:title="mainStore.t.i.hints[
					contextMenu.object.type === 'place' ? 'addPlaceNext'
					: contextMenu.object.type === 'route' ? 'addRouteNext'
					: (props.what === 'places' ? 'addPlace' : 'addRoute')
				]"
				@pointerdown.stop
				@pointerup.stop
				@click.stop="() => {
					if (contextMenu.object.type === 'place') {
						mainStore.upsertPlace({ props: {
							folderid: (contextMenu.object as Place).folderid,
							srt: mainStore.getNeighboursSrts(
								contextMenu.object.id,
								contextMenu.object.type,
								false,
							).new,
						}});
					} else if (contextMenu.object.type === 'route') {
						mainStore.upsertRoute({ props: {
							folderid: (contextMenu.object as Route).folderid,
							srt: mainStore.getNeighboursSrts(
								contextMenu.object.id,
								contextMenu.object.type,
								false,
							).new,
						}});
					} else if (contextMenu.object.type === 'folder' && props.what === 'places') {
						mainStore.upsertPlace({ props: { folderid: contextMenu.object.id } });
					} else if (contextMenu.object.type === 'folder' && props.what === 'routes') {
						mainStore.upsertRoute({ props: { folderid: contextMenu.object.id } });
					}
					if (props.what === 'places') focusCurrent(currentPlaceNameInputRef);
					else focusCurrent(currentRouteNameInputRef);
				}"
			>
				<span class="icon icon-plus-circled" />
				{{ mainStore.t.i.hints[props.what === 'places' ? 'addPlace' : 'addRoute'] }}
			</a>
			<a
				v-if="contextMenu.object.type === 'folder'"
				class="menu-link message border_1"
				role="button" tabindex="0"
				:title="mainStore.t.i.hints.addFolderIn"
				@pointerdown.stop
				@pointerup.stop
				@click.stop="() => {
					router.push({
						name: 'HomeFolder',
						query: {
							parent: contextMenu.object.id,
							context: (contextMenu.object as Folder).context,
						},
					});
					contextMenu.show = false;
				}"
			>
				<span class="icon icon-plus-circled-folder" />
				{{ mainStore.t.i.hints.addFolder }}
			</a>
			<a
				v-if="contextMenu.object.type !== 'folder' || !contextMenu.object.virtual"
				class="menu-link message border_1"
				role="button" tabindex="0"
				@pointerdown.stop
				@pointerup.stop
				@click.stop="() => {
					if (contextMenu.object.type === 'folder') {
						router.push({
							name: 'HomeDeleteFolder',
							params: {
								id: contextMenu.object.id,
								type: (contextMenu.object as Folder).context,
							},
						});
						contextMenu.show = false;
					} else {
						mainStore.deleteObjects({
							[contextMenu.object.id]: contextMenu.object,
						})
					}
					contextMenu.show = false;
				}"
			>
				<span :class="`icon icon-cross-45-circled${
					contextMenu.object.type === 'folder' ? '-folder' : ''
				}`" />
				{{
					mainStore.t.i.buttons[
						contextMenu.object.type === 'place' ? 'deletePlace'
						: contextMenu.object.type === 'route' ? 'deleteRoute'
						: 'deleteFolder'
					]
				}}
			</a>
		</template>
	</Popup>
</template>

<script setup lang="ts">
import { ref, provide, onMounted, inject, nextTick } from 'vue';
import { useMainStore } from '@/stores/main';
import { useRouter } from 'vue-router';
import { Folder, Place, Route } from '@/types';
import { isPlace } from '@/guards';
import { formFoldersCheckedIds } from '@/shared/generators';
import { IEntityPopupProps } from '@/shared/interfaces';
import TreeNode from '@/components/tree/TreeNode.vue';
import Popup from '@/components/popups/Popup.vue';

export interface IPlacesTreeProps {
	instanceid?: string;
	what?: 'places' | 'routes';
}
const props = withDefaults(defineProps<IPlacesTreeProps>(), {
	instanceid: '',
	what: 'places',
});
const mainStore = useMainStore();
const router = useRouter();

const foldersCheckedIds = ref([]);
provide('foldersCheckedIds', foldersCheckedIds);

const dragging = ref(false);
provide('dragging', dragging);

const dragTargetId = ref(null);
provide('dragTargetId', dragTargetId);

const dragTargetContext = ref(null);
provide('dragTargetContext', dragTargetContext);

const contextMenu = ref<IEntityPopupProps>({
	object: null,
	show: false,
	position: {
		top: 'auto',
		right: 'auto',
		bottom: 'auto',
		left: 'auto',
	},
});
provide('contextMenu', contextMenu);

const currentPlaceNameInputRef = inject<HTMLElement>('currentPlaceNameInputRef');
const currentRouteNameInputRef = inject<HTMLElement>('currentRouteNameInputRef');

const focusCurrent = async (input: HTMLElement | null) => {
	if (!input) return;
	mainStore.setMessage(mainStore.t.i.text.addedEnterName, 3);
	await nextTick();
	input.focus();
}
provide('focusCurrent', focusCurrent);

onMounted(() => {
	foldersCheckedIds.value = formFoldersCheckedIds();
});
</script>

<style lang="scss" scoped>
.tree-item-popup {
	* {
		user-select: none;
	}
	.popup-content .menu-link {
		display: grid;
		grid-template-columns: auto 1fr;
		align-items: center;
		gap: 8px;
		padding-right: 12px; padding-left: 12px;
		cursor: pointer;
		&:is(h2) {
			margin: -30px 0 0 0;
			padding-right: 40px;
			max-width: 10em;
			cursor: default;
		}
		.icon {
			width: 14px;
			height: 14px;
			&::before {
				display: flex;
				align-items: center;
				justify-content: center;
				line-height: 0;
			}
		}
	}
}
</style>
