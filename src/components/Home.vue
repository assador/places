<template>
	<div
		id="grid"
		ref="root"
		:class="`sbs_${sbs}`"
		:style="gridStyle"
		@mousemove="rootMouseOverTrottled"
		@touchmove="rootMouseOverTrottled"
		@mouseup="sidebarDragStop"
		@touchend="sidebarDragStop"
	>
		<div
			id="top-left"
			class="app-cell"
			:style="sidebarSize.top === 0 || sidebarSize.left === 0 || !cells.top || !cells.left ? 'display: none' : ''"
		>
			<div id="top-left__control-buttons-left" />
		</div>
		<div
			id="top-basic"
			class="app-cell"
			:style="sidebarSize.top === 0 || !cells.top ? 'display: none' : ''"
		>
			<Header />
			<div
				id="messages"
				class="invisible"
				@mouseover="mainStore.setMouseOverMessages(true)"
				@mouseout="mainStore.setMouseOverMessages(false)"
				@click="mainStore.clearMessages();"
			>
				<div
					v-for="(message, index) in mainStore.messages"
					:id="'message-' + index"
					:key="index"
					class="message border_1"
				>
					{{ message }}
				</div>
			</div>
		</div>
		<div
			id="top-right"
			class="app-cell"
			:style="sidebarSize.top === 0 || sidebarSize.right === 0 || !cells.top || !cells.right ? 'display: none' : ''"
		>
			<div id="top-right__control-buttons-right" />
		</div>
		<div
			id="basic-left"
			class="app-cell"
			:style="sidebarSize.left !== 0 || cells.left ? 'display: block' : 'display: none'"
		>
			<div id="basic-left__control-buttons-left" />
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
						@click="selectPlaces(searchInput.value)"
					>
						<span>↪</span>
					</button>
					<button
						class="button-iconed icon icon-cross-45"
						:title="mainStore.t.i.buttons.clear"
						@click="
							if (searchInput.value !== '') {
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
						class="button-iconed icon icon-cross-45"
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
			<Measure />
			<Points v-if="mainStore.tempsShow" type="temps" />
			<div v-if="mainStore.routesShow" id="routes">
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
								@click="() => {
									mainStore.currentRoute = commonRoute;
									if (commonRoute.points.length) {
										const point = mainStore.points[
											commonRoute.points[
												commonRoute.choosing
											].id
										];
										mainStore.currentPoint = point;
										mainStore.updateMap({
											latitude: point.latitude,
											longitude: point.longitude,
										});
									}
								}"
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
								:class="index + 1 === mainStore.commonPlacesPage ? ' un_imp' : ''"
								@click="mainStore.commonPlacesPage = index + 1;"
							>
								{{ index + 1 }}
							</a>
						</div>
					</div>
				</div>
			</div>
			<div v-if="mainStore.placesShow" id="places-tree">
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
							:class="
								commonPlace === mainStore.currentPlace ||
								mainStore.measure.points.find(p => p.id === commonPlace.id)
									? 'active' : ''
							"
							@click="() => {
								mainStore.currentPlace = commonPlace;
								const point = mainStore.points[commonPlace.pointid];
								mainStore.currentPoint = point;
								mainStore.updateMap({
									latitude: point.latitude,
									longitude: point.longitude,
								});
							}"
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
							:class="index + 1 === mainStore.commonPlacesPage ? ' un_imp' : ''"
							@click="mainStore.commonPlacesPage = index + 1;"
						>
							{{ index + 1 }}
						</a>
					</div>
				</div>
			</div>
		</div>
		<div
			id="basic-basic"
			class="app-cell"
			:style="(cells.left ? 'padding-left: 0;' : '') + (cells.right ? 'padding-right: 0;' : '')"
		>
			<div
				class="basic-on-full button"
				:title="mainStore.t.i.hints.fullscreen"
				:style="cells.left && cells.right && compact === 2 ? 'display: none' : ''"
				@click="basicOnFull"
			>
				⤧
			</div>
			<component
				:is="maps[mainStore.activeMapIndex].component"
				:style="cells.left && cells.right && compact === 2 ? 'display: none' : ''"
			/>
			<button
				id="sbb-top"
				:class="cells.top ? 'disclosed' : ''"
				:style="(cells.top ? 'top: -10px;' : '')"
				@click="() => cells.top = !cells.top"
			/>
			<button
				id="sbb-right"
				:class="cells.right ? 'disclosed' : ''"
				:style="(cells.right ? 'right: -10px;' : '')"
				@click="() => cells.right = !cells.right"
			/>
			<button
				id="sbb-bottom"
				:class="cells.bottom ? 'disclosed' : ''"
				:style="(cells.bottom ? 'bottom: -10px;' : '')"
				@click="() => cells.bottom = !cells.bottom"
			/>
			<button
				id="sbb-left"
				:class="cells.left ? 'disclosed' : ''"
				:style="(cells.left ? 'left: -10px;' : '')"
				@click="() => cells.left = !cells.left"
			/>
		</div>
		<div
			id="basic-right"
			class="app-cell"
			:style="sidebarSize.right !== 0 || cells.right ? 'display: block' : 'display: none'"
		>
			<div id="basic-right__control-buttons-right" />
			<RouteDetails />
			<PlaceDetails />
			<div>
				<button
					:disabled="mainStore.saved"
					:title="(!mainStore.saved ? (mainStore.t.i.hints.notSaved + '. ') : '') + mainStore.t.i.hints.sabeToDb"
					class="save-button"
					@click="toDBCompletely"
				>
					{{ mainStore.t.i.buttons.save }}
				</button>
			</div>
		</div>
		<div
			id="bottom-left"
			class="app-cell"
			:style="sidebarSize.bottom === 0 || sidebarSize.left === 0 || !cells.left || !cells.bottom ? 'display: none' : ''"
		>
			<div id="bottom-left__control-buttons-bottom" />
		</div>
		<div
			id="bottom-basic"
			class="app-cell"
			:style="sidebarSize.bottom === 0 || !cells.bottom ? 'display: none' : ''"
		>
			<div id="bottom-basic__control-buttons-bottom" />
			<div id="bottom-choose-map">
				<select
					id="choose-map-input"
					:title="mainStore.t.i.hints.mapProvider"
					@change="e => mainStore.activeMapIndex = (e.target as HTMLSelectElement).selectedIndex"
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
			</div>
			<div id="bottom-center-coordinates">
				<span class="imp">
					{{ mainStore.t.i.captions.center }}:
				</span>
				<span class="nobr">
					<input
						id="center-coordinates-latitude"
						v-model.number.trim="mainStore.center.latitude"
						placeholder="latitude"
						title="mainStore.t.i.captions.latitude"
					/>
					<span>°N</span>
				</span>
				<span class="nobr">
					<input
						id="center-coordinates-longitude"
						v-model.number.trim="mainStore.center.longitude"
						placeholder="longitude"
						title="mainStore.t.i.captions.longitude"
					/>
					<span>°E</span>
				</span>
			</div>
			<span id="bottom-altitude" class="nobr">
				{{ mainStore.t.i.captions.altitude }}:
				{{ centerAltitude }}
			</span>
		</div>
		<div
			id="sbs-top"
			:style="`
				top: ${sidebarSize.top - 11}px;
				left: ${compactControlButtons ? sidebarSize.left : 0}px;
				right: ${compactControlButtons ? sidebarSize.right : 0}px;
			`"
			@mousedown="e => sidebarDragStart(e, 'top')"
			@touchstart="e => sidebarDragStart(e, 'top')"
		/>
		<div
			id="sbs-right"
			:style="`right: ${sidebarSize.right - 11}px`"
			@mousedown="e => sidebarDragStart(e, 'right')"
			@touchstart="e => sidebarDragStart(e, 'right')"
		/>
		<div
			id="sbs-bottom"
			:style="`bottom: ${sidebarSize.bottom - 11}px`"
			@mousedown="e => sidebarDragStart(e, 'bottom')"
			@touchstart="e => sidebarDragStart(e, 'bottom')"
		/>
		<div
			id="sbs-left"
			:style="`left: ${sidebarSize.left - 11}px`"
			@mousedown="e => sidebarDragStart(e, 'left')"
			@touchstart="e => sidebarDragStart(e, 'left')"
		/>
		<router-view />
	</div>
	<Teleport :to="compactControlButtons
		? '#basic-left__control-buttons-left'
		: '#top-left__control-buttons-left'
	">
		<div class="control-buttons">
			<button
				id="actions-places"
				:class="'actions-button' + (mainStore.placesShow ? ' button-pressed' : '')"
				:title="mainStore.t.i.captions.places"
				accesskey="p"
				@click="() => mainStore.placesShow = !mainStore.placesShow"
			>
				<span>☩</span>
				<span>{{ mainStore.t.i.captions.places }}</span>
			</button>
			<button
				id="actions-routes"
				:class="'actions-button' + (mainStore.routesShow ? ' button-pressed' : '')"
				:title="mainStore.t.i.captions.routes"
				accesskey="t"
				@click="() => mainStore.routesShow = !mainStore.routesShow"
			>
				<span>⭍</span>
				<span>{{ mainStore.t.i.captions.routes }}</span>
			</button>
			<button
				id="actions-points"
				:class="'actions-button' + (mainStore.tempsShow ? ' button-pressed' : '')"
				:title="mainStore.t.i.captions.independentPoints"
				accesskey="t"
				@click="() => mainStore.tempsShow = !mainStore.tempsShow"
			>
				<span>⊙</span>
				<span>{{ mainStore.t.i.captions.points }}</span>
			</button>
			<button
				id="actions-range"
				:class="'actions-button actions-button_bigger' + (mainStore.rangeShow ? ' button-pressed' : '')"
				:title="mainStore.t.i.captions.range"
				accesskey="r"
				@click="() => {
					mainStore.rangeShow = !mainStore.rangeShow;
					mainStore.rangeShow
						? mainStore.showInRange(mainStore.range)
						: mainStore.showInRange(null)
				}"
			>
				<span>⨷</span>
				<span>{{ mainStore.t.i.buttons.range }}</span>
			</button>
			<button
				id="actions-edit-folders"
				:class="'actions-button' + (foldersEditMode ? ' button-pressed' : '')"
				:title="mainStore.t.i.hints.editFolders"
				accesskey="c"
				@click="foldersEditMode = !foldersEditMode;"
			>
				<span>abc|</span>
				<span>{{ mainStore.t.i.buttons.editFolders }}</span>
			</button>
		</div>
		<div class="control-buttons">
			<button
				id="mode-normal"
				class="actions-button"
				:class="mainStore.mode === 'normal' ? 'button-pressed' : ''"
				:title="mainStore.t.i.captions.modeNormal"
				accesskey="m"
				@click="() => {
					mainStore.mode = 'normal';
					mainStore.measure.show = false;
				}"
			>
				<span>☩</span>
				<span>{{ mainStore.t.i.buttons.normal }}</span>
			</button>
			<button
				id="mode-routes"
				class="actions-button"
				:class="mainStore.mode === 'routes' ? 'button-pressed' : ''"
				:title="mainStore.t.i.captions.modeRoutes"
				accesskey="m"
				@click="() => {
					mainStore.mode = 'routes';
					mainStore.routesShow = true;
					mainStore.measure.show = false;
				}"
			>
				<span>⭍</span>
				<span>{{ mainStore.t.i.buttons.routes }}</span>
			</button>
			<button
				id="mode-measure"
				class="actions-button"
				:class="mainStore.mode === 'measure' ? 'button-pressed' : ''"
				:title="mainStore.t.i.captions.modeMeasure"
				accesskey="m"
				@click="() => {
					mainStore.mode = 'measure';
					mainStore.measure.show = true;
				}"
			>
				<span>⤡</span>
				<span>{{ mainStore.t.i.buttons.measure }}</span>
			</button>
		</div>
	</Teleport>
	<Teleport :to="compactControlButtons
		? '#basic-right__control-buttons-right'
		: '#top-right__control-buttons-right'
	">
		<div class="control-buttons">
			<input
				id="import-from-file-input"
				ref="importFromFileInput"
				name="jsonFile"
				type="file"
				accept=".json,.gpx,text/xml,application/json"
				@change="importFromFile();"
			/>
			<button
				id="actions-undo"
				:disabled="mainStore.stateBackupsIndex < 1"
				class="actions-button"
				:title="mainStore.t.i.hints.undo"
				accesskey="z"
				@click="mainStore.undo();"
			>
				<span>↺</span>
				<span>{{ mainStore.t.i.buttons.undo }}</span>
			</button>
			<button
				id="actions-redo"
				:disabled="mainStore.stateBackupsIndex === mainStore.stateBackups.length - 1"
				class="actions-button"
				:title="mainStore.t.i.hints.redo"
				accesskey="y"
				@click="mainStore.redo();"
			>
				<span>↻</span>
				<span>{{ mainStore.t.i.buttons.redo }}</span>
			</button>
			<button
				id="actions-save"
				:disabled="mainStore.saved || mainStore.user.testaccount"
				:class="'actions-button' + (!mainStore.saved ? ' button-pressed' : '')"
				:title="(!mainStore.saved ? (mainStore.t.i.hints.notSaved + '. ') : '') + mainStore.t.i.hints.sabeToDb"
				accesskey="s"
				@click="toDBCompletely"
			>
				<span>↸</span>
				<span>{{ mainStore.t.i.buttons.save }}</span>
			</button>
			<button
				id="actions-install"
				class="actions-button"
				:title="mainStore.t.i.hints.install"
				:disabled="installButtonEnabled"
				@click="installPWA()"
			>
				<span>⤓</span>
				<span>{{ mainStore.t.i.buttons.install }}</span>
			</button>
			<button
				id="actions-import"
				class="actions-button"
				:title="mainStore.t.i.hints.importPlaces"
				accesskey="i"
				@click="importFromFileInput.click()"
			>
				<span>↲</span>
				<span>{{ mainStore.t.i.buttons.import }}</span>
			</button>
			<button
				id="actions-export"
				class="actions-button"
				:title="mainStore.t.i.hints.exportPlaces"
				accesskey="e"
				@click="router.push({name: 'HomeExport'})"
			>
				<span>↱</span>
				<span>{{ mainStore.t.i.buttons.export }}</span>
			</button>
			<button
				id="actions-about"
				class="actions-button"
				:title="mainStore.t.i.hints.about"
				accesskey="h"
				@click="
					router.push({
						name: 'HomeText',
						params: {what: 'about'}
					});
				"
			>
				<span>?</span>
				<span>{{ mainStore.t.i.buttons.help }}</span>
			</button>
			<button
				id="actions-exit"
				class="actions-button"
				:title="mainStore.t.i.hints.exit"
				accesskey="q"
				@click="emitter.emit('logout')"
			>
				<span>↪</span>
				<span>{{ mainStore.t.i.buttons.exit }}</span>
			</button>
		</div>
	</Teleport>
	<Teleport :to="compactControlButtons
		? '#bottom-basic__control-buttons-bottom'
		: '#bottom-left__control-buttons-bottom'
	">
		<div class="control-buttons">
			<button
				id="placemarksShowHideButton"
				:class="'actions-button' + (mainStore.placemarksShow ? ' button-pressed' : '')"
				:title="mainStore.t.i.hints.shPlacemarks"
				@click="mainStore.placemarksShowHide()"
			>
				<span>◆</span>
				<!-- <span>{{ mainStore.t.i.buttons.places }}</span> -->
			</button>
			<button
				id="commonPlacesShowHideButton"
				:class="'actions-button' + (commonPlacesShow ? ' button-pressed' : '')"
				:title="mainStore.t.i.hints.shCommonPlaces"
				@click="commonPlacesShowHide();"
			>
				<span>◇</span>
				<!-- <span>{{ mainStore.t.i.buttons.commonPlaces }}</span> -->
			</button>
			<button
				id="commonPlacemarksShowHideButton"
				:class="'actions-button' + (mainStore.commonPlacemarksShow ? ' button-pressed' : '')"
				:title="mainStore.t.i.hints.shCommonPlacemarks"
				@click="mainStore.commonPlacemarksShowHide()"
			>
				<span>⬙</span>
				<!-- <span>{{ mainStore.t.i.buttons.commonPlacemarks }}</span> -->
			</button>
			<button
				id="commonRoutesShowHideButton"
				:class="'actions-button' + (commonRoutesShow ? ' button-pressed' : '')"
				:title="mainStore.t.i.hints.shCommonRoutes"
				@click="commonRoutesShowHide();"
			>
				<span>◇</span>
				<!-- <span>{{ mainStore.t.i.buttons.commonRoutes }}</span> -->
			</button>
			<button
				id="centerPlacemarkShowHideButton"
				:class="'actions-button' + (mainStore.centerPlacemarkShow ? ' button-pressed' : '')"
				:title="mainStore.t.i.hints.shCenter"
				@click="mainStore.centerPlacemarkShowHide()"
			>
				<span>◈</span>
				<!-- <span>{{ mainStore.t.i.buttons.center }}</span> -->
			</button>
		</div>
	</Teleport>
</template>

<script setup lang="ts">
import {
	ref, Ref,
	computed,
	watch,
	onMounted,
	onUnmounted,
	onUpdated,
	provide,
	inject,
	nextTick,
	defineAsyncComponent,
	watchEffect,
} from 'vue';
import axios from 'axios';
import { useMainStore } from '@/stores/main';
import { useRouter } from 'vue-router';
import { throttle } from 'lodash';
import {
	emitter,
	constants,
	generateRandomString,
	sortObjects,
	makeDropDowns,
	makeFieldsValidatable,
} from '@/shared';
import Header from '@/components/Header.vue';
import Measure from '@/components/helpers/Measure.vue';
import Points from '@/components/Points.vue';
import Tree from '@/components/tree/Tree.vue';
import RouteDetails from '@/components/details/Route.vue';
import PlaceDetails from '@/components/details/Place.vue';
import { Folder, Point, Place, Route, Image } from '@/stores/types';

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

const idleTimeInterval = inject('idleTimeInterval') as Ref<number | undefined>;
const foldersEditMode = inject('foldersEditMode') as Ref<boolean>;
const toDB = inject('toDB') as (...args: any[]) => any;
const toDBCompletely = inject('toDBCompletely') as (...args: any[]) => any;
const handleDragOver = inject('handleDragOver') as (...args: any[]) => any;
const handleDrop = inject('handleDrop') as (...args: any[]) => any;

const root = ref<HTMLElement | null>(null);
const basicOnFull = () => {
	root.value?.classList.toggle('basic-fulled');
};
const extmap = ref(null);
provide('extmap', extmap);
const importFromFileInput = ref<HTMLInputElement | null>(null);
const inputUploadFiles = ref<HTMLInputElement | null>(null);
const commonPlacesPagesCount = ref(0);
const commonRoutesPage = ref(1);
provide('commonRoutesPage', commonRoutesPage);
const commonRoutesPagesCount = ref(0);
const commonRoutesOnPageCount = ref(constants.commonroutesonpagecount);
provide('commonRoutesOnPageCount', commonRoutesOnPageCount);
const commonPlacesShow = ref(false);
const commonRoutesShow = ref(false);

const cells = ref({
	top: true,
	right: true,
	bottom: true,
	left: true,
});
const sidebarSize = ref({
	top: constants.sidebars.top,
	right: constants.sidebars.right,
	bottom: constants.sidebars.bottom,
	left: constants.sidebars.left,
});
const gridStyle = computed(() => {
	let style = '';
	if (compact.value === 2) {
		style += 'grid-template-columns:';
		style += cells.value.left ? ' 48%' : ' 0';
		style += ' 1fr';
		style += cells.value.right ? ' 48%; ' : ' 0; ';
		style += 'grid-template-rows:';
		style += cells.value.top ? ' 80px' : ' 0';
		style += ' 1fr';
		style += cells.value.bottom ? ' auto;' : ' 0;';
	} else {
		style = 
			`grid-template-columns:${sidebarSize.value.left}px 1fr ${sidebarSize.value.right}px;` +
			`grid-template-rows:${sidebarSize.value.top}px 1fr ${sidebarSize.value.bottom}px;`
		;
	}
	return style;
});
const compact = ref(0);
const compactControlButtons = ref(false);
const sidebarDrag = ref({ what: null as unknown, x: 0, y: 0, w: 0, h: 0 });
const sbs = ref('all');

watch(compact, () => {
	if (compact.value === 2) {
		cells.value.top = false;
		cells.value.right = false;
		cells.value.bottom = false;
		cells.value.left = false;
	} else {
		cells.value.top = true;
		cells.value.right = true;
		cells.value.bottom = true;
		cells.value.left = true;
	}
	const sidebars =
		compact.value === 0
			? constants.sidebars
			: compact.value === 1
				? constants.sidebarsCompact
				: constants.sidebarsCompactUltra;
	Object.assign(sidebarSize.value, sidebars);
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
/*
const commonRoutes = computed<Record<string, Route>>(() => {
	const ids = Object.keys(mainStore.commonRoutes);
	const start = commonRoutesOnPageCount.value * (commonRoutesPage.value - 1);
	const end = commonRoutesOnPageCount.value * commonRoutesPage.value;
	return ids.slice(start, end).reduce((acc, id) => {
		acc[id] = mainStore.commonRoutes[id];
		return acc;
	}, {} as Record<string, Route>);
});
*/
const centerAltitude = ref<number | null>(null);
watch(() => mainStore.ready, async () => {
	await stateReadyChanged();
});
watchEffect(async () => {
	if (
		typeof mainStore.center.latitude === 'number' &&
		typeof mainStore.center.longitude === 'number'
	) {
		centerAltitude.value = await mainStore.getAltitude(
			mainStore.center.latitude,
			mainStore.center.longitude,
		);
	}
});
watch(mainStore, changedStore => {
	if (!changedStore.refreshing) {
		sessionStorage.setItem('places-store-state', JSON.stringify(changedStore.$state));
	}
});

onMounted(async () => {
	if (mainStore.ready) stateReadyChanged();
	mainStore.idleTime = 0;
	if (!idleTimeInterval.value) {
		idleTimeInterval.value = window.setInterval(() => {
			if (++mainStore.idleTime >= constants.sessionlifetime) {
				window.clearInterval(idleTimeInterval.value);
				idleTimeInterval.value = undefined;
				mainStore.unload();
				router.push({ name: 'Auth' });
			}
		}, 1000);
	}
	await nextTick();
	makeFieldsValidatable(mainStore.t);
	windowResize();
	makeDropDowns(root);
	// Register event listeners only once
	document.addEventListener('dragover', handleDragOver, false);
	document.addEventListener('drop', handleDrop, false);
	document.addEventListener('keyup', keyup, false);
	window.addEventListener('resize', windowResize, false);
});
onUnmounted(() => {
	['dragover', 'drop', 'keyup'].forEach(event =>
		document.removeEventListener(event, {
			dragover: handleDragOver,
			drop: handleDrop,
			keyup: keyup
		}[event] as EventListener)
	);
	window.removeEventListener('resize', windowResize);
	window.clearInterval(idleTimeInterval.value);
});

const firstUpdate = ref(true);
onUpdated(() => {
	makeFieldsValidatable(mainStore.t);
	if (firstUpdate.value) {
		openTreeTo(mainStore.currentPlace);
		openTreeTo(mainStore.currentRoute);
		firstUpdate.value = false;
	}
});

const installEvent = inject<typeof installEvent>('installEvent');
const installButtonEnabled = computed(() => !!installEvent.value);

const installPWA = () => {
	const event = installEvent.value;
	if (!event) return;
	event.prompt();
};
const blur = (el?: HTMLElement): void => {
	if (el) (el as HTMLElement).blur();
		else document.querySelectorAll<HTMLElement>(':focus').forEach(el => el.blur());
};
const stateReadyChanged = async () => {
	if (!mainStore.ready) return;
	mainStore.restoreObjectsAsLinks();
	if (!mainStore.currentPlace) mainStore.setFirstCurrentPlace();
	const commonPlacesKeys = Object.keys(mainStore.commonPlaces);
	const commonPlacesLen = commonPlacesKeys.length;
	const perPage = mainStore.commonPlacesOnPageCount;
	commonPlacesPagesCount.value = Math.ceil(commonPlacesLen / perPage);
	const cp = mainStore.currentPlace;
	if (cp && cp.common && cp.userid !== mainStore.user.id) {
		const idx = commonPlacesKeys.indexOf(cp.id);
		const inPaginator = idx / perPage;
		mainStore.commonPlacesPage =
			Number.isInteger(inPaginator) ? inPaginator + 1 : Math.ceil(inPaginator);
	}
	if (mainStore.user.testaccount) {
		setTimeout(() => {
			mainStore.setMessage(mainStore.t.m.popup.testAccount);
		}, 3000);
	}
};

const openTreeTo = (object: Place | Route): void => {
	if (!object || !object.folderid) return;
	let id = object.folderid;
	let folder: Folder;
	while (id) {
		folder = mainStore.folders[id];
		if (folder) {
			mainStore.folderOpenClose({ folder, opened: true });
			id = folder.parent;
			continue;
		}
		switch (id) {
			case 'root':
				mainStore.folderOpenClose({folder: mainStore.tree, opened: true});
				return;
			case 'routesroot':
				mainStore.folderOpenClose({folder: mainStore.treeRoutes, opened: true});
				return;
			default:
				return;
		}
	}
};
watch(() => mainStore.currentPlace, current => {
	if (!current || (current.common && current.userid !== mainStore.user.id)) return;
	openTreeTo(mainStore.currentPlace);
});
watch(() => mainStore.currentRoute, current => {
	if (!current || (current.common && current.userid !== mainStore.user.id)) return;
	openTreeTo(mainStore.currentRoute);
});

const appendPlace = async (payload: Record<string, any> = {}): Promise<void | Place> => {
	const { serverConfig, user, center, t, addPlace, addPoint, setMessage } = mainStore;
	// Check places limit
	if (
		!user.testaccount &&
		serverConfig.rights.placescount > 0 &&
		serverConfig.rights.placescount <= Object.keys(mainStore.places).length
	) {
		setMessage(t.m.popup.placesCountExceeded);
		return;
	}
	const newPoint: Point = {
		id: crypto.randomUUID(),
		userid: user.id,
		latitude: center.latitude ?? null,
		longitude: center.longitude ?? null,
		time: new Date().toISOString().slice(0, -5),
		common: false,
		type: 'point',
		added: true,
		deleted: false,
		updated: false,
		show: true,
	};
	const newPlace: Place = {
		type: 'place',
		userid: sessionStorage.getItem('places-useruuid'),
		name: '',
		description: '',
		pointid: '',
		link: '',
		time: new Date().toISOString().slice(0, -5),
		id: crypto.randomUUID(),
		folderid: 'root',
		srt:
			Object.keys(mainStore.places).length
				? Math.ceil(Math.max(
					...Object.values(mainStore.places).map((p: Place) => p.srt || 0)
				)) + 1
				: 1
		,
		common: false,
		geomark: true,
		images: {},
		added: true,
		deleted: false,
		updated: false,
		show: true,
	};
	for (const key in payload) newPlace[key] = payload[key];
	newPlace.pointid = newPoint.id;
	addPoint({ point: newPoint, from: newPlace, todb: false });
	addPlace({ place: newPlace, todb: false });
	if (payload['todb'] !== false && !mainStore.user.testaccount) {
		emitter.emit('toDB', {
			'points': [{ ...newPoint, from: newPlace }],
			'places': [ newPlace ],
		});
	}
	mainStore.currentPoint = newPoint;
	mainStore.currentPlace = newPlace;
	await nextTick();
	const detailedNameElem = document.getElementById('place-detailed-name');
	if (detailedNameElem) {
		detailedNameElem.classList.add('highlight');
		window.setTimeout(() => {
			detailedNameElem.classList.remove('highlight');
			detailedNameElem.focus();
		}, 500);
	}
	return newPlace;
};
provide('appendPlace', appendPlace);

const appendRoute = async (payload: Record<string, any> = {}): Promise<void | Route> => {
	const { routes, serverConfig, user, t, addRoute, setMessage } = mainStore;
	const routesCount = Object.keys(routes).length;
	const maxRoutes = serverConfig.rights.routescount;
	// Check routes limit
	if (!user.testaccount && maxRoutes > 0 && maxRoutes <= routesCount) {
		setMessage(t.m.popup.routesCountExceeded);
		return;
	}
	const now = new Date().toISOString().slice(0, -5);
	const routeId = crypto.randomUUID();
	let folderid = 'routesroot';
	if (
		mainStore.currentRoute &&
		!(
			mainStore.currentRoute.common &&
			mainStore.currentRoute.userid !== mainStore.user.id
		)
	) {
		folderid = mainStore.currentRoute.folderid;
	}
	let srt = 1;
	if (routesCount > 0) {
		const maxSrt = Math.max(...Object.values(routes).map((t: Route) => t.srt || 0));
		srt = Math.ceil(maxSrt) + 1;
	}
	const newRoute: Route = {
		type: 'route',
		id: routeId,
		folderid,
		points: [],
		choosing: null,
		userid: sessionStorage.getItem('places-useruuid'),
		name: '',
		description: '',
		link: '',
		time: now,
		srt,
		common: false,
		geomarks: 1,
		added: true,
		deleted: false,
		updated: false,
		show: true,
	};
	for (const key in payload) newRoute[key] = payload[key];
	await addRoute({ route: newRoute });
	mainStore.currentRoute = newRoute;
	await nextTick();
	const detailedNameElem = document.getElementById('route-detailed-name');
	if (detailedNameElem) {
		detailedNameElem.classList.add('highlight');
		window.setTimeout(() => {
			detailedNameElem.classList.remove('highlight');
			detailedNameElem.focus();
		}, 500);
	}
	return newRoute;
};
provide('appendRoute', appendRoute);

const commonPlacesShowHide = (show = null): void => {
	commonPlacesShow.value =
		show === null
			? !commonPlacesShow.value
			: show
	;
	mainStore.commonPlacemarksShowHide(commonPlacesShow.value);
};
const commonRoutesShowHide = (show = null): void => {
	commonRoutesShow.value =
		show === null
			? !commonRoutesShow.value
			: show
	;
	mainStore.commonRoutesShowHide(commonRoutesShow.value);
};
provide('commonPlacesShowHide', commonPlacesShowHide);

const importFromFile = async () => {
	const input = importFromFileInput.value as HTMLInputElement;
	const file = input.files && input.files[0];
	if (!file) return;
	const mime = file.type;
	if (mime !== 'application/json' && mime !== 'application/gpx+xml') {
		mainStore.setMessage(mainStore.t.m.popup.invalidImportFileType);
		return;
	}
	const reader = new FileReader();
	reader.onload = async (event: ProgressEvent<FileReader>) => {
		await nextTick();
		await mainStore.setPlaces({
			text: event.target?.result,
			mime,
		});
		input.value = '';
	};
	reader.readAsText(file);
};
const uploadFiles = async (event: Event) => {
	event.preventDefault();
	if (mainStore.user.testaccount) {
		mainStore.setMessage(mainStore.t.m.popup.taNotAllowFileUploads);
		return;
	}
	const files = (inputUploadFiles.value as HTMLInputElement).files;
	if (!files || files.length === 0) return;
	const data = new FormData();
	const filesArray: Array<Image> = [];
	let srt = 0;
	if (
		mainStore.currentPlace.images &&
		Object.keys(mainStore.currentPlace.images).length
	) {
		const storeImages = Object.values(mainStore.currentPlace.images);
		const lastImage = sortObjects(storeImages, 'srt').pop();
		srt = lastImage ? Number(lastImage.srt) || 0 : 0;
	}
	const mimes = mainStore.serverConfig.mimes;
	const uploadSize = mainStore.serverConfig.uploadsize;
	const popup = mainStore.t.m.popup;
	const placeId = mainStore.currentPlace.id || null;
	// Validating files and creating an array for uploading
	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		const mimeType = file.type;
		const fileName = file.name;
		const fileSize = file.size;
		if (!mimes[mimeType]) {
			mainStore.setMessage(`${popup.file} ${fileName} ${popup.fileNotImage}`);
			continue;
		}
		if (fileSize > uploadSize) {
			mainStore.setMessage(`${popup.file} ${fileName} ${popup.fileTooLarge}`);
			continue;
		}
		const rndname = generateRandomString(32);
		data.append(rndname, file);
		filesArray.push({
			id: rndname,
			file: `${rndname}.${mimes[mimeType]}`,
			size: Number(fileSize) || null,
			type: mimeType,
			lastmodified: Number(file.lastModified) || null,
			srt: ++srt,
			placeid: placeId,
		});
	}
	if (!filesArray.length) return;
	const imagesUploading = document.getElementById('images-uploading');
	const imagesAddInput = document.getElementById('images-add__input') as HTMLInputElement;
	if (imagesUploading) imagesUploading.classList.remove('hidden');
	data.append('userid', mainStore.user.id);
	axios.post('/backend/upload.php', data)
		.then(response => {
			if (imagesAddInput) imagesAddInput.value = '';
			if (imagesUploading) imagesUploading.classList.add('hidden');
			const [errorCodes, uploadedFiles] = response.data;
			// Remove from the array those files that were not downloaded
			const uploadedIds = new Set(uploadedFiles.map((f: any) => f.id));
			for (let i = filesArray.length - 1; i >= 0; i--) {
				if (!uploadedIds.has(filesArray[i].id)) {
					filesArray.splice(i, 1);
				}
			}
			// Errors handling
			errorCodes.forEach((code: number) => {
				switch (code) {
					case 2:
						mainStore.setMessage(popup.taNotAllowFileUploads);
						break;
					case 3:
						mainStore.setMessage(popup.filesNotImages);
						break;
					case 4:
						mainStore.setMessage(
							`${popup.filesTooLarge} ${(
								(mainStore.serverConfig.rights.photosize / 1048576).toFixed(3)
							) || 0} Mb.`
						);
						break;
				}
			});
			if (uploadedFiles.length > 0 && mainStore.currentPlace) {
				const newImagesObject: Record<string, Image> = {
					...(mainStore.currentPlace.images || {})
				};
				for (const image of filesArray) {
					newImagesObject[image.id] = image;
				}
				mainStore.changePlace({
					place: mainStore.currentPlace,
					change: { images: newImagesObject },
				}).then(() => {
					toDB({ 'places': [ mainStore.currentPlace ] });
				});
				toDB({ 'images_upload': filesArray });
				mainStore.setMessage(popup.filesUploadedSuccessfully);
			}
		})
		.catch(error => {
			mainStore.setMessage(`${mainStore.t.m.popup.filesUploadError} ${error}`);
			if (imagesAddInput) imagesAddInput.value = '';
			if (imagesUploading) imagesUploading.classList.add('hidden');
		});
};
provide('uploadFiles', uploadFiles);

const keyup = (event: Event): void => {
	const e = event as KeyboardEvent;
	e.preventDefault();
	if (!(e.altKey && e.shiftKey)) return;
	const shortcut = (constants.shortcuts as Record<string, string>)[e.code];
	if (!shortcut) return;
	blur();
	const actions: Record<string, () => void> = {
		'add': () => appendPlace(),
		'add folder': () => router.push({ name: 'HomeFolder' }),
		'edit mode': () => foldersEditMode.value = !foldersEditMode.value,
		'import': () => importFromFileInput.value.click(),
		'export': () => router.push({ name: 'HomeExport' }),
		'save': () => toDBCompletely(),
		'help': () => router.push({ name: 'HomeText', params: { what: 'about' } }),
		'revert': () => document.location.reload(),
		'quit': () => emitter.emit('logout'),
		'other': () => commonPlacesShowHide(),
		'placemarks': () => mainStore.placemarksShowHide(),
		'other placemarks': () => mainStore.commonPlacemarksShowHide(),
		'other routes': () => mainStore.commonRoutesShowHide(),
		'center': () => mainStore.centerPlacemarkShowHide(),
		'undo': () => mainStore.undo(),
		'redo': () => mainStore.redo(),
	};
	const action = actions[shortcut];
	if (action) action();
};
const windowResize = (): void => {
	const width = window.innerWidth;
	compact.value = width > constants.compact
		? 0
		: width > constants.compactUltra
			? 1
			: 2;
	compactControlButtons.value = width <= constants.compactControlButtons;
};
const sidebarDragStart = (event: Event, what: string): void => {
	event.preventDefault();
	sidebarDrag.value.what = what;
	let x: number, y: number;
	const touch = (event as TouchEvent).changedTouches?.[0];
	if (touch) {
		x = touch.pageX;
		y = touch.pageY;
	} else {
		x = (event as MouseEvent).screenX;
		y = (event as MouseEvent).screenY;
	}
	sidebarDrag.value.x = x;
	sidebarDrag.value.y = y;
	const { value: size } = sidebarSize;
	switch (what) {
		case 'top':
			sidebarDrag.value.h = size.top;
			break;
		case 'bottom':
			sidebarDrag.value.h = size.bottom;
			break;
		case 'left':
			sidebarDrag.value.w = size.left;
			break;
		case 'right':
			sidebarDrag.value.w = size.right;
			break;
	}
};
const rootMouseOver = (event: Event): void => {
	if (!sidebarDrag.value.what) return;
	const isTouch = (event as TouchEvent).changedTouches !== undefined;
	const getCoord = (axis: 'X' | 'Y') =>
		isTouch
			? (event as TouchEvent).changedTouches[0][`page${axis}`]
			: (event as MouseEvent)[`screen${axis}`];
	switch (sidebarDrag.value.what) {
		case 'top':
			const newTop = sidebarDrag.value.h - sidebarDrag.value.y + getCoord('Y');
			sidebarSize.value.top = newTop < constants.sidebars.top ? 0 : newTop;
			break;
		case 'bottom':
			const newBottom = sidebarDrag.value.h + sidebarDrag.value.y - getCoord('Y');
			sidebarSize.value.bottom = newBottom < constants.sidebars.bottom ? 0 : newBottom;
			break;
		case 'left':
			const newLeft = sidebarDrag.value.w - sidebarDrag.value.x + getCoord('X');
			sidebarSize.value.left = newLeft < constants.sidebars.top ? 0 : newLeft;
			break;
		case 'right':
			const newRight = sidebarDrag.value.w + sidebarDrag.value.x - getCoord('X');
			sidebarSize.value.right = newRight < constants.sidebars.top ? 0 : newRight;
			break;
	}
};
const rootMouseOverTrottled = throttle(rootMouseOver, 10);

const sidebarDragStop = (): void => {
	sidebarDrag.value.what = null;
};
// Search places by name
const searchInput = ref(null);
const searchInputEvent = (event: KeyboardEvent): void => {
	const input = event.target as HTMLInputElement;
	if (event.code === "Escape") {
		input.value = '';
		selectPlaces('');
		return;
	}
	if (event.code === "Enter") {
		selectPlaces(input.value);
	}
};
const selectPlaces = (text: string): void => {
	const regexp = new RegExp(text, 'i');
	for (const id in mainStore.places) {
		if (regexp.test(mainStore.places[id].name)) {
			mainStore.places[id].show = true;
			if (
				text.length !== 0 &&
				!mainStore.folders[mainStore.places[id].folderid].opened
			) {
				mainStore.folderOpenClose({
					folder: mainStore.folders[mainStore.places[id].folderid],
					opened: true,
				});
			}
		} else {
			mainStore.places[id].show = false;
		}
	}
};
</script>

<style lang="scss" scoped>
.helpers-search, .helpers-range {
	display: flex;
	flex-flow: row wrap;
	justify-content: flex-end;
	gap: 8px;
	margin-top: 8px;
	padding-left: 0;
	align-items: center;
	> *, .actions-button {
		flex: 0 1 auto;
		&:first-child {
			flex: 1 1 auto;
			min-width: 3em;
		}
	}
}
.helpers-search, .helpers-range, .helpers-measure {
	margin: 8px 0 20px 0;
	> *:first-child {
		flex-basis: 0;
	}
}
.control-buttons {
	display: flex;
	flex-flow: row wrap;
	gap: 8px;
	text-align: center;
	&:not(:last-child) {
		margin-bottom: 8px;
	}
	.actions-button {
		flex: 1 1 calc(25% - 16px);
		min-width: 40px;
		min-height: 30px;
	}
}
.helpers-search, .helpers-range {
	.control-buttons button {
		width: 22px;
	}
}
:is(#top-left, #basic-left) .control-buttons {
	flex-flow: row nowrap;
	.actions-button {
		flex-basis: calc(20% - 16px);
		min-width: 0;
	}
}
:is(#bottom-left, #bottom-basic) .actions-button {
	flex-basis: calc(20% - 16px);
	min-width: 30px;
	min-height: 30px;
	& > *:first-child {
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 32px !important;
	}
}
</style>
