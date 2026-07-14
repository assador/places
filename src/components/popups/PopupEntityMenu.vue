<template>
	<Popup
		v-if="object && common.popupEntityMenu"
		:show="common.popupEntityMenu.show"
		:position="common.popupEntityMenu.position"
		:closeOnClick="false"
		class="tree-item-popup messages"
		@update:show="handlePopupUpdate"
	>
		<template #popupSlot>
			<h2 class="menu-link message border_1">
				{{ object.name }}
			</h2>
			<a
				class="menu-link message border_1"
				role="button" tabindex="0"
				@pointerdown.stop
				@pointerup.stop
				@click.stop="mainStore.showHideGeomarks({
					object: object,
					show: Number(isPlace(object)
						? !object.geomark
						: !object.geomarks
					),
				})"
			>
				<span
					class="icon"
					:class="`icon-geomark-${isPlace(object)
						? Number(object.geomark)
						: object.geomarks
					}-circled`"
				/>
				{{ `${
					(isPlace(object)
						? !object.geomark
						: !object.geomarks
					)
						? mainStore.t.i.hints.show
						: mainStore.t.i.hints.hide
				} ${mainStore.t.i.hints.onMap}` }}
			</a>
			<a
				v-if="object.type === 'place' || object.type === 'route'"
				class="menu-link message border_1"
				role="button" tabindex="0"
				@pointerdown.stop
				@pointerup.stop
				@click.stop="if (isFileInput(inputUploadFiles)) { inputUploadFiles.click(); }"
			>
				<span class="icon icon-plus-circled" />
				{{ mainStore.t.i.buttons.addPhotos }}
				<input
					ref="inputUploadFiles"
					type="file"
					name="files"
					accept="image/*"
					capture="environment"
					multiple
					class="images-add__input"
					@change="addImages(object, $event.target as HTMLInputElement)"
				/>
			</a>
			<a
				class="menu-link message border_1"
				role="button" tabindex="0"
				:title="object.type !== 'folder' ? (
					mainStore.t.i.hints[context === 'places' ? 'addPlace' : 'addRoute'] + ' ' +
					mainStore.t.i.hints.addNext
				) : ''"
				@pointerdown.stop
				@pointerup.stop
				@click.stop="() => {
					if (!object) return;
					if (object.type === 'place') {
						mainStore.upsertPlaceFollowing(object);
					} else if (object.type === 'route') {
						mainStore.upsertRouteFollowing(object);
					} else if (object.type === 'folder' && context === 'places') {
						mainStore.upsertPlace({ props: { folderid: object.id } });
					} else if (object.type === 'folder' && context === 'routes') {
						mainStore.upsertRoute({ props: { folderid: object.id } });
					}
					if (context === 'places') focusCurrent(currentPlaceNameInputRef);
					else focusCurrent(currentRouteNameInputRef);
				}"
			>
				<span class="icon icon-plus-circled" />
				{{ mainStore.t.i.hints[context === 'places' ? 'addPlace' : 'addRoute'] }}
			</a>
			<a
				v-if="
					context === 'places' ||
					object.type === 'route' && mainStore.currentRoute?.points.length
				"
				class="menu-link message border_1"
				role="button" tabindex="0"
				:title="
					(mainStore.t.i.hints[context === 'places' ? 'addPlace' : 'addPoint']) + ' ' +
					mainStore.t.i.hints.usingGeoLocation +
					(context === 'places' ? ` ${mainStore.t.i.hints.addNext}` : '')
				"
				@pointerdown.stop
				@pointerup.stop
				@click.stop="async () => {
					if (!object) return;
					const loc = await geoLocation.getLocation();
					if (object.type === 'place') {
						mainStore.upsertPlaceFollowing(object, {
							props: {
								latitude: loc.latitude,
								longitude: loc.longitude,
							},
						});
					} else if (object.type === 'route') {
						mainStore.upsertPoint({
							where: mainStore.points,
							whom: object,
							props: {
								latitude: loc.latitude,
								longitude: loc.longitude,
							},
						});
					} else if (object.type === 'folder' && context === 'places') {
						mainStore.upsertPlace({
							props: {
								folderid: object.id,
								latitude: loc.latitude,
								longitude: loc.longitude,
							},
						});
					}
					if (context === 'places') focusCurrent(currentPlaceNameInputRef);
					else focusCurrent(currentRouteNameInputRef);
				}"
			>
				<span class="icon icon-plus-net" />
				{{ mainStore.t.i.hints[context === 'places' ? 'addPlace' : 'addPoint'] }}
				{{ mainStore.t.i.hints.usingGeoLocation }}
			</a>
			<a
				v-if="object.type === 'folder'"
				class="menu-link message border_1"
				role="button" tabindex="0"
				:title="mainStore.t.i.hints.addFolderIn"
				@pointerdown.stop
				@pointerup.stop
				@click.stop="() => {
					if (!object) return;
					router.push({
						name: 'HomeFolder',
						query: {
							parent: object.id,
							context: (object as Folder).context,
						},
					});
					show = false;
				}"
			>
				<span class="icon icon-plus-circled-folder" />
				{{ mainStore.t.i.hints.addFolder }}
			</a>
			<a
				v-if="object.type !== 'folder' || !object.virtual"
				class="menu-link message border_1"
				role="button" tabindex="0"
				@pointerdown.stop
				@pointerup.stop
				@click.stop="() => {
					if (!object) return;
					if (object.type === 'folder') {
						router.push({
							name: 'HomeDeleteFolder',
							params: {
								id: object.id,
								type: (object as Folder).context,
							},
						});
						show = false;
					} else {
						mainStore.deleteEntities({
							[object.id]: object,
						})
					}
					show = false;
				}"
			>
				<span :class="`icon icon-cross-45-circled${
					object.type === 'folder' ? '-folder' : ''
				}`" />
				{{
					mainStore.t.i.buttons[
						object.type === 'place' ? 'deletePlace'
						: object.type === 'route' ? 'deleteRoute'
						: 'deleteFolder'
					]
				}}
			</a>
		</template>
	</Popup>
</template>

<script setup lang="ts">
import { ref, Ref, computed, inject } from 'vue';
import { useMainStore } from '@/stores/main';
import { useRouter } from 'vue-router';
import { Folder } from '@/types';
import { isPlace, isFileInput } from '@/guards';
import { common, addImages } from '@/services/common';
import { useGeolocation } from '@/services/geolocation';
import Popup from '@/components/popups/Popup.vue';

const mainStore = useMainStore();
const router = useRouter();
const geoLocation = useGeolocation();

const focusCurrent = inject<(input: HTMLElement | null) => Promise<void>>('focusCurrent', async () => {});
const currentPlaceNameInputRef = inject<Ref<HTMLInputElement | null>>('currentPlaceNameInputRef', ref(null));
const currentRouteNameInputRef = inject<Ref<HTMLInputElement | null>>('currentRouteNameInputRef', ref(null));

const object = computed({
	get: () => common.popupEntityMenu?.object,
	set: (val) => common.updateEntityMenu({ object: val }),
});
const context = computed({
	get: () => common.popupEntityMenu?.context,
	set: (val) => common.updateEntityMenu({ context: val }),
});
const show = computed({
	get: () => common.popupEntityMenu?.show,
	set: (val) => common.updateEntityMenu({ show: val }),
});

const inputUploadFiles = ref<HTMLInputElement | null>(null);

const handlePopupUpdate = (show: boolean): void => {
	if (common.popupEntityMenu) common.popupEntityMenu.show = show;
};
</script>

<style lang="scss">
.popup.tree-item-popup {
	padding: 38px 12px 0 12px;
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
	.images-add__input {
		display: none;
	}
}
</style>
