import { describe, it, expect } from 'vitest';
import { useGettersOther } from '@/stores/getters/other';
import { useGettersEntity } from '@/stores/getters/entity';

const state = {
	folders: {
		value: {
			'f-root': { id: 'f-root', parent: null, srt: 10 },
			'f-child-1': { id: 'f-child-1', parent: 'f-root', srt: 1 },
			'f-child-5': { id: 'f-child-5', parent: 'f-root', srt: 5 },
			'f-child-3': { id: 'f-child-3', parent: 'f-root', srt: 3 },
			'f-child-2': { id: 'f-child-2', parent: 'f-root', srt: 2 },
			'f-child-4': { id: 'f-child-4', parent: 'f-root', srt: 4 },
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
			expect(res).toEqual(['f-child-1', 'f-child-2', 'f-child-3', 'f-child-4', 'f-child-5']);
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
		it('element is located in the middle of the list', () => {
			const res = getSrts('f-child-4', 'folder');
			expect(res).toEqual({
				previous: 3,
				next: 5,
				min: 1,
				max: 5,
				before: 3.5,
				after: 4.5,
			});
		});
		it('element is the first in the list of neighbors', () => {
			const res = getSrts('f-child-1', 'folder');
			expect(res).toEqual({
				previous: undefined,
				next: 2,
				min: 1,
				max: 5,
				before: 0.5,
				after: 1.5,
			});
		});
		it('element is the last in the list of neighbors', () => {
			const res = getSrts('f-child-5', 'folder');
			expect(res).toEqual({
				previous: 4,
				next: undefined,
				min: 1,
				max: 5,
				before: 4.5,
				after: 15,
			});
		});
		it('element is the only one in the folder', () => {
			const res = getSrts('f-lonely', 'folder');
			expect(res).toEqual({
				previous: undefined,
				next: undefined,
				min: 500,
				max: 500,
				before: 250,
				after: 510,
			});
		});
		it('check for places with a parent field folderid', () => {
			const res = getSrts('p-1', 'place');
			expect(res).toEqual({
				previous: undefined,
				next: 30,
				min: 10,
				max: 30,
				before: 5,
				after: 20,
			});
		});
	});
});
