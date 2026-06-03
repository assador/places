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
				class="basic-action-buttons action-buttons"
				id="top-left__control-buttons-left"
			/>
		</div>

<!-- SEC Top-Basic -->

		<div
			ref="topBasic"
			id="top-basic"
			class="app-cell"
			:style="!cells.top || !sidebarSizes.top.act ? { display: 'none' } : null"
		>
			<Header />
			<div
				class="basic-action-buttons action-buttons"
				id="top-basic__control-buttons-top-left"
			/>
			<div
				class="basic-action-buttons action-buttons"
				id="top-basic__control-buttons-top-right"
			/>
		</div>

<!-- SEC Top-Right -->

		<div
			id="top-right"
			class="app-cell"
			:style="!cells.top || !cells.right || !sidebarSizes.top.act || !sidebarSizes.right.act ? { display: 'none' } : null"
		>
			<div
				class="basic-action-buttons action-buttons"
				id="top-right__control-buttons-right"
			/>
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
						@click="selectPlaces(searchInput.value)"
					>
						<span>↪</span>
					</button>
					<button
						class="button-iconed icon icon-cross-45-circled"
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
								@click="() => {
									mainStore.setCurrentRoute(commonRoute.id);
									if (commonRoute.points.length) {
										const point = mainStore.points[
											commonRoute.points[
												commonRoute.choosing
											].id
										];
										mainStore.setCurrentPoint(point.id);
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
			<RouteDetails />
			<PlaceDetails />
		</div>

<!-- SEC Bottom-Left -->

		<div
			id="bottom-left"
			class="app-cell"
			:style="!cells.bottom || !cells.left || !sidebarSizes.bottom.act || !sidebarSizes.left.act ? { display: 'none' } : null"
		>
			<div
				class="basic-action-buttons action-buttons"
				id="bottom-left__control-buttons-bottom"
			/>
		</div>

<!-- SEC Bottom-Basic -->

		<div
			id="bottom-basic"
			class="app-cell"
			:style="!cells.bottom || !sidebarSizes.bottom.act ? { display: 'none' } : null"
		>
			<div
				class="basic-action-buttons action-buttons"
				id="bottom-basic__control-buttons-bottom"
			/>
			<div id="bottom-choose-map">
				<select
					id="choose-map-input"
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
			<span id="bottom-donate" class="nobr">
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
		<div id="ui-buttons-left">
			<button
				class="action-button"
				:title="mainStore.t.i.hints.getLocation"
				@click="geoLocation.centerTo()"
			>
				<span class="icon icon-center-net" />
			</button>
			<button
				class="action-button"
				:disabled="mainStore.mode === 'routes' && !mainStore.currentRoute"
				:title="
					`${mainStore.t.i.hints.getLocation}. ` +
					`${mainStore.t.i.hints[mainStore.mode === 'normal' ? 'addPlace' : 'addPoint']}.`
				"
				@click="async () => {
					await mainStore.upsertEntityWithCurrentLocation(mainStore.mode);
					if (mainStore.mode === 'normal') focusCurrent(currentPlaceNameInputRef);
				}"
			>
				<span class="icon icon-plus-net" />
			</button>
		</div>
		<div id="ui-buttons-right">
			<button
				v-if="common.compact === 2"
				class="action-button"
				:title="mainStore.t.i.hints.hideCells"
				@click="hideCells"
			>
				<span class="icon icon-expand" />
			</button>
			<button
				v-if="common.compact !== 2"
				class="action-button basic-on-full"
				:class="{ 'button-pressed': basicFulled }"
				:title="mainStore.t.i.hints.fullscreen"
				@click="basicOnFull"
			>
				<span class="icon icon-full" />
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
		<transition name="fade">
			<div
				v-if="mainStore.messages.length || mainStore.messagesMouseOver"
				id="messages"
				@mouseenter="mainStore.messagesMouseOver = true"
				@mouseleave="() => {
					mainStore.messagesMouseOver = false;
					mainStore.clearMessages();
				}"
				@click="mainStore.clearMessages(true)"
			>
				<div
					v-for="(message, index) in mainStore.messages"
					:id="'message-' + index"
					:key="'message-' + index"
					class="message border_1"
				>
					{{ message }}
				</div>
			</div>
		</transition>
	</Teleport>

