import { Folder, Place, Route } from '@/types';

export interface IPopupProps {
	show: boolean;
	what?: string;
	closeButton?: boolean;
	closeOnClick?: boolean;
	position?: {
		top?: number | string | null,
		right?: number | string | null,
		bottom?: number | string | null,
		left?: number | string | null,
	};
}
export interface IEntityPopupProps extends IPopupProps {
	object: Folder | Place | Route;
}
