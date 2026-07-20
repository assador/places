<template>
	<div
		ref="root"
		id="grid"
		:class="`sbs_${sbs}`"
		:style="gridStyle"
	>

<!-- SEC Top-Left -->

		<div
			id="top-left"
			class="app-cell"
			:style="!cells.top || !cells.left || !sidebarSizes.top.act || !sidebarSizes.left.act ? { display: 'none' } : null"
		>
			<div
				v-if="common.compact !== 2"
				class="basic-action-buttons action-buttons"
			>
				<div class="control-buttons">
					<ControlsRadios />
				</div>
				<div class="control-buttons mode-buttons">
					<ControlsMode />
				</div>
			</div>
		</div>

<!-- SEC Top-Basic -->

		<div
			ref="topBasic"
			id="top-basic"
			class="app-cell"
			:style="!cells.top || !sidebarSizes.top.act ? { display: 'none' } : null"
		>
			<Header />
			<div class="basic-action-buttons action-buttons">
				<div
					v-if="common.compact === 2"
					class="control-buttons"
				>
					<ControlsRadios />
				</div>
			</div>
			<div class="basic-action-buttons action-buttons">
				<div
					v-if="common.compact === 2"
					class="control-buttons"
				>
					<ControlsCommon />
				</div>
			</div>
		</div>

<!-- SEC Top-Right -->

		<div
			id="top-right"
			class="app-cell"
			:style="!cells.top || !cells.right || !sidebarSizes.top.act || !sidebarSizes.right.act ? { display: 'none' } : null"
		>
			<div
				v-if="common.compact !== 2"
				class="basic-action-buttons action-buttons"
			>
				<div class="control-buttons">
					<ControlsCommon />
				</div>
			</div>
		</div>

