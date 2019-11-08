module.exports = {
    schemaDepsOrder: [
        'user.js',
        'contact-request.js',
        'call.js',
        'sms.js'
    ],
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