import { createApp } from 'vue';
import { createPinia } from 'pinia';

import { registerSW } from 'virtual:pwa-register';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';

import App from '@/App.vue';
import router from '@/router';

registerSW({ immediate: true });

const app = createApp(App);
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

app.use(router);
app.use(pinia);

app.mount("#app");
