import { computed } from 'vue';
import { StoreMainStateRefs } from '@/stores/types';
import { initFolderFactory } from '@/stores/actions/entity';
import _ from 'lodash';
import { Folder, FolderContext } from '@/types';

export function useGettersTree(
	state: StoreMainStateRefs,
) {
	const allChildrenMap = (context: FolderContext): Record<string, Record<string, Folder>> => {
		const folders = state.treeParams.value[context].folders;
		const map: Record<string, Record<string, Folder>> = {};
		for (const id in folders) {
			if (!Object.hasOwn(folders, id)) continue;
			const pId = String(folders[id].parent || null);
			if (!folders[id].deleted) {
				if (!map[pId]) map[pId] = {};
				map[pId][id] = folders[id];
			}
		}
		return map;
	};
	const folderChildren = (fId: string | null, context: FolderContext): Record<string, Folder> => {
		const children = allChildrenMap(context)[String(fId || null)] || {};
		if (!context) return children;
		return Object.fromEntries(
			Object.values(children)
				.filter((folder: Folder) => folder.context === context)
				.map((folder: Folder) => [folder.id, folder])
		);
	};
	const buildTree = (context: FolderContext): Folder | undefined => {
		const folders = state.treeParams.value[context].folders;
		if (!folders) return;
		const createFolder = initFolderFactory(() => state.user.value?.id ?? null);
		const prepareNode = (parent: Folder): Folder => {
			const folder = parent.id ? folders[parent.id] : parent;
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
	const treePlaces = computed((): Folder | undefined => {
		return buildTree('places');
	});
	const treeRoutes = computed((): Folder | undefined => {
		return buildTree('routes');
	});
	const treeSettings = computed((): Folder | undefined => {
		return buildTree('settings');
	});
	const trees = computed(() => {
		const result = {} as {
			readonly places: Folder;
			readonly routes: Folder;
			readonly settings: Folder;
		};
		Object.defineProperties(result, {
			places: {
				get: () => treePlaces.value,
				enumerable: true,
			},
			routes: {
				get: () => treeRoutes.value,
				enumerable: true,
			},
			settings: {
				get: () => treeSettings.value,
				enumerable: true,
			},
		});
		return result;
	});
	const getAncestors = (
		id: string,
		context: FolderContext,
	): Set<string> => {
		const collection = new Set<string>();
		const folders = state.treeParams.value[context].folders;
		if (!folders) return collection;
		let parentId = folders[id]?.parent;
		while (parentId) {
			collection.add(parentId);
			parentId = folders[parentId]?.parent;
		}
		return collection;
	};
	const getDescendants = (
		id: string | null,
		context: 'folders' | FolderContext,
	): Set<string> => {
		const folderIds = new Set<string>();
		const folders = state.treeParams.value[context].folders;
		const collectFolderIds = (currentId: string | null) => {
			for (const fId in folders) {
				if (!Object.hasOwn(folders, fId)) continue;
				if (
					!folderIds.has(fId) &&
					folders[fId].parent === currentId
				) {
					folderIds.add(fId);
					collectFolderIds(fId);
				}
			}
		};
		collectFolderIds(id);
		if (context === 'folders') {
			return folderIds;
		}
		const collection = new Set<string>();
		const source =
			context === 'settings'
				? state[context].value.user
				: state[context].value
		;
		for (const itemId in source) {
			const itemFolderId = source[itemId].folderid;
			if (
				itemFolderId === id ||
				itemFolderId && folderIds.has(itemFolderId)
			) {
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