<!-- SEC Controls Top-Left -->

	<Teleport :to="common.compact === 2
		? '#top-basic__control-buttons-top-left'
		: '#top-left__control-buttons-left'
	">
		<div class="control-buttons">
			<button
				id="actions-places"
				class="action-button"
				:class="{ 'button-pressed': mainStore.placesShow.show }"
				:title="mainStore.t.i.captions.places"
				accesskey="p"
				@click="() => mainStore.placesShow.show = !mainStore.placesShow.show"
			>
				<span class="icon icon-geomark-1" />
				<span>{{ mainStore.t.i.buttons.places }}</span>
			</button>
			<button
				id="actions-routes"
				class="action-button"
				:class="{ 'button-pressed': mainStore.routesShow.show }"
				:title="mainStore.t.i.captions.routes"
				accesskey="t"
				@click="() => mainStore.routesShow.show = !mainStore.routesShow.show"
			>
				<span class="icon icon-route" />
				<span>{{ mainStore.t.i.buttons.routes }}</span>
			</button>
			<button
				id="actions-points"
				class="action-button"
				:class="{ 'button-pressed': mainStore.tempsShow.show }"
				:title="mainStore.t.i.buttons.pointsTemporary"
				accesskey="t"
				@click="() => mainStore.tempsShow.show = !mainStore.tempsShow.show"
			>
				<span class="icon icon-geomark-3" />
				<span>{{ mainStore.t.i.buttons.points }}</span>
			</button>
			<button
				id="actions-range"
				class="action-button actions-button_bigger"
				:class="{ 'button-pressed': mainStore.rangeShow }"
				:title="mainStore.t.i.buttons.range"
				accesskey="r"
				@click="() => {
					mainStore.rangeShow = !mainStore.rangeShow;
					mainStore.rangeShow
						? mainStore.showInRange(mainStore.range)
						: mainStore.showInRange(null)
				}"
			>
				<span class="icon icon-compas" />
				<span>{{ mainStore.t.i.buttons.range }}</span>
			</button>
			<button
				id="actions-edit-folders"
				class="action-button"
				:class="{ 'button-pressed': common.folderEditability }"
				:title="mainStore.t.i.hints.editFolders"
				accesskey="c"
				@click="common.toggleFolderEditability"
			>
				<span class="icon icon-empty icon-empty-small">A|</span>
				<span>{{ mainStore.t.i.buttons.editFolders }}</span>
			</button>
		</div>
		<div class="control-buttons mode-buttons">
			<button
				id="mode-normal"
				class="action-button"
				:class="{ 'button-pressed': mainStore.mode === 'normal' }"
				:title="mainStore.t.i.captions.modeNormal"
				accesskey="m"
				@click="changeMode('normal')"
			>
				<span class="icon icon-cross" />
				<span>{{ mainStore.t.i.buttons.normal }}</span>
			</button>
			<button
				id="mode-routes"
				class="action-button"
				:class="{ 'button-pressed': mainStore.mode === 'routes' }"
				:title="mainStore.t.i.captions.modeRoutes"
				accesskey="m"
				@click="changeMode('routes')"
			>
				<span class="icon icon-route" />
				<span>{{ mainStore.t.i.buttons.routes }}</span>
			</button>
			<button
				id="mode-measure"
				class="action-button"
				:class="{ 'button-pressed': mainStore.mode === 'measure' }"
				:title="mainStore.t.i.captions.modeMeasure"
				accesskey="m"
				@click="changeMode('measure')"
			>
				<span class="icon icon-ruler" />
				<span>{{ mainStore.t.i.buttons.measure }}</span>
			</button>
		</div>
	</Teleport>

