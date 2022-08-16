import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import App from '@/App.vue';

describe('App', () => {
	let wrapper;
	beforeEach(() => {
		wrapper = mount(App);
	});
	it('restore store state from sessionStorage', async () => {
		await nextTick();
		console.dir(sessionStorage.getItem('places-session'));
		//expect(wrapper).toEqual(folder);
	});
});
