import '@/registerServiceWorker';
import { createApp } from 'vue';
import router from '@/router';
import store from '@/store';
import App from '@/App.vue';
import VueFullscreen from 'vue-fullscreen';
import { createYmaps } from 'vue-yandex-maps';

const app = createApp(App);
app.use(router);
app.use(store);
app.use(VueFullscreen);
app.use(createYmaps({
	apikey: '264f4333-26ea-4342-af02-67c24d0533e7',
}));
app.mount("#app");
