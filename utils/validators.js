const validator = require('validator');


const PHONE_VALIDATOR = {
    validator: phone => validator.isMobilePhone(phone),
    message: props => `${props.value} is not a valid phone number!`
}

const IMAGE_VALIDATOR = {
    validator: imageUrl => {
        if (imageUrl) {
            return validator.isURL(imageUrl);
        }
        return true;
    },
    message: props => 'Invalid Image URL.'
}

const EMAIL_VALIDATOR = {
    validator: email => validator.isEmail(email),
    message: props => `${props.value} is not a valid email!`
}
module.exports = {
    PHONE_VALIDATOR,
    IMAGE_VALIDATOR,
    EMAIL_VALIDATOR

}