<!-- SEC Basic-Left -->

		<div
			id="basic-left"
			class="app-cell"
			:style="!cells.left || !sidebarSizes.left.act ? { display: 'none' } : null"
		>
			<div class="helpers-search">
				<input
					id="search-input"
					ref="searchInput"
					:placeholder="mainStore.t.i.inputs.searchPlaces"
					:title="mainStore.t.i.inputs.searchPlaces"
					@keyup="searchInputEvent"
				/>
				<span class="control-buttons">
					<button
						class="button-iconed"
						:title="mainStore.t.i.buttons.find"
						@click="selectPlaces(searchInput?.value)"
					>
						<span>↪</span>
					</button>
					<button
						class="button-iconed icon icon-cross-45-circled"
						:title="mainStore.t.i.buttons.clear"
						@click="
							if (searchInput && searchInput.value !== '') {
								searchInput.value = '';
								selectPlaces(searchInput.value);
							}
						"
					/>
				</span>
			</div>
			<form
				v-if="mainStore.rangeShow"
				action="javascript:void(0)"
				class="helpers-range"
				@submit="mainStore.showInRange(mainStore.range)"
			>
				<input
					id="range-input"
					ref="rangeInput"
					v-model="mainStore.range"
					type="number"
					min="0"
					max="6378136.6"
					:placeholder="mainStore.t.i.buttons.range"
					:title="mainStore.t.i.captions.range"
					class="fieldwidth_100"
				/>
				<span class="control-buttons">
					<button
						class="button-iconed"
						@click="mainStore.showInRange(mainStore.range)"
					>
						<span>↪</span>
					</button>
					<button
						class="button-iconed icon icon-cross-45-circled"
						:title="mainStore.t.i.buttons.clear"
						@click="
							if (mainStore.range !== null) {
								mainStore.range = null;
								mainStore.showInRange(null);
							}
						"
					/>
				</span>
			</form>
			<div
				v-if="mainStore.measure.show"
				class="helpers-measure"
			>
				<div id="helpers-measure-value-basic-left" />
				<MeasureDetails />
			</div>
			<Points v-if="mainStore.tempsShow.show" context="temps" />
			<div v-if="mainStore.routesShow.show" id="routes">
				<div id="routes-tree" class="margin_bottom">
					<div
						id="routes-menu"
						class="menu"
					>
						<Tree instanceid="routestree" what="routes" />
					</div>
					<div v-if="Object.keys(mainStore.commonRoutes).length > 0 && commonRoutesShow">
						<h2 class="basiccolor">
							{{ mainStore.t.i.captions.commonRoutes }}
						</h2>
						<div class="margin_bottom">
							<div
								v-for="commonRoute in mainStore.commonRoutes"
								:id="commonRoute.id"
								:key="commonRoute.id"
								class="place-button block_01"
								:class="
									commonRoute === mainStore.currentRoute ||
									mainStore.measure.points.find(p => p.id === commonRoute.id)
										? 'active' : ''
								"
								@click="mainStore.setCurrentRoute(commonRoute.id)"
							>
								{{ commonRoute.name }}
							</div>
						</div>
						<div class="margin_bottom">
							<a
								v-for="(_, index) in commonRoutesPagesCount"
								:key="index"
								href="javascript:void(0);"
								class="pseudo_button"
								:class="{ un_imp: index + 1 === mainStore.commonPlacesPage }"
								@click="mainStore.commonPlacesPage = index + 1;"
							>
								{{ index + 1 }}
							</a>
						</div>
					</div>
				</div>
			</div>
			<div v-if="mainStore.placesShow.show" id="places-tree">
				<div
					id="places-menu"
					class="menu"
				>
					<Tree instanceid="placestree" what="places"  />
				</div>
				<div v-if="Object.keys(mainStore.commonPlaces).length > 0 && commonPlacesShow">
					<h2 class="basiccolor">
						{{ mainStore.t.i.captions.commonPlaces }}
					</h2>
					<div class="margin_bottom">
						<div
							v-for="commonPlace in commonPlaces"
							:id="commonPlace.id"
							:key="commonPlace.id"
							class="place-button block_01"
							:class="{ active:
								commonPlace.id === mainStore.currentPlaceId ||
								mainStore.measure.points.find(p => p.id === commonPlace.id)
							}"
							@click="mainStore.setCurrentPlace(commonPlace.id)"
						>
							{{ commonPlace.name }}
						</div>
					</div>
					<div class="margin_bottom">
						<a
							v-for="(_, index) in commonPlacesPagesCount"
							:key="index"
							href="javascript:void(0);"
							class="pseudo_button"
							:class="{ un_imp: index + 1 === mainStore.commonPlacesPage }"
							@click="mainStore.commonPlacesPage = index + 1;"
						>
							{{ index + 1 }}
						</a>
					</div>
				</div>
			</div>
		</div>

<!-- SEC Basic-Basic -->

		<div
			ref="basicBasic"
			id="basic-basic"
			class="app-cell"
		>
			<component
				v-if="showMap"
				:is="maps[mainStore.activeMapIndex].component"
			/>
		</div>

<!-- SEC Basic-Right -->

		<div
			id="basic-right"
			class="app-cell"
			:style="!cells.right || !sidebarSizes.right.act ? { display: 'none' } : null"
		>
			<RouteDetails v-if="mainStore.routesShow.show && mainStore.currentRouteId" />
			<PlaceDetails v-if="mainStore.placesShow.show && mainStore.currentPlaceId" />
		</div>

<!-- SEC Bottom-Left -->

		<div
			id="bottom-left"
			class="app-cell"
			:style="!cells.bottom || !cells.left || !sidebarSizes.bottom.act || !sidebarSizes.left.act ? { display: 'none' } : null"
		>
			<div
				v-if="common.compact === 0"
				class="basic-action-buttons action-buttons"
			>
				<div class="control-buttons">
					<ControlsGeolocation />
					<ControlsMarkers />
					<ControlsOther />
					<button
						class="action-button"
						:class="{ 'button-pressed': basicFulled }"
						:title="mainStore.t.i.hints.fullscreen"
						@click="basicOnFull"
					>
						<span class="icon icon-expand" />
					</button>
				</div>
			</div>
		</div>

