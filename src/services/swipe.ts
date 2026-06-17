export const useSwipe = (config: {
	onSwipeLeft: () => void;
	onSwipeRight: () => void;
	threshold?: number;
	maxAxisDeviation?: number;
}) => {
	const threshold = config.threshold ?? 50;
	const maxAxisDeviation = config.maxAxisDeviation ?? 40;

	let startPos = { x: 0, y: 0 };
	let isTracking = false;

	const onPointerDown = (event: PointerEvent) => {
		if (event.buttons !== 1 || event.ctrlKey || event.metaKey) return;

		const el = event.currentTarget as HTMLElement;
		el.setPointerCapture(event.pointerId);

		isTracking = true;
		startPos = { x: event.clientX, y: event.clientY };
	};
	const onPointerUp = (event: PointerEvent) => {
		if (!isTracking) return;
		isTracking = false;

		const el = event.currentTarget as HTMLElement;
		el.releasePointerCapture(event.pointerId);

		const deltaX = event.clientX - startPos.x;
		const deltaY = event.clientY - startPos.y;

		if (Math.abs(deltaY) > maxAxisDeviation) return;
		if (Math.abs(deltaX) < threshold) return;

		if (deltaX > 0) config.onSwipeRight();
		else config.onSwipeLeft();
	};
	return { onPointerDown, onPointerUp };
};
