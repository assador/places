import { Point, Place, Route, Folder } from '@/types';

export const isPoint = (obj: any): obj is Point => obj?.type === 'point';
export const isPlace = (obj: any): obj is Place => obj?.type === 'place';
export const isRoute = (obj: any): obj is Route => obj?.type === 'route';
export const isFolder = (obj: any): obj is Folder => obj?.type === 'folder';