<!-- SEC Bottom-Basic -->

		<div
			id="bottom-basic"
			class="app-cell"
			:style="!cells.bottom || !sidebarSizes.bottom.act ? { display: 'none' } : null"
		>
			<div
				v-if="common.compact > 0"
				class="basic-action-buttons action-buttons"
				id="controls-mode"
			>
				<div class="control-buttons">
					<ControlsMode v-if="common.compact === 2" />
					<ControlsGeolocation />
					<ControlsMarkers />
					<ControlsOther />
					<ControlsState v-if="common.compact === 2" />
					<button
						v-if="common.compact !== 2"
						class="action-button"
						:class="{ 'button-pressed': basicFulled }"
						:title="mainStore.t.i.hints.fullscreen"
						@click="basicOnFull"
					>
						<span class="icon icon-expand" />
					</button>
				</div>
			</div>
			<div id="bottom-controls-offline" />
			<div id="bottom-controls-choosemap" />
			<div
				v-if="common.compact !== 2"
				id="bottom-center-coordinates"
			>
				<span class="imp">
					{{ mainStore.t.i.captions.center }}:
				</span>
				<span class="nobr">
					<input
						id="center-coordinates-latitude"
						v-model.number.trim="mainStore.center.latitude"
						placeholder="latitude"
						:title="mainStore.t.i.captions.latitude"
					/>
					<span>°N</span>
				</span>
				<span class="nobr">
					<input
						id="center-coordinates-longitude"
						v-model.number.trim="mainStore.center.longitude"
						placeholder="longitude"
						:title="mainStore.t.i.captions.longitude"
					/>
					<span>°E</span>
				</span>
			</div>
			<span
				v-if="common.compact !== 2"
				id="bottom-donate"
				class="nobr"
			>
				<button
					@click="popupDonate.show = !popupDonate.show"
				>
					{{ mainStore.t.i.buttons.donate }}
				</button>
			</span>
			<Popup
				:show="popupDonate.show"
				:position="popupDonate.position"
				:closeOnClick="true"
				class="center column"
				@update:show="popupDonate.show = $event"
			>
				<template #popupSlot>
					<div>
						<h2>Boosty</h2>
						<div>
							<img src="@/assets/images/assador-donate.png" />
						</div>
					</div>
					<div>
						<h2>Open Collective</h2>
						<div>
							Поддержать через
							<a href="https://opencollective.com/places" target="_blank">
								Open Collective
							</a>
							(USD/EUR)
						</div>
					</div>
				</template>
			</Popup>
		</div>
		<div id="ui-buttons-left" />
		<div id="ui-buttons-right">
			<button
				v-if="basicFulled"
				class="action-button"
				:class="{ 'button-pressed': basicFulled }"
				:title="mainStore.t.i.hints.fullscreen"
				@click="basicOnFull"
			>
				<span class="icon icon-expand" />
			</button>
		</div>
		<div
			v-if="common.compact === 2"
			id="sbb-top"
			@click="sideShowHide('top')"
		>
			<button :class="{ disclosed: cells.top, 'button-pressed': cells.top }" />
		</div>
		<div
			v-if="common.compact === 2"
			id="sbb-right"
			@click="sideShowHide('right')"
		>
			<button :class="{ disclosed: cells.right, 'button-pressed': cells.right }" />
		</div>
		<div
			v-if="common.compact === 2"
			id="sbb-bottom"
			@click="sideShowHide('bottom')"
		>
			<button :class="{ disclosed: cells.bottom, 'button-pressed': cells.bottom }" />
		</div>
		<div
			v-if="common.compact === 2"
			id="sbb-left"
			@click="sideShowHide('left')"
		>
			<button :class="{ disclosed: cells.left, 'button-pressed': cells.left }" />
		</div>
		<div
			v-if="common.compact !== 2"
			id="sbs-top"
			:style="{ top: sidebarSizes.top.act + 'px' }"
			@pointerdown="sidebarDragTop.onPointerDown"
			@pointermove="sidebarDragTop.onPointerMove"
			@pointerup="sidebarDragTop.onPointerUp"
		/>
		<div
			v-if="common.compact !== 2"
			id="sbs-right"
			:style="{ right: sidebarSizes.right.act + 'px' }"
			@pointerdown="sidebarDragRight.onPointerDown"
			@pointermove="sidebarDragRight.onPointerMove"
			@pointerup="sidebarDragRight.onPointerUp"
		/>
		<div
			v-if="common.compact !== 2"
			id="sbs-bottom"
			:style="{ bottom: sidebarSizes.bottom.act + 'px' }"
			@pointerdown="sidebarDragBottom.onPointerDown"
			@pointermove="sidebarDragBottom.onPointerMove"
			@pointerup="sidebarDragBottom.onPointerUp"
		/>
		<div
			v-if="common.compact !== 2"
			id="sbs-left"
			:style="{ left: sidebarSizes.left.act + 'px' }"
			@pointerdown="sidebarDragLeft.onPointerDown"
			@pointermove="sidebarDragLeft.onPointerMove"
			@pointerup="sidebarDragLeft.onPointerUp"
		/>
		<router-view />
	</div>

