import { tree } from './_tree';
import { treeSorted } from './_tree_sorted';
import { findInTree, sortObjects } from '@/shared/common';

const folder = {
	id: '2jmi6ciMRxs0pSVUSUBxwdROjAfeWBcf',
	parent: 'HDvAVlozgwYEbIJVgvZE7JQhYQM5Oc1E',
	name: 'Хибины',
	description: '',
	srt: 3,
	geomarks: 1,
	userid: 'yJ02ELehJphCRMpYoOfXsHyK3vY6oGbd',
	type: 'folder',
	added: false,
	deleted: false,
	updated: false,
	opened: false,
	builded: true,
};

describe('Common shared functions', () => {
	it('finds an object in the object tree by property value', () => {
		expect(findInTree(tree, 'children', 'name', 'Хибины')).toEqual(folder);
	});
	it('sort objects in array of objects by property value', () => {
		expect(sortObjects(Object.values(tree.children), 'name')).toEqual(treeSorted);
	});
});
