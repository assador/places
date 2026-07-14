import { useMainStore } from '@/stores/main';
import { common } from '@/services/common';
import { calculatePopupPosition } from '@/shared/common';
import { Point, Place } from '@/types'

export const mapContextMenu = (e: PointerEvent, lat: number, lng: number) => {
	const mainStore = useMainStore();
	let entity: Point | Place | null;
	if (mainStore.mode === 'normal' && !e.shiftKey) {
		if (!mainStore.currentPlaceId) {
			entity = mainStore.upsertPlace({
				props: { latitude: lat, longitude: lng },
				center: false,
			});
		} else {
			entity = mainStore.upsertPlaceFollowing(
				mainStore.currentPlace,
				{ props: { latitude: lat, longitude: lng }, center: false },
			);
		}
		if (entity) {
			common.setPointInfo({ id: entity.pointid, entity });
			common.showPopup(calculatePopupPosition(e));
		}
	} else if (mainStore.mode === 'routes' && mainStore.currentRouteId) {
		const route = mainStore.currentRoute;
		if (route) {
			entity = mainStore.upsertPoint({
				props: { latitude: lat, longitude: lng },
				where: mainStore.points,
				whom: route,
			});
			if (entity) {
				common.setPointInfo({ id: entity.id, entity: route });
				common.showPopup(calculatePopupPosition(e));
			}
		}
	} else if (
	 	mainStore.mode === 'measure' ||
		mainStore.mode === 'normal' && e.shiftKey
	) {
		entity = mainStore.upsertPoint({
			props: { latitude: lat, longitude: lng },
			where: mainStore.temps,
		});
		if (mainStore.mode === 'measure' && entity) {
			mainStore.addPointToPoints({
				point: entity,
				entity: mainStore.measure,
			});
		}
	}
}
