import { EntityCollection, Folder, Point, Place, Route } from '@/types';

// SEC Export

const escapeXML = (str: string): string => {
	return str.replace(/[<>&"']/g, (match) => {
		const entities: Record<string, string> = {
			'<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;'
		};
		return entities[match];
	});
};
export const generateGPX = ({
	places,
	pointsDict,
}: {
	places: Record<string, Place>;
	pointsDict: Record<string, Point>;
}): string => {
	const header = [
		'<?xml version="1.0" encoding="utf-8" standalone="yes"?>',
		'<gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">',
	].join('');
	const wpts = Object.values(places).map(p => {
		const wp = pointsDict[p.pointid];
		if (!wp) return '';
		let node = `<wpt lat="${wp.latitude}" lon="${wp.longitude}">`;
		if (wp.altitude) node += `<ele>${wp.altitude}</ele>`;
		if (p.name) node += `<name>${escapeXML(p.name)}</name>`;
		if (p.description) node += `<desc>${escapeXML(p.description)}</desc>`;
		if (p.link) node += `<link href="${escapeXML(p.link)}"></link>`;
		if (p.time) node += `<time>${p.time}</time>`;
		node += '</wpt>';
		return node;
	}).join('');
	return `${header}${wpts}</gpx>`;
};
export const generateJSON = ({
	places,
	pointsDict,
	foldersDict,
}: {
	places: Record<string, Place>;
	pointsDict: Record<string, Point>;
	foldersDict: Record<string, Folder>;
}): string => {

	const pointsSet = new Set<string>();
	const exportFoldersDict: Record<string, any> = {};

	const addFolderWithParents = (folderId: string) => {
		let currentId = folderId;
		while (currentId && foldersDict[currentId]) {
			if (exportFoldersDict[currentId]) break;
			const f = foldersDict[currentId];
			const {
				type,
				show,
				added,
				deleted,
				updated,
				geomarks,
				open,
				...cleanFolder
			} = f as any;
			exportFoldersDict[currentId] = cleanFolder;
			currentId = f.parent as string;
		}
	};
	const placesArray = Object.values(places).map((p) => {
		const {
			type,
			show,
			added,
			deleted,
			updated,
			geomark,
			images,
			...cleanPlace
		} = p as any;
		if (p.pointid && pointsDict[p.pointid]) pointsSet.add(p.pointid);
		if (p.folderid) addFolderWithParents(p.folderid);
		return cleanPlace;
	});
	const pointsArray = Array.from(pointsSet).map((id) => {
		const {
			type,
			show,
			added,
			deleted,
			updated,
			...cleanPoint
		} = pointsDict[id] as any;
		return cleanPoint;
	});
	const foldersArray = Object.values(exportFoldersDict);

	return JSON.stringify({
		places: placesArray,
		points: pointsArray,
		folders: foldersArray,
	}, null, 2);
};

// SEC Import

export const entitiesFromJSON = (text: string): EntityCollection | null => {
	try {
		const entities: EntityCollection = JSON.parse(text);
		return entities;
	} catch (e) {
		console.error(e);
		return null;
	}
}
export const entitiesFromGPX = (text: string): EntityCollection | null => {
	try {
		const folderId = crypto.randomUUID();
		const entities: EntityCollection = {
			points: [],
			places: [],
			routes: [],
			folders: [{
				id: folderId,
				parent: null,
				name: new Date().toUTCString(),
			}],
		};
		const parser = new DOMParser();
		const xml = parser.parseFromString(text, 'application/xml');

		if (xml.getElementsByTagName('parsererror').length) return null;

		for (const wpt of Array.from(xml.getElementsByTagName('wpt'))) {
			const pointId = crypto.randomUUID();
			const placeId = crypto.randomUUID();
			const ele = wpt.getElementsByTagName('ele')[0]?.textContent;
			const time = wpt.getElementsByTagName('time')[0]?.textContent;
			const name = wpt.getElementsByTagName('name')[0]?.textContent;
			const desc = wpt.getElementsByTagName('desc')[0]?.textContent;
			const href = wpt.getElementsByTagName('link')[0]?.getAttribute('href');

			const point: Partial<Point> = {
				id: pointId,
				latitude: parseFloat(wpt.getAttribute('lat') || '0'),
				longitude: parseFloat(wpt.getAttribute('lon') || '0'),
				altitude: ele ? parseFloat(ele) : null,
				time: time || undefined,
			};
			entities.points.push(point);

			const place: Partial<Place> = {
				id: placeId,
				pointid: pointId,
				folderid: folderId,
				name: name || '',
				description: desc || '',
				link: href || '',
			};
			entities.places.push(place);
		}
		for (const rte of Array.from(xml.getElementsByTagName('rte'))) {
			const route: Partial<Route> = {
				name: rte.getElementsByTagName('name')[0]?.textContent || '',
				points: [],
			};
			for (const pt of Array.from(rte.getElementsByTagName('rtept'))) {
				const pointId = crypto.randomUUID();
				entities.points.push({
					id: pointId,
					latitude: parseFloat(pt.getAttribute('lat') || '0'),
					longitude: parseFloat(pt.getAttribute('lon') || '0'),
				});
				route.points.push({
					id: pointId,
					name: pt.getElementsByTagName('name')[0]?.textContent || '',
				});
			}
			entities.routes.push(route);
		}
		return entities;
	} catch (e) {
		console.error(e);
		return null;
	}
}
