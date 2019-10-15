<template>
	<ul>
		<folders
			:instanceid="instanceid"
			:folder="folderData"
			:parent="folderData"
			class="places-menu-folder_root"
		>
		</folders>
	</ul>
</template>

<script>
import folders from "./TreeNode.vue"
import {bus} from "../shared/bus.js"
export default {
	components: {
		folders,
	},
	props: ["instanceid", "data"],
	data: function() {return {
		folderData: {},
	}},
	watch: {
		data: {
			deep: true,
			immediate: true,
			handler: function(data) {
				this.folderData = {
					...data,
					children: data.children,
				};
			},
		},
	},
}
</script>
