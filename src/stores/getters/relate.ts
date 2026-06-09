import { Route } from '@/types';

export const relateGetters = {
	pointReferences() {
		const refs = new Map<string, Set<string>>();
		for (const id in this.places) {
			const place = this.places[id];
			if (!place.deleted) {
				const pid = place.pointid;
				let pointSet = refs.get(pid);
				if (!pointSet) {
					pointSet = new Set<string>();
					refs.set(pid, pointSet);
				}
				pointSet.add(id);
			}
		}
		for (const id in this.routes) {
			const route = this.routes[id];
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
	},
	isMeasurePoint() {
		return (id: string): boolean => {
			return this.measurePointIds.has(id);
		}
	},
	isRoutePoint() {
		return (id: string, route: Route): boolean => {
			return this.pointDescriptionIds(route.points).has(id);
		}
	},
	isPlacePoint() {
		return (id: string): boolean => {
			for (const placeId in this.places) {
				if (this.places[placeId].pointid === id) return true;
			}
			return false;
		}
	},
};
