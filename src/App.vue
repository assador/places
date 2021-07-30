<template>
	<div id="app">
		<component :is="currentComponent" />
	</div>
</template>

<script>
import { Component, Vue } from 'vue-property-decorator'
import { constants } from '@/shared/constants'
import { bus } from '@/shared/bus'
import { mapState } from 'vuex'
import auth from '@/components/Auth.vue'
import home from '@/components/Home.vue'
import account from '@/components/Account.vue'
@Component({
	name: 'App',
	components: {
		auth: () => import('@/components/Auth.vue'),
		home: () => import('@/components/Home.vue'),
		account: () => import('@/components/Account.vue'),
	},
	data() {
		return {
			currentComponent: 'auth',
			currentPlaceCommon: false,
		}
	},
	computed: {
		...mapState(['currentPlace', 'currentPlaceIndex']),
	},
	created() {
		bus.$on('loggedChange', (currentComponent) => {
			this.currentComponent = currentComponent;
			if (currentComponent !== 'auth') {
				this.$store.dispatch('setUser');
				this.$store.dispatch('setPlaces', false);
			}
		});
	},
	mounted() {
		/*
		 * If the App is mounted during the session (for example, when the page
		 * is reloaded), the store state is restored from sessionStorage.
		 * If the App is mounted outside the session, the store state,
		 * in contrast, is written to sessionStorage for future use.
		 */
		if (sessionStorage.getItem('places-session')) {
			this.$store.commit('setRefreshing', true);
			this.$store.replaceState(
				JSON.parse(sessionStorage.getItem('places-store-state'))
			);
			// Restore objects as links to each other
			this.$store.commit(
				'setHomePlace',
				this.$store.state.user.homeplace && this.$store.state.user.homeplace.id
					? this.$store.state.user.homeplace.id
					: null
			);
			if (this.$store.state.currentPlace) {
				for (let place of this.$store.state.commonPlaces) {
					if (place.id === this.$store.state.currentPlace.id) {
						this.$store.commit('setCurrentPlace', place);
						this.currentPlaceCommon = true;
						break;
					}
				}
				if (!this.currentPlaceCommon) {
					for (let place of this.$store.state.places) {
						if (place.id === this.$store.state.currentPlace.id) {
							this.$store.commit('setCurrentPlace', place);
							break;
						}
					}
				}
			}
			this.$store.commit('setRefreshing', false);
		}
		if (!sessionStorage.getItem('places-session')) {
			sessionStorage.setItem('places-app-child-component', 'auth');
		}
		this.currentComponent = sessionStorage.getItem('places-app-child-component');
		window.idleTimeInterval = window.setInterval(() => {
			if (this.$store.state.idleTime < constants.sessionlifetime) {
				this.$store.commit('setIdleTime', this.$store.state.idleTime + 1);
			} else {
				clearInterval(window.idleTimeInterval);
				sessionStorage.removeItem('places-userid');
				sessionStorage.removeItem('places-session');
				this.$store.commit('setIdleTime', 0);
				this.currentComponent = 'auth';
			}
		}, 1000);
		document.addEventListener('mousedown', () => {
			this.$store.commit('setIdleTime', 0);
		}, false);
		document.addEventListener('keyup', () => {
			this.$store.commit('setIdleTime', 0);
		}, false);
	},
})
export default class App extends Vue {}
</script>
