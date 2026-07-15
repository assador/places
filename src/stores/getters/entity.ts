import { computed } from 'vue';
import {
	StoreMainStateRefs,
} from '@/stores/types';
import {
	Entity,
	EntityCollection,
	FatPointDescription,
	FatPointsPack,
	Folder,
	Identifiable,
	Place,
	Point,
	PointDescription,
	RawImage,
	Route,
} from '@/types';

export function useGettersEntity(
	state: StoreMainStateRefs,
) {

	const pointDescriptionIds = (points: PointDescription[]): Set<string> => {
		const set = new Set<string>();
		points.forEach(pd => set.add(pd.id));
		return set;
	};
	const measurePointIds = computed((): Set<string> => {
		const set = new Set<string>();
		state.measure.value.points.forEach((pd: PointDescription) => set.add(pd.id));
		return set;
	});
	const notMeasureTempPointIds = computed((): Set<string> => {
		const set = new Set<string>();
		for (const id in state.temps.value) if (!measurePointIds.value.has(id)) set.add(id);
		return set;
	});
	const homePlace = computed((): Place | null => {
		const homeplaceId = state.user.value?.homeplace;
		return homeplaceId ? (state.places.value[homeplaceId] ?? null) : null;
	});
	const currentPoint = computed((): Point | null => {
		return (
			state.currentPointId.value ? (
				state.points.value[state.currentPointId.value]
					?? state.temps.value[state.currentPointId.value]
					?? null
			) : null
		);
	});
	const currentPlace = computed((): Place | null => {
		return (
			state.currentPlaceId.value
				? (state.places.value[state.currentPlaceId.value] ?? null)
				: null
		);
	});
	const currentRoute = computed((): Route | null => {
		return (
			state.currentRouteId.value
				? (state.routes.value[state.currentRouteId.value] ?? null)
				: null
		);
	});
	const getAllPoints = computed((): Record<string, Point> => {
		return { ...state.points.value, ...state.temps.value };
	});
	const getParentFolder = (id: string): Folder | undefined => {
		const f = state.folders.value[id];
		const p = state.places.value[id];
		const r = state.routes.value[id];
		const pId = f ? f.parent : p ? p.folderid : r?.folderid;
		if (!pId) return undefined;
		return state.folders.value[pId];
	};
	const getPointById = (id: string): Point | undefined => {
		if (Object.hasOwn(state.points.value, id)) return state.points.value[id];
		if (Object.hasOwn(state.temps.value, id)) return state.temps.value[id];
		return undefined;
	};
	const getPlaceById = (id: string): Place | undefined => {
		if (Object.hasOwn(state.places.value, id)) return state.places.value[id];
		if (Object.hasOwn(state.commonPlaces.value, id)) return state.commonPlaces.value[id];
		return undefined;
	};
	const getRouteById = (id: string): Route | undefined => {
		if (Object.hasOwn(state.routes.value, id)) return state.routes.value[id];
		if (Object.hasOwn(state.commonRoutes.value, id)) return state.commonRoutes.value[id];
		return undefined;
	};
	const matchEntityFields = <E extends object>(
		{ entity, where }: { entity: E & Identifiable; where: Partial<E>; }
	): boolean => {
		for (const key in where) {
			if (Object.hasOwn(where, key)) {
				if (entity[key as keyof E] !== where[key as keyof E]) return false;
			}
		}
		return true;
	};
	const getEntityIn = <E extends object>(
		{ dict, where }: { dict: Record<string, E & Identifiable>; where: Partial<E>; }
	): E & Identifiable | undefined => {
		if ('id' in where && typeof where.id === 'string') {
			const entity = dict[where.id];
			if (entity && matchEntityFields({ entity, where })) return entity;
			return undefined;
		}
		for (const id in dict) {
			if (!Object.hasOwn(dict, id)) continue;
			const entity = dict[id];
			if (matchEntityFields({ entity, where })) return entity;
		}
		return undefined;
	};
	const routePoints = (route: Route): Point[] => {
		if (route === null) return [];
		const points: Point[] = [];
		for (const p of route.points) {
			if (p.id in state.points.value) points.push(state.points.value[p.id]);
				else if (p.id in state.temps.value) points.push(state.temps.value[p.id]);
		}
		return points;
	};
	const collectModified = <T extends Entity>(c: Record<string, T>): T[] => {
		const modified: T[] = [];
		for (const id in c) {
			if (
				(c[id].added || c[id].updated || c[id].deleted) &&
				!(c[id].added && c[id].deleted)
			) {
				modified.push(c[id]);
			}
		}
		return modified;
	};
	const getPendingImagesPackage = computed((): RawImage[] => {
		const pending: RawImage[] = [];
		collectModified(state.places.value).forEach((place: Place) => {
			if (place.images) {
				for (const id in place.images) {
					if (place.images[id].new && place.images[id].raw) {
						pending.push({
							id: id,
							raw: place.images[id].raw,
							entityid: place.id,
							entitytype: 'place',
						});
					}
				}
			}
		});
		collectModified(state.routes.value).forEach((route: Route) => {
			if (route.images) {
				for (const id in route.images) {
					if (route.images[id].new && route.images[id].raw) {
						pending.push({
							id: id,
							raw: route.images[id].raw,
							entityid: route.id,
							entitytype: 'route',
						});
					}
				}
			}
		});
		return pending;
	});
	const getAllModifiedPackage = computed((): EntityCollection => {
		return {
			points: collectModified(state.points.value),
			places: collectModified(state.places.value),
			routes: collectModified(state.routes.value),
			folders: collectModified(state.folders.value),
		};
	});
	const measureFatPoints = computed((): FatPointDescription[] => {
		return state.measure.value.points.map((p: PointDescription, index: number) => {
			return {
				...p,
				name: p.name ?? String(index + 1),
				index: index,
				key: `measure-${p.id}`,
				point: state.temps.value[p.id] || state.points.value[p.id],
			};
		});
	});
	const notMeasureFatTemps = computed((): FatPointsPack => {
		const points: FatPointDescription[] = [];
		let index = 0;
		for (const id of notMeasureTempPointIds.value) {
			points.push({
				id: id,
				name: String(index + 1),
				index: index,
				key: `temp-${id}`,
				point: state.temps.value[id],
			});
			index++;
		}
		return {
			id: 'tempspack',
			type: 'pointspack',
			points: points,
			choosing: points.find(p => p.point.id === state.currentPointId.value)?.index ?? null,
			show: false,
			name: state.t.value.i.captions.pointsTemporary,
		};
	});

	return {
		matchEntityFields,
		pointDescriptionIds,
		measurePointIds,
		notMeasureTempPointIds,
		homePlace,
		currentPoint,
		currentPlace,
		currentRoute,
		getParentFolder,
		getEntityIn,
		getAllPoints,
		getPointById,
		getPlaceById,
		getRouteById,
		routePoints,
		collectModified,
		getPendingImagesPackage,
		getAllModifiedPackage,
		measureFatPoints,
		notMeasureFatTemps,
	};
};
