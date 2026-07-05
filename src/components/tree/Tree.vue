<template>
	<ul class="tree">
		<TreeNode
			:instanceid="instanceid"
			:editable="props.editable"
			:what="props.what"
			:folder="mainStore.trees[props.what]"
		/>
	</ul>
</template>

<script setup lang="ts">
import { ref, provide } from 'vue';
import { useMainStore } from '@/stores/main';
import TreeNode from '@/components/tree/TreeNode.vue';

export interface IPlacesTreeProps {
	instanceid?: string;
	editable?: boolean;
	what?: 'places' | 'routes';
}
const props = withDefaults(defineProps<IPlacesTreeProps>(), {
	instanceid: '',
	editable: true,
	what: 'places',
});

const mainStore = useMainStore();

const dragging = ref(false);
provide('dragging', dragging);

const dragTargetId = ref(null);
provide('dragTargetId', dragTargetId);

const dragTargetContext = ref(null);
provide('dragTargetContext', dragTargetContext);
</script>

<style lang="scss" scoped>
ul {
	padding-left: 0;
}
</style>
