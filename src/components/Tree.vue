<template>
	<ul>
		<TreeNode
			:instanceid="instanceid"
			:folder="folderData"
			:parent="folderData"
			class="folder_root"
		/>
	</ul>
</template>

<script lang="ts">
import Vue from 'vue';
import TreeNode from './TreeNode.vue';
import { Folder } from '@/store/types';

export default Vue.extend({
	components: {
		TreeNode,
	},
	props: ["instanceid", "data"],
	data() {
		return {
			folderData: {} as Folder,
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
});
</script>
