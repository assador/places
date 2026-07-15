import { ref, watch, onUnmounted, type Ref } from 'vue';

interface UseElementSizeOptions {
	debounceMs?: number;
}

export function useElementSize(
	elementRef: Ref<HTMLElement | null>,
	options: UseElementSizeOptions = {},
) {
	const width = ref(0);
	const height = ref(0);
	let resizeObserver: ResizeObserver | null = null;
	let timeoutId: number | null = null;

	const updateSizes = (element: HTMLElement) => {
		width.value = element.offsetWidth;
		height.value = element.offsetHeight;
	};
	const handleResize = (entries: ResizeObserverEntry[]) => {
		if (!entries.length) return;
		const element = entries[0].target as HTMLElement;

		if (options.debounceMs) {
			if (timeoutId) clearTimeout(timeoutId);
			timeoutId = window.setTimeout(() => {
				updateSizes(element);
			}, options.debounceMs);
		} else {
			updateSizes(element);
		}
	};
	watch(
		elementRef,
		(newElement, oldElement) => {
			if (oldElement && resizeObserver) {
				resizeObserver.unobserve(oldElement);
			}
			if (newElement) {
				if (!resizeObserver) {
					resizeObserver = new ResizeObserver(handleResize);
				}
				resizeObserver.observe(newElement);
				updateSizes(newElement);
			}
		},
		{ flush: 'post' },
	);
	onUnmounted(() => {
		if (resizeObserver) resizeObserver.disconnect();
		if (timeoutId) clearTimeout(timeoutId);
	});
	return { width, height };
}
