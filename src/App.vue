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
	<div>
</template>

<script>
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
		const session = localStorage.getItem("places-session");
		if(session) {
			this.component = "home";
			this.$store.dispatch("setUser")
				.then(response => {
					this.$store.dispatch("setPlaces", false);
				});
		} else {
			this.component = "auth";
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
		window.addEventListener("scroll", () => {
			onWindowScroll({
				top: [document.getElementById("scroll-up")],
				bottom: [document.getElementById("scroll-down")],
			});
		}, false);
	},
}
</script>
