import localforage from 'localforage';
import { BufferItems, EntityCollection } from '@/types';

class BufferService {
	private buffer: LocalForage | null = null;

	init(): void {
		this.buffer = localforage.createInstance({
			driver: localforage.INDEXEDDB,
			name: 'PlacesApp',
			storeName: 'buffer',
		});
	}
	async getOf(uuid: string): Promise<BufferItems> {
		if (!this.buffer || !uuid) return {};
		return (await this.buffer.getItem<BufferItems>(uuid)) || {};
	}
	setFor(uuid: string) {
		return {
			entities: async (payload: EntityCollection): Promise<void> => {
				if (!this.buffer || !uuid) return;
				const current = await this.getOf(uuid);
				await this.buffer.setItem(uuid, { ...current, entities: payload });
			},
			home: async (payload: string | null): Promise<void> => {
				if (!this.buffer || !uuid) return;
				const current = await this.getOf(uuid);
				await this.buffer.setItem(uuid, { ...current, home: payload });
			},
		};
	}
	for(uuid: string) {
		return {
			clearEntities: async (): Promise<void> => {
				if (!this.buffer || !uuid) return;
				const current = await this.getOf(uuid);
				delete current.entities;
				await this.buffer.setItem(uuid, current);
			},
			clearHome: async (): Promise<void> => {
				if (!this.buffer || !uuid) return;
				const current = await this.getOf(uuid);
				delete current.home;
				await this.buffer.setItem(uuid, current);
			},
		};
	}
	async clearAllFor(uuid: string): Promise<void> {
		if (!this.buffer || !uuid) return;
		await this.buffer.removeItem(uuid);
	}
}

export const buffer = new BufferService();
