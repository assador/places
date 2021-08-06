<template>
	<div id="app">
		<router-view />
	</div>
</template>

<script>
import { Component, Vue } from 'vue-property-decorator'
import { constants } from '@/shared/constants'
import { bus } from '@/shared/bus'
import { mapState } from 'vuex'
@Component({
	name: 'App',
	data() {
		return {
			currentPlaceCommon: false,
		}
	},
	computed: {
		...mapState(['currentPlace', 'currentPlaceIndex']),
	},
	created() {
		bus.$on('logged', () => {
			this.$store.dispatch('setUser');
			this.$store.dispatch('setPlaces', false);
			this.$router.push({name: 'Home'}).catch(() => {});
		});
	},
	mounted() {
		/*
		 * If the App is mounted during the session (for example, when the page
		 * is reloaded), the store state is restored from sessionStorage.
		 */
		if (sessionStorage.getItem('places-session')) {
			this.$store.replaceState(
				JSON.parse(sessionStorage.getItem('places-store-state'))
			);
			this.$store.dispatch('restoreObjectsAsLinks');
		}
		const idleTimeInterval = setInterval(() => {
			if (this.$store.state.idleTime < constants.sessionlifetime) {
				this.$store.commit('setIdleTime', this.$store.state.idleTime + 1);
			} else {
				clearInterval(idleTimeInterval);
				this.$store.dispatch('unload');
				this.$router.push({name: 'Auth'}).catch(() => {});
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
