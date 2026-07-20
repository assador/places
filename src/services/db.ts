import {
	EntityCollection,
	EntityPartial,
	Identifiable,
	ImageableEntity,
} from '@/types';
import {
	isEntityCollectionKey,
	isImage,
	isImageableCollectionKey,
	isImageableContext,
	isImageableEntity,
} from '@/guards';

import api from '@/api';
import { bufferInstance } from '@/services/localforage';
import { useMainStore } from '@/stores/main';

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

					const img = pi.entity.images[pi.id];
					delete img.new;
					delete img.raw;
					delete img.preview;

					const image: unknown = { ...img, ...serverFile };
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
	if (!mainStore.user || mainStore.user.testaccount) return;

	if (mainStore.offlineMode || !mainStore.online) {
		await syncBuffer(payload || mainStore.getAllModifiedPackage);
		mainStore.savedToDB(payload || mainStore.getAllModifiedPackage);
		return;
	}

	let dataToSend: EntityCollection = payload || {};
	if (payload) {
		dataToSend = payload;
	} else {
		const storeModifiedEntities: EntityCollection =
			mainStore.getAllModifiedPackage
		;
		const bufferedEntities: EntityCollection | null =
			await bufferInstance.getItem<EntityCollection>('entities')
		;
		if (!bufferedEntities) {
			dataToSend = storeModifiedEntities;
		} else {
			dataToSend = {};
			const keys = new Set([
				...Object.keys(storeModifiedEntities),
				...Object.keys(bufferedEntities),
			]);
			keys.forEach(key => {
				if (!isEntityCollectionKey(key)) return;

				const storeArray = storeModifiedEntities[key] || [];
				const bufferArray = bufferedEntities[key] || [];
				const mergedMap = new Map<string, EntityPartial>();

				bufferArray.forEach(item => {
					if (item.id) mergedMap.set(item.id, item);
				});
				storeArray.forEach(item => {
					if (item.id) mergedMap.set(item.id, item);
				});
				dataToSend[key] = Array.from(mergedMap.values()) as any;
			});
		}
	}

	let hasChanges = false;
	for (const key in dataToSend) {
		if (isEntityCollectionKey(key) && dataToSend[key] && dataToSend[key].length) {
			hasChanges = true;
		}
	}
	if (!hasChanges) return;

	try {
		await uploadImages(dataToSend);
		await api.post(
			`set_entities.php`,
			{
				data: dataToSend,
				userid: localStorage.getItem('places-useruuid'),
				sessionid: localStorage.getItem('places-session'),
			},
			{ silent: true },
		);
		const bufferedHome = await bufferInstance.getItem<string>('home');
		if (bufferedHome || mainStore.user.homeplace) {
			await api.post(
				'set_home.php',
				{
					id: localStorage.getItem('places-useruuid'),
					data: bufferedHome || mainStore.user.homeplace,
				},
				{ silent: true },
			);
		}
	} catch (error) {
		console.error(error);
		mainStore.setMessage(mainStore.t.m.popup.cannotSendDataToDb);
		throw error;
	}
	await bufferInstance.removeItem('entities');
	await bufferInstance.removeItem('home');

	mainStore.savedToDB(dataToSend);
	mainStore.setMessage(mainStore.t.m.popup.savedToDb);
};

export const syncBuffer = async (payload?: EntityCollection): Promise<void> => {
	const mainStore = useMainStore();

	try {
		if (!payload) payload = mainStore.getAllModifiedPackage;

		let hasChanges = false;
		for (const key in payload) {
			if (isEntityCollectionKey(key) && payload[key] && payload[key].length) {
				hasChanges = true;
			}
		}
		if (!hasChanges) return;

		const entities = await bufferInstance.getItem<EntityCollection>('entities') || {};
		const rawPayload: EntityCollection = JSON.parse(JSON.stringify(payload));

		for (const key in payload) {
			if (isImageableCollectionKey(key) && payload[key]) {
				const sourceArray = payload[key]!;
				const targetArray = rawPayload[key];

				sourceArray.forEach((entity, index) => {
					if (
						!isImageableEntity(entity) ||
						!entity.images ||
						!targetArray?.[index]
					) {
						return;
					}
					const clonedEntity = targetArray[index] as ImageableEntity;
					if (!clonedEntity.images) clonedEntity.images = {};

					for (const imgId in entity.images) {
						if (!Object.hasOwn(entity.images, imgId)) continue;
						const sourceImg = entity.images[imgId];

						if (sourceImg?.raw instanceof File) {
							if (!clonedEntity.images[imgId]) {
								clonedEntity.images[imgId] = { ...sourceImg };
							}
							clonedEntity.images[imgId].raw = sourceImg.raw;
						}
					}
				});
			}
		}
		for (const key in rawPayload) {
			if (isEntityCollectionKey(key) && rawPayload[key]?.length) {
				if (!entities[key]) entities[key] = [];
				const targetArray = entities[key] as Identifiable[];
				const sourceArray = rawPayload[key] as Identifiable[];

				sourceArray.forEach(newEntity => {
					if (!newEntity.id) return;
					const idx = targetArray.findIndex(e => e.id === newEntity.id);
					if (idx !== -1) {
						targetArray[idx] = newEntity;
					} else {
						targetArray.push(newEntity);
					}
				});
			}
		}
		await bufferInstance.setItem('entities', entities);

		if (mainStore.user?.homeplace) {
			await bufferInstance.setItem('home', mainStore.user.homeplace);
		}
	} catch (error) {
		console.error(error);
		mainStore.setMessage(mainStore.t.m.popup.cannotSendDataToDb);
	}
};
