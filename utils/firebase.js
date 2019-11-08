const admin = require('firebase-admin');
const config = require('../config/index');
var serviceAccount = require('../config/vars/firebase-credentials.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: config.firebase.databaseURL
});

module.exports = {
    firebaseAdmin: admin
}