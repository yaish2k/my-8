module.exports = {
    schemaDepsOrder: [
        'user.js',
        'contact-request.js',
        'call.js',
        'sms.js'
    ],
    db: 'mongodb://127.0.0.1:27017/gal?retryWrites=true',
    firebase: {
        databaseURL: 'https://sense-c29c8.firebaseio.com'
    }
}