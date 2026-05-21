import { useMainStore } from '@/stores/main';

export const mapContextMenu = (e: PointerEvent, lat: number, lng: number) => {
	const mainStore = useMainStore();
	if (mainStore.mode === 'normal' && !e.shiftKey) {
		if (!mainStore.currentPlaceId) {
			mainStore.upsertPlace({
				props: { latitude: lat, longitude: lng },
				center: false,
			});
		} else {
			mainStore.upsertPlaceFollowing(
				mainStore.currentPlace,
				{ props: { latitude: lat, longitude: lng }, center: false },
			);
		}
	} else if (mainStore.mode === 'routes' && mainStore.currentRouteId) {
		mainStore.upsertPoint({
			props: { latitude: lat, longitude: lng },
			where: mainStore.points,
			whom: mainStore.currentRoute,
		});
	} else if (
	 	mainStore.mode === 'measure' ||
		mainStore.mode === 'normal' && e.shiftKey
	) {
		const temp = mainStore.upsertPoint({
			props: { latitude: lat, longitude: lng },
			where: mainStore.temps,
		});
		if (mainStore.mode === 'measure') {
			mainStore.addPointToPoints({
				point: temp,
				entity: mainStore.measure,
			});
		}
	}
}
