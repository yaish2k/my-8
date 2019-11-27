const mongoose = require('mongoose');
const settings = require('../config/index');


const handleTransaction = async (transactionFunc) => {
    let session;
    try {
        session = await mongoose.startSession();
        session.startTransaction({ writeConcern: { w: 1 } });
        await transactionFunc();
        await session.commitTransaction();
    } catch (err) {
        await session.abortTransaction();
        throw new DatabaseError('Failed to create call intance on db');
    }
}

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

const getAppSettings = () => {
    return {
        maxAllowedSms: settings.nexmo.SMS.MESSAGES_MAX_BALANCE,
        maxAllowedCalls: settings.nexmo.CALL.CALLS_MAX_BALANCE,
        serverPhoneNumber: settings.nexmo.SERVER_PHONE_NUMBER,
    }
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
    phoneNumberDigitsOnly,
    getAppSettings,
    handleTransaction
}