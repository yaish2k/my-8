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
    constructor(remainingMessagesAmount) {
        super({ message: 'Sms was sent successfully', remainingMessagesAmount }, STATUS_CODES.STATUS_2001.code);
    }
}

class ConversationWasCreatedSuccessfullyResponse extends BaseResponse {
    constructor(remainingCallsAmount) {
        super({ message: 'Conversation was created successfully', remainingCallsAmount }, STATUS_CODES.STATUS_2002.code);
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