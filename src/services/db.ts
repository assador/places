import api from '@/api';
import { useMainStore } from '@/stores/main';
import { EntityCollection } from '@/types';

const uploadImages = async (): Promise<void> => {
	const mainStore = useMainStore();
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
		if (!response.data || !Array.isArray(response.data)) {
			throw new Error(typeof response.data === 'string'
				? response.data
				: mainStore.t.m.errors.server.invalidResponse
			);
		}

		const [ errorCodes, uploadedFiles ] = response.data;

		if (Array.isArray(errorCodes)) {
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
		}
		if (Array.isArray(uploadedFiles) &&uploadedFiles.length) {
			const serverFilesMap = Object.fromEntries(
				uploadedFiles.map((f: any) => [ f.id, f.file ]),
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
		const errorMessage = error.response?.data?.message || error.message || error;
		mainStore.setMessage(`${mainStore.t.m.popup.cannotSendDataToDb}: ${errorMessage}`);
	}
};
export const saveHome = async (id: string): Promise<void> => {
	const mainStore = useMainStore();
	if (mainStore.user.testaccount) return;
	try {
		await api.post(
			'set_home.php',
			{ id: localStorage.getItem('places-useruuid'), data: id },
			{ silent: true },
		);
	} catch (error) {
		mainStore.setMessage(`${mainStore.t.m.popup.cannotSendDataToDb}: ${error}`);
	}
};
export const saveAll = async (): Promise<void> => {
	const mainStore = useMainStore();
	saveEnities(mainStore.getAllModifiedPackage);
	saveHome(mainStore.user.homeplace);
}
