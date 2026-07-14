import api from '@/api';
import { useMainStore } from '@/stores/main';
import { EntityCollection } from '@/types';

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

const uploadImages = async (): Promise<void> => {
	const mainStore = useMainStore();
	if (!mainStore.user) return;
	if (mainStore.user.testaccount) {
		mainStore.setMessage(mainStore.t.m.popup.taNotAllowFileUploads, 3);
		return;
	}
	const pendingImages = mainStore.getPendingImagesPackage;
	if (!pendingImages.length) return;

	const data = new FormData();
	pendingImages.forEach(p => data.append(p.id, p.raw));
	data.append('userid', mainStore.user.id);

	try {
		const response = await api.post('upload.php', data, { silent: true });
		if (!isValidUploadResponse(response.data)) {
			throw new Error(
				typeof response.data === 'string'
					? response.data
					: mainStore.t.m.errors.server.invalidResponse,
			);
		}
		const [ errorCodes, uploadedFiles ] = response.data;

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
							`${mainStore.t.m.popup.filesTooLarge}
${mainStore.t.m.errors.server.maxLimit}`, 3
						);
					}
					break;
				}
			}
		});
		if (uploadedFiles.length) {
			const serverFilesMap = Object.fromEntries(
				uploadedFiles.map(f => [ f.id, f.file ]),
			);
			pendingImages.forEach(img => {
				const { entityid, entitytype, id } = img;
				const serverFile = serverFilesMap[id];
				if (!serverFile) return;
				const entity =
					entitytype === 'place' ? mainStore.places[entityid] :
					entitytype === 'route' ? mainStore.routes[entityid] :
					null
				;
				if (entity && entity.images && entity.images[id]) {
					entity.images[id].file = serverFile;
					delete entity.images[id].new;
					delete entity.images[id].raw;
					delete entity.images[id].preview;
				}
			});
		}
	} catch (error) {
		mainStore.setMessage(`${mainStore.t.m.popup.filesUploadError} ${error}`);
		throw error;
	}
};

export const saveEnities = async (payload: EntityCollection): Promise<void> => {
	const mainStore = useMainStore();
	if (!payload) payload = mainStore.getAllModifiedPackage;
	try {
		if (!mainStore.user) return;
		await uploadImages();
		if (!mainStore.user.testaccount) {
			await api.post(
				`set_entities.php`,
				{
					data: payload,
					userid: localStorage.getItem('places-useruuid'),
					sessionid: localStorage.getItem('places-session'),
				},
				{ silent: true },
			);
		}
		mainStore.savedToDB(payload);
	} catch (error) {
		console.error(error);
		mainStore.setMessage(mainStore.t.m.popup.cannotSendDataToDb);
	}
};
export const saveHome = async (id: string): Promise<void> => {
	const mainStore = useMainStore();
	if (!mainStore.user || mainStore.user.testaccount) return;
	try {
		await api.post(
			'set_home.php',
			{ id: localStorage.getItem('places-useruuid'), data: id },
			{ silent: true },
		);
	} catch (error) {
		console.error(error);
		mainStore.setMessage(mainStore.t.m.popup.cannotSendDataToDb);
	}
};
export const saveAll = async (): Promise<void> => {
	const mainStore = useMainStore();
	if (!mainStore.user) return;
	saveEnities(mainStore.getAllModifiedPackage);
	if (mainStore.user.homeplace) saveHome(mainStore.user.homeplace);
}
