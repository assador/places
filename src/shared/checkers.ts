import { findInTree } from '@/shared/searchers';
import { Folder } from '@/stores/types';

export const isPlainTreeCorrect = (plain: Record<string, Folder>): boolean => {
	for (const id in plain) {
		const parent = plain[plain[id].parent];
		if (parent) {
			if (parent.id === id) {return false;}
			// Check if the parent is your own child:
			let parentId = parent.id;
			while (parentId) {
				if (!plain[parentId]) break;
				if (plain[parentId].parent === id) {
					return false;
				}
				parentId = plain[parentId].parent;
			}
		}
	}
	return true;
}
export const isParentInTree = (
	tree: Record<string, any>,
	childrenKey: string,
	parentId: string,
	childId: string,
	parent?: Record<string, any>
): boolean => {
	if (!parent) {
		parent = findInTree(tree, childrenKey, 'id', parentId) || tree;
	}
	if (parent![childrenKey] && parent![childrenKey][childId]) {
		return true;
	}
	for (const id in parent![childrenKey]) {
		if (isParentInTree(
			tree,
			childrenKey,
			parentId,
			childId,
			parent![childrenKey][id]
		)) {
			return true;
		}
	}
	return false;
};
