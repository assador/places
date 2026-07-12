import { describe, it, expect } from 'vitest';
import { useGettersOther } from '@/stores/getters/other';
import { useGettersEntity } from '@/stores/getters/entity';

const state = {
	folders: {
		value: {
			'f-root': { id: 'f-root', parent: null, srt: 10 },
			'f-child-1': { id: 'f-child-1', parent: 'f-root', srt: 100 },
			'f-child-2': { id: 'f-child-2', parent: 'f-root', srt: 200 },
			'f-child-3': { id: 'f-child-3', parent: 'f-root', srt: 300 },
			'f-lonely': { id: 'f-lonely', parent: 'f-other', srt: 500 },
		},
	},
	places: {
		value: {
			'p-1': { id: 'p-1', folderid: 'f-child-1', srt: 10 },
			'p-2': { id: 'p-2', folderid: 'f-child-1', srt: 30 },
		},
	},
	routes: { value: {} },
} as any;
const gettersEntity = useGettersEntity(state);
const { getNeighbourIds, getSrts } = useGettersOther(
	state,
	gettersEntity,
);

describe('Neighbours (for srt)', () => {
	describe('getNeighbourIds', () => {
		it('should return undefined if the entity is not found', () => {
			expect(getNeighbourIds('ghost-id', 'folder')).toBeUndefined();
		});
		it('should return a sorted array of IDs of all neighbours in the same folder', () => {
			const res = getNeighbourIds('f-child-2', 'folder');
			expect(res).toEqual(['f-child-1', 'f-child-2', 'f-child-3']);
		});
		it('should work correctly for a single element', () => {
			const res = getNeighbourIds('f-lonely', 'folder');
			expect(res).toEqual(['f-lonely']);
		});
	});
	describe('getSrts', () => {
		it('should return undefined if the entity does not exist', () => {
			expect(getSrts('ghost-id', 'place')).toBeUndefined();
		});
		it('element is located exactly in the middle of the list', () => {
			const res = getSrts('f-child-2', 'folder');
			expect(res).toEqual({
				previous: 100,
				next: 300,
				before: 150,
				after: 250,
			});
		});
		it('element is the first in the list of neighbors', () => {
			const res = getSrts('f-child-1', 'folder');
			expect(res).toEqual({
				previous: undefined,
				next: 200,
				before: 50,
				after: 150,
			});
		});
		it('element is the last in the list of neighbors', () => {
			const res = getSrts('f-child-3', 'folder');
			expect(res).toEqual({
				previous: 200,
				next: undefined,
				before: 250,
				after: 310,
			});
		});
		it('element is the only one in the folder', () => {
			const res = getSrts('f-lonely', 'folder');
			expect(res).toEqual({
				previous: undefined,
				next: undefined,
				before: 250,
				after: 510,
			});
		});
		it('check for places with a parent field folderid', () => {
			const res = getSrts('p-1', 'place');
			expect(res).toEqual({
				previous: undefined,
				next: 30,
				before: 5,
				after: 20,
			});
		});
	});
});
