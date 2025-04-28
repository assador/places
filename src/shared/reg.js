import { reactive } from 'vue';
import axios from 'axios';
export const reg = reactive({
    message: '',
});
export const regRoutine = (data, voc) => {
    axios.post('/backend/reg.php', data)
        .then(response => {
        switch (response.data) {
            case 0:
                reg.message = voc.m.paged.regError;
                break;
            case 1:
                reg.message = voc.m.paged.loginTaken;
                break;
            default:
                reg.message = voc.m.paged.regLetterSent;
        }
    });
};
//# sourceMappingURL=reg.js.map