const { STATUS_CODES } = require('./status_codes');
const _ = require('lodash');

class BaseError extends Error {
    constructor(message, statusCodeMessageObject, errorName) {
        const finalMessage = _.isEmpty(message) ? statusCodeMessageObject.message : message;
        Object.assign(statusCodeMessageObject, { message: finalMessage });
        super(JSON.stringify(statusCodeMessageObject));
        this.errorName = errorName;
    }

}
class UserIsNotAllowedToSendMessageError extends BaseError {
    constructor(message) {
        super(message, STATUS_CODES.STATUS_1001, 'UserIsNotAllowedToSendMessageError');
    }
}

class SmsAmountExeededError extends BaseError {
    constructor(message) {
        super(message, STATUS_CODES.STATUS_1002, 'SmsAmountExeededError');
    }
}

class PhoneCallsAmountExeededError extends BaseError {
    constructor(message) {
        super(message, STATUS_CODES.STATUS_1003, 'PhoneCallsAmountExeededError');
    }
}

class NexmoSmsServiceError extends BaseError {
    constructor(message) {
        super(message, STATUS_CODES.STATUS_1004, 'NexmoSmsServiceError');
    }
}

class NexmoPhoneCallsServiceError extends BaseError {
    constructor(message) {
        super(message, STATUS_CODES.STATUS_1005, 'NexmoPhoneCallsServiceError');
    }
}

class MaxiumEightUsersError extends BaseError {
    constructor(message) {
        super(message, STATUS_CODES.STATUS_1030, 'MaxiumEightUsersError');
    }
}

class ItegrityError extends BaseError {
    constructor(message) {
        super(message, STATUS_CODES.STATUS_1050, 'ItegrityError');
    }
}

class DatabaseError extends BaseError {
    constructor(message) {
        super(message, STATUS_CODES.STATUS_1040, 'DatabaseError');
    }
}


module.exports = {
    BaseError,
    DatabaseError,
    ItegrityError,
    MaxiumEightUsersError,
    NexmoPhoneCallsServiceError,
    NexmoSmsServiceError,
    PhoneCallsAmountExeededError,
    SmsAmountExeededError,
    UserIsNotAllowedToSendMessageError,
}
