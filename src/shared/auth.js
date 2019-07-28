import {bus} from "./bus.js"
import axios from "axios"
export const loginRoutine = user => new Promise((resolve, reject) => {
	axios.post("/backend/auth.php", user)
		.then(response => {
			switch(response.data) {
				case 0 :
					sessionStorage.clear();
					response.message = "Неверные логин или пароль";
					break;
			}
			resolve(response);
		})
		.catch(error => {
			sessionStorage.clear();
			reject(error);
		})
});
