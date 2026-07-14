import { StoreMain, ActionsImport } from '@/stores/types';
import { Point, EntityCollection } from '@/types';
import { entitiesFromJSON, entitiesFromGPX } from '@/shared/importexport';
import { isFolder, isPlace } from '@/guards';

export function useActionsImport(
	store: StoreMain,
): ActionsImport {

	const addImportedFolders = (
		foldersArray: unknown[],
		idMap: Map<string, string>,
	): void => {
		for (const f of foldersArray) {
			if (!isFolder(f) || !f.id) continue;

			const existing = store.folders.value[f.id];
			const targetId = existing ? existing.id! : f.id;
			idMap.set(f.id, targetId);

			let mappedParent: string | null = null;
			if (f.parent) mappedParent = idMap.get(f.parent) ?? f.parent;

			store.upsertFolder({
				object: existing,
				mode: existing ? 'change' : 'new',
				props: {
					...f,
					id: targetId,
					parent: mappedParent,
				},
				silent: true,
			});
		}
	};
	const addImportedPlaces = (
		placesArray: unknown[],
		idMap: Map<string, string>,
		pointsRecord: Record<string, Point>,
	): void => {
		for (const p of placesArray) {
			if (!isPlace(p) || !p.id) continue;

			const existing = store.places.value[p.id];

			const ptImported = pointsRecord[p.pointid];
			if (!ptImported) continue;
			const existingPoint = store.points.value[p.pointid];
			const pointId = existingPoint ? existingPoint.id : p.pointid;
			idMap.set(p.pointid, pointId);

			store.upsertPoint({
				object: existingPoint,
				mode: existingPoint ? 'change' : 'new',
				props: { ...ptImported, id: pointId },
				silent: true,
			});
			let mappedFolderId: string | null = null;
			if (p.folderid) mappedFolderId = idMap.get(p.folderid) ?? p.folderid;
			store.upsertPlace({
				object: existing,
				mode: existing ? 'change' : 'new',
				props: {
					...p,
					id: p.id,
					pointid: pointId,
					folderid: mappedFolderId,
				},
				silent: true,
			});
		}
	};
	const addImported = ({ mime, text }: { mime: string; text: string }): void => {
		store.setBusy(true);
		let entities: EntityCollection = {};
		const idMap = new Map<string, string>();

		switch (mime) {
			case 'application/json':
				entities = entitiesFromJSON(text);
				break;
			case 'application/gpx+xml':
				entities = entitiesFromGPX(text);
				break;
		}

		if (!entities) {
			store.setMessage(store.t.value.m.popup.parsingImportError);
			store.setBusy(false);
			return;
		}

		// Импортируем папки
		if (entities.folders) addImportedFolders(entities.folders, idMap);
		store.inspectOrphanFolders();

		if (!entities.points) {
			store.saved.value = false;
			store.backupState();
			store.setBusy(false);
			return;
		}

		// Индексируем входящие точки по их ID для быстрого O(1) доступа внутри addImportedPlaces
		const points: Record<string, Point> = {};
		for (const pt of entities.points) {
			if (pt && pt.id) {
				points[pt.id] = pt as Point;
			}
		}

		// Импортируем места
		if (entities.places) addImportedPlaces(entities.places, idMap, points);
		store.inspectOrphanPlaces();

		store.saved.value = false;
		store.backupState();
		store.setBusy(false);
	};
	const selectToExport = (type: 'places' | 'routes', id: string, checked: boolean): void => {
		const set = store.selectedToExport.value[type];
		if (checked) {
			if (!set.includes(id)) set.push(id);
		} else {
			const index = set.indexOf(id);
			if (index !== -1) set.splice(index, 1);
		}
	};
	const toggleToExport = (type: 'places' | 'routes', id: string): void => {
		const set = store.selectedToExport.value[type];
		const index = set.indexOf(id);
		if (index !== -1) set.splice(index, 1);
		else set.push(id);
	};

	return {
		addImported,
		selectToExport,
		toggleToExport,
	};
};
