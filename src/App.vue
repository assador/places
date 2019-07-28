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
			if(component == "home") {
				this.$store.dispatch("setUser")
					.then(response => {
						this.$store.dispatch("setPlaces", false);
					});
			}
		});
		window.idleTimeInterval = window.setInterval(() => {
			if(
				sessionStorage.getItem("places-session")
				&& this.$store.state.idleTime < constants.sessionlifetime
			) {
				this.$store.commit("setIdleTime", this.$store.state.idleTime + 1);
			} else {
				sessionStorage.clear();
				this.component = "auth";
			}
		}, 1000);
		document.addEventListener("mousedown", () => {
			this.$store.commit("setIdleTime", 0);
		}, false);
		document.addEventListener("keyup", () => {
			this.$store.commit("setIdleTime", 0);
		}, false);
		this.component = "auth";
	},
}
</script>
