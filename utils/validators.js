const PHONE_VALIDATOR = {
    validator: phone => {
        return /\d{3}-\d{3}-\d{4}/.test(phone);
    },
    message: props => `${props.value} is not a valid phone number!`
}
module.exports = {
    PHONE_VALIDATOR
}