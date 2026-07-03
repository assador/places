import { ref } from 'vue';
import { useMainStore } from '@/stores/main';
import { calculatePopupPosition } from '@/shared/common';
import {
	Place,
	Route,
	Folder,
	Image,
	Measure,
	FatPointsPack,
	PopupProps,
	PopupPosition,
	PopupEntityMenuProps,
	MetaEntityContext,
	PointInfo,
	PointInfoContext,
} from '@/types';

const _compact = ref(0);
const _folderEditability = ref(false);
const _idleTimeInterval = ref(null);
const _foldersCheckedIds = ref(new Set<string>());
const _popupProps = ref<PopupProps>({
	show: false,
	position: {
		top: 'auto',
		right: 'auto',
		bottom: 'auto',
		left: 'auto',
	},
});
const _popupEntityMenu = ref<PopupEntityMenuProps>({
	object: null,
	context: null,
	show: false,
	lastEvent: null,
	position: {
		top: 'auto',
		right: 'auto',
		bottom: 'auto',
		left: 'auto',
	},
});
const _pointInfo = ref(null);
const _pointInfoPointId = ref<string | null>(null);
const _pointInfoContext = ref<PointInfoContext | undefined>(undefined);
const _pointInfoEntity = ref<Place | Route | Measure | FatPointsPack | undefined>(undefined);

export const common = {
	get compact(): number {
		return _compact.value;
	},
	set compact(value: number) {
		_compact.value = value;
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
	get folderEditability(): boolean {
		return _folderEditability.value;
	},
	set folderEditability(value: boolean) {
		_folderEditability.value = value;
	},
	toggleFolderEditability() {
		_folderEditability.value = !_folderEditability.value;
	},

// SEC popupProps

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

// SEC pointInfo

	get pointInfo(): PointInfo | null {
		const mainStore = useMainStore();
		return mainStore.getPointInfo({
			id: _pointInfoPointId.value,
			context: _pointInfoContext.value,
			entity: _pointInfoEntity.value,
		});
	},
	setPointInfo(
		{ id, context, entity }:
		{
			id: string | null;
			context?: PointInfoContext;
			entity?: Place | Route | Measure | FatPointsPack;
		}
	): void {
		_pointInfoPointId.value = id;
		_pointInfoContext.value = context;
		_pointInfoEntity.value = entity;
	},
	clearPointInfo(): void {
		_pointInfo.value = null;
	},

// SEC popupEntityMenu

	get popupEntityMenu(): PopupEntityMenuProps | null {
		return _popupEntityMenu.value;
	},
	set popupEntityMenu(value: PopupEntityMenuProps) {
		_popupEntityMenu.value = value;
	},
	updateEntityMenu(fields: Partial<PopupEntityMenuProps>) {
		_popupEntityMenu.value = { ..._popupEntityMenu.value, ...fields };
	},
	toggleEntityMenuPopup(
		e: PointerEvent,
		entity: Place | Route | Folder | null,
		context: MetaEntityContext,
	): void {
		if (_popupEntityMenu.value.show && entity.id === _popupEntityMenu.value.object.id) {
			_popupEntityMenu.value.show = false;
			_popupEntityMenu.value.lastEvent = null;
		} else {
			_popupEntityMenu.value.context = context;
			_popupEntityMenu.value.lastEvent = e;
			_popupEntityMenu.value.position = calculatePopupPosition(e);
			_popupEntityMenu.value.show = true;
		}
		_popupEntityMenu.value.object = entity;
	},
};

export const setBusy = (value: boolean): void => {
	const mainStore = useMainStore();
	mainStore.setBusy(value);
};
export const addImages = (entity: Place | Route, input: HTMLInputElement) => {
	if (!entity || !input || !input.files?.length) return;
	const mainStore = useMainStore();
	const filesArray = Array.from(input.files);
	const newImagesObject = { ...(entity.images || {}) };
	const existingImages = Object.values(newImagesObject);
	let srt = existingImages.length
		? Math.max(...existingImages.map((img: Image) => img.srt || 0))
		: 0
	;
	filesArray.forEach(file => {
		const id = crypto.randomUUID();
		const image: Image = {
			id: id,
			type: 'image',
			file: file.name,
			size: file.size,
			lastmodified: file.lastModified,
			srt: srt += 10,
			[`${entity.type}id`]: entity.id,
			new: true,
			preview: URL.createObjectURL(file),
			raw: file,
		};
		newImagesObject[id] = image;
	});
	if (entity.type === 'place') {
		mainStore.changePlace({
			entity: entity,
			change: { images: newImagesObject },
		});
	} else if (entity.type === 'route') {
		mainStore.changeRoute({
			entity: entity,
			change: { images: newImagesObject },
		});
	}
	input.value = '';
}
