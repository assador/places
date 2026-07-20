import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createPing } from '@/services/ping';

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

const ping = createPing();
ping.init();

app.mount("#app");
