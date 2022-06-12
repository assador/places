<template>
	<ul>
		<places-tree-node
			:instanceid="instanceid"
			:folder="data"
			class="folder_root"
		/>
	</ul>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import PlacesTreeNode from './PlacesTreeNode.vue';
import { Folder } from '@/store/types';

export default defineComponent({
	components: {
		PlacesTreeNode,
	},
	props: {
		instanceid: {
			type: String,
			default: '',
		},
		data: {
			type: Object as PropType<Folder>,
			default() {return {};},
		},
	},
});
</script>
