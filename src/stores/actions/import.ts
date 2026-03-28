import {
	Point,
	Place,
	Folder,
	EntityCollection,
} from '@/types';
import {
	entitiesFromJSON,
	entitiesFromGPX,
} from '@/shared';

export const importActions = {
	existingFolder(folder: Partial<Folder>, idMap: Map<string, string>) {
		return Object.values<Folder>(this.folders).find(f => {
			if (f.id === folder.id) return true;
			const mapped = folder.parent ? idMap.get(folder.parent) : null;
			return f.name === folder.name && f.parent === mapped;
		});
	},
	existingPoint(point: Partial<Point>) {
		return Object.values<Point>(this.points).find(pt =>
			pt.id === point.id ||
			pt.latitude === point.latitude &&
			pt.longitude === point.longitude
		);
	},
	existingPlace(place: Partial<Place>, pointsRecord: Record<string, Point>) {
		return Object.values<Place>(this.places).find(pl => {
			const pt = this.points[pl.pointid];
			const ptImported = pointsRecord[place.pointid];
			return (
				pl.id === place.id ||
				pl.name === place.name &&
				pt.latitude.toFixed(4) === ptImported.latitude.toFixed(4) &&
				pt.longitude.toFixed(4) === ptImported.longitude.toFixed(4)
			);
		});
	},
	getImportedPoint(
		pointsRecord: Record<string, Point>,
		pointId: string,
	): {
		point: Point | null,
		modify: boolean,
		existing: Point | null,
	} {
		let point: Point | null = null;
		let modify = false;
		const existing = this.points[pointId] ?? null;
		if (pointsRecord[pointId]) {
			point = pointsRecord[pointId];
			modify = true;
		} else if (existing) point = this.points[pointId];
		return { point: point, modify: modify, existing: existing };
	},
	addImportedFolders(
		foldersArray: Folder[],
		idMap: Map<string, string>,
	) {
		foldersArray.forEach(f => {
			const existing = this.existingFolder(f, idMap);
			const newFolderId = existing ? existing.id : crypto.randomUUID();
			idMap.set(f.id, newFolderId);
		});
		foldersArray.forEach(f => {
			const newFolderId = idMap.get(f.id) ?? crypto.randomUUID();
			const newParentId = f.parent ? idMap.get(f.parent) : null;
			this.upsertFolder({
				object: this.folders[newFolderId],
				mode: this.folders[newFolderId] ? 'change' : 'new',
				props: { ...f, id: newFolderId, parent: newParentId },
				silent: true,
			});
		});
	},
	addImportedPlaces(
		placesArray: Place[],
		idMap: Map<string, string>,
		pointsRecord: Record<string, Point>,
	) {
		placesArray.forEach(p => {
			const existing = this.existingPlace(p, pointsRecord);
			if (existing) return; // Then, if we want, we can do something with what we find. Like change it, ask questions, tell all the people to fuck off.
			const pointGot = this.getImportedPoint(pointsRecord, p.pointid);
			if (!pointGot.point) return;
			if (pointGot.modify) {
				if (pointGot.existing) {
					this.upsertPoint({
						object: pointGot.existing,
						mode: 'change',
						props: { ...pointGot.point },
						silent: true,
					});
				} else {
					const newPointId = this.resolveId(
						pointGot.point.id,
						idMap,
						this.points,
					);
					this.upsertPoint({
						props: { ...pointGot.point, id: newPointId },
						silent: true,
					});
				}
			}
			const newPlaceId = this.resolveId(
				p.id,
				idMap,
				this.places,
			);
			this.upsertPlace({
				props: {
					...p,
					id: newPlaceId,
					pointid: idMap.get(p.pointid) || p.pointid,
					folderid: p.folderid ? idMap.get(p.folderid) : null,
				},
				silent: true,
			});
		});
	},
	addImported(
		{ mime, text }: { mime: string; text: string; }
	) {
		this.setBusy(true);
		let entities: EntityCollection = {};
		const idMap = new Map<string, string>();

		switch (mime) {
			case 'application/json' :
				entities = entitiesFromJSON(text);
				break;
			case 'application/gpx+xml' :
				entities = entitiesFromGPX(text);
				break;
		}
		if (!entities) {
			this.setMessage(this.t.m.popup.parsingImportError);
			return;
		}

		if (entities.folders) this.addImportedFolders(entities.folders, idMap);
		this.inspectOrphanFolders();

		if (!entities.points) {
			this.saved = false;
			this.backupState();
			return;
		}
		const points = entities.points.reduce((pts: Record<string, Point>, pt: Point) => {
			pts[pt.id] = pt;
			return pts;
		}, {});

		if (entities.places) this.addImportedPlaces(entities.places, idMap, points);
		this.inspectOrphanPlaces();

		this.saved = false;
		this.backupState();
		this.setBusy(false);
	},
};
