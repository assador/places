<template>
	<div
		:class="'popup ' + (props.show ? 'appear' : 'disappear')"
		@click="e => {if (closeOnClick) close(e);}"
		@keyup="e => {if (e.code === 'Escape') close(e);}"
	>
		{{ props.what }}
		<slot name="slot"></slot>
		<a
			href="javascript:void(0)"
			class="close"
			@click="e => close(e)"
		>
			×
		</a>
	</div>
</template>

<script setup lang="ts">
export interface IPlacesPopupProps {
	show: boolean;
	what?: any;
	closeOnClick?: boolean;
}
const props = withDefaults(defineProps<IPlacesPopupProps>(), {
	show: false,
	what: '',
	closeOnClick: true,
});
const emit = defineEmits(['update:show']);

const close = (event: Event): void => {
	if (event) event.stopPropagation();
	emit('update:show', false);
};
</script>
