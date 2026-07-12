import { computed } from 'vue';
import { StoreMainStateRefs, GettersEntity } from '@/stores/types';
import { Folder, Place, Route, TreeEntityCollection } from '@/types';

export function useGettersRelate(
	state: StoreMainStateRefs,
	getters: GettersEntity,
) {
	const collectRecursive = (
		folderId: string | null,
		includeFolders = true,
	): TreeEntityCollection => {
		const result: TreeEntityCollection = {
			folders: {},
			places: {},
			routes: {},
		};
		if (folderId !== null && !state.folders.value[folderId]) return result;

		const placesMap: Record<string, Place[]> = {};
		const routesMap: Record<string, Route[]> = {};
		const childFoldersMap: Record<string, Folder[]> = {};

		for (const id in state.places.value) {
			if (!Object.hasOwn(state.places.value, id)) continue;
			const p = state.places.value[id];
			const key = p.folderid ?? 'null';
			if (!placesMap[key]) placesMap[key] = [];
			placesMap[key].push(p);
		}
		for (const id in state.routes.value) {
			if (!Object.hasOwn(state.routes.value, id)) continue;
			const r = state.routes.value[id];
			const key = r.folderid ?? 'null';
			if (!routesMap[key]) routesMap[key] = [];
			routesMap[key].push(r);
		}
		for (const id in state.folders.value) {
			if (!Object.hasOwn(state.folders.value, id)) continue;
			const f = state.folders.value[id];
			const key = f.parent ?? 'null';
			if (!childFoldersMap[key]) childFoldersMap[key] = [];
			childFoldersMap[key].push(f);
		}
		const collect = (currentId: string | null) => {
			const key = currentId ?? 'null';

			const childPlaces = placesMap[key] || [];
			for (const p of childPlaces) result.places[p.id] = p;

			const childRoutes = routesMap[key] || [];
			for (const r of childRoutes) result.routes[r.id] = r;

			const childFolders = childFoldersMap[key] || [];
			for (const f of childFolders) {
				if (includeFolders && f.id) result.folders[f.id] = f;
				collect(f.id);
			}
		};
		if (folderId !== null) {
			if (includeFolders) {
				const startFolder = state.folders.value[folderId];
				if (startFolder) result.folders[folderId] = startFolder;
			}
			collect(folderId);
		} else {
			collect(null);
		}
		return result;
	};
	const pointReferences = computed((): Map<string, Set<string>> => {
		const refs = new Map<string, Set<string>>();
		for (const id in state.places.value) {
			const place = state.places.value[id];
			if (!place.deleted && place.pointid) {
				const pid = place.pointid;
				let pointSet = refs.get(pid);
				if (!pointSet) {
					pointSet = new Set<string>();
					refs.set(pid, pointSet);
				}
				pointSet.add(id);
			}
		}
		for (const id in state.routes.value) {
			const route = state.routes.value[id];
			if (!route.deleted) {
				for (const pd of route.points) {
					let pointSet = refs.get(pd.id);
					if (!pointSet) {
						pointSet = new Set<string>();
						refs.set(pd.id, pointSet);
					}
					pointSet.add(id);
				}
			}
		}
		return refs;
	});
	const isPlacePoint = (id: string): boolean => {
		for (const placeId in state.places.value) {
			if (state.places.value[placeId].pointid === id) return true;
		}
		return false;
	};
	const isRoutePoint = (id: string, route: Route): boolean => {
		return getters.pointDescriptionIds(route.points).has(id);
	};
	const isMeasurePoint = (id: string): boolean => {
		return getters.measurePointIds.value.has(id);
	};

	return {
		collectRecursive,
		pointReferences,
		isPlacePoint,
		isRoutePoint,
		isMeasurePoint,
	};
}
