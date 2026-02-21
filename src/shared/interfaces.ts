export interface IPlacesPopupProps {
	show: boolean;
	what?: any;
	closeOnClick?: boolean;
	classExt?: string;
	position?: {
		top?: number | string | null,
		right?: number | string | null,
		bottom?: number | string | null,
		left?: number | string | null,
	};
}
