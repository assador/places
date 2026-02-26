import { findInTree } from '@/shared/searchers';
import { Folder } from '@/types';

/**
 * Checks if descendantId is a descendant of ancestorId
 * via parentKey in relativesList.
 */
export const isDescendantOf = ({
	descendantId,
	ancestorId,
	parentKey = 'parent',
	relativesList,
}: {
	descendantId: string;
	ancestorId: string;
	parentKey?: string;
	relativesList: Record<string, any>;
}): boolean => {
	if (!descendantId || !ancestorId || descendantId === ancestorId) return false;
	let current = relativesList[descendantId];
	while (current && current[parentKey]) {
		if (current[parentKey] === ancestorId) return true;
		current = relativesList[current[parentKey]];
	}
	return false;
}

/**
 * Checks if ancestorId is a ancestor of descendantId
 * via parentKey in relativesList.
 */
export const isAncestorOf = ({
	descendantId,
	ancestorId,
	parentKey = 'parent',
	relativesList,
}: {
	descendantId: string;
	ancestorId: string;
	parentKey?: string;
	relativesList: Record<string, any>;
}): boolean => isDescendantOf({ descendantId, ancestorId, relativesList, parentKey });

/**
 * Recursively checks if childId is a descendant of parentId.
 * Starts from a provided parent object or finds it by parentId, 
 * then searches downwards through the nested childrenKey.
 * @param tree - The root tree object.
 * @param childrenKey - Key used to access the children collection.
 * @param parentId - ID of the ancestor to search from.
 * @param childId - ID of the descendant to look for.
 * @param parent - (Optional) Pre-resolved parent object to start the search from.
 */
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
