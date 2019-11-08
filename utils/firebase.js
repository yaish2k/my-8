const admin = require('firebase-admin');
const config = require('../config/index');

admin.initializeApp({
    credential: admin.credential.cert(config.firebase.credentials),
    databaseURL: config.firebase.databaseURL
});

module.exports = {
    firebaseAdmin: admin
}