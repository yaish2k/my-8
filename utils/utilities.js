const mongoose = require('mongoose');

const castToObjectId = (id) => {
    if (typeof id === 'string') {
        return mongoose.Types.ObjectId(id);
    }
    return id;
}

const phoneNumberDigitsOnly = (phoneNumber) => {
    return phoneNumber.replace(/[+\-)]/g, '');
}
const castToId = (objectId) => {
    if (typeof objectId !== 'string') {
        return objectId.toString();
    }
    return objectId;
}

const formatString = (str, ...formatingArgs) => {
    let formattedString = str;
    for (index in formatingArgs) {
        formattedString = formattedString.replace("{" + index + "}", formatingArgs[index]);
    }
    return formattedString;
}
const promisify = (fn, ...args) => {
    return new Promise((resolve, reject) => {
        fn(...args, (err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        })
    })
}

module.exports = {
    castToObjectId,
    promisify,
    castToId,
    formatString,
    phoneNumberDigitsOnly
}