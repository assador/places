import {bus} from "./bus.js"
import axios from "axios"
export const loginRoutine = user => new Promise((resolve, reject) => {
	axios.post("/backend/auth.php", user)
		.then(response => {
			switch(response.data) {
				case 0 :
					localStorage.removeItem("user-token");
					localStorage.removeItem("user-id");
					response.message = "Неверные логин или пароль";
					break;
				default :
					let data = response.data.split("|");
					localStorage.setItem("user-token", data[0]);
					localStorage.setItem("user-id", data[1]);
					bus.$emit("loggedChange", "home");
			}
			resolve(response);
		})
		.catch(error => {
			localStorage.removeItem("user-token");
			localStorage.removeItem("user-id");
			reject(error);
		})
});