<!-- SEC Controls Top-Right -->

	<Teleport :to="common.compact === 2
		? '#top-basic__control-buttons-top-right'
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
				class="action-button"
				:title="mainStore.t.i.hints.undo"
				accesskey="z"
				@click="mainStore.undo();"
			>
				<span class="icon icon-undo" />
				<span>{{ mainStore.t.i.buttons.undo }}</span>
			</button>
			<button
				id="actions-redo"
				:disabled="mainStore.stateBackupsIndex === mainStore.stateBackups.length - 1"
				class="action-button"
				:title="mainStore.t.i.hints.redo"
				accesskey="y"
				@click="mainStore.redo();"
			>
				<span class="icon icon-redo" />
				<span>{{ mainStore.t.i.buttons.redo }}</span>
			</button>
			<button
				id="actions-save"
				class="action-button"
				:class="{ 'button-pressed': !mainStore.saved }"
				:disabled="mainStore.saved"
				:title="
					(!mainStore.saved ? (mainStore.t.i.hints.notSaved + '. ') : '') +
					mainStore.t.i.hints.saveToDb
				"
				accesskey="s"
				@click="() => {
					if (mainStore.user.testaccount) {
						mainStore.setMessage(mainStore.t.m.popup.testOnSave, 8);
					}
					db.saveAll();
				}"
			>
				<span class="icon icon-save" />
				<span>{{ mainStore.t.i.buttons.save }}</span>
			</button>
			<button
				id="actions-install"
				class="action-button"
				:title="mainStore.t.i.hints.install"
				:disabled="!installPWAEnabled"
				@click="installPWA"
			>
				<span class="icon icon-save" />
				<span>{{ mainStore.t.i.buttons.install }}</span>
			</button>
			<button
				id="actions-import"
				class="action-button"
				:title="mainStore.t.i.hints.importPlaces"
				accesskey="i"
				@click="importFromFileInput.click()"
			>
				<span class="icon icon-import" />
				<span>{{ mainStore.t.i.buttons.import }}</span>
			</button>
			<button
				id="actions-export"
				class="action-button"
				:title="mainStore.t.i.hints.exportPlaces"
				accesskey="e"
				@click="router.push({ name: 'HomeExport' })"
			>
				<span class="icon icon-export" />
				<span>{{ mainStore.t.i.buttons.export }}</span>
			</button>
			<button
				id="actions-about"
				class="action-button"
				:title="mainStore.t.i.hints.about"
				accesskey="h"
				@click="
					router.push({
						name: 'HomeText',
						params: { what: 'about' },
					});
				"
			>
				<span class="icon icon-empty">?</span>
				<span>{{ mainStore.t.i.buttons.help }}</span>
			</button>
			<button
				id="actions-exit"
				class="action-button"
				:title="mainStore.t.i.hints.exit"
				accesskey="q"
				@click="() => {
					showMap = false;
					$nextTick(() => {
						logout();
						router.push({ name: 'Auth' });
					});
				}"
			>
				<span class="icon icon-exit" />
				<span>{{ mainStore.t.i.buttons.exit }}</span>
			</button>
		</div>
	</Teleport>

<!-- SEC Controls Bottom-Left -->

	<Teleport :to="common.compact > 0
		? '#bottom-basic__control-buttons-bottom'
		: '#bottom-left__control-buttons-bottom'
	">
		<div class="control-buttons">
			<button
				class="action-button"
				:class="{ 'button-pressed': mainStore.markersShow }"
				:title="mainStore.t.i.hints.shMarkers"
				@click="mainStore.markersShowHide()"
			>
				<span class="icon icon-geomark-1" />
			</button>
<!--
			<button
				class="action-button"
				:class="{ 'button-pressed': commonPlacesShow }"
				:title="mainStore.t.i.hints.shCommonPlaces"
				@click="commonPlacesShowHide();"
			>
				<span class="icon icon-geomark-3" />
			</button>
			<button
				class="action-button"
				:class="{ 'button-pressed': mainStore.commonMarkersShow }"
				:title="mainStore.t.i.hints.shCommonMarkers"
				@click="mainStore.commonMarkersShowHide()"
			>
				<span class="icon icon-geomark-2" />
			</button>
			<button
				class="action-button"
				:class="{ 'button-pressed': commonRoutesShow }"
				:title="mainStore.t.i.hints.shCommonRoutes"
				@click="commonRoutesShowHide();"
			>
				<span class="icon icon-circle" />
			</button>
-->
			<button
				class="action-button"
				:class="{ 'button-pressed': mainStore.centerMarkerShow }"
				:title="mainStore.t.i.hints.shCenter"
				@click="mainStore.centerMarkerShowHide()"
			>
				<span class="icon icon-circle-circle" />
			</button>
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
		class="messages"
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
	inject,
	nextTick,
	defineAsyncComponent,
} from 'vue';
import api from '@/api';
import { useMainStore } from '@/stores/main';
import { useRouter } from 'vue-router';
import { useGeolocation } from '@/services/geolocation';

import * as db from '@/services/db';
import { common, setBusy } from '@/services/common';
import { logout } from '@/services/auth';
import { constants } from '@/shared/constants';
import { useElementSize } from '@/services/sizes';
import { useLightPointerDnD } from '@/shared/dnd';
import { sortObjects } from '@/shared/sorting';
import { clamp, makeDropDowns } from '@/shared/common';

