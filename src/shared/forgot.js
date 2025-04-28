import { reactive } from 'vue';
import axios from 'axios';
export const forgot = reactive({
    message: '',
});
export const forgotRoutine = (data, voc) => {
    axios.post('/backend/forgot.php', data)
        .then(response => {
        switch (response.data) {
            case 0:
                forgot.message = voc.m.paged.letterError;
                break;
            case 1:
                forgot.message = voc.m.paged.noUserWithEmail;
                break;
            default:
                forgot.message = voc.m.paged.forgotLetterSent;
        }
    });
};
//# sourceMappingURL=forgot.js.map