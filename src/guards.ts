import { Point, Place, Route, Folder, PointDescription } from '@/types';

export const isPoint = (obj: any): obj is Point =>
	obj && typeof obj === 'object' && obj.type === 'point' && typeof obj.id === 'string'
;
export const isPlace = (obj: any): obj is Place =>
	obj && typeof obj === 'object' && obj.type === 'place' && typeof obj.id === 'string'
;
export const isRoute = (obj: any): obj is Route =>
	obj && typeof obj === 'object' && obj.type === 'route' && typeof obj.id === 'string'
;
export const isFolder = (obj: any): obj is Folder =>
	obj && typeof obj === 'object' && obj.type === 'folder' && typeof obj.id === 'string'
;
export const isPointDescription = (obj: any): obj is PointDescription =>
	obj && typeof obj === 'object' && typeof obj.id === 'string' &&
	(obj.name === undefined || typeof obj.name === 'string') &&
	(obj.description === undefined || typeof obj.description === 'string')
;
