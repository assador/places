import { ref } from "vue";
import { useMainStore } from '@/stores/main';

const _compact = ref(0);
const _folderEditability = ref(false);
const _idleTimeInterval = ref(null);
const _foldersCheckedIds = ref(new Set<string>());

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
	get idleTimeInterval(): number {
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
};

export const setBusy = (value: boolean): void => {
	const mainStore = useMainStore();
	mainStore.setBusy(value);
};
