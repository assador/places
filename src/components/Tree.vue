<template>
	<ul>
		<folders
			:instanceid="instanceid"
			:folder="folderData"
			:parent="folderData"
			class="folder_root"
		/>
	</ul>
</template>

<script>
import folders from "./TreeNode.vue"
export default {
	components: {
		folders,
	},
	props: ["instanceid", "data"],
	data() {
		return {
			folderData: {},
		}
	},
	watch: {
		data: {
			deep: true,
			immediate: true,
			handler(data) {
				this.folderData = {
					...data,
					children: data.children,
				};
			},
		},
	},
}
</script>
