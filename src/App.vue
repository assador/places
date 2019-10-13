<template>
	<div id="main">
		<component v-bind:is="component" />
		<a
			id="scroll-up"
			href="javascript:void(0);"
			onclick="scrollWindow(-100);"
		>
			▲
		</a>
		<a
			id="scroll-down"
			href="javascript:void(0);"
			onclick="scrollWindow(100);"
		>
			▼
		</a>
	</div>
</template>

<script>
import {constants} from "./shared/constants.js"
import {bus} from "./shared/bus.js"
import auth from "./components/Auth.vue"
import home from "./components/Home.vue"
import account from "./components/Account.vue"
export default {
	components: {
		auth,
		home,
		account,
	},
	data: function() {return {
		component: "auth",
	}},
	mounted: function() {
		bus.$on("loggedChange", (component) => {
			this.component = component;
			if(component != "auth") {
				this.$store.dispatch("setUser")
					.then(response => {
						this.$store.dispatch("setPlaces", false);
						sessionStorage.setItem(
							"places-store-state",
							JSON.stringify(this.$store.state)
						);
					});
			}
		});
		/*
		 * If the App is mounted during the session (for example, when the page
		 * is reloaded), the store state is restored from sessionStorage.
		 * If the App is mounted outside the session, the store state,
		 * in contrast, is written to sessionStorage for future use.
		 */
		if(sessionStorage.getItem("places-session")) {
			this.$store.commit("setRefreshing", true);
			this.$store.replaceState(
				JSON.parse(sessionStorage.getItem("places-store-state"))
			);
			// Restore objects as links to each other
			this.$store.commit(
				"setHomePlace",
				this.$store.state.user.homeplace.id
					? this.$store.state.user.homeplace.id
					: null
			);
			for(let i = 0; i < this.$store.state.places.length; i++) {
				if(
					this.$store.state.currentPlace
					&& this.$store.state.places[i].id == this.$store.state.currentPlace.id
				) {
					this.$store.state.currentPlace = this.$store.state.places[i];
				}
			}
			this.$store.commit("setRefreshing", false);
		} else {
			sessionStorage.setItem(
				"places-store-state",
				JSON.stringify(this.$store.state)
			);
		}
		this.component = sessionStorage.getItem("places-app-child-component");
		window.idleTimeInterval = window.setInterval(() => {
			if(this.$store.state.idleTime < constants.sessionlifetime) {
				this.$store.commit("setIdleTime", this.$store.state.idleTime + 1);
			} else {
				clearInterval(window.idleTimeInterval);
				sessionStorage.removeItem("places-app-child-component");
				sessionStorage.removeItem("places-userid");
				sessionStorage.removeItem("places-session");
				this.$store.commit("setIdleTime", 0);
				this.component = "auth";
			}
		}, 1000);
		document.addEventListener("mousedown", () => {
			this.$store.commit("setIdleTime", 0);
		}, false);
		document.addEventListener("keyup", () => {
			this.$store.commit("setIdleTime", 0);
		}, false);
	},
}
</script>
