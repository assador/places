import '@/registerServiceWorker';
import { createApp } from 'vue';
import router from '@/router';
import { store } from '@/store';
import App from '@/App.vue';
import VueFullscreen from 'vue-fullscreen';

const app = createApp(App);
app.use(router);
app.use(store);
app.use(VueFullscreen);
app.mount("#app");
