import { ref } from 'vue';
import { useMainStore } from '@/stores/main';

export function useGeolocation() {
	const coords = ref<GeolocationCoordinates | null>(null);
	const error = ref<string | null>(null);
	const mainStore = useMainStore();

	const getLocation = () => {
		if (!navigator.geolocation) {
			error.value = mainStore.t.m.errors.geo.notSupported;
			return Promise.reject(error.value);
		}
		mainStore.setBusy(true);
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
					mainStore.setBusy(false);
					resolve(coords.value);
				},
				err => {
					mainStore.setBusy(false);
					const errorsMap: Record<number, string> = {
						[err.PERMISSION_DENIED]:
							mainStore.t.m.errors.geo.permissionDenied,
						[err.POSITION_UNAVAILABLE]:
							mainStore.t.m.errors.geo.positionUnavailable,
						[err.TIMEOUT]:
							mainStore.t.m.errors.geo.timeout,
					};
					error.value = errorsMap[err.code] || mainStore.t.m.errors.geo.error;
					reject(error.value);
				},
				options,
			);
		});
	};
	const centerTo = async (location?: GeolocationCoordinates) => {
		let center = location;
		if (!center) {
			try {
				center = await getLocation();
			} catch (error) {
				console.error(error);
				mainStore.setMessage(mainStore.t.m.errors.geo.error, 5);
				return;
			}
		}
		mainStore.center = {
			latitude: center.latitude,
			longitude: center.longitude,
		};
	}
	return { coords, error, getLocation, centerTo };
}
