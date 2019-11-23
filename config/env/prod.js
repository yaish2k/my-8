module.exports = {
    schemaDepsOrder: [
        'user.js',
        'contact-request.js',
        'call.js',
        'sms.js'
    ],
    nexmo: {
        SERVER_PHONE_NUMBER: process.env.SERVER_PHONE_NUMBER,
        SMS: {
            MESSAGES_MAX_BALANCE: process.env.MESSAGES_MAX_BALANCE || 6,
            SUCESS_MESSAGE_ID: "0",
            MESSAGE_ACCEPTED: 'answered',
            SERVER_MESSAGE: process.env.SMS_SERVER_MESSAGE || '{0} is looking for you urgently'
        },
        CALL: {
            CALLS_MAX_BALANCE: process.env.CALLS_MAX_BALANCE || 6,
            SERVER_MESSAGE: process.env.CALL_SERVER_MESSAGE || '{0} is looking for you urgently',
            CALL_ACCEPETED: 'accepted',
            ACTION: process.env.CALL_ACTION || 'talk',
            VOICE_NAME: process.env.CALL_VOICE_NAME || 'Kendra',
            TYPE: process.env.CALL_TYPE || 'phone'
        },
        credentials: {
            apiKey: process.env.NEXMO_API_KEY,
            apiSecret: process.env.NEXMO_API_SECRET,
            applicationId: process.env.NEXMO_APPLICATION_ID,
            privateKey: JSON.parse(`"${process.env.NEXMO_APPLICATION_PRIVATE_KEY_PATH}"`)
        }
    },
    app: {
        MAX_APPROVED_CONTACTS: process.env.MAX_APPROVED_CONTACTS || 8,
    },
    db: process.env.MONGODB_URL,
    firebase: {
        databaseURL: process.env.FIREBASE_DATABASE_URL,
        credentials: {
            type: process.env.FIREBASE_TYPE,
            project_id: process.env.FIREBASE_PROJECT_ID,
            private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
            private_key: JSON.parse(`"${process.env.FIREBASE_PRIVATE_KEY}"`),
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            client_id: process.env.FIREBASE_CLIENT_ID,
            auth_uri: process.env.FIREBASE_AUTH_URI,
            token_uri: process.env.FIREBASE_TOKEN_URI,
            auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
            client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
        }
    }
}