<template>
	<div id="main">
		<component v-bind:is="component" />
	<div>
</template>

<script>
import {bus} from "./shared/bus.js"
import auth from "./components/Auth.vue"
import home from "./components/Home.vue"
import account from "./components/Account.vue"
export default {
	data() {return {
		component: "auth",
	}},
	components: {
		auth,
		home,
		account,
	},
	mounted: function() {
		if(this.$store.state.status == 0) {
			this.$store.commit("loaded");
			const session = localStorage.getItem("places-session");
			if(session) {
				this.component = "home";
				this.$store.commit("already");
				this.$store.dispatch("setUser")
					.then(response => {
						this.$store.dispatch("setPlaces", false);
					});
			} else {
				this.component = "auth";
			}
		}
		bus.$on("loggedChange", (component) => {
			this.component = component;
			if(component == "home") {
				this.$store.dispatch("setUser")
					.then(response => {
						this.$store.dispatch("setPlaces", false);
					});
			}
		});
	},
}
</script>
