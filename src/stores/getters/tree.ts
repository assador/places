import {
	Folder,
} from '@/types';
import { makeChildren } from '@/shared/converters';

export const treeGetters = {
	childrened() {
		const aliveFolders: Record<string, Folder> = {};
		for (const id in this.folders) {
			if (!this.folders[id].deleted) {
				aliveFolders[id] = this.folders[id];
			}
		}
		return makeChildren(aliveFolders);
	},
	treePlaces() {
		const tree: Folder = this.createFolder({
			virtual: true,
			context: 'places',
			id: null,
			parent: null,
			srt: 20,
			name: this.t.i.captions.places,
			children: {},
		});
		Object.defineProperty(tree, 'open', {
			get: () => this.treeParams.places.open,
			set: (val) => { this.treeParams.places.open = val; },
			enumerable: true,
			configurable: true,
		});
		for (const id in this.childrened) {
			if (
				!this.childrened[id].parent &&
				this.childrened[id].context === 'places'
			) {
				tree.children[id] = this.childrened[id];
			}
		}
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
			children: {},
		});
		Object.defineProperty(tree, 'open', {
			get: () => this.treeParams.routes.open,
			set: (val) => { this.treeParams.routes.open = val; },
			enumerable: true,
			configurable: true,
		});
		for (const id in this.childrened) {
			if (
				!this.childrened[id].parent &&
				this.childrened[id].context === 'routes'
			) {
				tree.children[id] = this.childrened[id];
			}
		}
		return tree;
	},
	trees() {
		return {
			places: this.treePlaces,
			routes: this.treeRoutes,
		};
	},
};
