import { describe, it, expect } from 'vitest';
import { useGettersEntity } from '@/stores/getters/entity';

const state = {
	points: {
		'pt-1': { id: 'pt-1', latitude: 55.7558, longitude: 37.6173 },
		'pt-2': { id: 'pt-2', latitude: 45.0355, longitude: 38.9751 },
	},
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
const { getEntityIn } = useGettersEntity(state);

describe('importActions.existingPoint', () => {
	it('should find a point with the same coordinates', () => {
		const result = getEntityIn({
			dict: state.points,
			where: { latitude: 55.7558, longitude: 37.6173 },
		});
		expect(result).toBeDefined();
		expect(result?.id).toBe('pt-1');
	});
	it('should return undefined if the coordinates are not in the database', () => {
		const result = getEntityIn({
			dict: state.points,
			where: { latitude: 0, longitude: 0 },
		});
		expect(result).toBeUndefined();
	});
});
