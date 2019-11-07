module.exports = {
    schemaDepsOrder: [
        'user.js',
        'contact-request.js',
        'call.js',
        'sms.js'
    ],
    db: process.env.MONGODB_URL,
    firebase: {
        databaseURL: process.env.FIREBASE_DATABASE_URL
    }
}