import { Folder } from '@/types';
import _ from 'lodash';

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
	buildTree() {
		return (context: 'places' | 'routes') => {
			const { folders, folderChildren, createFolder, treeParams, t } = this;
			const prepareNode = (folder: Folder): Folder => {
				const reactiveFolder = folder.id ? folders[folder.id] : folder;
				if (!reactiveFolder) return folder;
				if (!Object.prototype.hasOwnProperty.call(reactiveFolder, 'children')) {
					Object.defineProperty(reactiveFolder, 'children', {
						get: () => {
							const kids = folderChildren(reactiveFolder.id, context);
							return _.sortBy(Object.values(kids).map(prepareNode), 'srt');
						},
						enumerable: false,
						configurable: true,
					});
				}
				return reactiveFolder;
			};
			const tree = createFolder({
				virtual: true,
				context: context,
				id: null,
				parent: null,
				srt: context === 'places' ? 20 : 10,
				name: t.i.captions[context],
			});
			Object.defineProperty(tree, 'open', {
				get: () => treeParams[context].open,
				set: (val) => { treeParams[context].open = val; },
				enumerable: false,
				configurable: true,
			});
			return prepareNode(tree);
		};
	},
	treePlaces() {
		return this.buildTree('places');
	},
	treeRoutes() {
		return this.buildTree('routes');
	},
	trees() {
		return {
			places: this.treePlaces,
			routes: this.treeRoutes,
		};
	},
};