<!-- SEC Messages -->

	<Teleport :to="common.compact === 2 ? '#grid' : '#top-basic'">
		<Messages />
	</Teleport>

<!-- SEC Controls -->

	<Teleport :to="common.compact === 2 ? '#dashboard-controls-choosemap' : '#bottom-controls-choosemap'">
		<select
			:title="mainStore.t.i.hints.mapProvider"
			@change="e => mainStore.activeMapIndex = (e.currentTarget as HTMLSelectElement).selectedIndex"
		>
			<option
				v-for="(map, index) in maps"
				:key="index"
				:value="map.componentName"
				:selected="map.componentName === maps[mainStore.activeMapIndex].componentName"
			>
				{{ map.name }}
			</option>
		</select>
	</Teleport>

	<Teleport :to="common.compact === 2 ? '#dashboard-controls-offline' : '#bottom-controls-offline'">
		<div class="online-mode">
			<select
				v-model="offlineMode"
				:class="{ focused: offlineMode }"
			>
				<option :value="false">
					{{ mainStore.t.i.inputs.online }}
				</option>
				<option :value="true">
					{{ mainStore.t.i.inputs.offline }}
				</option>
			</select>
			<div
				:class="`indicator-online ${
					offlineMode ? 'color-grey' : mainStore.online ? 'color-green' : 'color-red'
				}`"
				:title="offlineMode || !mainStore.online
					? mainStore.t.i.text.offline + '\n' + mainStore.t.i.text.offlineSaving
					: mainStore.t.i.text.online + '\n' + mainStore.t.i.text.onlineSaving
				"
			/>
		</div>
	</Teleport>

<!-- SEC Measure Value -->

	<Popup
		v-if="showMobileMeasurePopup"
		id="helpers-measure-popup"
		:show="true"
		:position="showMobileMeasurePopupPosition"
		:closeOnClick="false"
		:closeButton="false"
		class="messages modest"
	>
		<template #popupSlot>
			<div id="helpers-measure-value-popup" />
		</template>
	</Popup>

	<Teleport
		v-if="
			showMobileMeasurePopup ||
			common.compact !== 2 &&
			mainStore.measure.show &&
			mainStore.measure.points.length > 1
		"
		:to="common.compact === 2
			? '#helpers-measure-value-popup'
			: '#helpers-measure-value-basic-left'
		"
	>
		<div class="helpers-measure-header">
			<h2 v-if="common.compact !== 2" class="color-01">
				{{ mainStore.t.i.captions.measure }}
			</h2>
			<span v-if="mainStore.measure.points.length > 1">
				<span class="imp_02">
					{{ mainStore.getDistance().toFixed(3) }}
				</span>
				{{ mainStore.t.i.text.km }}
			</span>
		</div>
	</Teleport>

<!-- SEC Popups -->

	<PopupPointInfo />
	<PopupEntityMenu />

	<div
		v-if="isPrefixActive"
		class="prefix-activated-indicator icon icon-circle-full"
	/>
</template>

<script setup lang="ts">
import {
	ref,
	computed,
	watch,
	onMounted,
	onUnmounted,
	onUpdated,
	provide,
	nextTick,
	defineAsyncComponent,
} from 'vue';
import { useMainStore } from '@/stores/main';
import { useRouter } from 'vue-router';

import { constants } from '@/shared/constants';
import * as db from '@/services/db';
import { common, setBusy } from '@/services/common';
import { logout } from '@/services/auth';
import { useElementSize } from '@/services/sizes';
import { useLightPointerDnD } from '@/services/dnd';
import { clamp } from '@/shared/common';

import { Place, PopupProps, PopupPosition } from '@/types';

import Header from '@/components/Header.vue';
import MeasureDetails from '@/components/helpers/Measure.vue';
import Messages from '@/components/Messages.vue';
import PlaceDetails from '@/components/details/Place.vue';
import Points from '@/components/Points.vue';
import Popup from '@/components/popups/Popup.vue';
import PopupEntityMenu from '@/components/popups/PopupEntityMenu.vue';
import PopupPointInfo from '@/components/popups/PopupPointInfo.vue';
import RouteDetails from '@/components/details/Route.vue';
import Tree from '@/components/tree/Tree.vue';

import ControlsCommon from '@/components/controls/ControlsCommon.vue';
import ControlsMode from '@/components/controls/ControlsMode.vue';
import ControlsRadios from '@/components/controls/ControlsRadios.vue';
import ControlsMarkers from '@/components/controls/ControlsMarkers.vue';
import ControlsGeolocation from '@/components/controls/ControlsGeolocation.vue';
import ControlsOther from '@/components/controls/ControlsOther.vue';
import ControlsState from '@/components/controls/ControlsState.vue';

const maps = [
	{
		name: 'OpenStreetMap',
		component: defineAsyncComponent(() =>
			import('@/components/maps/MapOpenStreetMap.vue')
		),
		componentName: 'PlacesMapOpenStreetMap',
	}, {
		name: 'Яндекс.Карты',
		component: defineAsyncComponent(() =>
			import('@/components/maps/MapYandex.vue')
		),
		componentName: 'PlacesMapYandex',
	}
];
const mainStore = useMainStore();
const router = useRouter();

const extmap = ref<any>(null);
provide('extmap', extmap);
const showMap = ref(true);
provide('showMap', showMap);

const offlineMode = computed({
	get: () => mainStore.offlineMode,
	set: (newValue) => {
		mainStore.setOffline(newValue);
	},
});

const root = ref<HTMLElement>();
const basicFulled = ref(false);
const basicOnFull = () => {
	basicFulled.value = !basicFulled.value;
	root.value?.classList.toggle('basic-fulled');
};
const showMobileMeasurePopup = computed(() => {
	return (
		common.compact === 2 &&
		mainStore.measure.show &&
		mainStore.measure.points.length > 1 &&
		!cells.value.left &&
		!cells.value.right
	);
});

const topBasic = ref<HTMLElement | null>(null);
const { height: topBasicHeight } = useElementSize(topBasic);
const showMobileMeasurePopupPosition = computed<PopupPosition>(() => {
	return {
		top: `calc(${topBasicHeight.value}px + 20px)`,
		right: 'auto',
		bottom: 'auto',
		left: '50%',
	};
});

const basicBasic = ref<HTMLElement | null>(null);
const { width: mapWidth, height: mapHeight } = useElementSize(basicBasic, { debounceMs: 120 });
watch([ mapWidth, mapHeight ], async () => {
	await nextTick();
	if (extmap.value === null) return;
	const leafletMap = extmap.value.leafletObject ? extmap.value.leafletObject : extmap.value;
	if (leafletMap && typeof leafletMap.invalidateSize === 'function') {
		leafletMap.invalidateSize();
	}
});

const cells = ref({
	top: true,
	right: true,
	bottom: true,
	left: true,
});
provide('cells', cells);

const importFromFileInput = ref<HTMLInputElement>();
provide('importFromFileInput', importFromFileInput);
const commonPlacesPagesCount = ref(0);
const commonRoutesPage = ref(1);
provide('commonRoutesPage', commonRoutesPage);
const commonRoutesPagesCount = ref(0);
const commonRoutesOnPageCount = ref(constants.commonroutesonpagecount);
provide('commonRoutesOnPageCount', commonRoutesOnPageCount);
const commonPlacesShow = ref(false);
const commonRoutesShow = ref(false);

const changeMode = (mode: string): void => {
	switch (mode) {
		case 'normal':
			mainStore.mode = 'normal';
			mainStore.measure.show = false;
			mainStore.placesShow.show = true;
			if (mainStore.placesShow.first) mainStore.placesShow.first = false;
			break;
		case 'routes':
			mainStore.mode = 'routes';
			mainStore.measure.show = false;
			mainStore.routesShow.show = true;
			if (mainStore.routesShow.first) mainStore.routesShow.first = false;
			break;
		case 'measure':
			mainStore.mode = 'measure';
			mainStore.measure.show = true;
			break;
	}
};
provide('changeMode', changeMode);

const focusCurrent = async (input: HTMLElement | null): Promise<void> => {
	if (!input) return;
	mainStore.setMessage(mainStore.t.i.text.addedEnterName, 3);
	await nextTick();
	input.focus();
}
provide('focusCurrent', focusCurrent);
const currentPlaceNameInputRef = ref(null);
const currentRouteNameInputRef = ref(null);
provide('currentPlaceNameInputRef', currentPlaceNameInputRef);
provide('currentRouteNameInputRef', currentRouteNameInputRef);

const popupDonate = ref<PopupProps>({
	show: false,
	position: {
		top: '0',
		right: '0',
		bottom: '0',
		left: '0',
	},
});

const commonPlaces = computed<Record<string, Place>>(() => {
	const ids = Object.keys(mainStore.commonPlaces);
	const start = mainStore.commonPlacesOnPageCount * (mainStore.commonPlacesPage - 1);
	const end = mainStore.commonPlacesOnPageCount * mainStore.commonPlacesPage;
	return ids.slice(start, end).reduce((acc, id) => {
		acc[id] = mainStore.commonPlaces[id];
		return acc;
	}, {} as Record<string, Place>);
});

const stopIdleTimer = () => {
	if (common.idleTimeInterval) {
		window.clearInterval(common.idleTimeInterval);
		common.idleTimeInterval = null;
	}
};

// SEC Hooks

onMounted(async () => {
	mainStore.idleTime = 0;
	stopIdleTimer();
	common.idleTimeInterval = window.setInterval(() => {
		if (++mainStore.idleTime >= constants.sessionlifetime) {
			stopIdleTimer();
			mainStore.unload();
			router.push({ name: 'Auth' });
		}
	}, 1000);
	await nextTick();
	windowResize();
	document.addEventListener('keyup', keyup, false);
	window.addEventListener('resize', windowResize, false);
	setBusy(false);
	if (mainStore.first) {
		mainStore.first = false;
		mainStore.backupState();
		if (mainStore.user && mainStore.user.testaccount) {
			setTimeout(() => {
				mainStore.setMessage(mainStore.t.m.popup.testAccount, 8);
			}, 1000);
		}
	}
});
onUnmounted(() => {
	document.removeEventListener('keyup', keyup);
	window.removeEventListener('resize', windowResize);
	stopIdleTimer();
});

const firstUpdate = ref(true);
onUpdated(() => {
	if (firstUpdate.value) {
		mainStore.openTreeToCurrent(mainStore.currentPlace);
		mainStore.openTreeToCurrent(mainStore.currentRoute);
		firstUpdate.value = false;
	}
});

const blur = (el?: HTMLElement): void => {
	if (el) (el as HTMLElement).blur();
		else document.querySelectorAll<HTMLElement>(':focus').forEach(el => el.blur());
};
watch(() => mainStore.currentPlaceId, () => {
	mainStore.openTreeToCurrent(mainStore.currentPlace);
});
watch(() => mainStore.currentRouteId, () => {
	mainStore.openTreeToCurrent(mainStore.currentRoute);
});

const commonPlacesShowHide = (show: boolean | null = null): void => {
	commonPlacesShow.value =
		show === null
			? !commonPlacesShow.value
			: show
	;
	mainStore.commonMarkersShowHide(commonPlacesShow.value);
};
provide('commonPlacesShowHide', commonPlacesShowHide);

const isPrefixActive = ref(false);
const LEADER_CODE = 'Backquote';

const keyup = (e: KeyboardEvent): void => {
	const target = e.target as HTMLElement;
	if (
		target.tagName === 'INPUT' ||
		target.tagName === 'TEXTAREA' ||
		target.hasAttribute('contenteditable')
	) {
		return;
	}
	if (!isPrefixActive.value) {
		if (e.code === LEADER_CODE) {
			e.preventDefault();
			isPrefixActive.value = true;
		}
		return;
	}
	e.preventDefault();
	if (e.code === LEADER_CODE || e.code === 'Escape') {
		isPrefixActive.value = false;
		return;
	}
	const shortcut = (constants.shortcuts as Record<string, string>)[e.code];
	if (!shortcut) {
		isPrefixActive.value = false;
		return;
	}
	blur();
	const actions: Record<string, () => void> = {
		'normal mode': () => changeMode('normal'),
		'routes mode': () => changeMode('routes'),
		'measure mode': () => changeMode('measure'),
		'places show': () => mainStore.placesShow.show = !mainStore.placesShow.show,
		'routes show': () => mainStore.routesShow.show = !mainStore.routesShow.show,
		'temps show': () => mainStore.tempsShow.show = !mainStore.tempsShow.show,
		'add': () => mainStore.upsertPlaceFollowing(mainStore.currentPlace),
		'add folder': () => router.push({ name: 'HomeFolder' }),
		'import': () => importFromFileInput?.value?.click(),
		'export': () => router.push({ name: 'HomeExport' }),
		'save': () => db.saveAll(),
		'help': () => router.push({ name: 'HomeText', params: { what: 'about' } }),
		'quit': () => { logout(); router.push({ name: 'Auth' }); },
		'marks': () => mainStore.markersShowHide(),
		'center': () => mainStore.centerMarkerShowHide(),
		'undo': () => mainStore.undo(),
		'redo': () => mainStore.redo(),
	};
	const action = actions[shortcut];
	if (action) action();
	isPrefixActive.value = false;
};

const sbs = ref('all');

const sidebarSizes = ref(structuredClone(constants.sidebars));

watch(() => common.compact, (newValue, oldValue) => {
	(Object.keys(cells.value) as Array<keyof typeof cells.value>).forEach(key => {
		cells.value[key] = newValue !== 2;
	});
	cells.value.bottom = true;
	if (oldValue === 2 && newValue < 2) {
		windowResize();
	}
});

const windowResize = (): void => {
	const width = window.innerWidth;
	common.compact = width > constants.compact ? 0 : width > constants.compactUltra ? 1 : 2;
	if (common.compact !== 2) {
		updateSidebarSizes('top', 0);
		updateSidebarSizes('right', 0);
		updateSidebarSizes('bottom', 0);
		updateSidebarSizes('left', 0);
	}
};

// SEC Sidebars

const sideShowHide = (side: 'top' | 'right' | 'bottom' | 'left') => {
	cells.value[side] = !cells.value[side];
	if (cells.value[side]) {
		if (side === 'left') cells.value.right = false;
		if (side === 'right') cells.value.left = false;
	}
};
const gridStyle = computed(() => {
	const s = sidebarSizes.value;
	const c = cells.value;
	if (common.compact === 2) {
		const cols = c.left ? '1fr 0 0' : (c.right ? '0 0 1fr' : '0 1fr 0');
		const rows = `${c.top ? 'auto' : '0'} 1fr ${c.bottom ? 'auto' : '0'}`;
		return `grid-template-columns: ${cols}; grid-template-rows: ${rows};`;
	}
	return `
		grid-template-columns: ${s.left.act}px 1fr ${s.right.act}px;
		grid-template-rows: ${s.top.act}px 1fr ${s.bottom.act}px;
	`;
});

// SEC Sidebars DnD

const updateSidebarSizes = (
	side: 'top' | 'right' | 'bottom' | 'left',
	delta: number,
) => {
	const grid = root.value;
	if (!grid) return;
	const vw = grid.clientWidth;
	const vh = grid.clientHeight;
	const s = sidebarSizes.value;

	switch (side) {
		case 'top':
			s.top.act = clamp(
				s.top.act + delta,
				s.top.min,
				Math.min(s.top.max, vh - s.bottom.act - s.center.min),
			);
			break;
		case 'right':
			s.right.act = clamp(
				s.right.act - delta,
				s.right.min,
				Math.min(s.right.max, vw - s.left.act - s.center.min),
			);
			break;
		case 'bottom':
			s.bottom.act = clamp(
				s.bottom.act - delta,
				s.bottom.min,
				Math.min(s.bottom.max, vh - s.top.act - s.center.min),
			);
			break;
		case 'left':
			s.left.act = clamp(
				s.left.act + delta,
				s.left.min,
				Math.min(s.left.max, vw - s.right.act - s.center.min),
			);
			break;
	}
};
const sidebarDragLeft = useLightPointerDnD({
	onDrag: ({ deltaX }) => updateSidebarSizes('left', deltaX),
});
const sidebarDragRight = useLightPointerDnD({
	onDrag: ({ deltaX }) => updateSidebarSizes('right', deltaX),
});
const sidebarDragTop = useLightPointerDnD({
	onDrag: ({ deltaY }) => updateSidebarSizes('top', deltaY),
});
const sidebarDragBottom = useLightPointerDnD({
	onDrag: ({ deltaY }) => updateSidebarSizes('bottom', deltaY),
});

// SEC Search

const searchInput = ref<HTMLInputElement>();
const searchInputEvent = (event: KeyboardEvent): void => {
	const input = event.currentTarget as HTMLInputElement;
	if (event.code === "Escape") {
		input.value = '';
		selectPlaces('');
		return;
	}
	if (event.code === "Enter") {
		selectPlaces(input.value);
	}
};
const selectPlaces = (text?: string | null): void => {
	const regexp = new RegExp(text ?? '.*', 'i');
	for (const id in mainStore.places) {
		if (!Object.hasOwn(mainStore.places, id)) continue;
		if (!text) { mainStore.places[id].show = true; continue; }
		if (regexp.test(mainStore.places[id].name)) {
			mainStore.places[id].show = true;
		} else {
			mainStore.places[id].show = false;
		}
	}
};
</script>

<style lang="scss" scoped>
#top-left, #top-right, #bottom-left, .basic-action-buttons {
	display: flex;
	gap: 8px;
}
.basic-action-buttons {
	display: flex;
	gap: 8px;
	align-items: start;
}
.basic-action-buttons {
	flex: 1 1 auto;
}
:not(#bottom-basic) > .basic-action-buttons .control-buttons {
	flex-grow: 1;
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(35px, 1fr));
	gap: 8px;
}
#top-left .basic-action-buttons {
	flex-direction: column;
	align-items: stretch;
}
.mode-buttons {
	grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
}
:is(#top-right, #basic-right) .basic-action-buttons .control-buttons {
	grid-template-columns: repeat(auto-fit, minmax(45px, 1fr));
}
:is(#bottom-left, #bottom-basic) .basic-action-buttons .control-buttons {
	grid-template-columns: repeat(auto-fit, minmax(25px, 1fr));
}
:is(#basic-left, #basic-right) .basic-action-buttons:not(:empty) {
	margin-bottom: 18px;
}
.helpers-search, .helpers-range, .helpers-measure {
	margin-bottom: 12px;
}
.helpers-search, .helpers-range {
	display: flex;
	flex-flow: row wrap;
	justify-content: flex-end;
	gap: 8px;
	align-items: center;
	> *:not(:first-child), .action-button {
		flex: 0 1 auto;
	}
	> *:first-child {
		flex: 1 1 0;
		min-width: 3em;
	}
	.control-buttons button {
		width: 22px;
	}
}
.helpers-measure-header {
	display: grid;
	grid-template-columns: 1fr auto;
	gap: 8px;
	margin-bottom: 12px;
	align-items: baseline;
	* {
		margin: 0;
	}
	h2 {
		margin: 0 !important;
	}
}
.online-mode {
	display: grid;
	grid-template-columns: 1fr auto;
	align-items: center;
	gap: 6px;
	.indicator-online {
		display: block;
		width: 12px;
		height: 12px;
		border-radius: 999999px;
	}
}
</style>
