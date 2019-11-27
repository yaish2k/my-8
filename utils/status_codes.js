
STATUS_CODES = {
    STATUS_1001: {
        code: 1001,
        meesage: 'User is not allowed to send message (not part of the approved contacts)'
    },
    STATUS_1002: {
        code: 1002,
        message: 'Not enough sms balance remaining'
    },
    STATUS_1003: {
        code: 1003,
        message: 'Not enough phone calls balance remaining'
    },
    STATUS_1004: {
        code: 1004,
        message: 'Error while trying to send sms from nexmo'
    },
    STATUS_1005: {
        code: 1005,
        message: 'Error while trying create phone call conversation with nexmo'
    },
    STATUS_1030: {
        code: 1030,
        message: 'Max 8 list error - user cannot add any more users (max 8 users per list)'
    },

    STATUS_1040: {
        code: 1040,
        message: 'Database error occured'
    },
    STATUS_1050: {
        code: 1050,
        message: 'Itegrity error occured'
    },

    STATUS_2001: {
        code: 2001,
        message: 'sms was sent waiting for push notification status'
    },
    STATUS_2003: {
        code: 2003,
        message: 'Sms was recieved to {0}' // send by push notification to the sender somehow
    },
    STATUS_2004: {
        code: 2004,
        message: 'phone call was sent waiting for push notification status'
    },
    STATUS_2006: {
        code: 2006,
        message: 'phone call was answered by {0}' // send by push notification to the sender somehow
    },
    STATUS_2020: {
        code: 2020,
        message: '{0} approved your request' // send by push notification to the sender somehow
    },
    STATUS_2021: {
        code: 2021,
        message: '{0} sent you a request' // send by push notification to the sender somehow
    }

}
module.exports = {
    STATUS_CODES
}