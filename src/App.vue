<template>
	<div id="main">
		<component v-bind:is="component" />
	<div>
</template>

<script>
import {bus} from "./shared/bus.js"
import auth from "./components/Auth.vue"
import home from "./components/Home.vue"
export default {
	data() {return {
		component: "auth",
	}},
	components: {
		auth,
		home,
	},
	mounted: function() {
		if(this.$store.state.status == 0) {
			this.$store.commit("loaded");
			const token = localStorage.getItem("user-token");
			if(token) {
				this.component = "home";
				this.$store.commit("already");
				this.$store.dispatch("setPlaces");
			} else {
				this.component = "auth";
			}
		}
		bus.$on("loggedChange", (component) => {
			this.component = component;
			if(component == "home") {
				this.$store.dispatch("setPlaces", false);
			}
		});
	},
}
</script>
