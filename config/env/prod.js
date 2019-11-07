module.exports = {
    schemaDepsOrder: [
        'user.js',
        'contact-request.js',
        'call.js',
        'sms.js'
    ],
    db: process.env.MONGODB_URL,
    firebase: {
        databaseURL: 'https://sense-c29c8.firebaseio.com'
    }
}