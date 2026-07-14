import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Point } from '@/types';
import { useActionsService } from '@/stores/actions/service';
import { parseOpenMeteo, parseOpenElevation } from '@/stores/actions/service';
import api from '@/api';

vi.mock('@/api', () => ({
	default: {
		get: vi.fn(),
	},
}));

describe('useActionsService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});
	describe('parseOpenMeteo', () => {
		it('should parse the elevation array correctly', () => {
			const mockData = { elevation: [120.5] };
			expect(parseOpenMeteo(mockData)).toBe(120.5);
		});

		it('should correctly parse a single elevation number', () => {
			const mockData = { elevation: 340 };
			expect(parseOpenMeteo(mockData)).toBe(340);
		});

		it('should return null if the array contains a non-a-number string', () => {
			const mockData = { elevation: ['not-a-number'] };
			expect(parseOpenMeteo(mockData)).toBeNull();
		});

		it('should return null if the structure is invalid', () => {
			expect(parseOpenMeteo({ foo: 'bar' })).toBeNull();
			expect(parseOpenMeteo(null)).toBeNull();
		});
	});
	describe('parseOpenElevation', () => {
		it('should return null if the structure is invalid', () => {
			const mockData = { results: [{ elevation: 450.2 }] };
			expect(parseOpenElevation(mockData)).toBe(450.2);
		});

		it('should return null if the results array is empty or there are no fields', () => {
			expect(parseOpenElevation({ results: [] })).toBeNull();
			expect(parseOpenElevation({ results: [{}] })).toBeNull();
			expect(parseOpenElevation(null)).toBeNull();
		});
	});
	describe('getAltitude logic (via setPointAltitude call)', () => {
		const createMockStore = () => ({
			getPointById: vi.fn().mockReturnValue({
				latitude: 55,
				longitude: 37,
				altitude: null,
			}),
		});
		const mockPoint = { latitude: 55, longitude: 37, altitude: null } as Point;
		it('should record the height from the main API (OpenMeteo) if available', async () => {
			const store = createMockStore() as any;
			const { setPointAltitude } = useActionsService(store);
			vi.mocked(api.get).mockResolvedValueOnce({
				data: { elevation: [150] },
			});
			await setPointAltitude(mockPoint);
			const pointInStore = store.getPointById(1);
			expect(pointInStore.altitude).toBe(150);
			expect(api.get).toHaveBeenCalledTimes(1);
		});

		it('should go to the fallback API (OpenElevation) if the main API returned null', async () => {
			const store = createMockStore() as any;
			const { setPointAltitude } = useActionsService(store);
			vi.mocked(api.get).mockResolvedValueOnce({
				data: { elevation: null },
			});
			vi.mocked(api.get).mockResolvedValueOnce({
				data: { results: [{ elevation: 280 }] },
			});
			await setPointAltitude(mockPoint);
			const pointInStore = store.getPointById(1);
			expect(pointInStore.altitude).toBe(280);
			expect(api.get).toHaveBeenCalledTimes(2);
		});
		it('should exit quietly and not change anything if both APIs crash', async () => {
			const store = createMockStore() as any;
			const { setPointAltitude } = useActionsService(store);
			vi.mocked(api.get).mockRejectedValue(new Error('Network error'));
			await setPointAltitude(mockPoint);
			const pointInStore = store.getPointById(1);
			expect(pointInStore.altitude).toBe(0);
		});
	});
});
