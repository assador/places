import { computed } from 'vue';
import { StoreMainStateRefs } from '@/stores/types';
import { initFolderFactory } from '@/stores/actions/entity';
import _ from 'lodash';
import { Folder } from '@/types';

export function useGettersTree(
	state: StoreMainStateRefs,
) {
	const allChildrenMap = computed((): Record<string, Record<string, Folder>> => {
		const map: Record<string, Record<string, Folder>> = {};
		for (const id in state.folders.value) {
			if (!Object.hasOwn(state.folders.value, id)) continue;
			const pId = String(state.folders.value[id].parent || null);
			if (!state.folders.value[id].deleted) {
				if (!map[pId]) map[pId] = {};
				map[pId][id] = state.folders.value[id];
			}
		}
		return map;
	});
	const folderChildren = (fId: string | null, context?: string): Record<string, Folder> => {
		const children = allChildrenMap.value[String(fId || null)] || {};
		if (!context) return children;
		return Object.fromEntries(
			Object.values(children)
				.filter((folder: Folder) => folder.context === context)
				.map((folder: Folder) => [folder.id, folder])
		);
	};
	const buildTree = (context: 'places' | 'routes'): Folder => {
		const createFolder = initFolderFactory(() => state.user.value?.id ?? null);
		const prepareNode = (parent: Folder): Folder => {
			const folder = parent.id ? state.folders.value[parent.id] : parent;
			if (!folder) return parent;
			if (!Object.prototype.hasOwnProperty.call(folder, 'children')) {
				Object.defineProperty(folder, 'children', {
					get: () => {
						const kids = folderChildren(folder.id, context);
						return _.sortBy(Object.values(kids).map(prepareNode), 'srt');
					},
					enumerable: false,
					configurable: true,
				});
			}
			return folder;
		};
		const tree = createFolder({
			virtual: true,
			context: context,
			id: null,
			parent: null,
			srt: context === 'places' ? 20 : 10,
			name: state.t.value.i.captions[context],
			userid: state.user.value?.id ?? null,
		});
		Object.defineProperty(tree, 'open', {
			get: () => state.treeParams.value[context].open,
			set: (val) => { state.treeParams.value[context].open = val; },
			enumerable: false,
			configurable: true,
		});
		return prepareNode(tree);
	};
	const treePlaces = computed((): Folder => {
		return buildTree('places');
	});
	const treeRoutes = computed((): Folder => {
		return buildTree('routes');
	});
	const trees = computed((): { places: Folder, routes: Folder } => {
		return {
			places: treePlaces.value,
			routes: treeRoutes.value,
		};
	});
	const getAncestors = (id: string): Set<string> => {
			const collection = new Set<string>();
			let parentId = state.folders.value[id]?.parent;
			while (parentId) {
				collection.add(parentId);
				parentId = state.folders.value[parentId]?.parent;
			}
			return collection;
	};
	const getDescendants = (id: string | null, type: 'folders' | 'places' | 'routes'): Set<string> => {
		const folderIds = new Set<string>();
		const collectFolderIds = (currentId: string | null) => {
			for (const id in state.folders.value) {
				if (!Object.hasOwn(state.folders.value, id)) continue;
				if (state.folders.value[id].parent === currentId) {
					folderIds.add(id);
					collectFolderIds(id);
				}
			}
		};
		collectFolderIds(id);
		if (type === 'folders') {
			return folderIds;
		}
		const collection = new Set<string>();
		const targetCollection = state[type];
		for (const itemId in targetCollection.value) {
			const itemFolderId = targetCollection.value[itemId].folderid;
			if (itemFolderId && (itemFolderId === id || folderIds.has(itemFolderId))) {
				collection.add(itemId);
			}
		}
		return collection;
	};

	return {
		allChildrenMap,
		trees,
		getAncestors,
		getDescendants,
	};
}
