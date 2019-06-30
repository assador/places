<template>
	<ul>
		<folders
			:folder="folderData"
			class="places-menu-folder_root"
		>
		</folders>
	</ul>
</template>

<script>
import folders from "./TreeNode.vue"
import {bus} from "../shared/bus.js"
export default {
	name: "data",
	components: {
		folders,
	},
	props: {
		data: {
			type: Object,
			required: true,
		},
	},
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
