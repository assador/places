import { reactive } from 'vue';
import axios from 'axios';
import { emitter } from './bus';
export const login = reactive({
    message: '',
});
export const loginRoutine = (user, voc) => {
    axios.post('/backend/auth.php', user)
        .then(response => {
        switch (response.data) {
            case 0:
                sessionStorage.clear();
                login.message = voc.m.paged.wrongLoginPassword;
                break;
            default:
                if (typeof response.data === 'object') {
                    sessionStorage.setItem('places-userid', response.data.id);
                    sessionStorage.setItem('places-session', response.data.session);
                    emitter.emit('logged');
                }
        }
        console.log(response);
    })
        .catch(e => {
        console.error(e);
        sessionStorage.clear();
    });
};
//# sourceMappingURL=auth.js.map