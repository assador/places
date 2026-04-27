import { Folder } from '@/types';

export const treeGetters = {
	allChildrenMap() {
		const map: Record<string, Record<string, Folder>> = {};
		for (const id in this.folders) {
			const pId = this.folders[id].parent || null;
			if (!map[pId]) map[pId] = {};
			if (!this.folders[id].deleted) map[pId][id] = this.folders[id];
		}
		return map;
	},
	folderChildren() {
		return (fId: string | null, context?: string) => {
			const children = this.allChildrenMap[String(fId || null)] || {};
			if (!context) return children;
			return Object.fromEntries(
				Object.values(children)
					.filter((folder: Folder) => folder.context === context)
					.map((folder: Folder) => [folder.id, folder])
			);
		};
	},
	treePlaces() {
		const tree: Folder = this.createFolder({
			virtual: true,
			context: 'places',
			id: null,
			parent: null,
			srt: 20,
			name: this.t.i.captions.places,
		});
		Object.defineProperty(tree, 'open', {
			get: () => this.treeParams.places.open,
			set: (val) => { this.treeParams.places.open = val; },
			enumerable: true,
			configurable: true,
		});
		Object.defineProperty(tree, 'children', {
			get: () => this.folderChildren(null, 'places'),
			enumerable: true,
			configurable: true,
		});
		return tree;
	},
	treeRoutes() {
		const tree: Folder = this.createFolder({
			virtual: true,
			context: 'routes',
			id: null,
			parent: null,
			srt: 10,
			name: this.t.i.captions.routes,
		});
		Object.defineProperty(tree, 'open', {
			get: () => this.treeParams.routes.open,
			set: (val) => { this.treeParams.routes.open = val; },
			enumerable: true,
			configurable: true,
		});
		Object.defineProperty(tree, 'children', {
			get: () => this.folderChildren(null, 'routes'),
			enumerable: true,
			configurable: true,
		});
		return tree;
	},
	trees() {
		return {
			places: this.treePlaces,
			routes: this.treeRoutes,
		};
	},
};
