<template>
	<div :class="'popup ' + $parent.popuped">
		<div v-html="data"></div>
		<a href="javascript:void(0);" class="close" @click="$parent.showPopup({show: false}, $event);">×</a>
	</div>
</template>

<script>
export default {
	props: ["data"],
	computed: {
	},
}
</script>
