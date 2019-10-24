<template>
	<div>
		<div v-html="data"></div>
		<a
			href="javascript:void(0);"
			class="close"
			@click="$root.showPopup({show: false}, $event);"
		>
			×
		</a>
	</div>
</template>

<script>
export default {
	props: ["data"],
	computed: {
	},
}
</script>
