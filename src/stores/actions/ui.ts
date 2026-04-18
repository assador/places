import {
	Place,
	Route,
	Folder,
	GeomarksState,
} from '@/types';
import { isFolder, isPlace, isRoute } from '@/guards';
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
	showHideGeomarks(payload: { object: Folder | Place | Route, show: GeomarksState }) {
		let visibility: number;
		const showHideSubGeomarks = (object: Folder | Place | Route, show: GeomarksState) => {
			switch (object.type) {
				case 'place': {
					object.geomark = Boolean(show);
					return;
				}
				case 'route': {
					object.geomarks = show;
					return;
				}
				case 'folder': {
					object.geomarks = show;
					for (const item of
						Object.values<Place | Route>({ ...this.places, ...this.routes })
							.filter((item: Place | Route) => item.folderid === object.id)
					) {
						if (isPlace(item)) item.geomark = Boolean(show);
						else if (
							show === GeomarksState.None ||
							show === GeomarksState.All
						) {
							item.geomarks = show;
						}
					}
					const ids = this.getChildIds(object.id);
					if (!ids.length) return;
					for (const id of ids) {
						showHideSubGeomarks(this.folders[id], show);
					}
					return;
				}
			}
		}
		const showHideParentGeomarks = (object: Folder | Place | Route) => {
			const objectParentId = (isFolder(object) ? object.parent : object.folderid);
			const neibours: (Folder | Place | Route)[] =
				Object.values({ ...this.folders, ...this.places, ...this.routes })
					.filter(
						(neibour: Place | Route | Folder) => {
							const neibourParentId =
								isFolder(neibour) ? neibour.parent : neibour.folderid
							;
							if (
								neibourParentId === objectParentId ||
								neibourParentId === null &&
								objectParentId === null
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
					visibility = !isPlace(neibours[i])
						? (neibours[i] as Folder | Route).geomarks
						: Number((neibours[i] as Place).geomark)
					;
					continue;
				}
				if (visibility != (isPlace(neibours[i])
					? (neibours[i] as Place).geomark
					: (neibours[i] as Folder | Route).geomarks
				)) {
					visibility = GeomarksState.Partial;
					break;
				}
			}
			const parent: Folder =
				this.folders[objectParentId] ??
				this.trees.places[objectParentId] ??
				this.trees.routes[objectParentId] ??
				null
			;
			if (parent === null) {
				if (
					isPlace(object) && object.folderid === null ||
					isFolder(object) && object.parent === null && object.context === 'places'
				) {
					this.trees.places.geomarks = visibility;
				}
				if (
					isRoute(object) && object.folderid === null ||
					isFolder(object) && object.parent === null && object.context === 'routes'
				) {
					this.trees.routes.geomarks = visibility;
				}
				return;
			}
			parent.geomarks = visibility;
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
