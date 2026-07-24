import {
	BufferEntityCollection,
	BufferItems,
	EntityCollection,
	Identifiable,
	ImageableEntity,
} from '@/types';
import {
	isBufferEntityCollectionKey,
	isImage,
	isImageableContext,
	isImageableEntity,
} from '@/guards';

import api from '@/api';
import { buffer } from '@/services/buffer';
import { useMainStore } from '@/stores/main';
import { toRawDeep } from '@/shared/common';

interface UploadedFile {
	id: string;
	file: string;
	size: number;
	type: string;
}
const isValidUploadResponse = (data: unknown): data is [number[], UploadedFile[]] => {
	return (
		Array.isArray(data) &&
		data.length === 2 &&
		Array.isArray(data[0]) &&
		Array.isArray(data[1]) &&
		data[1].every(f =>
			f && typeof f === 'object' &&
			'id' in f && typeof f.id === 'string' &&
			'file' in f && typeof f.file === 'string' &&
			'size' in f && typeof f.size === 'number' &&
			'type' in f && typeof f.type === 'string'
		)
	);
};

const uploadImages = async (payload: EntityCollection): Promise<void> => {
	const mainStore = useMainStore();
	if (!mainStore.user) return;
	if (mainStore.user.testaccount) {
		mainStore.setMessage(mainStore.t.m.popup.taNotAllowFileUploads, 3);
		return;
	}
	const pendingImages: { id: string; raw: File; entity: Partial<ImageableEntity> }[] = [];

	const collectFromEntities = (entities: Partial<ImageableEntity>[] | undefined) => {
		entities?.forEach(entity => {
			if (!entity.images) return;

			for (const id in entity.images) {
				const img = entity.images[id];
				if (img.new && img.raw instanceof File) {
					pendingImages.push({ id, raw: img.raw, entity });
				}
			}
		});
	};

	collectFromEntities(payload.places);
	collectFromEntities(payload.routes);
	if (!pendingImages.length) return;

	try {
		const data = new FormData();
		pendingImages.forEach(p => data.append(p.id, p.raw));
		data.append('userid', mainStore.user.id);

		const response = await api.post('upload.php', data, { silent: true });
		if (!isValidUploadResponse(response.data)) {
			throw new Error(
				typeof response.data === 'string'
					? response.data
					: mainStore.t.m.errors.server.invalidResponse,
			);
		}
		const [errorCodes, uploadedFiles] = response.data;

		errorCodes.forEach((code: number) => {
			switch (code) {
				case 2:
					mainStore.setMessage(mainStore.t.m.popup.taNotAllowFileUploads, 3);
					break;
				case 3:
					mainStore.setMessage(mainStore.t.m.popup.filesNotImages, 3);
					break;
				case 4: {
					const limitBytes = Number(mainStore.serverConfig?.rights?.photosize);
					if (limitBytes > 0) {
						const maxMb = (limitBytes / 1048576).toFixed(3);
						mainStore.setMessage(
							`${mainStore.t.m.popup.filesTooLarge} ${maxMb} Mb.`, 3
						);
					} else {
						mainStore.setMessage(
							mainStore.t.m.popup.filesTooLarge + '\n' +
							mainStore.t.m.errors.server.maxLimit
						, 3);
					}
					break;
				}
			}
		});
		if (uploadedFiles.length) {
			const serverFilesMap = Object.fromEntries(
				uploadedFiles.map(f => [f.id, f]),
			);
			pendingImages.forEach(pi => {
				const serverFile = serverFilesMap[pi.id];
				if (!serverFile || !isImageableEntity(pi.entity)) return;

				if (pi.entity.id && pi.entity?.images?.[pi.id]) {
					const context = pi.entity.type + 's';
					if (!isImageableContext(context)) return;

					const entity = mainStore[context][pi.entity.id];
					if (!entity) return;

					const image = pi.entity.images[pi.id];
					delete image.new;
					delete image.raw;

					Object.assign(image, serverFile);
					if (!isImage(image)) return;

					mainStore.upsertImage({ image, entity });
				}
			});
		}
	} catch (error) {
		console.error(error);
		mainStore.setMessage(
			`${mainStore.t.m.popup.filesUploadError} ${error}`,
		);
		throw error;
	}
};