import { Place, Route, Image, PopupProps, PopupPosition } from '@/types';

import Header from '@/components/Header.vue';
import MeasureDetails from '@/components/helpers/Measure.vue';
import Points from '@/components/Points.vue';
import Tree from '@/components/tree/Tree.vue';
import RouteDetails from '@/components/details/Route.vue';
import PlaceDetails from '@/components/details/Place.vue';
import Popup from '@/components/popups/Popup.vue';
import PopupEntityMenu from '@/components/popups/PopupEntityMenu.vue';
import PopupPointInfo from '@/components/popups/PopupPointInfo.vue';

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
const geoLocation = useGeolocation();

const { installPWAEnabled, installPWA } = inject('pwa') as any;

const handleDrop = inject('handleDrop') as (...args: any[]) => any;

const root = ref<HTMLElement | null>(null);
const basicFulled = ref(false);
const basicOnFull = () => {
	basicFulled.value = !basicFulled.value;
	root.value?.classList.toggle('basic-fulled');
};
const hideCells = () => {
	cells.value = {
		top: false,
		right: false,
		bottom: false,
		left: false,
	}
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

const extmap = ref(null);
provide('extmap', extmap);

const showMap = ref(true);
provide('showMap', showMap);

const importFromFileInput = ref<HTMLInputElement | null>(null);
const commonPlacesPagesCount = ref(0);
const commonRoutesPage = ref(1);
provide('commonRoutesPage', commonRoutesPage);
const commonRoutesPagesCount = ref(0);
const commonRoutesOnPageCount = ref(constants.commonroutesonpagecount);
provide('commonRoutesOnPageCount', commonRoutesOnPageCount);
const commonPlacesShow = ref(false);
const commonRoutesShow = ref(false);

const focusCurrent = async (input: HTMLElement | null) => {
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
	makeDropDowns(root);
	document.addEventListener('drop', handleDrop, false);
	document.addEventListener('keyup', keyup, false);
	window.addEventListener('resize', windowResize, false);
	setBusy(false);
	if (mainStore.first) {
		mainStore.first = false;
		mainStore.backupState();
		if (mainStore.user.testaccount) {
			setTimeout(() => {
				mainStore.setMessage(mainStore.t.m.popup.testAccount, 8);
			}, 1000);
		}
	}
});
onUnmounted(() => {
	document.removeEventListener('drop', handleDrop);
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
	mainStore.openTreeToCurrent(mainStore.currentPlace)
});
watch(() => mainStore.currentRouteId, () => {
	mainStore.openTreeToCurrent(mainStore.currentRoute)
});

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
const commonPlacesShowHide = (show: boolean | null = null): void => {
	commonPlacesShow.value =
		show === null
			? !commonPlacesShow.value
			: show
	;
	mainStore.commonMarkersShowHide(commonPlacesShow.value);
};
provide('commonPlacesShowHide', commonPlacesShowHide);

