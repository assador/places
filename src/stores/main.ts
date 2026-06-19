import { defineStore } from 'pinia';
import {
	IMainState,
	Point,
	Place,
	Route,
	Folder,
	Image,
	PointDescription,
	PointInfo,
	PointInfoContext,
	TreeItemType,
    Measure,
} from '@/types';
import { isFolder } from '@/guards';
import { constants } from '@/shared/constants';
import { distanceOnSphere } from '@/shared/common';
import { t } from '@/lang/ru';

import { entityActions } from './actions/entity';
import { relateActions } from './actions/relate';
import { importActions } from './actions/import';
import { backupActions } from './actions/backup';
import { initActions } from './actions/init';
import { dbActions } from './actions/db';
import { uiActions } from './actions/ui';
import { serviceActions } from './actions/service';

import { treeGetters } from './getters/tree';
import { entityGetters } from './getters/entity';
import { relateGetters } from './getters/relate';

export const useMainStore = defineStore('main', {
	state: (): IMainState => ({
		activeMapIndex: 0,
		backup: true,
		busyCount: 0,
		center: {
			latitude: Number(constants.map.initial.latitude),
			longitude: Number(constants.map.initial.longitude),
		},
		centerMarkerShow: true,
		colortheme: 'brown',
		commonMarkersShow: false,
		commonPlaces: {},
		commonPlacesOnPageCount: constants.commonplacesonpagecount,
		commonPlacesPage: 1,
		commonPlacesShow: false,
		commonRoutes: {},
		commonRoutesOnPageCount: constants.commonroutesonpagecount,
		commonRoutesPage: 1,
		commonRoutesShow: false,
		currentDrag: null,
		currentPlaceId: null,
		currentPointId: null,
		currentRouteId: null,
		first: true,
		folders: {},
		idleTime: 0,
		lang: 'ru',
		langs: [{
			value: 'ru',
			title: 'Русский',
		}, {
			value: 'en',
			title: 'English',
		}],
		measure: {
			type: 'measure',
			points: [],
			choosing: null,
			show: false,
		},
		messages: [],
		messagesMouseOver: false,
		messagesInterval: null,
		messagesTimeout: null,
		mode: 'normal',
		newEntityPointId: null,
		markersShow: true,
		places: {},
		placesShow: { show: true, first: true },
		points: {},
		range: null,
		rangeShow: false,
		ready: false,
		refreshing: false,
		routes: {},
		routesShow: { show: false, first: true },
		saved: true,
		selectedToExport: {
			places: [],
			routes: [],
		},
		serverConfig: null,
		stateBackups: [],
		stateBackupsIndex: -1,
		t: t,
		temps: {},
		tempsShow: { show: false, first: true },
		treeParams: {
			places: {
				context: 'places',
				open: false,
			},
			routes: {
				context: 'routes',
				open: false,
			},
		},
		user: null,
		users: {},
		zoom: Number(constants.map.initial.zoom),
	}),

	persist: {
		serializer: {
			deserialize: (value) => JSON.parse(value),
			serialize: (state) => {
				const skipKeys = new Set([
					'busyCount',
					'currentDrag',
					'idleTime',
					'messages',
					'messagesInterval',
					'messagesMouseOver',
					'messagesTimeout',
					'refreshing',
					't',
				]);
				return JSON.stringify(state, (key, value) => {
					if (skipKeys.has(key)) return undefined;
					if (value && typeof value === 'object') {
						if (value.raw) return undefined;
					}
					return value;
				});
			},
		},
	},

	actions: {
		...entityActions,
		...relateActions,
		...importActions,
		...backupActions,
		...initActions,
		...dbActions,
		...uiActions,
		...serviceActions,

		swapSrts(payload: any[]) {
			payload[0].srt = [ payload[1].srt, payload[1].srt = payload[0].srt ][0];
		},
	},

	getters: {
		...treeGetters,
		...entityGetters,
		...relateGetters,

		colorthemes() {
			return [
				{ value: 'brown',        title: this.t.i.inputs.colorthemeBrown },
				{ value: 'blue',         title: this.t.i.inputs.colorthemeBlue },
				{ value: 'pink',         title: this.t.i.inputs.colorthemePink },
				{ value: 'green',        title: this.t.i.inputs.colorthemeGreen },
				{ value: 'pink-light',   title: this.t.i.inputs.colorthemePinkLight },
				{ value: 'blue-light',   title: this.t.i.inputs.colorthemeBlueLight },
				{ value: 'purple-light', title: this.t.i.inputs.colorthemePurpleLight },
				{ value: 'green-light',  title: this.t.i.inputs.colorthemeGreenLight },
			];
		},
		descriptionFields() {
			const descriptionFields = {
				name               : this.t.i.captions.name,
				description        : this.t.i.captions.description,
				link               : this.t.i.captions.link,
				latitude           : this.t.i.captions.latitude,
				longitude          : this.t.i.captions.longitude,
				coordsMinSec       : this.t.i.captions.coordsMinSec,
				altitudecapability : this.t.i.captions.altitudecapability,
				range              : this.t.i.captions.range,
				time               : this.t.i.captions.time,
				srt                : this.t.i.captions.srt,
				common             : this.t.i.captions.common,
				images             : this.t.i.captions.images,
				point              : this.t.i.captions.point,
				home               : this.t.i.inputs.checkboxHome,
			}
			return descriptionFields;
		},
		busy() {
			return this.busyCount > 0;
		},
		distanceBetweenPoints() {
			return (ids: string[], where?: string): number => {
				if (ids.length < 2) return 0;
				const points = where ? this[where] : this.getAllPoints;
				let distance = 0;
				for (let i = 1; i < ids.length; i++) {
					if (!points[ids[i]]) continue;
					distance += distanceOnSphere(
						points[ids[i]].latitude,
						points[ids[i]].longitude,
						points[ids[i - 1]].latitude,
						points[ids[i - 1]].longitude,
						constants.earthRadius
					);
				}
				return distance;
			}
		},
		getNeighboursSrts() {
			return (id: string, type: TreeItemType, top?: boolean) => {
				const collection: Record<string, Folder | Place | Route> = this[type + 's'];
				const item = collection[id];
				if (!item) return null;
				const parentId = isFolder(item) ? item.parent : item.folderid;
				const neighboursSrts: number[] = [];
				for (const key in collection) {
					const i = collection[key];
					const iParentId = isFolder(i) ? i.parent : i.folderid;
					if (iParentId === parentId) neighboursSrts.push(i.srt);
				}
				neighboursSrts.sort((a, b) => a - b);
				const currentIndex = neighboursSrts.indexOf(item.srt);
				const previous = neighboursSrts[currentIndex - 1];
				const next = neighboursSrts[currentIndex + 1];
				let newSrt: number;
				if (top) {
					newSrt = !previous
						? item.srt / 2
						: (item.srt - previous) / 2 + previous;
				} else {
					newSrt = !next ? item.srt + 1 : (next - item.srt) / 2 + item.srt;
				}
				return {
					all: neighboursSrts,
					own: item.srt,
					previous,
					next,
					new: newSrt,
				};
			}
		},
		getPointCoords() {
			return (pointId: string): number[] => {
				const point = this.getPointById(pointId);
				return [ point.latitude, point.longitude ];
			}
		},
		getPointsCoords() {
			return (pointIdsArray: string[]): number[][] => {
				const coords: number[][] = [];
				let point: Point;
				for (const id of pointIdsArray) {
					point = this.getPointById(id);
					coords.push([ point.latitude, point.longitude ]);
				}
				return coords;
			}
		},
		getDistance() {
			return (
				pointIds: string[] = this.measure.points.map((p: PointDescription) => p.id),
				takeIntoAltitudeDeltas: boolean = false,
			): number => {
				if (pointIds.length < 2) return 0;
				let distance = 0;
				for (let i = 0; i < pointIds.length - 1; i++) {
					const p1 = this.getPointById(pointIds[i]);
					const p2 = this.getPointById(pointIds[i + 1]);
					if (p1 && p2) {
						const d = distanceOnSphere(
							p1.latitude, p1.longitude,
							p2.latitude, p2.longitude,
							constants.earthRadius
						);
						if (
							takeIntoAltitudeDeltas &&
							p1.altitude !== null &&
							p2.altitude !== null
						) {
							const deltaH = Math.abs(p1.altitude - p2.altitude) / 1000;
							distance += Math.sqrt(Math.pow(d, 2) + Math.pow(deltaH, 2));
						} else {
							distance += d;
						}
					}
				}
				return distance;
			}
		},
		getPointInfo() {
			return (
				{ id, context, entity }:
				{
					id: string | null;
					context?: PointInfoContext;
					entity?: Place | Route | Measure;
				}
			): PointInfo | null => {
				if (!id) return null;

				const point = this.points[id] || this.temps[id];
				if (!point) return null;

				const of: Place | Route | Measure | undefined = entity || undefined;
				let name: string | undefined = undefined;
				let description: string | undefined = undefined;
				let index: number | undefined = undefined;
				let key: string | undefined = undefined;

				if (of?.type === 'place') {
					name = of.name;
					description = of.description;
				} else if (of?.type === 'route' || of?.type === 'measure') {
					const pts = of.points;
					const len = pts.length;
					for (let i = 0; i < len; i++) {
						if (pts[i].id === id) {
							index = i;
							key = `${id}-${i}`;
							name = pts[i].name;
							description = pts[i].description;
							break;
						}
					}
				}
				return {
					point,
					of,
					context,
					name,
					description,
					index,
					key,
				};
			};
		},
		getAllImages() {
			const allImages: Record<string, Image> = {};
			for (const id in this.places) {
				if (Object.hasOwn(this.places, id)) {
					const images = this.places[id].images;
					if (images) {
						for (const imgId in images) {
							if (Object.hasOwn(images, imgId)) {
								allImages[imgId] = images[imgId];
							}
						}
					}
				}
			}
			for (const id in this.routes) {
				if (Object.hasOwn(this.routes, id)) {
					const images = this.routes[id].images;
					if (images) {
						for (const imgId in images) {
							if (Object.hasOwn(images, imgId)) {
								allImages[imgId] = images[imgId];
							}
						}
					}
				}
			}
			return allImages; // Yes, I don't have a girlfriend at the moment.
		},
	},
});