export const saveEntities = async (payload?: EntityCollection): Promise<void> => {
	const mainStore = useMainStore();
	if (mainStore.saving || !mainStore.user || mainStore.user.testaccount) return;
	mainStore.saving = true;

	try {
		let buffered = await syncBuffer(payload || mainStore.getAllModifiedPackage);

		if (mainStore.offlineMode || !mainStore.online) {
			mainStore.savedToDB(payload || mainStore.getAllModifiedPackage);
			return;
		}

		if (!buffered) buffered = await buffer.getOf(mainStore.user.id);

		if (buffered.entities && Object.keys(buffered.entities).length) {
			await uploadImages(buffered.entities);
			await api.post(
				`set_entities.php`,
				{
					data: buffered.entities,
					userid: localStorage.getItem('places-useruuid'),
					sessionid: localStorage.getItem('places-session'),
				},
				{ silent: true },
			);
		}
		if (buffered.home !== undefined) {
			await api.post(
				'set_home.php',
				{
					id: localStorage.getItem('places-useruuid'),
					data: buffered.home,
				},
				{ silent: true },
			);
		}
		await buffer.clearAllFor(mainStore.user.id);
		mainStore.savedToDB(payload || mainStore.getAllModifiedPackage);
		mainStore.setMessage(mainStore.t.m.popup.savedToDb, 3);
	} catch (error) {
		console.error(error);
		mainStore.setMessage(mainStore.t.m.popup.cannotSendDataToDb);
		throw error;
	} finally {
		mainStore.saving = false;
	}
};

let syncQueue = Promise.resolve<BufferItems | null>(null);

export const syncBuffer = (payload?: BufferEntityCollection): Promise<BufferItems | null> => {
	syncQueue = syncQueue
		.then(() => runSyncBuffer(payload))
		.catch((error) => {
			console.error(error);
			return null;
		})
	;
	return syncQueue;
};
export const runSyncBuffer = async (payload?: BufferEntityCollection): Promise<BufferItems | null> => {
	const mainStore = useMainStore();
	if (!mainStore.user || mainStore.user.testaccount) return null;

	if (!payload) payload = mainStore.getAllModifiedPackage;
	const buffered = await buffer.getOf(mainStore.user.id);
	const entities = buffered.entities || {};
	const home = mainStore.user.homeplace;

	let hasEntityChanges = false;
	for (const key in payload) {
		if (isBufferEntityCollectionKey(key) && payload[key]?.length) {
			hasEntityChanges = true;
			break;
		}
	}
	const hasHomeChanges = (buffered.home ?? null) !== mainStore.user.homeplace;
	if (!hasEntityChanges && !hasHomeChanges) return null;

	try {
		const rawPayload: BufferEntityCollection = structuredClone(toRawDeep(payload));
		for (const key in rawPayload) {
			if (!isBufferEntityCollectionKey(key) || !rawPayload[key]?.length) continue;

			if (!entities[key]) entities[key] = [];
			const targetArray = entities[key] as Identifiable[];
			const sourceArray = rawPayload[key] as Identifiable[];

			sourceArray.forEach(entity => {
				if (!entity.id) return;
				const idx = targetArray.findIndex(e => e.id === entity.id);
				if (idx !== -1) {
					targetArray[idx] = entity;
				} else {
					targetArray.push(entity);
				}
			});
		}
		await buffer.setFor(mainStore.user.id).entities(entities);
		await buffer.setFor(mainStore.user.id).home(home);
		return { entities, home };
	} catch (error) {
		console.error(error);
		mainStore.setMessage(mainStore.t.m.popup.cannotSendDataToDb);
		throw error;
	}
};