const importFromFile = async () => {
	const input = importFromFileInput.value as HTMLInputElement;
	const file = input.files[0] ?? null;
	if (!file) return;
	const mime = file.type;
	if (mime !== 'application/json' && mime !== 'application/gpx+xml') {
		mainStore.setMessage(mainStore.t.m.popup.invalidImportFileType);
		return;
	}
	const reader = new FileReader();
	reader.onload = async (event: ProgressEvent<FileReader>) => {
		await nextTick();
		mainStore.addImported({ mime, text: event.target?.result as string });
		input.value = '';
	};
	reader.readAsText(file);
};
const uploadFiles = async (
	event: Event,
	target: Place | Route,
	inputElement?: HTMLInputElement,
) => {
	event.preventDefault();
	if (mainStore.user.testaccount) {
		mainStore.setMessage(mainStore.t.m.popup.taNotAllowFileUploads, 3);
		return;
	}
	const input = inputElement || (event.currentTarget as HTMLInputElement);
	if (!input.files || !input.files.length) return;
	const data = new FormData();
	const filesArray: Image[] = [];
	let srt = 0;
	if (target.images && Object.keys(target.images).length) {
		const storeImages = Object.values(target.images);
		const lastImage = sortObjects(storeImages, 'srt').pop();
		srt = lastImage ? Number(lastImage.srt) || 0 : 0;
	}
	const mimes = mainStore.serverConfig.mimes;
	const uploadSize = mainStore.serverConfig.uploadsize;
	const popup = mainStore.t.m.popup;
	// Validating files and creating an array for uploading
	for (let i = 0; i < input.files.length; i++) {
		const file = input.files[i];
		const mimeType = file.type;
		const fileName = file.name;
		const fileSize = file.size;
		if (!mimes[mimeType]) {
			mainStore.setMessage(`${popup.file} ${fileName} ${popup.fileNotImage}`, 3);
			continue;
		}
		if (fileSize > uploadSize) {
			mainStore.setMessage(`${popup.file} ${fileName} ${popup.fileTooLarge}`, 3);
			continue;
		}
		const imageId = crypto.randomUUID();
		data.append(imageId, file);
		filesArray.push({
			id: imageId,
			file: `${imageId}.${mimes[mimeType]}`,
			size: Number(fileSize) || null,
			type: mimeType,
			lastmodified: Number(file.lastModified) || null,
			srt: ++srt,
			[`${target.type}id`]: target.id,
		});
	}
	if (!filesArray.length) return;
	data.append('userid', mainStore.user.id);
	data.append('entityid', target.id);
	data.append('entitytype', target.type);
	try {
		const response = await api.post('upload.php', data, { silent: true });
		input.value = '';
		const [ errorCodes, uploadedFiles ] = response.data;
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
					mainStore.setMessage(popup.taNotAllowFileUploads, 3);
					break;
				case 3:
					mainStore.setMessage(popup.filesNotImages, 3);
					break;
				case 4:
					mainStore.setMessage(
						`${popup.filesTooLarge} ${(
							(mainStore.serverConfig.rights.photosize / 1048576).toFixed(3)
						) || 0} Mb.`
					, 3);
					break;
			}
		});
		if (uploadedFiles.length) {
			const newImagesObject: Record<string, Image> = {
				...(target.images || {})
			};
			for (const image of filesArray) {
				newImagesObject[image.id] = image;
			}
			if (target.type === 'place') {
				mainStore.changePlace({
					entity: target,
					change: { images: newImagesObject },
				});
			} else if (target.type === 'route') {
				mainStore.changeRoute({
					entity: target,
					change: { images: newImagesObject },
				});
			}
			// mainStore.setMessage(popup.filesUploadedSuccessfully, 3);
		}
	} catch(error) {
		mainStore.setMessage(`${mainStore.t.m.popup.filesUploadError} ${error}`);
	}
};
provide('uploadFiles', uploadFiles);

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
		'import': () => importFromFileInput.value.click(),
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

const cells = ref({
	top: true,
	right: true,
	bottom: true,
	left: true,
});
const sidebarSizes = ref(structuredClone(constants.sidebars));

watch(() => common.compact, (valNew, valOld) => {
	(Object.keys(cells.value) as Array<keyof typeof cells.value>).forEach(key => {
		cells.value[key] = valNew !== 2;
	});
	if (valOld === 2 && valNew < 2) {
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

const searchInput = ref(null);
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
const selectPlaces = (text: string): void => {
	const regexp = new RegExp(text, 'i');
	for (const id in mainStore.places) {
		if (regexp.test(mainStore.places[id].name)) {
			mainStore.places[id].show = true;
			if (
				text.length !== 0 &&
				!mainStore.folders[mainStore.places[id].folderid].open
			) {
				mainStore.folderOpenClose({
					folder: mainStore.folders[mainStore.places[id].folderid],
					open: true,
				});
			}
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
	align-items: stretch;
}
.icon {
	&, &::before {
		display: block;
	}
	&-empty {
		display: flex;
		width: 100%;
		align-items: center;
		justify-content: center;
		font-size: 20px;
	}
	&-empty-small {
		font-size: 15px;
	}
	&-compas {
		transform: rotate(45deg);
	}
}
.basic-action-buttons {
	flex-direction: column;
	flex: 1 1 calc(20% - 16px);
	.control-buttons {
		flex-grow: 1;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(35px, 1fr));
		gap: 8px;
	}
	.action-button {
		display: flex;
		flex-flow: column nowrap;
		gap: 4px;
		align-items: center;
		justify-content: center;
		min-width: 0;
		padding: 2px 0 0 0;
	}
	.icon {
		&, &::before {
			width: 15px; height: 15px;
		}
	}
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
</style>
