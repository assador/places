import { computed } from 'vue';
import { StoreMainStateRefs, GettersEntity } from '@/stores/types';
import {
	Folder,
	Place,
	Route,
	Image,
	Measure,
	PointDescription,
	FatPointsPack,
	PointInfo,
	PointContext,
	PointInfoContext,
	TreeItemType,
} from '@/types';

// import { isFolder } from '@/guards';
import { constants } from '@/shared/constants';
import { distanceOnSphere } from '@/shared/common';

export function useGettersOther(
	state: StoreMainStateRefs,
	getters: GettersEntity,
) {
	const colorthemes = computed((): { value: string, title: string }[] => {
		return [
			{ value: 'brown',        title: state.t.value.i.inputs.colorthemeBrown },
			{ value: 'blue',         title: state.t.value.i.inputs.colorthemeBlue },
			{ value: 'pink',         title: state.t.value.i.inputs.colorthemePink },
			{ value: 'green',        title: state.t.value.i.inputs.colorthemeGreen },
			{ value: 'pink-light',   title: state.t.value.i.inputs.colorthemePinkLight },
			{ value: 'blue-light',   title: state.t.value.i.inputs.colorthemeBlueLight },
			{ value: 'purple-light', title: state.t.value.i.inputs.colorthemePurpleLight },
			{ value: 'green-light',  title: state.t.value.i.inputs.colorthemeGreenLight },
		];
	});
	const descriptionFields = computed((): Record<string, string> => {
		const descriptionFields = {
			name               : state.t.value.i.captions.name,
			description        : state.t.value.i.captions.description,
			link               : state.t.value.i.captions.link,
			latitude           : state.t.value.i.captions.latitude,
			longitude          : state.t.value.i.captions.longitude,
			coordsMinSec       : state.t.value.i.captions.coordsMinSec,
			altitudecapability : state.t.value.i.captions.altitudecapability,
			range              : state.t.value.i.captions.range,
			time               : state.t.value.i.captions.time,
			srt                : state.t.value.i.captions.srt,
			common             : state.t.value.i.captions.common,
			images             : state.t.value.i.captions.images,
			point              : state.t.value.i.captions.point,
			home               : state.t.value.i.inputs.checkboxHome,
		}
		return descriptionFields;
	});
	const busy = computed((): boolean => {
		return state.busyCount.value > 0;
	});
	const distanceBetweenPoints = (ids: string[], where?: PointContext): number => {
		if (ids.length < 2) return 0;
		const points = where ? state[where].value : getters.getAllPoints.value;
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
	};
	const getNeighbourIds = (
		id: string,
		type: 'folder' | 'place' | 'route',
	): string[] | undefined => {
		const typeDict = {
			folder: state.folders,
			place: state.places,
			route: state.routes,
		};
		const dict = typeDict[type].value;
		const item = dict[id];
		if (!item) return undefined;

		const isFolders = type === 'folder';
		const parentId =
			isFolders
				? (item as Folder).parent
				: (item as Place | Route).folderid
		;
		const neighbours: Record<string, number> = {};
		for (const key in dict) {
			if (!Object.hasOwn(dict, key)) continue;
			const neighbour = dict[key];
			const neighbourParentId =
				isFolders
					? (neighbour as Folder).parent
					: (neighbour as Place | Route).folderid
			;
			if (neighbourParentId === parentId) neighbours[String(neighbour.id)] = neighbour.srt;
		}
		return Object.keys(neighbours).sort((a, b) => neighbours[a] - neighbours[b]);
	};
	const getSrts = (
		id: string,
		type: TreeItemType,
	): {
		before: number;
		after: number;
		min: number;
		max: number;
		previous: number | undefined;
		next: number | undefined;
	} | undefined => {
		let before: number | undefined;
		let after: number | undefined;
		let previous: number | undefined = undefined;
		let next: number | undefined = undefined;
		const typeDict = {
			folder: state.folders,
			place: state.places,
			route: state.routes,
		};
		const dict = typeDict[type].value;
		const item = dict[id];
		if (!item) return undefined;
		const neighbourIds = getNeighbourIds(id, type);
		if (!neighbourIds) return undefined;
		const min = dict[neighbourIds[0]].srt;
		const max = dict[neighbourIds[neighbourIds.length - 1]].srt;
		const index = neighbourIds.indexOf(id);
		if (index === 0) {
			before = item.srt / 2;
		} else {
			previous = dict[neighbourIds[index - 1]].srt;
			before = (item.srt - previous) / 2 + previous;
		}
		if (index === neighbourIds.length - 1) {
			after = item.srt + 10;
		} else {
			next = dict[neighbourIds[index + 1]].srt;
			after = (next - item.srt) / 2 + item.srt;
		}
		return { before, after, min, max, previous, next };
	};
	const getPointCoords = (pointId: string): number[] | undefined => {
		const point = getters.getPointById(pointId);
		return point ? [ point.latitude, point.longitude ] : undefined;
	};
	const getPointsCoords = (pointIdsArray: string[]): number[][] => {
		const coords: number[][] = [];
		for (const id of pointIdsArray) {
			const point = getters.getPointById(id);
			if (point) coords.push([ point.latitude, point.longitude ]);
		}
		return coords;
	};
	const getDistance = (
		pointIds: string[] = state.measure.value.points.map((p: PointDescription) => p.id),
		takeIntoAltitudeDeltas: boolean = false,
	): number => {
		if (pointIds.length < 2) return 0;
		let distance = 0;
		for (let i = 0; i < pointIds.length - 1; i++) {
			const p1 = getters.getPointById(pointIds[i]);
			const p2 = getters.getPointById(pointIds[i + 1]);
			if (p1 && p2) {
				const d = distanceOnSphere(
					p1.latitude, p1.longitude,
					p2.latitude, p2.longitude,
					constants.earthRadius
				);
				if (
					p1.altitude &&
					p2.altitude &&
					takeIntoAltitudeDeltas
				) {
					const deltaH = Math.abs(p1.altitude - p2.altitude) / 1000;
					distance += Math.sqrt(Math.pow(d, 2) + Math.pow(deltaH, 2));
				} else {
					distance += d;
				}
			}
		}
		return distance;
	};
	const getPointInfo = (
		{ id, context, entity }:
		{
			id: string | null;
			context?: PointInfoContext;
			entity?: Place | Route | Measure | FatPointsPack;
		}
	): PointInfo | null => {
		if (!id) return null;

		const point = state.points.value[id] || state.temps.value[id];
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
			id,
			point,
			of,
			context,
			name,
			description,
			index,
			key,
		};
	};
	const getAllImages = computed((): Record<string, Image> => {
		const allImages: Record<string, Image> = {};
		for (const id in state.places.value) {
			if (Object.hasOwn(state.places.value, id)) {
				const images = state.places.value[id].images;
				if (images) {
					for (const imgId in images) {
						if (Object.hasOwn(images, imgId)) {
							allImages[imgId] = images[imgId];
						}
					}
				}
			}
		}
		for (const id in state.routes.value) {
			if (Object.hasOwn(state.routes.value, id)) {
				const images = state.routes.value[id].images;
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
	});

	return {
		colorthemes,
		descriptionFields,
		busy,
		distanceBetweenPoints,
		getNeighbourIds,
		getSrts,
		getPointCoords,
		getPointsCoords,
		getDistance,
		getPointInfo,
		getAllImages,
	};
}
