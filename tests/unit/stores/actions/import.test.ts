/*
import { describe, it, expect } from 'vitest';
describe('importActions.existingPoint', () => {
	it('should find a point with the same coordinates', () => {
		const mockStore = {
			points: {
				'pt-1': { id: 'pt-1', latitude: 55.7558, longitude: 37.6173 },
				'pt-2': { id: 'pt-2', latitude: 45.0355, longitude: 38.9751 },
			},
		};
		const importedPoint = { latitude: 55.7558, longitude: 37.6173 };
		const result = existingPoint.call(
			mockStore,
			importedPoint,
		);
		expect(result).toBeDefined();
		expect(result?.id).toBe('pt-1');
	});
	it('should return undefined if the coordinates are not in the database', () => {
		const mockStore = { points: {} };
		const importedPoint = { latitude: 0, longitude: 0 };
		const result = existingPoint.call(
			mockStore,
			importedPoint,
		);
		expect(result).toBeUndefined();
	});
});
*/
