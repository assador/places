import { ref } from 'vue';

export class ConfirmInstance {
	private _show = ref(false);
	private _message = ref<string | null>(null);
	private _resolve = ref<((value: boolean) => void) | null>(null);

	get show(): boolean {
		return this._show.value;
	}
	get message(): string | null {
		return this._message.value;
	}
	open(msg: string = ''): Promise<boolean> {
		this._message.value = msg;
		this._show.value = true;

		return new Promise<boolean>((resolve) => {
			this._resolve.value = resolve;
		});
	}
	accept(): void {
		if (this._resolve.value) this._resolve.value(true);
		this.close();
	}
	cancel(): void {
		if (this._resolve.value) this._resolve.value(false);
		this.close();
	}
	close(): void {
		this._show.value = false;
		this._message.value = null;
		this._resolve.value = null;
	}
}

export const confirm = new ConfirmInstance();
