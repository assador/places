export interface IPlacesPopupProps {
	show: boolean;
	what?: any;
	closeButton?: boolean;
	closeOnClick?: boolean;
	position?: {
		top?: number | string | null,
		right?: number | string | null,
		bottom?: number | string | null,
		left?: number | string | null,
	};
}
