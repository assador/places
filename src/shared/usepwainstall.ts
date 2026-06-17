import { ref, onMounted, onUnmounted } from 'vue';

export function usePWAInstall() {
	const installEvent = ref<any>(null);
	const installPWAEnabled = ref(false);
	const handler = (e: Event) => {
		e.preventDefault();
		installEvent.value = e;
		installPWAEnabled.value = true;
	};
	onMounted(() => {
		window.addEventListener('beforeinstallprompt', handler);
	});
	onUnmounted(() => {
		window.removeEventListener('beforeinstallprompt', handler);
	});
	const installPWA = async () => {
		if (!installEvent.value) return;
		installEvent.value.prompt();
		await installEvent.value.userChoice;
		installEvent.value = null;
		installPWAEnabled.value = false;
	};
	return { installPWAEnabled, installPWA };
}
