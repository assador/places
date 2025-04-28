/* eslint-disable */
import { defineStore } from 'pinia';
import { useMainStore } from './main';
;
export const mainStore = useMainStore();
export const adminStore = useMainStore();
export const store = defineStore('store', {
    state: () => ({
        ...mainStore.$state,
        ...adminStore.$state,
    })
});
//# sourceMappingURL=index.js.map