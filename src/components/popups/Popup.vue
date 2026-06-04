<template>
	<Teleport to="#popup-root">
		<transition name="fade">
			<div
				v-if="props.show"
				v-bind="$attrs"
				ref="popupRef"
				class="popup"
				:style="popupStyle"
				@pointerup="handleClickInside"
				@pointerdown.stop
			>
				<a
					v-if="props.closeButton"
					href="javascript:void(0)"
					class="close"
					@click.stop="close()"
				>
					×
				</a>
				<div
					v-if="props.what"
					class="popup-title"
				>
					{{ props.what }}
				</div>
				<div
					class="popup-content"
				>
					<slot name="popupSlot" />
				</div>
			</div>
		</transition>
	</Teleport>
</template>

<script setup lang="ts">
import {
	ref,
	computed,
	onMounted,
	onUnmounted,
	watch,
	nextTick,
	type CSSProperties,
} from 'vue';
import { PopupProps } from '@/types';

const props = withDefaults(defineProps<PopupProps>(), {
	show: false,
	what: '',
	closeButton: true,
	closeOnClick: true,
	position: () => ({
		top: 'auto',
		right: 'auto',
		bottom: 'auto',
		left: 'auto',
	}),
});
const emit = defineEmits([ 'update:show' ]);
defineOptions({ inheritAttrs: false });

let resizeObserver: ResizeObserver | null = null;

const popupRef = ref<HTMLElement | null>(null);
const correctedPosition = ref({
	top: 'auto',
	right: 'auto',
	bottom: 'auto',
	left: 'auto',
	maxWidth: 'none',
	maxHeight: 'none',
});

const close = () => {
	emit('update:show', false);
};
const handleClickInside = () => {
	if (props.closeOnClick) close();
};
const handleClickOutside = (event: PointerEvent) => {
	if (event.defaultPrevented || !props.show || !popupRef.value) return;
	const target = event.target as Node;
	if ((target as HTMLElement).closest('.draggable, .leaflet-marker-icon')) return;
	if (!popupRef.value.contains(target)) close();
};
const keyup = (event: KeyboardEvent): void => {
	if (event.key === 'Escape') close();
};
const adjustPosition = () => {
	if (!popupRef.value) return;

	const popupWidth = popupRef.value.offsetWidth;
	const popupHeight = popupRef.value.offsetHeight;
	if (popupWidth === 0 && popupHeight === 0) return;

	const { clientWidth, clientHeight } = document.documentElement;
	const clientPadding = 0;

	let topStr = props.position.top || 'auto';
	let leftStr = props.position.left || 'auto';
	let bottomStr = props.position.bottom || 'auto';
	let rightStr = props.position.right || 'auto';

	let maxWidth = `${clientWidth - clientPadding * 2}px`;
	let maxHeight = `${clientHeight - clientPadding * 2}px`;

	const parsePx = (val: string) => val.endsWith('px') ? parseFloat(val) : null;
	const topVal = parsePx(topStr);
	const leftVal = parsePx(leftStr);
	const bottomVal = parsePx(bottomStr);
	const rightVal = parsePx(rightStr);

	if (leftVal !== null) {
		if (leftVal + popupWidth > clientWidth - clientPadding) {
			leftStr = `${Math.max(clientPadding, clientWidth - popupWidth - clientPadding)}px`;
		}
	} else if (rightVal !== null) {
		const calculatedLeft = clientWidth - rightVal - popupWidth;
		if (calculatedLeft < clientPadding) {
			rightStr = `${Math.max(clientPadding, clientWidth - popupWidth - clientPadding)}px`;
		}
	}
	if (topVal !== null) {
		if (topVal + popupHeight > clientHeight - clientPadding) {
			topStr = `${Math.max(clientPadding, clientHeight - popupHeight - clientPadding)}px`;
		}
	} else if (bottomVal !== null) {
		const calculatedTop = clientHeight - bottomVal - popupHeight;
		if (calculatedTop < clientPadding) {
			bottomStr = `${Math.max(clientPadding, clientHeight - popupHeight - clientPadding)}px`;
		}
	}
	correctedPosition.value = {
		top: topStr,
		left: leftStr,
		bottom: bottomStr,
		right: rightStr,
		maxWidth,
		maxHeight,
	};
};
const popupStyle = computed((): CSSProperties => {
	const isReady = correctedPosition.value.maxWidth !== 'none';
	return {
		position: 'absolute',
		top: isReady ? correctedPosition.value.top : props.position.top,
		right: isReady ? correctedPosition.value.right : props.position.right,
		bottom: isReady ? correctedPosition.value.bottom : props.position.bottom,
		left: isReady ? correctedPosition.value.left : props.position.left,
		maxWidth: correctedPosition.value.maxWidth,
		maxHeight: correctedPosition.value.maxHeight,
		zIndex: 999999,
		transform: props.position.left === '50%' ? 'translateX(-50%)' : 'none',
		visibility: isReady ? 'visible' : 'hidden',
	};
});
watch(() => props.show, async (isShowing) => {
	if (isShowing) {
		await nextTick();
		adjustPosition();
		if (popupRef.value && !resizeObserver) {
			resizeObserver = new ResizeObserver(() => adjustPosition());
			resizeObserver.observe(popupRef.value);
		}
	} else {
		if (resizeObserver) {
			resizeObserver.disconnect();
			resizeObserver = null;
		}
		correctedPosition.value.maxWidth = 'none';
	}
});
onMounted(() => {
	document.addEventListener("keyup", keyup, false);
	document.addEventListener("pointerdown", handleClickOutside, false);
	if (props.show) {
		nextTick(() => {
			adjustPosition();
			if (popupRef.value) {
				resizeObserver = new ResizeObserver(() => adjustPosition());
				resizeObserver.observe(popupRef.value);
			}
		});
	}
});
onUnmounted(() => {
	document.removeEventListener('keyup', keyup);
	document.removeEventListener('pointerdown', handleClickOutside, false);
	if (resizeObserver) {
		resizeObserver.disconnect();
		resizeObserver = null;
	}
});
</script>

<style lang="scss">
.popup {
	overflow: auto !important;
}
.popup.messages {
	display: block;
	padding: 30px 0 0 0;
	.close {
		right: 0;
		padding: 15px 11px;
		& + .message {
			border-top: none;
		}
	}
	.popup-content .message {
		padding-right: 30px; padding-left: 30px;
		&:last-child {
			padding-bottom: 20px;
		}
	}
}
.column .popup-content {
	display: flex;
	flex-direction: column;
    gap: 32px;
}
</style>
