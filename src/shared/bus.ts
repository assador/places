import mitt from 'mitt';
import { EntityCollection } from '@/types';

type Events = {
	busy: boolean;
	logged: void;
	logout: void;
	toDB: EntityCollection;
	toDBAll: void;
	homeToDB: string;
	confirm: {
		func: (...args: any[]) => void;
		args: any[];
		msg: string;
	};
};
export const emitter = mitt<Events>();
