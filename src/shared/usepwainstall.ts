import { ref, onMounted, onUnmounted } from 'vue';

interface BeforeInstallPromptEvent extends Event {
	readonly platforms: string[];
	readonly userChoice: Promise<{
		outcome: 'accepted' | 'dismissed';
		platform: string;
	}>;
	prompt(): Promise<void>;
}

export function usePWAInstall() {
	const installEvent = ref<BeforeInstallPromptEvent | null>(null);
	const installPWAEnabled = ref(false);
	const handler = (e: Event) => {
		e.preventDefault();
		installEvent.value = e as BeforeInstallPromptEvent;
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
		await installEvent.value.prompt();
		await installEvent.value.userChoice;
		installEvent.value = null;
		installPWAEnabled.value = false;
	};
	return { installPWAEnabled, installPWA };
}
