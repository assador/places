import { ref, inject, watch, } from 'vue';
const installEvent = inject('installEvent');
const shown = ref(false);
watch(() => installEvent.value, () => {
    shown.value = !!installEvent.value;
});
const dismissPrompt = () => {
    shown.value = false;
};
const installPWA = () => {
    installEvent.value.prompt();
    installEvent.value.userChoice.then(choice => {
        dismissPrompt();
        if (choice.outcome === 'accepted') {
        }
        else {
        }
    });
};
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
if (__VLS_ctx.shown) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.installPWA) },
        id: "prompt-button",
        ...{ class: "important" },
    });
}
/** @type {__VLS_StyleScopedClasses['important']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            shown: shown,
            installPWA: installPWA,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=PWAPrompt.vue.js.map