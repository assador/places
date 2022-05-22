<template>
	<ul>
		<tree-node
			:instanceid="instanceid"
			:folder="data"
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
});
</script>
