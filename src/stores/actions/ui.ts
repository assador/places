import {
	Place,
	Route,
	Folder,
} from '@/types';
import { constants } from '@/shared/constants';
import { distanceOnSphere } from '@/shared/common';

export const uiActions = {
	setBusy(busy: boolean = true) {
		if (busy) this.busyCount++;
			else this.busyCount = Math.max(0, this.busyCount - 1);
	},
	changeLang(lang: string) {
		const getLang = () => import(`@/lang/${lang}.ts`);
		getLang().then(l => {
			this.lang = lang;
			this.t = l.getT();
			this.trees.places.name = this.t.i.captions.rootFolder;
		});
	},

// SEC Messages

	setMessage(
		message: string,
		secondsForAll: number = 0,
		secondsForOne: number = 0.5,
	) {
		if (!message) return;
		const messageIndex = this.messages.indexOf(message);
		if (messageIndex === -1) this.messages.push(message);
		clearInterval(this.messagesInterval);
		clearTimeout(this.messagesTimeout);
		if (!this.messagesMouseOver && secondsForAll) {
			this.messagesTimeout = setTimeout(() => {
				if (this.messages.length === 1) {
					this.clearMessages();
					return;
				}
				this.messagesInterval = setInterval(() => {
					if (this.messages.length > 1) {
						this.deleteMessage(0);
					} else {
						this.clearMessages();
					}
				}, secondsForOne * 1000);
			}, secondsForAll * 1000);
		}
	},
	deleteMessage(index: number) {
		if (index >= 0 && this.messages[index]) this.messages.splice(index, 1);
	},
	clearMessages(polyupasu: boolean = false) {
		clearInterval(this.messagesInterval);
		clearTimeout(this.messagesTimeout);
		if (polyupasu || !this.messagesMouseOver) this.messages = [];
	},

// SEC Tree

	folderOpenClose(
		{ folder, open, target }:
		{ folder?: Folder; open?: boolean; target?: any; }
	) {
		const targetOpen = typeof open !== 'undefined'
			? open : !folder.open
		;
		if (folder) {
			if (folder.virtual) {
				this.trees[folder.context].open = targetOpen;
			} else {
				this.folders[folder.id].open = targetOpen;
			}
		}
		if (target) {
			if (targetOpen) {
				target.classList.add('folder_open');
				target.classList.remove('folder_closed');
			} else {
				if (target.classList.contains('folder_open')) {
					target.classList.add('folder_closed');
					target.classList.remove('folder_open');
				} else {
					target.classList.add('folder_open');
					target.classList.remove('folder_closed');
				}
			}
		}
	},
	openTreeTo(object: Place | Route) {
		if (!object) return;
		const context = object.type === 'place' ? 'places' : 'routes';
		this.folderOpenClose({
			folder: this.trees[context],
			open: true,
		});
		let id = object.folderid;
		while (id) {
			const folder = this.folders[id];
			if (!folder) break;
			this.folderOpenClose({ folder, open: true });
			id = folder.parent;
		}
	},
	openTreeToCurrent(current: Place | Route) {
		if (!current || (current.common && current.userid !== this.user.id)) return;
		this.openTreeTo(current);
	},

// SEC Map

	centerPlacemarkShowHide(show? : boolean) {
		this.centerPlacemarkShow = show === undefined
			? !this.centerPlacemarkShow
			: show
		;
	},
	placemarksShowHide(show? : boolean) {
		this.placemarksShow = show === undefined
			? !this.placemarksShow
			: show
		;
	},
	commonPlacemarksShowHide(show? : boolean) {
		this.commonPlacemarksShow = show === undefined
			? !this.commonPlacemarksShow
			: show
		;
	},
	commonRoutesShowHide(show? : boolean) {
		this.commonRoutesShow = show === undefined
			? !this.commonRoutesShow
			: show
		;
	},
	showHideGeomarks(payload: Record<string, any>) {
		let visibility: number;
		const showHideSubGeomarks = (
			object: Place | Route | Folder,
			show: number | boolean
		) => {
			switch (object.type) {
				case 'place':
					object['geomark'] = Boolean(show);
					return;
				case 'route':
					object['geomarks'] = !show ? 0 : 1;
					return;
				case 'folder':
					object['geomarks'] = !show ? 0 : 1;
					for (const item of
						Object.values({ ...this.places, ...this.routes })
							.filter((item: Place | Route) => {
								if (
									item.folderid === object.id ||
									item.folderid === null &&
									!object['parent']
								) {
									return true;
								} else {
									return false;
								}
							})
					) {
						item[item['type'] !== 'place' ? 'geomarks' : 'geomark'] = show;
					}
					if (!object['children']) return;
					for (const folder of Object.values(object['children'])) {
						showHideSubGeomarks(folder as Folder, !show ? 0 : 1);
					}
					break;
			}
		}
		const showHideParentGeomarks = (object: Place | Route | Folder) => {
			const objectParentKey =
				Object.hasOwn(object, 'folderid') ? 'folderid' : 'parent'
			;
			const neibours =
				Object.values({ ...this.places, ...this.routes, ...this.folders })
					.filter(
						(neibour: Place | Route | Folder) => {
							const neibourParentKey =
								Object.hasOwn(neibour, 'folderid')
									? 'folderid' : 'parent'
							;
							if (
								neibour[neibourParentKey] === object[objectParentKey] ||
								neibour[neibourParentKey] === null &&
								object[objectParentKey] === null
							) {
								return true;
							} else {
								return false;
							}
						}
					) as Array<Place | Route | Folder>
			;
			for (let i = 0; i < neibours.length; i++) {
				if (i === 0) {
					visibility = (neibours[i]['geomark'] ?? neibours[i]['geomarks']);
					continue;
				}
				if (visibility != (neibours[i]['geomark'] ?? neibours[i]['geomarks'])) {
					visibility = 2;
					break;
				}
			}
			const parent: Folder =
				this.folders[object[objectParentKey]] ??
				this.trees.places[object[objectParentKey]] ??
				this.trees.routes[object[objectParentKey]] ??
				null
			;
			if (parent === null) {
				if (
					object['parent'] === null &&
					object['context'] === 'places'  ||
					object.type === 'place' &&
					object['folderid'] === null
				) {
					this.trees.places.geomarks = Number(visibility);
				}
				if (
					object['parent'] === null &&
					object['context'] === 'places'  ||
					object.type === 'place' &&
					object['folderid'] === null
				) {
					this.trees.routes.geomarks = Number(visibility);
				}
				return;
			}
			parent.geomarks = Number(visibility);
			showHideParentGeomarks(parent);
		}
		showHideSubGeomarks(payload.object, payload.show);
		showHideParentGeomarks(payload.object);
	},
	showInRange(range: number | null) {
		if (range <= 0 || range === null) {
			for (const id in this.places) this.places[id].show = true;
			return;
		}
		for (const id in this.places) {
			if (distanceOnSphere(
				this.points[this.places[id].pointid].latitude,
				this.points[this.places[id].pointid].longitude,
				this.points[this.currentPlace.pointid].latitude,
				this.points[this.currentPlace.pointid].longitude,
				constants.earthRadius
			) > range) {
				this.places[id].show = false;
			} else {
				this.places[id].show = true;
			}
		}
	},
	updateMap(payload: Record<string, any>) {
		if (typeof payload.latitude === 'number') {
			this.center.latitude = payload.latitude;
		}
		if (typeof payload.longitude === 'number') {
			this.center.longitude = payload.longitude;
		}
		if (typeof payload.zoom === 'number') {
			this.zoom = payload.zoom;
		}
	},
};
