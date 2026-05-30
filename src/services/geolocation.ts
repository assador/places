import { ref } from 'vue';
import { useMainStore } from '@/stores/main';
import { Mode } from '@/types';

export function useGeolocation() {
	const coords = ref(null);
	const error = ref(null);
	const isLoading = ref(false);
	const mainStore = useMainStore();

	const getLocation = () => {
		if (!navigator.geolocation) {
			error.value = mainStore.t.m.service.geoLocation.notSupported;
			return Promise.reject(error.value);
		}
		isLoading.value = true;
		error.value = null;
		const options = {
			enableHighAccuracy: true,
			timeout: 10000,
			maximumAge: 0,
		};
		return new Promise<GeolocationCoordinates>((resolve, reject) => {
			navigator.geolocation.getCurrentPosition(
				position => {
					coords.value = position.coords;
					isLoading.value = false;
					resolve(coords.value);
				},
				err => {
					isLoading.value = false;
					switch (err.code) {
						case err.PERMISSION_DENIED:
							error.value = mainStore.t.m.service.geoLocation.permissionDenied;
							break;
						case err.POSITION_UNAVAILABLE:
							error.value = mainStore.t.m.service.geoLocation.positionUnavailable;
							break;
						case err.TIMEOUT:
							error.value = mainStore.t.m.service.geoLocation.timeout;
							break;
						default:
							error.value = mainStore.t.m.service.geoLocation.error;
					}
					reject(error.value);
				},
				options,
			);
		});
	};
	const centerTo = async (location?: GeolocationCoordinates) => {
		let center = location;
		if (!center) {
			try { center = await getLocation(); }
			catch (error) { mainStore.setMessage(error, 5); }
		}
		mainStore.center = {
			latitude: center.latitude,
			longitude: center.longitude,
		};
	}
	const upsertEntity = async (mode: Mode) => {
		try {
			const location = await getLocation();
			if (mode === 'normal') {
				if (mainStore.currentPlace) {
					mainStore.upsertPlaceFollowing(mainStore.currentPlace, {
						props: {
							latitude: location.latitude,
							longitude: location.longitude,
						},
					});
				} else {
					mainStore.upsertPlace({
						props: {
							latitude: location.latitude,
							longitude: location.longitude,
						},
					});
				}
			} else if (mode === 'routes' && mainStore.currentRoute) {
				mainStore.upsertPoint({
					where: mainStore.points,
					whom: mainStore.currentRoute,
					props: {
						latitude: location.latitude,
						longitude: location.longitude,
					},
				});
			} else if (mode === 'measure') {
				const point = mainStore.upsertPoint({
					where: mainStore.temps,
					props: {
						latitude: location.latitude,
						longitude: location.longitude,
					},
				});
				mainStore.addPointToPoints({
					point: point,
					entity: mainStore.measure,
				});
			}
			centerTo(location);
		}
		catch (error) { mainStore.setMessage(error, 5); return error; }
	}
	return { coords, error, isLoading, getLocation, centerTo, upsertEntity };
}
