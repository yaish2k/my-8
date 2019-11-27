const { STATUS_CODES } = require('./status_codes');

class BaseResponse {
    constructor(data, code = null, statusCode = 200) {
        this.data = data;
        this.statusCode = statusCode;
        this.code = code
    }
}

class UserCreatedResponse extends BaseResponse {
    constructor() {
        super({ message: 'User created' });
    }
}

class UserEditedResponse extends BaseResponse {
    constructor() {
        super({ message: 'User edited' });
    }
}

class UserDeletedResponse extends BaseResponse {
    constructor() {
        super({ message: 'User deleted' });
    }
}

class ContactRequestCreatedResponse extends BaseResponse {
    constructor() {
        super({ message: 'Contact request created' });
    }
}

class ContactRequestDeclinedResponse extends BaseResponse {
    constructor() {
        super({ message: 'Contact request declined' });

    }
}

class ContactRequestApprovedResponse extends BaseResponse {
    constructor() {
        super({ message: 'Contact request approved' });

    }
}

class ContactRequestRemovedResponse extends BaseResponse {
    constructor() {
        super({ message: 'Contact request deleted' });

    }
}

class SmsWasSentSuccessfullyResponse extends BaseResponse {
    constructor(remainingMessagesAmount, sentMessagesAmmount) {
        super({ message: 'Sms was sent successfully', remainingMessagesAmount, sentMessagesAmmount }, STATUS_CODES.STATUS_2001.code);
    }
}

class ConversationWasCreatedSuccessfullyResponse extends BaseResponse {
    constructor(remainingCallsAmount, answeredCallsAmount) {
        super({ message: 'Phone call was sent waiting for push notification status', remainingCallsAmount, answeredCallsAmount }, STATUS_CODES.STATUS_2004.code);
    }
}



module.exports = {
    UserCreatedResponse,
    UserEditedResponse,
    UserDeletedResponse,
    ContactRequestCreatedResponse,
    ContactRequestDeclinedResponse,
    ContactRequestApprovedResponse,
    ContactRequestRemovedResponse,
    SmsWasSentSuccessfullyResponse,
    ConversationWasCreatedSuccessfullyResponse
} 