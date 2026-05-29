import { ref } from 'vue';
import { useMainStore } from '@/stores/main';

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
	return { coords, error, isLoading, getLocation };
}
