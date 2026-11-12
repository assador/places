import {
	BufferCollection,
	BufferEntityCollection,
	BufferItems,
	EntityCollection,
	Identifiable,
	ImageableEntity,
} from '@/types';
import {
	BufferSettingCollection,
	Setting,
	SettingCollection,
} from '@/types/settings';
import {
	isBufferCollectionKey,
	isBufferEntityCollectionKey,
	isBufferSettingCollectionKey,
	isImage,
	isImageableContext,
	isImageableEntity,
} from '@/guards';

import api from '@/api';
import { buffer } from '@/services/buffer';
import { useMainStore } from '@/stores/main';
import { toRawDeep } from '@/shared/common';
import { ennobleError } from '@/shared/response';

interface UploadedFile {
	id: string;
	file: string;
	size: number;
	type: string;
}

const uploadImages = async (payload: EntityCollection): Promise<void> => {
	const mainStore = useMainStore();
	if (!mainStore.user) return;
	if (mainStore.user.testaccount) {
		mainStore.setMessage(mainStore.t.m.popup.taNotAllowFileUploads, 3);
		return;
	}
	const userid = localStorage.getItem('places-useruuid');
	const sessionid = localStorage.getItem('places-session');
	if (!userid || !sessionid) return;

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

	const formData = new FormData();
	pendingImages.forEach(p => formData.append(p.id, p.raw));
	formData.append('userid', userid);
	formData.append('sessionid', sessionid);

	const [errorCodes, uploadedFiles] = await api.post('upload.php', formData, { silent: true });

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
			uploadedFiles.map((f: UploadedFile) => [f.id, f]),
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
};

export const saveEntities = async (payload?: EntityCollection): Promise<void> => {
	const mainStore = useMainStore();
	if (mainStore.saving || !mainStore.user || mainStore.user.testaccount) return;
	mainStore.saving = true;

	try {
		let buffered = await syncBuffer('entities');
		if (!payload) payload = mainStore.getAllModifiedPackage;

		if (mainStore.offlineMode || !mainStore.online) {
			mainStore.savedToDB('entities', payload);
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
			await buffer.for(mainStore.user.id).clearEntities();
		}
		if (buffered.home !== undefined) {
			await api.post(
				'set_home.php',
				{
					data: buffered.home,
					userid: localStorage.getItem('places-useruuid'),
					sessionid: localStorage.getItem('places-session'),
				},
				{ silent: true },
			);
			await buffer.for(mainStore.user.id).clearHome();
		}
		mainStore.savedToDB('entities', payload);
		mainStore.setMessage(mainStore.t.m.response.success.saved, 3);
	} catch (error) {
		mainStore.setMessage(ennobleError(error));
	} finally {
		mainStore.saving = false;
	}
};

const saveSettings = async (
	payload: SettingCollection | null,
	voc: boolean,
): Promise<void> => {
	const mainStore = useMainStore();
	if (mainStore.saving || !mainStore.user || mainStore.user.testaccount) return;
	mainStore.saving = true;

	try {
		let buffered = await syncBuffer('settings');
		if (!payload) payload = mainStore.getAllModifiedSettings;

		if (mainStore.offlineMode || !mainStore.online) {
			mainStore.savedToDB('settings', payload);
			return;
		}

		if (!buffered) buffered = await buffer.getOf(mainStore.user.id);

		if (buffered.settings && Object.keys(buffered.settings).length) {
			if (!voc && buffered.settings.user?.length) {
				const data: Partial<Setting>[] = [];
				for (const setting of buffered.settings.user) {
					data.push({
						id: setting.id,
						val: setting.val,
						valtype: setting.valtype,
						added: setting.added,
						updated: setting.updated,
						deleted: setting.deleted,
					});
				}
				await api.post(
					`set_settings_users.php`,
					{
						data: data,
						userid: localStorage.getItem('places-useruuid'),
						sessionid: localStorage.getItem('places-session'),
					},
					{ silent: true },
				);
			} else {
				await api.post(
					`set_settings_users_voc.php`,
					{
						data: buffered.settings,
						userid: localStorage.getItem('places-useruuid'),
						sessionid: localStorage.getItem('places-session'),
					},
					{ silent: true },
				);
			}
			await buffer.for(mainStore.user.id).clearSettings();
		}
		mainStore.savedToDB('settings', payload);
		mainStore.setMessage(mainStore.t.m.response.success.saved, 3);
	} catch (error) {
		mainStore.setMessage(ennobleError(error));
	} finally {
		mainStore.saving = false;
	}
};
export const saveSettingsUsers = (payload?: SettingCollection): void => {
	saveSettings(payload ?? null, false);
}
export const saveSettingsUsersVoc = (payload?: SettingCollection): void => {
	saveSettings(payload ?? null, true);
}

let syncQueue = Promise.resolve<BufferItems | null>(null);

export const updateInBuffer = (
	buf: BufferCollection,
	raw: BufferCollection,
): void => {
	for (const key in raw) {
		if (!isBufferCollectionKey(key) || !raw[key]?.length) continue;

		if (!buf[key]) buf[key] = [];
		const targetArray = buf[key] as Identifiable[];
		const sourceArray = raw[key] as Identifiable[];

		sourceArray.forEach(obj => {
			if (!obj.id) return;
			const idx = targetArray.findIndex(e => e.id === obj.id);
			if (idx !== -1) {
				targetArray[idx] = obj;
			} else {
				targetArray.push(obj);
			}
		});
	}
};

export const syncBuffer = (
	context?: 'entities' | 'settings'
): Promise<BufferItems | null> => {
	syncQueue = syncQueue
		.then(() => runSyncBuffer(context))
		.catch((error) => {
			console.error(error);
			return null;
		})
	;
	return syncQueue;
};

export const runSyncBuffer = async (
	context?: 'entities' | 'settings'
): Promise<BufferItems | null> => {
	const mainStore = useMainStore();
	if (!mainStore.user || mainStore.user.testaccount) return null;
	const buffered = await buffer.getOf(mainStore.user.id);
	const entities = buffered.entities || {};
	const settings = buffered.settings || {};
	let modifiedEntities: BufferEntityCollection = {};
	let modifiedSettings: BufferSettingCollection = {};
	let hasEntityChanges = false;
	let hasSettingChanges = false;

	if (!context || context === 'entities') {
		modifiedEntities = mainStore.getAllModifiedPackage;
		for (const key in modifiedEntities) {
			if (isBufferEntityCollectionKey(key) && modifiedEntities[key]?.length) {
				hasEntityChanges = true;
				break;
			}
		}
	}
	if (!context || context === 'settings') {
		modifiedSettings = mainStore.getAllModifiedSettings;
		for (const key in modifiedSettings) {
			if (isBufferSettingCollectionKey(key) && modifiedSettings[key]?.length) {
				hasSettingChanges = true;
				break;
			}
		}
	}
	if (!hasEntityChanges && !hasSettingChanges) return null;
	try {
		if (hasEntityChanges) {
			updateInBuffer(entities, structuredClone(toRawDeep(modifiedEntities)));
			await buffer.setFor(mainStore.user.id).entities(entities);
		}
		if (hasSettingChanges) {
			updateInBuffer(settings, structuredClone(toRawDeep(modifiedSettings)));
			await buffer.setFor(mainStore.user.id).settings(settings);
		}
		return { entities, settings };
	} catch (error) {
		mainStore.setMessage(mainStore.t.m.errors.other.cannotSendDataToDb);
		throw error;
	}
};
