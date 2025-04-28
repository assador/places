import { ref, provide, onMounted } from 'vue';
import { useMainStore } from '@/stores/main';
;
import PlacesTreeNode from './PlacesTreeNode.vue';
import { formFoldersCheckedIds } from '../shared/common';
const props = withDefaults(defineProps(), {
    instanceid: '',
});
const mainStore = useMainStore();
const foldersCheckedIds = ref([]);
provide('foldersCheckedIds', foldersCheckedIds);
onMounted(() => {
    foldersCheckedIds.value = formFoldersCheckedIds();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_withDefaultsArg = (function (t) { return t; })({
    instanceid: '',
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
/** @type {[typeof PlacesTreeNode, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(PlacesTreeNode, new PlacesTreeNode({
    instanceid: (props.instanceid),
    folder: (__VLS_ctx.mainStore.tree),
    foldersCheckedIds: (__VLS_ctx.foldersCheckedIds),
    ...{ class: "folder_root" },
}));
const __VLS_1 = __VLS_0({
    instanceid: (props.instanceid),
    folder: (__VLS_ctx.mainStore.tree),
    foldersCheckedIds: (__VLS_ctx.foldersCheckedIds),
    ...{ class: "folder_root" },
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
/** @type {__VLS_StyleScopedClasses['folder_root']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            PlacesTreeNode: PlacesTreeNode,
            mainStore: mainStore,
            foldersCheckedIds: foldersCheckedIds,
        };
    },
    __typeProps: {},
    props: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
    props: {},
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=PlacesTree.vue.js.map