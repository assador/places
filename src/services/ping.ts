import api from '@/api';
import { watch } from 'vue';
import { useMainStore } from '@/stores/main';

class PingService {
	private store: ReturnType<typeof useMainStore> | null = null;
	private pingIntervalId: number | null = null;
	private isPinging = false;
	private intervalDuration = 7000;
	private pingUrl = 'ping.php';

	init() {
		this.store = useMainStore();
		watch(
			() => this.store?.offlineMode,
			(isOffline) => {
				if (isOffline) {
					this.stopPingLoop();
				} else {
					this.startPingLoop();
				}
			},
			{ immediate: true },
		);
	}
	private async checkServer(): Promise<boolean> {
		if (this.isPinging) return false;
		this.isPinging = true;

		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 3000);

			const response = await api.get(this.pingUrl, {
				signal: controller.signal,
				silent: true,
				headers: {
					'Cache-Control': 'no-cache, no-store, must-revalidate',
					'Pragma': 'no-cache',
					'Expires': '0',
				},
			});
			clearTimeout(timeoutId);
			return response.status >= 200 && response.status < 300;
		} catch {
			return false;
		} finally {
			this.isPinging = false;
		}
	}
	private startPingLoop() {
		if (this.pingIntervalId) return;

		this.executePing();

		this.pingIntervalId = window.setInterval(() => {
			this.executePing();
		}, this.intervalDuration);
	}
	private stopPingLoop() {
		if (this.pingIntervalId) {
			clearInterval(this.pingIntervalId);
			this.pingIntervalId = null;
		}
	}
	private async executePing() {
		if (!this.store) return;
		if (this.store.offlineMode) return;
		const isAlive = await this.checkServer();

		if (this.store.online !== isAlive) {
			this.store.online = isAlive;

			if (!isAlive) this.store.onServerOut();
			else this.store.onServerOn();
		}
	}
}

export function createPing() {
	return new PingService();
}
