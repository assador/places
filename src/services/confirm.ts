import { ref } from 'vue';

const _show = ref(false);
const _callback = ref<((...args: any[]) => void) | null>(null);
const _args = ref<readonly any[] | null>(null);
const _message = ref<string | null>(null);

export const confirm = {
	get show(): boolean {
		return _show.value;
	},
	get callback(): ((...args: any[]) => void) | null {
		return _callback.value;
	},
	get args(): readonly any[] | null {
		return _args.value;
	},
	get message(): string | null {
		return _message.value;
	},
	open(
		func: (...args: any[]) => void,
		args: any[] = [],
		msg: string = "",
	): boolean {
		_show.value = true;
		_callback.value = func;
		_args.value = args;
		_message.value = msg;
		return true;
	},
	close(): void {
		_show.value = false;
		_callback.value = null;
		_args.value = null;
		_message.value = null;
	},
};
