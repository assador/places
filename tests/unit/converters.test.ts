import { describe, it, expect } from 'vitest';
import { Point } from '@/types';

import {
	normalizeLat,
	normalizeLon,
	deg2dms,
	dms2deg,
	coords2string,
	latitude2string,
	longitude2string,
	string2coords,
	point2coords,
} from '@/shared/converters';

type TestPoint = Pick<Point, 'latitude' | 'longitude'> & {
	altitude?: number | null;
};

// ========================
// normalizeLat / normalizeLon
// ========================

describe('normalizeLat / normalizeLon', () => {
	it('normal longitude wrapping', () => {
		expect(normalizeLon(190)).toBe(-170);
		expect(normalizeLon(-190)).toBe(170);
		expect(normalizeLon(360)).toBe(0);
	});

	it('latitude clamping-ish behavior', () => {
		expect(Math.abs(normalizeLat(100))).toBeLessThanOrEqual(90);
		expect(Math.abs(normalizeLat(-100))).toBeLessThanOrEqual(90);
	});

	it('large numbers', () => {
		expect(Math.abs(normalizeLat(123456))).toBeLessThanOrEqual(90);
		expect(Math.abs(normalizeLon(-987654))).toBeLessThanOrEqual(180);
	});

	it('edge values', () => {
		expect(normalizeLat(90)).toBe(90);
		expect(normalizeLat(-90)).toBe(-90);
		expect(Math.abs(normalizeLon(180))).toBe(180);
	});
});

// ========================
// deg2dms
// ========================

describe('deg2dms', () => {
	it('basic conversion', () => {
		const [d, m, s] = deg2dms(10.5);
		expect(d).toBe(10);
		expect(m).toBe(30);
		expect(s).toBeCloseTo(0);
	});

	it('negative values', () => {
		const [d, m, s] = deg2dms(-10.75);
		expect(d).toBe(-10);
		expect(m).toBe(45);
		expect(s).toBeCloseTo(0);
	});

	it('precision case', () => {
		const [, , s] = deg2dms(10.999999);
		expect(s).toBeLessThan(60);
	});
});

// ========================
// dms2deg
// ========================

describe('dms2deg', () => {
	it('basic conversion', () => {
		expect(dms2deg([10, 30, 0])).toBeCloseTo(10.5);
	});

	it('negative degrees', () => {
		expect(dms2deg([-10, 30, 0])).toBeCloseTo(-10.5);
	});

	it('zero', () => {
		expect(dms2deg([0, 0, 0])).toBe(0);
	});
});

// ========================
// round-trip DMS <-> deg
// ========================

describe('round-trip DMS', () => {
	it('should return close to original', () => {
		const values = [0, 12.3456, -45.6789, 89.9999];

		for (const v of values) {
			const dms = deg2dms(v);
			const back = dms2deg(dms);
			expect(back).toBeCloseTo(v, 4);
		}
	});
});

// ========================
// coords2string
// ========================

describe('coords2string', () => {
	it('basic format', () => {
		const str = coords2string([10, 20]);
		expect(str).toMatch(/N/);
		expect(str).toMatch(/E/);
	});

	it('negative coords', () => {
		const str = coords2string([-10, -20]);
		expect(str).toMatch(/S/);
		expect(str).toMatch(/W/);
	});

	it('format structure', () => {
		const str = coords2string([10.5, 20.5]);
		expect(str).toMatch(/°/);
		expect(str).toMatch(/'/);
		expect(str).toMatch(/"/);
	});
});

// ========================
// latitude2string / longitude2string
// ========================

describe('latitude2string / longitude2string', () => {
	it('latitude direction', () => {
		expect(latitude2string(10)).toMatch(/N/);
		expect(latitude2string(-10)).toMatch(/S/);
	});

	it('longitude direction', () => {
		expect(longitude2string(10)).toMatch(/E/);
		expect(longitude2string(-10)).toMatch(/W/);
	});
});

// ========================
// string2coords
// ========================

describe('string2coords', () => {
	it('valid full format', () => {
		const coords = string2coords(`10°30'0"N, 20°15'0"E`);
		expect(coords).not.toBeNull();
		expect(coords![0]).toBeCloseTo(10.5);
		expect(coords![1]).toBeCloseTo(20.25);
	});

	it('lowercase + spaces', () => {
		const coords = string2coords(` 10 ° 30 ' 0 " n , 20 ° 15 ' 0 " e `);
		expect(coords).not.toBeNull();
	});

	it('decimal seconds', () => {
		const coords = string2coords(`10°30'30.5"N, 20°0'0"E`);
		expect(coords![0]).toBeCloseTo(10.50847, 4);
	});

	it('comma decimal separator', () => {
		const coords = string2coords(`10°30'30,5"N, 20°0'0"E`);
		expect(coords).not.toBeNull();
	});

	it('invalid string', () => {
		expect(string2coords('hello world')).toBeNull();
	});

	it('partial data (only degrees)', () => {
		const coords = string2coords(`10°N, 20°E`);
		expect(coords).not.toBeNull();
		expect(coords![0]).toBeCloseTo(10);
	});

	it('invalid numbers', () => {
		const coords = string2coords(`10°xx'N, 20°yy'E`);
		// may return NaN; we check this explicitly
		if (coords) {
			expect(Number.isNaN(coords[0]) || Number.isNaN(coords[1])).toBe(true);
		}
	});
});

// ========================
// point2coords
// ========================

describe('point2coords', () => {
	it('altitude = 0 (should be included)', () => {
		const p = { latitude: 10, longitude: 20, altitude: 0 };
		const str = point2coords(p as any, 'm', 'H');

		expect(str).toMatch(/H\s*0\s*m/);
	});

	it('altitude = null (should NOT be included)', () => {
		const p: TestPoint = { latitude: 10, longitude: 20, altitude: null };
		const str = point2coords(p as any, 'm', 'H');

		expect(str).not.toMatch(/H/);
	});

	it('altitude = undefined (should NOT be included)', () => {
		const p = { latitude: 10, longitude: 20 };
		const str = point2coords(p as any, 'm', 'H');

		expect(str).not.toMatch(/H/);
	});
});
