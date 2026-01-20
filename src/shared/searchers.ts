export const findInTree = (
	tree: Record<string, any>,
	childrenKey: string,
	key: string,
	value: unknown
): Record<string, any> | null => {
	if (tree[key] === value) return tree;
	const children = tree[childrenKey];
	if (children) {
		for (const child of Object.values(children)) {
			const found = findInTree(child, childrenKey, key, value);
			if (found) return found;
		}
	}
	return null;
}
