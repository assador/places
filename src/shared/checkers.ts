import { isRecord } from '@/guards';

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
	descendantId: string | null;
	ancestorId: string | null;
	parentKey?: string;
	relativesList: Record<string, unknown>;
}): boolean => {
	if (!descendantId || !ancestorId || descendantId === ancestorId) return false;
	let current = relativesList[descendantId];
	while (isRecord(current)) {
		const parentId = current[parentKey];
		if (parentId === ancestorId) return true;
		if (typeof parentId !== 'string') break;
		current = relativesList[parentId];
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
	descendantId: string | null;
	ancestorId: string | null;
	parentKey?: string;
	relativesList: Record<string, unknown>;
}): boolean => isDescendantOf({ descendantId, ancestorId, relativesList, parentKey });
