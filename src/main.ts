import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from '@/App.vue';
import router from '@/router';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import { registerSW } from 'virtual:pwa-register';

registerSW({ immediate: true });

const app = createApp(App);
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

app.use(router);
app.use(pinia);
app.mount("#app");
