import { ref } from 'vue';
import { useMainStore } from '@/stores/main';
import {
	Point,
	Place,
	Route,
	Measure,
	PointInfo,
	PopupProps,
	PopupPosition,
} from '@/types';

const _compact = ref(0);
const _folderEditability = ref(false);
const _idleTimeInterval = ref(null);
const _foldersCheckedIds = ref(new Set<string>());
const _pointInfo = ref(null);
const _popupProps = ref<PopupProps>({
	show: false,
	position: {
		top: 'auto',
		right: 'auto',
		bottom: 'auto',
		left: 'auto',
	},
});

export const common = {
	get compact(): number {
		return _compact.value;
	},
	set compact(value: number) {
		_compact.value = value;
	},
	get folderEditability(): boolean {
		return _folderEditability.value;
	},
	set folderEditability(value: boolean) {
		_folderEditability.value = value;
	},
	toggleFolderEditability() {
		_folderEditability.value = !_folderEditability.value;
	},
	get idleTimeInterval(): number | null {
		return _idleTimeInterval.value;
	},
	set idleTimeInterval(value: number | null) {
		_idleTimeInterval.value = value;
	},
	get foldersCheckedIds(): Set<string> {
		return _foldersCheckedIds.value;
	},
	set foldersCheckedIds(value: Set<string>) {
		_foldersCheckedIds.value = value;
	},
	get popupProps(): PopupProps {
		return _popupProps.value;
	},
	set popupProps(value: PopupProps) {
		_popupProps.value = value;
	},
	showPopup(position?: PopupPosition) {
		if (position) _popupProps.value.position = position;
		_popupProps.value.show = true;
	},
	hidePopup() {
		_popupProps.value.show = false;
	},
	togglePopup(position?: PopupPosition) {
		if (position) _popupProps.value.position = position;
		_popupProps.value.show = !_popupProps.value.show;
	},
	get pointInfo(): PointInfo | null {
		return _pointInfo.value;
	},
	setPointInfo(
		point: Point,
		entity?: Place | Route | Measure,
		context?: 'places' | 'routes' | 'measure' | 'temps',
	): void {
		const mainStore = useMainStore();
		let of: Place | Route | Measure | null = entity ?? null;
		let name: string | null = null;
		let description: string | null = null;

		if (!of && context) {
			if (context === 'places') {
				of = Object.values(mainStore.places).find(
					p => p.pointid === point.id
				) || null;
			} else if (context === 'routes') {
				of = Object.values(mainStore.routes).find(
					r => r.points.some(p => p.id === point.id)
				) || null;
			}
		}
		if (of?.type === 'place') {
			name = of.name || null;
			description = of.description || null;
		} else if (of?.type === 'route') {
			const routePoint = of.points.find(p => p.id === point.id);
			name = routePoint?.name || null;
			description = routePoint?.description || of.description || null;
		}
		_pointInfo.value = { point, of, name, description };
	},
	clearPointInfo(): void {
		_pointInfo.value = null;
	},
};

export const setBusy = (value: boolean): void => {
	const mainStore = useMainStore();
	mainStore.setBusy(value);
};
