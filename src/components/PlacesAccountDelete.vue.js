import { ref, onMounted, onBeforeUpdate } from 'vue';
import { useMainStore } from '@/stores/main';
;
import { useRouter, useRoute } from 'vue-router';
import { accountDeletionRoutine, acc } from '../shared/account';
const mainStore = useMainStore();
const router = useRouter();
const route = useRoute();
const leavePlaces = ref('none');
const leaveImages = ref('none');
const popuped = ref(false);
onMounted(() => {
    popuped.value = true;
});
onBeforeUpdate(() => {
    popuped.value = true;
});
const close = (event) => {
    if (event)
        event.stopPropagation();
    router.replace(route.matched[route.matched.length - 2].path);
};
const accountDeletionSubmit = async () => {
    if (mainStore.user.testaccount) {
        acc.message = mainStore.t.m.paged.taCannotBeDeleted;
    }
    else {
        accountDeletionRoutine(mainStore.user.id, leavePlaces.value, leaveImages.value);
        mainStore.unload();
        router.push({ name: 'PlacesAuth' });
    }
};
const accountDeletionConditionsChange = (event) => {
    switch (event.currentTarget.id) {
        case 'placesLeaveNone':
            document.getElementById('imagesLeaveNone').click();
            break;
        case 'imagesLeaveAll':
            if (document.getElementById('placesLeaveNone').checked) {
                document.getElementById('placesLeaveCommon').click();
            }
            break;
    }
};
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onClick: (e => __VLS_ctx.close(e)) },
    ...{ class: ('popup ' + (__VLS_ctx.popuped ? 'appear' : 'disappear')) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "centered" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "narrower" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "brand" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ class: "margin_bottom_0" },
});
(__VLS_ctx.mainStore.t.i.captions.deletingAccount);
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.mainStore.t.i.text.whatToDoWithAll);
__VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
    ...{ onSubmit: (...[$event]) => {
            __VLS_ctx.accountDeletionSubmit();
        } },
    ...{ onClick: (e => e.stopPropagation()) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "account__form margin_bottom" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.fieldset, __VLS_intrinsicElements.fieldset)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
(__VLS_ctx.mainStore.t.i.captions.places);
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onChange: (e => __VLS_ctx.accountDeletionConditionsChange(e)) },
    id: "placesLeaveNone",
    name: "places",
    type: "radio",
    value: "none",
});
(__VLS_ctx.leavePlaces);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.mainStore.t.i.inputs.daDeletePlaces);
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onChange: (e => __VLS_ctx.accountDeletionConditionsChange(e)) },
    id: "placesLeaveCommon",
    name: "places",
    type: "radio",
    value: "common",
});
(__VLS_ctx.leavePlaces);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.mainStore.t.i.inputs.daLeaveOnlyCommonPlaces);
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onChange: (e => __VLS_ctx.accountDeletionConditionsChange(e)) },
    id: "placesLeaveAll",
    name: "places",
    type: "radio",
    value: "all",
});
(__VLS_ctx.leavePlaces);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.mainStore.t.i.inputs.daLeaveAllPlaces);
__VLS_asFunctionalElement(__VLS_intrinsicElements.fieldset, __VLS_intrinsicElements.fieldset)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
(__VLS_ctx.mainStore.t.i.captions.images);
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onChange: (e => __VLS_ctx.accountDeletionConditionsChange(e)) },
    id: "imagesLeaveNone",
    name: "images",
    type: "radio",
    value: "none",
});
(__VLS_ctx.leaveImages);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.mainStore.t.i.inputs.daDeleteImages);
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onChange: (e => __VLS_ctx.accountDeletionConditionsChange(e)) },
    id: "imagesLeaveAll",
    name: "images",
    type: "radio",
    value: "all",
});
(__VLS_ctx.leaveImages);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.mainStore.t.i.inputs.daLeaveImages);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.fieldset, __VLS_intrinsicElements.fieldset)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    type: "submit",
});
(__VLS_ctx.mainStore.t.i.buttons.deleteAccount);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (e => __VLS_ctx.close(e)) },
    type: "button",
});
(__VLS_ctx.mainStore.t.i.buttons.cancel);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: {} },
});
(__VLS_ctx.acc.message);
__VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
    ...{ onClick: (e => __VLS_ctx.close(e)) },
    href: "javascript:void(0)",
    ...{ class: "close" },
});
/** @type {__VLS_StyleScopedClasses['centered']} */ ;
/** @type {__VLS_StyleScopedClasses['narrower']} */ ;
/** @type {__VLS_StyleScopedClasses['brand']} */ ;
/** @type {__VLS_StyleScopedClasses['margin_bottom_0']} */ ;
/** @type {__VLS_StyleScopedClasses['account__form']} */ ;
/** @type {__VLS_StyleScopedClasses['margin_bottom']} */ ;
/** @type {__VLS_StyleScopedClasses['close']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            acc: acc,
            mainStore: mainStore,
            leavePlaces: leavePlaces,
            leaveImages: leaveImages,
            popuped: popuped,
            close: close,
            accountDeletionSubmit: accountDeletionSubmit,
            accountDeletionConditionsChange: accountDeletionConditionsChange,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=PlacesAccountDelete.vue.js.map