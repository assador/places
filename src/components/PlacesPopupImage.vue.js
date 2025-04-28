import { ref, inject, watch, onMounted, onBeforeUnmount, } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useMainStore } from '@/stores/main';
;
import _ from 'lodash';
import { constants } from '@/shared/constants';
const props = withDefaults(defineProps(), {
    imageId: '',
});
const popuped = ref(false);
const images = ref([]);
const image = ref({});
const currentPlaceCommon = inject('currentPlaceCommon');
const mainStore = useMainStore();
const router = useRouter();
const route = useRoute();
const close = (event) => {
    if (event)
        event.stopPropagation();
    router.replace(route.matched[route.matched.length - 2].path);
};
const defineVars = () => {
    const places = (!currentPlaceCommon.value
        ? mainStore.places
        : mainStore.commonPlaces);
    for (const id in places) {
        if (places[id].images && props.imageId in places[id].images) {
            image.value = places[id].images[props.imageId];
            images.value = _.orderBy(Object.values(places[id].images));
            return;
        }
    }
    router.replace(route.matched[route.matched.length - 2].path);
};
const showImage = (step, event) => {
    if (event)
        event.stopPropagation();
    let currentIndex = images.value.indexOf(image.value);
    if (currentIndex > -1) {
        const ImagesLength = images.value.length;
        currentIndex = (currentIndex + step) % ImagesLength + ((currentIndex + step) % ImagesLength < 0 ? ImagesLength : 0);
        router.push({
            name: 'PlacesHomeImages',
            params: { imageId: images.value[currentIndex].id }
        }).catch(e => { console.error(e); });
    }
};
const keyup = (event) => {
    switch (event.key) {
        case 'Escape':
            close(event);
            break;
        case 'ArrowLeft':
            showImage(-1, event);
            break;
        case 'ArrowRight':
            showImage(1, event);
            break;
    }
};
watch(() => props.imageId, () => {
    defineVars();
});
onMounted(() => {
    window.setTimeout(() => {
        popuped.value = true;
    }, 1);
    defineVars();
    document.addEventListener('keyup', keyup, false);
});
onBeforeUnmount(() => {
    document.removeEventListener('keyup', keyup, false);
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_withDefaultsArg = (function (t) { return t; })({
    imageId: '',
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onClick: (e => __VLS_ctx.close(e)) },
    ...{ class: ('popup ' + (__VLS_ctx.popuped ? 'appear' : 'disappear')) },
});
if (__VLS_ctx.image) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
        ...{ onClick: (e => __VLS_ctx.showImage(1, e)) },
        ...{ class: "popup-image border_1" },
        src: (__VLS_ctx.constants.dirs.uploads.images.big + __VLS_ctx.image.file),
        onerror: ('this.src = \'' + __VLS_ctx.constants.dirs.uploads.images.orphanedbig + __VLS_ctx.image.file + '\''),
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
    ...{ onClick: (e => __VLS_ctx.showImage(-1, e)) },
    href: "javascript:void(0);",
    ...{ class: "prev" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
    ...{ onClick: (e => __VLS_ctx.showImage(1, e)) },
    href: "javascript:void(0);",
    ...{ class: "next" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
    ...{ onClick: (e => __VLS_ctx.close(e)) },
    href: "javascript:void(0);",
    ...{ class: "close" },
});
/** @type {__VLS_StyleScopedClasses['popup-image']} */ ;
/** @type {__VLS_StyleScopedClasses['border_1']} */ ;
/** @type {__VLS_StyleScopedClasses['prev']} */ ;
/** @type {__VLS_StyleScopedClasses['next']} */ ;
/** @type {__VLS_StyleScopedClasses['close']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            constants: constants,
            popuped: popuped,
            image: image,
            close: close,
            showImage: showImage,
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
//# sourceMappingURL=PlacesPopupImage.vue.js.map