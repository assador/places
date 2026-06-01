import { ref, onMounted, onUnmounted, type Ref } from 'vue';

export function useElementSize(elementRef: Ref<HTMLElement | null>) {
	const width = ref(0);
	const height = ref(0);
	let resizeObserver: ResizeObserver | null = null;
	const updateSizes = () => {
		if (elementRef.value) {
			width.value = elementRef.value.offsetWidth;
			height.value = elementRef.value.offsetHeight;
		}
	};
	onMounted(() => {
		if (elementRef.value) {
			resizeObserver = new ResizeObserver(entries => {
				if (entries.length) updateSizes();
			});
			resizeObserver.observe(elementRef.value);
		}
		window.addEventListener('resize', updateSizes, { passive: true });
		updateSizes();
	});
	onUnmounted(() => {
		if (resizeObserver) resizeObserver.disconnect();
		window.removeEventListener('resize', updateSizes);
	});
	return { width, height };
}
